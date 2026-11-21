import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, noir } from '../theme/noir';
import { Chevron, GoldCard } from './ui';

/** Entry point to the hands-free, voice-controlled guide. */
export function HandsFreeCard({ onPress }: { onPress: () => void }) {
  return (
    <View accessible accessibilityRole="button" accessibilityLabel="Start hands-free guide. Say next, back or repeat.">
      <GoldCard onPress={onPress}>
        <View style={styles.icon}>
          <Ionicons name="mic" size={17} color={noir.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Hands-free guide</Text>
          <Text style={styles.sub}>Step by step, read aloud. Say “Next”, “Back” or “Repeat”.</Text>
        </View>
        <Chevron />
      </GoldCard>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: noir.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.medium, fontSize: 14, color: noir.ivory },
  sub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: noir.ivory60, marginTop: 2 },
});
