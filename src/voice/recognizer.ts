// Platform speech recogniser for the voice engine, backed by
// `expo-speech-recognition` (iOS SFSpeechRecognizer, Android SpeechRecognizer,
// Web Speech API in the browser preview).
//
// The native module is NOT part of Expo Go — it ships in the development /
// production build only (`npx expo run:ios|android` or EAS). Importing it
// eagerly would crash Expo Go, so it is loaded lazily and its absence is
// reported as `needs-dev-build` instead.

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { CONTEXTUAL_STRINGS } from './commands';
import type { Availability, PermissionResult, Recognizer, RecognizerEvents, StartOptions } from './engine';

type SpeechModule = typeof import('expo-speech-recognition');

let cached: SpeechModule | null | undefined;

function loadModule(): SpeechModule | null {
  if (cached !== undefined) return cached;
  cached = null;
  if (Platform.OS !== 'web' && !requireOptionalNativeModule('ExpoSpeechRecognition')) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-speech-recognition') as SpeechModule;
  } catch {
    cached = null;
  }
  return cached;
}

/** Recognition language: the device's English variant (better accent match), else US English. */
export function recognitionLang(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    if (/^en[-_][A-Za-z]{2}$/.test(locale)) return locale.replace('_', '-');
  } catch {
    // fall through
  }
  return 'en-US';
}

export type VolumeListener = (level: number) => void;

export class ExpoRecognizer implements Recognizer {
  private volumeListener?: VolumeListener;

  /** Live microphone level (roughly -2…10), for the listening pulse. */
  setVolumeListener(fn: VolumeListener | undefined) {
    this.volumeListener = fn;
  }

  availability(): Availability {
    const mod = loadModule();
    if (!mod) return { ok: false, reason: Platform.OS === 'web' ? 'unsupported' : 'needs-dev-build' };
    let available = false;
    try {
      available = mod.ExpoSpeechRecognitionModule.isRecognitionAvailable();
    } catch {
      available = false;
    }
    if (!available) return { ok: false, reason: Platform.OS === 'web' ? 'unsupported' : 'service-disabled' };
    let supportsOnDevice = false;
    // On-device is fast, private and works offline. Only trusted on iOS:
    // Android needs a separately downloaded model and fails without it.
    if (Platform.OS === 'ios') {
      try {
        supportsOnDevice = mod.ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
      } catch {
        supportsOnDevice = false;
      }
    }
    return { ok: true, supportsOnDevice };
  }

  async requestPermission(): Promise<PermissionResult> {
    const mod = loadModule();
    if (!mod) return 'denied';
    // The browser asks for the microphone itself on start(); a refusal there
    // arrives as a `not-allowed` error, which the engine handles.
    if (Platform.OS === 'web') return 'granted';
    const res = await mod.ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (res.granted) return 'granted';
    return res.canAskAgain === false ? 'blocked' : 'denied';
  }

  start({ onDevice }: StartOptions) {
    const mod = loadModule();
    if (!mod) throw new Error('expo-speech-recognition is not available');
    mod.ExpoSpeechRecognitionModule.start({
      lang: recognitionLang(),
      interimResults: true, // act on the first partial result: lowest latency
      // The web adapter joins interim alternatives into one string, so ask for one there.
      maxAlternatives: Platform.OS === 'web' ? 1 : 3,
      continuous: true,
      contextualStrings: CONTEXTUAL_STRINGS,
      requiresOnDeviceRecognition: onDevice,
      addsPunctuation: false,
      // Short single-word commands: Apple's and Google's recommended tuning.
      iosTaskHint: 'confirmation',
      androidIntentOptions: { EXTRA_LANGUAGE_MODEL: 'web_search' },
      // Echo cancellation so our own narration is not heard as speech, and
      // narration plays from the loudspeaker rather than the earpiece.
      iosVoiceProcessingEnabled: true,
      iosCategory: {
        category: 'playAndRecord',
        categoryOptions: ['defaultToSpeaker', 'allowBluetooth', 'allowBluetoothA2DP'],
        mode: 'default',
      },
      volumeChangeEventOptions: { enabled: Platform.OS !== 'web', intervalMillis: 120 },
    });
  }

  abort() {
    const mod = loadModule();
    try {
      mod?.ExpoSpeechRecognitionModule.abort();
    } catch {
      // not running
    }
  }

  subscribe(events: RecognizerEvents): () => void {
    const mod = loadModule();
    if (!mod) return () => {};
    const m = mod.ExpoSpeechRecognitionModule;
    const subs = [
      m.addListener('start', () => events.onStart()),
      m.addListener('end', () => events.onEnd()),
      m.addListener('result', (e) => {
        const transcripts = (e?.results ?? []).map((r) => r?.transcript ?? '').filter((t) => t.length > 0);
        if (transcripts.length) events.onResult(transcripts, Boolean(e?.isFinal));
      }),
      m.addListener('error', (e) => events.onError(e?.error ?? 'unknown', e?.message ?? '')),
      m.addListener('volumechange', (e) => this.volumeListener?.(e?.value ?? -2)),
    ];
    return () => {
      for (const s of subs) {
        try {
          s.remove();
        } catch {
          // already removed
        }
      }
    };
  }
}
