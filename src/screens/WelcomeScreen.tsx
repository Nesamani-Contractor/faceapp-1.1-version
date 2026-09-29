import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts, gradients, noir, track } from '../theme/noir';
import { BRAND } from '../data/copy';
import { LookId, PICKABLE_LOOKS } from '../data/looks';
import { useAppState } from '../state/AppState';
import type { RootStackParamList } from '../navigation/types';
import { ChampagneGlow, Chip, Eyebrow, GoldCta, Photo } from '../components/ui';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { completeOnboarding } = useAppState();
  const [style, setStyle] = useState<LookId>();

  const begin = () => {
    completeOnboarding(style);
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  return (
    <View style={styles.fill}>
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: 520 + insets.top }}>
          <View style={styles.collage}>
            <Photo source="welcome" width={900} style={styles.main} />
            <View style={styles.side}>
              <Photo source="welcomeAlt1" width={500} style={styles.small} />
              <Photo source="welcomeAlt2" width={500} style={styles.small} />
            </View>
          </View>
          <ChampagneGlow />
          <LinearGradient colors={gradients.heroFade} locations={gradients.heroFadeStops} style={StyleSheet.absoluteFill} />
          <View style={styles.heroCopy}>
            <Text style={styles.brand}>{BRAND}</Text>
            <Text style={styles.headline}>
              Read your{'\n'}<Text style={styles.em}>light</Text>
            </Text>
            <Text style={styles.sub}>Face shape, colour season and a makeup guide in one 20-second scan.</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Eyebrow size={9.5} spacing={0.18}>WHICH LOOK FEELS MOST LIKE YOU?</Eyebrow>
          <View style={styles.chips}>
            {PICKABLE_LOOKS.map((l) => (
              <Chip key={l.id} label={l.title} active={style === l.id} onPress={() => setStyle(l.id)} />
            ))}
          </View>
          <GoldCta label={style ? 'BEGIN' : 'SKIP & BEGIN'} onPress={begin} style={{ marginTop: 26 }} />
          <Text style={styles.fine}>
            Your photos are analysed only to create your reading. Results are cosmetic suggestions, not medical advice.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: noir.bg },
  collage: { ...StyleSheet.absoluteFill, flexDirection: 'row', gap: 3 },
  main: { flex: 2 },
  side: { flex: 1, gap: 3 },
  small: { flex: 1 },
  heroCopy: { position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center', paddingHorizontal: 28 },
  brand: { fontFamily: fonts.display, fontSize: 15, letterSpacing: track(0.42, 15), paddingLeft: track(0.42, 15), color: noir.gold },
  headline: { fontFamily: fonts.display, fontSize: 44, lineHeight: 47, color: noir.ivory, textAlign: 'center', marginTop: 16 },
  em: { fontFamily: fonts.displayItalic, color: noir.gold },
  sub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19.5, color: noir.ivory62, textAlign: 'center', marginTop: 10, maxWidth: 280 },
  body: { paddingHorizontal: 20, marginTop: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  fine: { fontFamily: fonts.body, fontSize: 10.5, lineHeight: 15, color: noir.ivory42, textAlign: 'center', marginTop: 16 },
});
