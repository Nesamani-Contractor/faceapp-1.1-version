import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { fonts, noir } from '../theme/noir';
import { SEASONS } from '../data/seasons';
import type { RootStackParamList } from '../navigation/types';
import { BackButton, Eyebrow, GoldCta, Photo, Swatches } from '../components/ui';

export default function SeasonsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Seasons'>>();
  const highlight = params?.highlight;

  return (
    <View style={styles.fill}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <BackButton onPress={() => navigation.goBack()} />
        <Eyebrow size={10} spacing={0.2} style={{ marginTop: 22 }}>COLOUR ANALYSIS</Eyebrow>
        <Text style={styles.title}>The four{'\n'}colour seasons</Text>
        <Text style={styles.sub}>
          Your undertone, depth and contrast place you in a season — the palette that makes your skin glow instead of fade.
        </Text>

        {SEASONS.map((s) => {
          const mine = s.id === highlight;
          return (
            <View key={s.id} style={[styles.card, mine && styles.cardMine]}>
              <Photo source={s.id} width={700} style={styles.photo} fallback={[s.palette[0], s.palette[1], s.palette[3]]}>
                <LinearGradient
                  colors={['rgba(26,20,20,0)', 'rgba(26,20,20,0.1)', '#1A1414']}
                  locations={[0, 0.5, 1]}
                  style={StyleSheet.absoluteFill}
                />
                {mine && (
                  <View style={styles.mineBadge}>
                    <Eyebrow size={8.5} spacing={0.14} color={noir.goldText}>YOUR SEASON</Eyebrow>
                  </View>
                )}
              </Photo>
              <View style={styles.cardBody}>
                <View style={styles.row}>
                  <Text style={styles.name}>{s.name}</Text>
                  <Eyebrow size={9} spacing={0.12}>{s.metal.toUpperCase()}</Eyebrow>
                </View>
                <Text style={styles.subtitle}>{s.subtitle}</Text>
                <View style={{ marginTop: 14 }}>
                  <Swatches colors={s.palette} height={40} radius={10} gap={6} />
                </View>
                <Text style={styles.desc}>{s.description}</Text>
              </View>
            </View>
          );
        })}

        <GoldCta label="FIND MY SEASON" onPress={() => navigation.navigate('Camera')} style={{ marginTop: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: noir.bg },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: noir.ivory, marginTop: 10 },
  sub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19.5, color: noir.ivory62, marginTop: 10 },
  card: { marginTop: 20, borderRadius: 20, overflow: 'hidden', backgroundColor: noir.sheet, borderWidth: 1, borderColor: noir.ivory10 },
  cardMine: { borderColor: noir.gold45 },
  photo: { height: 170 },
  mineBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(20,16,16,0.7)',
    borderWidth: 1,
    borderColor: noir.gold45,
  },
  cardBody: { padding: 18, paddingTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { fontFamily: fonts.display, fontSize: 24, color: noir.ivory },
  subtitle: { fontFamily: fonts.displayItalic, fontSize: 14, color: noir.gold, marginTop: 2 },
  desc: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18.75, color: noir.ivory62, marginTop: 12 },
});
