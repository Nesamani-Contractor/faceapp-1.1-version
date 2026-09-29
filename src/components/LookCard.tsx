import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, gradients } from '../theme/noir';
import type { Look } from '../data/looks';
import { Photo } from './ui';

export function LookCard({ look, onPress, width = 148, height = 196, badge }: {
  look: Look;
  onPress?: () => void;
  width?: number | `${number}%`;
  height?: number;
  badge?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${look.title}, ${look.vibe}`}
      onPress={onPress}
      style={({ pressed }) => [{ width, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <Photo source={look.id} fallback={look.gradient} width={500} style={[styles.card, { height }]}>
        <LinearGradient
          colors={gradients.cardFade}
          locations={gradients.cardFadeStops}
          style={StyleSheet.absoluteFill}
        />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <View style={styles.caption}>
          <Text style={styles.title}>{look.title}</Text>
          <Text style={styles.vibe}>{look.vibe}</Text>
        </View>
      </Photo>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18 },
  caption: { position: 'absolute', left: 14, right: 14, bottom: 14 },
  title: { fontFamily: fonts.display, fontSize: 17, color: '#FFFFFF' },
  vibe: { fontFamily: fonts.body, fontSize: 10.5, color: 'rgba(255,255,255,0.62)', marginTop: 2 },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(20,16,16,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(201,162,98,0.45)',
  },
  badgeText: { fontFamily: fonts.monoMedium, fontSize: 8.5, letterSpacing: 1.2, color: '#E6D3AE' },
});
