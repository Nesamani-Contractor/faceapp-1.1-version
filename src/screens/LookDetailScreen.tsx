import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts, gradients, noir } from '../theme/noir';
import { getLook, PICKABLE_LOOKS } from '../data/looks';
import { getSeason } from '../data/seasons';
import { useAppState } from '../state/AppState';
import type { RootStackParamList } from '../navigation/types';
import { ScanArch } from '../components/ScanArch';
import { BackButton, ChampagneGlow, Chip, Eyebrow, GoldCta, Hairline, Photo, PillButton, Swatches } from '../components/ui';

export default function LookDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'LookDetail'>>();
  const { latest, savedLooks, toggleSavedLook } = useAppState();

  // "Choose For Me": use the latest scan's recommendation, or pick one.
  const [picking, setPicking] = useState(params.lookId === 'choose-for-me');
  useEffect(() => {
    if (params.lookId !== 'choose-for-me') return;
    const t = setTimeout(() => {
      const id = latest?.lookId ?? PICKABLE_LOOKS[Math.floor(Math.random() * PICKABLE_LOOKS.length)].id;
      setPicking(false);
      navigation.replace('LookDetail', { lookId: id });
    }, 1800);
    return () => clearTimeout(t);
  }, [params.lookId]);

  if (picking) {
    return (
      <View style={styles.picking}>
        <ScanArch />
        <Text style={styles.pickingTitle}>Choosing your look…</Text>
        <Text style={styles.pickingSub}>
          {latest ? `Matching to your ${getSeason(latest.seasonId).name} colouring` : 'Reading the room for you'}
        </Text>
      </View>
    );
  }

  const look = getLook(params.lookId) ?? PICKABLE_LOOKS[0];
  const saved = savedLooks.includes(look.id);
  const forYou = latest?.lookId === look.id;
  const season = latest ? getSeason(latest.seasonId) : undefined;

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <Photo source={look.id} fallback={look.gradient} width={1100} style={{ height: 480 + insets.top }}>
          <ChampagneGlow opacity={0.16} />
          <LinearGradient colors={gradients.heroFade} locations={gradients.heroFadeStops} style={StyleSheet.absoluteFill} />
          <View style={[styles.topBar, { top: insets.top + 8 }]}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.heroCopy}>
            <Eyebrow size={10} spacing={0.2}>{forYou ? 'RECOMMENDED FOR YOU' : 'THE LOOK'}</Eyebrow>
            <Text style={styles.title}>{look.title}</Text>
            <Text style={styles.tagline}>{look.tagline}</Text>
          </View>
        </Photo>

        <View style={styles.body}>
          <View style={styles.chips}>
            {look.vibeWords.map((w) => (
              <Chip key={w} label={w} />
            ))}
          </View>
          <Text style={styles.desc}>{look.description}</Text>

          <Text style={styles.h}>The palette</Text>
          <Swatches colors={look.palette} />

          {season && (
            <View style={styles.matchNote}>
              <Eyebrow size={9} spacing={0.16}>FOR YOUR {season.name.toUpperCase()}</Eyebrow>
              <Text style={styles.matchText}>
                Lean on {season.keywords} and {season.metal.toLowerCase()} jewellery to bring this look closer to your colouring.
              </Text>
            </View>
          )}

          <Text style={styles.h}>How to wear it</Text>
          {look.steps.map((s, i) => (
            <React.Fragment key={s.area}>
              <View style={styles.step}>
                <Text style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.area}</Text>
                  <Text style={styles.stepBody}>{s.how}</Text>
                </View>
              </View>
              {i < look.steps.length - 1 && <Hairline />}
            </React.Fragment>
          ))}

          <GoldCta
            label={saved ? 'SAVED TO VAULT' : 'SAVE THIS LOOK'}
            onPress={() => toggleSavedLook(look.id)}
            style={{ marginTop: 28 }}
          />
          {!latest && (
            <PillButton
              label="Scan to personalise"
              variant="ghost"
              onPress={() => navigation.navigate('Camera')}
              style={{ marginTop: 12 }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: noir.bg },
  topBar: { position: 'absolute', left: 20, right: 20 },
  heroCopy: { position: 'absolute', left: 22, right: 22, bottom: 24 },
  title: { fontFamily: fonts.display, fontSize: 40, color: noir.ivory, marginTop: 10 },
  tagline: { fontFamily: fonts.displayItalic, fontSize: 17, color: noir.gold, marginTop: 2 },
  body: { paddingHorizontal: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  desc: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21, color: noir.ivory62, marginTop: 18 },
  h: { fontFamily: fonts.display, fontSize: 19, color: noir.ivory, marginTop: 30, marginBottom: 14 },
  matchNote: { marginTop: 18, borderWidth: 1, borderColor: noir.gold28, backgroundColor: noir.gold12, borderRadius: 16, padding: 14 },
  matchText: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18.5, color: noir.ivory80, marginTop: 8 },
  step: { flexDirection: 'row', gap: 14, paddingVertical: 13 },
  stepNum: { fontFamily: fonts.monoMedium, fontSize: 11, color: noir.gold, marginTop: 2 },
  stepTitle: { fontFamily: fonts.medium, fontSize: 13.5, color: noir.ivory },
  stepBody: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: noir.ivory62, marginTop: 3 },
  picking: { flex: 1, backgroundColor: noir.bgDeep, alignItems: 'center', justifyContent: 'center', gap: 20 },
  pickingTitle: { fontFamily: fonts.displayItalic, fontSize: 21, color: noir.ivory },
  pickingSub: { fontFamily: fonts.body, fontSize: 12.5, color: noir.ivory60 },
});
