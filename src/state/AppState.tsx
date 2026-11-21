import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LookId } from '../data/looks';
import type { ScanRecord } from '../types/analysis';

type AppState = {
  ready: boolean;
  hasOnboarded: boolean;
  isPremium: boolean;
  styleAnswer?: LookId;
  savedLooks: LookId[];
  history: ScanRecord[];
  latest?: ScanRecord;
  /** Hands-free guide: listen for "next / back / repeat". */
  voiceCommands: boolean;
  /** Hands-free guide: read each step aloud. */
  narration: boolean;
  completeOnboarding: (style?: LookId) => void;
  unlockPremium: () => void;
  addScan: (record: ScanRecord) => void;
  toggleSavedLook: (id: LookId) => void;
  resetAll: () => void;
  setVoiceCommands: (on: boolean) => void;
  setNarration: (on: boolean) => void;
};

const KEY = 'shineme.v1.1.state';

type Persisted = Pick<
  AppState,
  'hasOnboarded' | 'isPremium' | 'styleAnswer' | 'savedLooks' | 'history' | 'voiceCommands' | 'narration'
>;

const EMPTY: Persisted = {
  hasOnboarded: false,
  isPremium: false,
  savedLooks: [],
  history: [],
  voiceCommands: true,
  narration: true,
};

// Web camera captures are data: URIs of several MB; keep them in memory only
// so localStorage doesn't overflow.
const persistable = (r: ScanRecord): ScanRecord =>
  r.photoUri?.startsWith('data:') && r.photoUri.length > 200_000 ? { ...r, photoUri: undefined } : r;

const Ctx = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<Persisted>(EMPTY);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((fn: (s: Persisted) => Persisted) => {
    setState((prev) => {
      const next = fn(prev);
      const toSave = { ...next, history: next.history.slice(0, 50).map(persistable) };
      AsyncStorage.setItem(KEY, JSON.stringify(toSave)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      ...state,
      latest: state.history[0],
      completeOnboarding: (style) => update((s) => ({ ...s, hasOnboarded: true, styleAnswer: style ?? s.styleAnswer })),
      unlockPremium: () => update((s) => ({ ...s, isPremium: true })),
      addScan: (record) => update((s) => ({ ...s, history: [record, ...s.history.filter((r) => r.id !== record.id)] })),
      toggleSavedLook: (id) =>
        update((s) => ({
          ...s,
          savedLooks: s.savedLooks.includes(id) ? s.savedLooks.filter((l) => l !== id) : [...s.savedLooks, id],
        })),
      resetAll: () => update(() => EMPTY),
      setVoiceCommands: (on) => update((s) => ({ ...s, voiceCommands: on })),
      setNarration: (on) => update((s) => ({ ...s, narration: on })),
    }),
    [ready, state, update]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAppState = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
};
