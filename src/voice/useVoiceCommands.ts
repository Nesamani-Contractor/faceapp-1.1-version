import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Animated, AppState, Platform } from 'react-native';
import type { VoiceCommand } from './commands';
import { VoiceCommandEngine, type EngineSnapshot } from './engine';
import { ExpoRecognizer } from './recognizer';

export type VoiceCommands = EngineSnapshot & {
  /** Tell the echo filter what the app is saying aloud (null when silent). */
  setNarration: (text: string | null) => void;
  /** 0…1 microphone level for the listening pulse. */
  level: Animated.Value;
};

/**
 * Listens for "next / back / repeat" while `active` is true.
 *
 * `active` should combine the user's voice toggle with screen focus, so the
 * microphone is released whenever the guide is not on screen.
 */
export function useVoiceCommands(active: boolean, onCommand: (c: VoiceCommand) => void): VoiceCommands {
  const handler = useRef(onCommand);
  handler.current = onCommand;
  const activeRef = useRef(active);
  activeRef.current = active;

  const { engine, recognizer, level } = useMemo(() => {
    const recognizer = new ExpoRecognizer();
    // iOS keeps one growing transcript per session; restarting after each
    // command gives every command a clean slate. Android/web finalise per utterance.
    const engine = new VoiceCommandEngine(recognizer, { restartAfterCommand: Platform.OS === 'ios' });
    return { engine, recognizer, level: new Animated.Value(0) };
  }, []);

  useEffect(() => {
    engine.onCommand((c) => handler.current(c));
    recognizer.setVolumeListener((v) => {
      // Recogniser levels are roughly -2 (silence) … 10 (loud).
      level.setValue(Math.max(0, Math.min(1, (v + 2) / 12)));
    });
    return () => {
      recognizer.setVolumeListener(undefined);
      engine.dispose();
    };
  }, [engine, recognizer, level]);

  useEffect(() => {
    if (active) engine.enable();
    else engine.disable();
  }, [active, engine]);

  useEffect(() => {
    // Only a real background releases the mic; "inactive" (Control Centre, a
    // system prompt) is too brief and would cut the user off mid-word.
    let wasBackground = false;
    const sub = AppState.addEventListener('change', (s) => {
      engine.setForeground(s !== 'background');
      if (s === 'background') wasBackground = true;
      // Back from Settings (a real trip to the background, not a permission
      // dialog) with the microphone possibly granted: try again.
      if (s === 'active' && wasBackground) {
        wasBackground = false;
        if (activeRef.current && engine.getSnapshot().status === 'permission-denied') engine.enable();
      }
    });
    return () => sub.remove();
  }, [engine]);

  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);

  return useMemo(
    () => ({ ...snapshot, setNarration: (t: string | null) => engine.setNarration(t), level }),
    [snapshot, engine, level]
  );
}
