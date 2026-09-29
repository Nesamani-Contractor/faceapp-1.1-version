import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, gradients, noir, TAB_BAR_HEIGHT, track } from '../theme/noir';
import { BRAND, FREE_SCANS, TAGLINE } from '../data/copy';
import { LOOKS, getLook } from '../data/looks';
import { getSeason } from '../data/seasons';
import { useAppState } from '../state/AppState';
import { formatShortDate } from '../utils/format';
import { ChampagneGlow, Chevron, Chip, GoldCard, GoldCta, Photo, SectionHead } from '../components/ui';
import { LookCard } from '../components/LookCard';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { latest, history, isPremium } = useAppState();

  const startScan = () => {
    if (!isPremium && history.length >= FREE_SCANS) navigation.navigate('Paywall');
    else navigation.navigate('Camera');
  };

  const heroHeight = 430 + insets.top;

  return (
    <View style={styles.fill}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-bleed portrait hero */}
        <Photo source="hero" width={1100} style={{ height: heroHeight }} position="top">
          <ChampagneGlow />
          <LinearGradient
            colors={gradients.heroFade}
            locations={gradients.heroFadeStops}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            accessibilityLabel="Your vault"
            onPress={() => navigation.navigate('Tabs', { screen: 'Vault' } as never)}
            hitSlop={12}
            style={[styles.avatar, { top: insets.top + 10 }]}
          />
          <View style={styles.heroCopy}>
            <Text style={styles.brand}>{BRAND}</Text>
            <Text style={styles.headline}>
              Tonight you{'\n'}
              <Text style={styles.headlineEm}>glow</Text>
            </Text>
            <Text style={styles.tagline}>{TAGLINE}</Text>
          </View>
        </Photo>

        <View style={styles.ctaWrap}>
          <GoldCta label="SCAN MY FACE" onPress={startScan} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Face Reader" active onPress={startScan} />
          <Chip
            label="Colour Season"
            onPress={() => navigation.navigate('Seasons', latest ? { highlight: latest.seasonId } : undefined)}
          />
          <Chip label="Makeup Match" onPress={() => navigation.navigate('MakeupMatch')} />
        </ScrollView>

        <SectionHead
          title="Seven looks"
          action="SWIPE →"
          onAction={() => navigation.navigate('Tabs', { screen: 'Looks' } as never)}
          style={styles.sectionHead}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
          decelerationRate="fast"
          snapToInterval={160}
        >
          {LOOKS.map((look) => (
            <LookCard
              key={look.id}
              look={look}
              badge={latest?.lookId === look.id ? 'FOR YOU' : undefined}
              onPress={() => navigation.navigate('LookDetail', { lookId: look.id })}
            />
          ))}
        </ScrollView>

        <GoldCard
          style={styles.lastScan}
          onPress={latest ? () => navigation.navigate('Results', { recordId: latest.id }) : startScan}
        >
          <Text style={styles.score}>{latest ? latest.shineScore : '—'}</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            {latest ? (
              <>
                <Text style={styles.lastTitle}>Last scan · {formatShortDate(latest.timestamp)}</Text>
                <Text style={styles.lastSub} numberOfLines={1}>
                  {getSeason(latest.seasonId).name} · {getLook(latest.lookId)?.title} · saved to your vault
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.lastTitle}>No scans yet</Text>
                <Text style={styles.lastSub}>Your first reading takes 20 seconds</Text>
              </>
            )}
          </View>
          <Chevron />
        </GoldCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: noir.bg },
  avatar: {
    position: 'absolute',
    right: 18,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: noir.cream35,
  },
  heroCopy: { position: 'absolute', left: 0, right: 0, bottom: 26, alignItems: 'center', paddingHorizontal: 24 },
  brand: {
    fontFamily: fonts.display,
    fontSize: 15,
    letterSpacing: track(0.42, 15),
    paddingLeft: track(0.42, 15),
    color: noir.gold,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 42.4,
    color: noir.ivory,
    textAlign: 'center',
    marginTop: 16,
  },
  headlineEm: { fontFamily: fonts.displayItalic, color: noir.gold },
  tagline: { fontFamily: fonts.body, fontSize: 12.5, color: noir.ivory60, marginTop: 10, textAlign: 'center' },
  ctaWrap: { paddingHorizontal: 20, marginTop: -6 },
  chips: { gap: 8, paddingHorizontal: 20, paddingTop: 20 },
  sectionHead: { marginTop: 22, marginHorizontal: 20 },
  rail: { gap: 12, paddingHorizontal: 20, paddingTop: 14 },
  lastScan: { marginTop: 22, marginHorizontal: 20 },
  score: { fontFamily: fonts.display, fontSize: 30, color: noir.gold, minWidth: 36 },
  lastTitle: { fontFamily: fonts.medium, fontSize: 12.5, color: noir.ivory },
  lastSub: { fontFamily: fonts.body, fontSize: 11, color: noir.ivory52, marginTop: 2 },
});
