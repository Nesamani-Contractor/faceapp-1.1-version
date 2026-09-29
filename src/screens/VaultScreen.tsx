import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, noir, TAB_BAR_HEIGHT } from '../theme/noir';
import { getLook, LOOKS } from '../data/looks';
import { getSeason } from '../data/seasons';
import { useAppState } from '../state/AppState';
import { formatDateTime } from '../utils/format';
import { LookCard } from '../components/LookCard';
import { Chevron, Eyebrow, GoldCard, GoldCta, Hairline, Photo, SectionHead, Swatches } from '../components/ui';

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Eyebrow color={noir.ivory52} size={9.5} spacing={0.12} style={{ marginTop: 5 }}>{label}</Eyebrow>
    </View>
  );
}

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { history, savedLooks, isPremium } = useAppState();
  const avg = history.length ? Math.round(history.reduce((s, r) => s + r.shineScore, 0) / history.length) : 0;
  const saved = LOOKS.filter((l) => savedLooks.includes(l.id));

  return (
    <View style={styles.fill}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pad}>
          <Eyebrow size={10} spacing={0.2}>YOUR VAULT</Eyebrow>
          <Text style={styles.title}>Every reading,{'\n'}kept</Text>

          <View style={styles.stats}>
            <Stat value={history.length} label="SCANS" />
            <Stat value={avg || '—'} label="AVG SHINE" />
            <Stat value={saved.length} label="SAVED LOOKS" />
          </View>
        </View>

        {!isPremium && (
          <GoldCard style={[styles.pad, { marginTop: 24 }]} onPress={() => navigation.navigate('Paywall')}>
            <View style={styles.diamond} />
            <Text style={styles.premiumText}>Premium unlocks style-icon match and unlimited scans.</Text>
            <Text style={styles.premiumPrice}>$39.99</Text>
          </GoldCard>
        )}

        {saved.length > 0 && (
          <>
            <SectionHead title="Saved looks" style={[styles.pad, { marginTop: 28 }]} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
              {saved.map((look) => (
                <LookCard key={look.id} look={look} onPress={() => navigation.navigate('LookDetail', { lookId: look.id })} />
              ))}
            </ScrollView>
          </>
        )}

        <SectionHead title="Scan history" style={[styles.pad, { marginTop: 28, marginBottom: 6 }]} />
        {history.length === 0 ? (
          <View style={styles.pad}>
            <Text style={styles.empty}>Your readings will live here — season, look and guide, ready whenever you are.</Text>
            <GoldCta label="SCAN MY FACE" onPress={() => navigation.navigate('Camera')} style={{ marginTop: 18 }} />
          </View>
        ) : (
          history.map((r, i) => {
            const season = getSeason(r.seasonId);
            return (
              <View key={r.id} style={styles.pad}>
                <Pressable
                  onPress={() => navigation.navigate('Results', { recordId: r.id })}
                  style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}
                >
                  <Photo uri={r.photoUri} source={r.photoUri ? undefined : season.id} width={200} style={styles.thumb} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.itemTitle}>{season.name} · {getLook(r.lookId)?.title}</Text>
                    <Text style={styles.itemSub}>{formatDateTime(r.timestamp)}</Text>
                    <View style={{ width: 110, marginTop: 8 }}>
                      <Swatches colors={r.analysis.color.best_colors_hex.slice(0, 5)} height={10} radius={3} gap={3} />
                    </View>
                  </View>
                  <Text style={styles.itemScore}>{r.shineScore}</Text>
                  <Chevron />
                </Pressable>
                {i < history.length - 1 && <Hairline />}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: noir.bg },
  pad: { marginHorizontal: 20 },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: noir.ivory, marginTop: 10 },
  stats: { flexDirection: 'row', gap: 30, marginTop: 22 },
  statValue: { fontFamily: fonts.display, fontSize: 30, color: noir.gold },
  diamond: { width: 9, height: 9, backgroundColor: noir.gold, transform: [{ rotate: '45deg' }] },
  premiumText: { flex: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 17.4, color: noir.ivory80 },
  premiumPrice: { fontFamily: fonts.medium, fontSize: 12, color: noir.gold, textDecorationLine: 'underline' },
  rail: { gap: 12, paddingHorizontal: 20, paddingTop: 14 },
  empty: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19.5, color: noir.ivory60, marginTop: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  thumb: { width: 56, height: 70, borderRadius: 12 },
  itemTitle: { fontFamily: fonts.medium, fontSize: 13.5, color: noir.ivory },
  itemSub: { fontFamily: fonts.body, fontSize: 11, color: noir.ivory52, marginTop: 2 },
  itemScore: { fontFamily: fonts.display, fontSize: 22, color: noir.gold },
});
