// Reads steps aloud (expo-speech — works in Expo Go, dev builds and the web).
//
// Every utterance gets an id so that a late `onStopped` from the utterance we
// just interrupted can never clear the echo filter of the one now playing.

import * as Speech from 'expo-speech';
import { recognitionLang } from './recognizer';

export type NarrationListener = (text: string | null) => void;

export class Narrator {
  private current = 0;
  private listener: NarrationListener = () => {};

  /** Called with the text when narration starts and null when it ends. */
  onNarration(fn: NarrationListener) {
    this.listener = fn;
  }

  speak(text: string) {
    const id = ++this.current;
    // Tell the echo filter *before* audio starts, not when onStart arrives.
    this.listener(text);
    const finished = () => {
      if (id === this.current) this.listener(null);
    };
    try {
      Speech.stop().catch(() => {});
      Speech.speak(text, {
        language: recognitionLang(),
        rate: 0.96,
        pitch: 1.0,
        onDone: finished,
        onStopped: finished,
        onError: finished,
      });
    } catch {
      finished();
    }
  }

  stop() {
    this.current++;
    this.listener(null);
    Speech.stop().catch(() => {});
  }
}
