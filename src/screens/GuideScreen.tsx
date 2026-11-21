// Hands-free makeup guide (FR-FA-02 / FR-FA-03).
//
// One step at a time, read aloud, driven by voice: say "Next", "Back" or
// "Repeat" while your hands are busy. Every voice command has an on-screen
// button twin, so the guide works fully without a microphone too.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { fonts, noir, track } from '../theme/noir';
import { getLook } from '../data/looks';
import { useAppState } from '../state/AppState';
import { humanize } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';
import { BackButton, ChampagneGlow, Eyebrow, GoldCta, PillButton, Swatches } from '../components/ui';
import type { VoiceCommand } from '../voice/commands';
import type { VoiceStatus } from '../voice/engine';
import { Narrator } from '../voice/narrator';
import { useVoiceCommands } from '../voice/useVoiceCommands';

type Step = { area: string; how: string };
type Guide = { title: string; steps: Step[]; palette?: string[] };

const MAKEUP_ORDER = ['base', 'cheeks', 'eyes', 'brows', 'lips'] as const;

function useGuide(params: RootStackParamList['Guide']): Guide | undefined {
  const { history } = useAppState();
  return useMemo(() => {
    if ('lookId' in params) {
      const look = getLook(params.lookId);
      return look && look.steps.length ? { title: look.title, steps: look.steps, palette: look.palette } : undefined;
    }
    const record = history.find((r) => r.id === params.recordId);
    if (!record) return undefined;
    const steps = MAKEUP_ORDER.map((k) => ({ area: humanize(k), how: record.analysis.makeup[k] })).filter((s) => s.how);
    return { title: 'Your makeup guide', steps, palette: record.analysis.color.best_colors_hex.slice(0, 5) };
  }, [params, history]);
}

const COMMAND_LABEL: Record<VoiceCommand, string> = { next: 'NEXT', back: 'BACK', repeat: 'REPEAT' };

function statusCopy(status: VoiceStatus): { text: string; tone: 'live' | 'muted' | 'warn' } {
  switch (status) {
    case 'listening':
      return { text: 'Listening — say “Next”, “Back” or “Repeat”', tone: 'live' };
    case 'starting':
      return { text: 'Starting the microphone…', tone: 'muted' };
    case 'requesting-permission':
      return { text: 'Allow the microphone to use your voice', tone: 'muted' };
    case 'paused':
      return { text: 'Paused while Shine Me is in the background', tone: 'muted' };
    case 'degraded':
      return { text: 'Reconnecting voice… the buttons still work', tone: 'warn' };
    case 'permission-denied':
      return { text: 'Microphone access is off for Shine Me', tone: 'warn' };
    case 'needs-dev-build':
      return { text: 'Voice needs the Shine Me app build — Expo Go has no speech recognition', tone: 'warn' };
    case 'unsupported':
      return { text: 'This browser can’t listen — try Chrome or Safari', tone: 'warn' };
    case 'service-disabled':
      return {
        text:
          Platform.OS === 'ios'
            ? 'Turn on Siri & Dictation in Settings to use your voice'
            : 'Turn on Google speech recognition to use your voice',
        tone: 'warn',
      };
    case 'off':
    default:
      return { text: 'Voice is off — tap the mic to go hands-free', tone: 'muted' };
  }
}

export default function GuideScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const focused = useIsFocused();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Guide'>>();
  const guide = useGuide(params);
  const { voiceCommands, narration, setVoiceCommands, setNarration } = useAppState();
  // Hands are busy: the screen must not lock mid-look. (Manual rather than
  // useKeepAwake so a browser without wake-lock support can't throw.)
  useEffect(() => {
    const tag = 'shineme-guide';
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, []);

  const total = guide?.steps.length ?? 0;
  const [index, setIndex] = useState(0); // === total → finished
  const indexRef = useRef(0);
  indexRef.current = index;

  // ── narration ────────────────────────────────────────────────────────────
  const narrator = useMemo(() => new Narrator(), []);
  const narrationRef = useRef(narration);
  narrationRef.current = narration;

  const voice = useVoiceCommands(voiceCommands && focused && total > 0, (c) => handleCommand(c, 'voice'));
  const setEcho = voice.setNarration;
  useEffect(() => narrator.onNarration(setEcho), [narrator, setEcho]);
  useEffect(() => () => narrator.stop(), [narrator]);
  useEffect(() => {
    if (!focused) narrator.stop();
  }, [focused, narrator]);

  const stepSpeech = useCallback(
    (i: number) => {
      if (!guide) return '';
      if (i >= total) return 'That’s the full look. Beautiful work.';
      const s = guide.steps[i];
      return `Step ${i + 1} of ${total}. ${s.area}. ${s.how}`;
    },
    [guide, total]
  );

  const say = useCallback(
    (text: string) => {
      if (narrationRef.current) narrator.speak(text);
      else AccessibilityInfo.announceForAccessibility(text);
    },
    [narrator]
  );

  // Read the first step when the guide opens.
  const opened = useRef(false);
  useEffect(() => {
    if (!guide || opened.current || !focused) return;
    opened.current = true;
    say(`${guide.title}. ${stepSpeech(0)}`);
  }, [guide, focused, say, stepSpeech]);

  // ── command handling (voice and buttons share this) ──────────────────────
  const [toast, setToast] = useState<{ label: string; seq: number; source: 'voice' | 'tap' } | null>(null);
  const toastSeq = useRef(0);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const flash = useCallback(
    (label: string, source: 'voice' | 'tap') => {
      setToast({ label, seq: ++toastSeq.current, source });
      toastAnim.stopAnimation();
      toastAnim.setValue(0);
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: 1, duration: 140, useNativeDriver: Platform.OS !== 'web' }),
        Animated.delay(900),
        Animated.timing(toastAnim, { toValue: 0, duration: 260, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    },
    [toastAnim]
  );

  const handleCommand = useCallback(
    (command: VoiceCommand, source: 'voice' | 'tap') => {
      if (!guide) return;
      const i = indexRef.current;
      if (command === 'next') {
        if (i >= total) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          flash('ALL DONE', source);
          say('That was the last step. Tap Finish when you are ready.');
          return;
        }
        const n = i + 1;
        indexRef.current = n;
        setIndex(n);
        Haptics.selectionAsync().catch(() => {});
        flash(COMMAND_LABEL.next, source);
        say(stepSpeech(n));
      } else if (command === 'back') {
        if (i <= 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          flash('FIRST STEP', source);
          say('You are on the first step.');
          return;
        }
        const n = i - 1;
        indexRef.current = n;
        setIndex(n);
        Haptics.selectionAsync().catch(() => {});
        flash(COMMAND_LABEL.back, source);
        say(stepSpeech(n));
      } else {
        Haptics.selectionAsync().catch(() => {});
        flash(COMMAND_LABEL.repeat, source);
        // Repeat always speaks, even with narration off — that is what was asked for.
        narrator.speak(stepSpeech(i));
      }
    },
    [guide, total, flash, say, stepSpeech, narrator]
  );

  // ── listening pulse ──────────────────────────────────────────────────────
  const live = voice.status === 'listening';
  const pulse = voice.level.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!live) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1100, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(breathe, { toValue: 0, duration: 1100, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [live, breathe]);

  if (!guide) {
    return (
      <View style={[styles.fill, styles.center]}>
        <Text style={styles.missing}>This guide is no longer available.</Text>
        <PillButton label="Back" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const done = index >= total;
  const step = guide.steps[Math.min(index, total - 1)];
  const status = voiceCommands ? voice.status : 'off';
  const copy = statusCopy(status);
  const blocked = status === 'permission-denied' || status === 'service-disabled';

  return (
    <View style={[styles.fill, { paddingTop: insets.top + 8 }]}>
      <ChampagneGlow opacity={0.14} />

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Eyebrow size={9} spacing={0.2}>HANDS-FREE</Eyebrow>
          <Text style={styles.title} numberOfLines={1}>{guide.title}</Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Read steps aloud"
          accessibilityState={{ checked: narration }}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            if (narration) narrator.stop();
            setNarration(!narration);
          }}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Ionicons name={narration ? 'volume-high' : 'volume-mute'} size={17} color={narration ? noir.gold : noir.ivory42} />
        </Pressable>
      </View>

      {/* Progress */}
      <View style={styles.progress} accessibilityLabel={done ? 'All steps complete' : `Step ${index + 1} of ${total}`}>
        {guide.steps.map((_, i) => (
          <View key={i} style={[styles.seg, i < index || done ? styles.segDone : i === index ? styles.segNow : null]} />
        ))}
      </View>

      {/* Step */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepWrap} showsVerticalScrollIndicator={false}>
        {done ? (
          <View accessibilityLiveRegion="polite">
            <Eyebrow size={10} spacing={0.2}>COMPLETE</Eyebrow>
            <Text style={styles.area}>That’s the look.</Text>
            <Text style={styles.how}>All {total} steps done. Say “Back” to revisit one, or finish below.</Text>
            {guide.palette && (
              <View style={{ marginTop: 26 }}>
                <Swatches colors={guide.palette} height={34} radius={10} gap={7} />
              </View>
            )}
          </View>
        ) : (
          <View accessibilityLiveRegion="polite" key={index}>
            <Text style={styles.stepNo}>
              {String(index + 1).padStart(2, '0')}
              <Text style={styles.stepOf}> / {String(total).padStart(2, '0')}</Text>
            </Text>
            <Text style={styles.area}>{step.area}</Text>
            <Text style={styles.how}>{step.how}</Text>
          </View>
        )}
      </ScrollView>

      {/* Command confirmation */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.toast,
          {
            opacity: toastAnim,
            transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          },
        ]}
      >
        {toast && (
          <View style={styles.toastPill}>
            {toast.source === 'voice' && <Ionicons name="mic" size={12} color={noir.ink} />}
            <Text style={styles.toastText}>{toast.label}</Text>
          </View>
        )}
      </Animated.View>

      {/* Voice panel */}
      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.voiceRow}>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Voice commands"
            accessibilityState={{ checked: voiceCommands }}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setVoiceCommands(!voiceCommands);
            }}
            hitSlop={8}
            style={styles.micWrap}
          >
            {live && (
              <Animated.View
                style={[
                  styles.micHalo,
                  {
                    transform: [{ scale: pulse }],
                    opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] }),
                  },
                ]}
              />
            )}
            <View style={[styles.mic, live ? styles.micLive : copy.tone === 'warn' ? styles.micWarn : null]}>
              <Ionicons
                name={voiceCommands && copy.tone !== 'warn' ? 'mic' : 'mic-off'}
                size={20}
                color={live ? noir.ink : copy.tone === 'warn' ? noir.danger : noir.ivory60}
              />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.status, copy.tone === 'warn' && { color: noir.goldText }]} accessibilityLiveRegion="polite">
              {copy.text}
            </Text>
            {live && voice.heard ? (
              <Text style={styles.heard} numberOfLines={1}>
                Heard “{voice.heard}”
              </Text>
            ) : null}
            {blocked && (
              <Pressable onPress={() => Linking.openSettings().catch(() => {})} hitSlop={8}>
                <Text style={styles.link}>Open Settings</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.controls}>
          <ControlButton icon="chevron-back" label="Back" onPress={() => handleCommand('back', 'tap')} disabled={index === 0} />
          <ControlButton icon="refresh" label="Repeat" onPress={() => handleCommand('repeat', 'tap')} />
          {done ? (
            <GoldCta label="FINISH" onPress={() => navigation.goBack()} style={{ flex: 1.4 }} />
          ) : (
            <ControlButton icon="chevron-forward" label="Next" primary onPress={() => handleCommand('next', 'tap')} />
          )}
        </View>
      </View>
    </View>
  );
}

function ControlButton({ icon, label, onPress, primary, disabled }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.ctrl,
        primary && styles.ctrlPrimary,
        { opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <Ionicons name={icon} size={18} color={primary ? noir.ink : noir.ivory} />
      <Text style={[styles.ctrlText, primary && { color: noir.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: noir.bgDeep },
  center: { alignItems: 'center', justifyContent: 'center' },
  missing: { fontFamily: fonts.display, fontSize: 20, color: noir.ivory },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  title: { fontFamily: fonts.displayItalic, fontSize: 17, color: noir.ivory, marginTop: 3 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: noir.cream35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: 22, marginTop: 22 },
  seg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: noir.ivory10 },
  segNow: { backgroundColor: noir.goldLight },
  segDone: { backgroundColor: noir.gold45 },
  stepWrap: { paddingHorizontal: 26, paddingTop: 40, paddingBottom: 24 },
  stepNo: { fontFamily: fonts.monoMedium, fontSize: 13, color: noir.gold, letterSpacing: track(0.14, 13) },
  stepOf: { color: noir.ivory42 },
  area: { fontFamily: fonts.display, fontSize: 44, lineHeight: 52, color: noir.ivory, marginTop: 12 },
  how: { fontFamily: fonts.body, fontSize: 21, lineHeight: 31, color: noir.ivory80, marginTop: 16 },
  toast: { position: 'absolute', left: 0, right: 0, bottom: 230, alignItems: 'center' },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: noir.goldLight,
    borderRadius: 99,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  toastText: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: track(0.16, 11), color: noir.ink },
  panel: {
    borderTopWidth: 1,
    borderColor: noir.gold28,
    backgroundColor: noir.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56 },
  micWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  micHalo: { position: 'absolute', width: 52, height: 52, borderRadius: 26, backgroundColor: noir.gold40 },
  mic: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: noir.ivory24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: noir.bg,
  },
  micLive: { backgroundColor: noir.goldLight, borderColor: noir.goldLight },
  micWarn: { borderColor: 'rgba(217,138,138,0.5)' },
  status: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: noir.ivory80 },
  heard: { fontFamily: fonts.body, fontSize: 12, color: noir.ivory52, marginTop: 3, fontStyle: 'italic' },
  link: { fontFamily: fonts.medium, fontSize: 12.5, color: noir.gold, marginTop: 5, textDecorationLine: 'underline' },
  controls: { flexDirection: 'row', gap: 10, marginTop: 16 },
  ctrl: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: noir.ivory16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  ctrlPrimary: { flex: 1.4, backgroundColor: noir.goldLight, borderColor: noir.goldLight },
  ctrlText: { fontFamily: fonts.medium, fontSize: 11.5, color: noir.ivory80, letterSpacing: track(0.04, 11.5) },
});
