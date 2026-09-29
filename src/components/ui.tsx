import React, { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { fonts, gradients, noir, track } from '../theme/noir';
import { photoUri, PhotoKey } from '../data/photos';

const tap = () => Haptics.selectionAsync().catch(() => {});

/** Diagonal stripes — the prototype's placeholder texture, kept as the photo backdrop. */
export function Stripes({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={[noir.stripeA, noir.stripeB, noir.stripeA, noir.stripeB]}
      locations={[0, 0.25, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, style]}
    />
  );
}

/**
 * A licensed photo over a gradient fallback. If the image fails to load the
 * gradient (or stripes) stays visible, matching the prototype.
 */
export function Photo({
  source,
  uri,
  fallback,
  style,
  position = 'top',
  children,
  width = 900,
}: {
  source?: PhotoKey;
  uri?: string;
  fallback?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  position?: 'top' | 'center';
  children?: React.ReactNode;
  width?: number;
}) {
  const [failed, setFailed] = useState(false);
  const src = uri ?? (source ? photoUri(source, width) : undefined);
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: noir.stripeA }, style]}>
      {fallback ? (
        <LinearGradient colors={fallback} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : (
        <Stripes />
      )}
      {src && !failed && (
        <Image
          source={{ uri: src }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition={position}
          transition={300}
          onError={() => setFailed(true)}
        />
      )}
      {children}
    </View>
  );
}

/** radial-gradient(120% 70% at 50% 18%, rgba(201,162,98,.22), transparent 62%) */
export function ChampagneGlow({ opacity = 0.22 }: { opacity?: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="18%" rx="60%" ry="35%" fx="50%" fy="18%">
          <Stop offset="0" stopColor={noir.gold} stopOpacity={opacity} />
          <Stop offset="0.62" stopColor={noir.gold} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
    </Svg>
  );
}

export function Eyebrow({ children, style, color = noir.gold, size = 9.5, spacing = 0.16 }: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  color?: string;
  size?: number;
  spacing?: number;
}) {
  return (
    <Text style={[{ fontFamily: fonts.monoMedium, fontSize: size, letterSpacing: track(spacing, size), color }, style]}>
      {children}
    </Text>
  );
}

/** Small chevron: an 8px square with two borders, rotated 45°. */
export function Chevron({ color = noir.gold, size = 8, weight = 1.4, style }: {
  color?: string;
  size?: number;
  weight?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRightWidth: weight,
          borderTopWidth: weight,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        },
        style,
      ]}
    />
  );
}

/** The 1b primary CTA: champagne gradient pill with an ink circle + chevron. */
export function GoldCta({ label, onPress, style, disabled }: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.ctaShadow, { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: disabled ? 0.5 : 1 }, style]}
    >
      <LinearGradient
        colors={gradients.goldCta}
        locations={gradients.goldCtaStops}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.cta}
      >
        <Text style={styles.ctaLabel}>{label}</Text>
        <View style={styles.ctaDot}>
          <Chevron color={noir.goldLight} weight={1.6} style={{ marginLeft: -3 }} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

/** Secondary pill buttons from the result sheet ("FULL GLAM →" / "Close"). */
export function PillButton({ label, onPress, variant = 'gold', style }: {
  label: string;
  onPress: () => void;
  variant?: 'gold' | 'ghost';
  style?: StyleProp<ViewStyle>;
}) {
  const inner =
    variant === 'gold' ? (
      <LinearGradient colors={gradients.goldPill} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.pill}>
        <Text style={styles.pillGoldText}>{label}</Text>
      </LinearGradient>
    ) : (
      <View style={[styles.pill, styles.pillGhost]}>
        <Text style={styles.pillGhostText}>{label}</Text>
      </View>
    );
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
    >
      {inner}
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.8 }]}
    >
      <Text style={[styles.chipText, active && { color: noir.goldText }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHead({ title, action, onAction, style }: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHead, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Eyebrow>{action}</Eyebrow>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Swatches({ colors, height = 52, radius = 12, gap = 8 }: {
  colors: string[];
  height?: number;
  radius?: number;
  gap?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {colors.map((c, i) => (
        <View key={`${c}-${i}`} style={{ flex: 1, height, borderRadius: radius, backgroundColor: c }} />
      ))}
    </View>
  );
}

/** Bordered card with the champagne wash used for "Last scan". */
export function GoldCard({ children, style, onPress }: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, style]}>
      <LinearGradient
        colors={gradients.goldWash}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
        style={styles.goldCard}
      >
        {children}
      </LinearGradient>
    </Pressable>
  );
}

export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: noir.ivory10 }, style]} />;
}

export function BackButton({ onPress, style }: { onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityLabel="Back" onPress={onPress} hitSlop={12} style={[styles.back, style]}>
      <Chevron color={noir.ivory} size={9} weight={1.5} style={{ transform: [{ rotate: '-135deg' }], marginLeft: 3 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ctaShadow: {
    borderRadius: 99,
    shadowColor: noir.gold,
    shadowOpacity: 0.24,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 99,
  },
  ctaLabel: { fontFamily: fonts.semi, fontSize: 13.5, letterSpacing: track(0.2, 13.5), color: noir.ink },
  ctaDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: noir.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: { paddingVertical: 15, paddingHorizontal: 18, borderRadius: 99, alignItems: 'center' },
  pillGhost: { borderWidth: 1, borderColor: noir.ivory24 },
  pillGoldText: { fontFamily: fonts.semi, fontSize: 12.5, letterSpacing: track(0.14, 12.5), color: noir.ink },
  pillGhostText: { fontFamily: fonts.body, fontSize: 12.5, color: noir.ivory80 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: noir.ivory16,
  },
  chipActive: { backgroundColor: noir.gold16, borderColor: noir.gold45 },
  chipText: { fontFamily: fonts.body, fontSize: 11.5, color: noir.ivory66 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.display, fontSize: 19, color: noir.ivory },
  goldCard: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: noir.gold28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: noir.cream35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,16,16,0.4)',
  },
});
