import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { fonts, gradients, noir, track } from '../theme/noir';
import { getSeason } from '../data/seasons';
import { getLook } from '../data/looks';
import { useAppState } from '../state/AppState';
import { formatDateTime, humanize } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';
import { LookCard } from '../components/LookCard';
import { BackButton, ChampagneGlow, Eyebrow, Hairline, Photo, PillButton, Swatches } from '../components/ui';

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Eyebrow size={9.5} spacing={0.2}>{eyebrow}</Eyebrow>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{humanize(value)}</Text>
      </View>
      {!last && <Hairline />}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Eyebrow color={noir.ivory52} size={8.5} spacing={0.14} style={{ marginTop: 5 }}>
        {label}
      </Eyebrow>
    </View>
  );
}

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Results'>>();
  const { history } = useAppState();
  const record = history.find((r) => r.id === params.recordId);

  if (!record) {
    return (
      <View style={[styles.fill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.sectionTitle}>This scan is no longer in your vault.</Text>
        <PillButton label="Back" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const a = record.analysis;
  const season = getSeason(record.seasonId);
  const look = getLook(record.lookId)!;
  const lowConfidence = a.color.confidence === 'low' || a.face_shape.confidence === 'low';

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <Photo
          uri={record.photoUri}
          source={record.photoUri ? undefined : season.id}
          style={{ height: 380 + insets.top }}
          position="top"
        >
          <ChampagneGlow />
          <LinearGradient colors={gradients.heroFade} locations={gradients.heroFadeStops} style={StyleSheet.absoluteFill} />
          <View style={[styles.topBar, { top: insets.top + 8 }]}>
            <BackButton onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Tabs'))} />
            <View style={styles.dateChip}>
              <Eyebrow color={noir.cream50} size={9} spacing={0.14}>{formatDateTime(record.timestamp).toUpperCase()}</Eyebrow>
            </View>
          </View>
        </Photo>

        {/* Result sheet — mirrors the 1b "done" bottom sheet */}
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.titleRow}>
            <Text style={styles.season}>{season.name}</Text>
            <Eyebrow size={10} spacing={0.14}>{record.shineScore} SHINE</Eyebrow>
          </View>
          <Text style={styles.lede}>{season.description}</Text>
          <View style={{ marginTop: 16 }}>
            <Swatches colors={a.color.best_colors_hex.slice(0, 5)} />
          </View>
          <Text style={styles.quote}>“{a.compliment}”</Text>

          {record.source === 'demo' && (
            <View style={styles.note}>
              <Text style={styles.noteText}>
                Demo reading. Set EXPO_PUBLIC_API_URL to the Shine Me server for a real Claude-powered analysis of your photo.
              </Text>
            </View>
          )}
          {lowConfidence && (
            <View style={styles.note}>
              <Text style={styles.noteText}>
                Lighting made a couple of readings less certain — retake in soft daylight for a sharper result.
              </Text>
            </View>
          )}

          <Section eyebrow="COLOUR ANALYSIS" title={`${a.color.season} · ${a.color.sub_season}`}>
            <View style={styles.stats}>
              <Stat label="UNDERTONE" value={a.color.undertone} />
              <Stat label="DEPTH" value={a.color.depth} />
              <Stat label="CONTRAST" value={a.color.contrast} />
            </View>
            <Text style={styles.label}>Wear these</Text>
            <Swatches colors={a.color.best_colors_hex} height={40} radius={10} gap={7} />
            {a.color.avoid_colors_hex.length > 0 && (
              <>
                <Text style={styles.label}>Go easy on</Text>
                <View style={{ width: '60%' }}>
                  <Swatches colors={a.color.avoid_colors_hex} height={26} radius={8} gap={6} />
                </View>
              </>
            )}
            <Text style={styles.body}>
              Best metal: <Text style={{ color: noir.gold }}>{a.color.best_metal}</Text> · {season.keywords}
            </Text>
          </Section>

          <Section eyebrow="FACIAL ANALYSIS" title={`${a.face_shape.value} face`}>
            <Text style={[styles.body, { marginTop: 4, marginBottom: 8 }]}>{a.face_shape.note}</Text>
            <Row label="Eyes" value={a.features.eye_shape} />
            <Row label="Brows" value={a.features.brow_shape} />
            <Row label="Lips" value={a.features.lip_shape} />
            <Row label="Nose" value={a.features.nose} />
            <Row label="Cheekbones" value={a.features.cheekbones} />
            <Row label="Jawline" value={a.features.jawline} last />
          </Section>

          <Section eyebrow="SKIN" title={`${humanize(a.skin.apparent_type)} skin`}>
            <View style={styles.tags}>
              {a.skin.strengths.map((s) => (
                <View key={s} style={styles.tag}>
                  <Text style={styles.tagText}>{humanize(s)}</Text>
                </View>
              ))}
            </View>
            {a.skin.notes.map((n) => (
              <Text key={n} style={styles.body}>{n}</Text>
            ))}
            <Text style={styles.disclaimer}>
              Cosmetic estimates from a photo — not a medical assessment.
            </Text>
          </Section>

          <Section eyebrow="MAKEUP GUIDE" title="Made for your features">
            {(['base', 'cheeks', 'eyes', 'brows', 'lips'] as const).map((k, i, arr) => (
              <React.Fragment key={k}>
                <View style={styles.step}>
                  <Text style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{humanize(k)}</Text>
                    <Text style={styles.stepBody}>{a.makeup[k]}</Text>
                  </View>
                </View>
                {i < arr.length - 1 && <Hairline />}
              </React.Fragment>
            ))}
          </Section>

          <Section eyebrow="YOUR LOOK" title="Recommended for you">
            <View style={{ marginTop: 12 }}>
              <LookCard
                look={look}
                width="100%"
                height={240}
                badge="FOR YOU"
                onPress={() => navigation.navigate('LookDetail', { lookId: look.id })}
              />
            </View>
          </Section>

          <View style={styles.actions}>
            <PillButton
              label={`${look.title.toUpperCase()} →`}
              onPress={() => navigation.navigate('LookDetail', { lookId: look.id })}
              style={{ flex: 1 }}
            />
            <PillButton label="Scan again" variant="ghost" onPress={() => navigation.navigate('Camera')} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: noir.bg },
  topBar: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateChip: { borderWidth: 1, borderColor: noir.cream22, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(20,16,16,0.4)' },
  sheet: {
    marginTop: -40,
    backgroundColor: noir.sheet,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderColor: noir.gold35,
    paddingTop: 14,
    paddingHorizontal: 22,
  },
  grabber: { width: 38, height: 4, borderRadius: 9, backgroundColor: noir.ivory22, alignSelf: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  season: { fontFamily: fonts.display, fontSize: 26, color: noir.ivory },
  lede: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18.75, color: noir.ivory62, marginTop: 8 },
  quote: { fontFamily: fonts.displayItalic, fontSize: 19, lineHeight: 26, color: noir.ivory, marginTop: 20 },
  note: { marginTop: 14, borderWidth: 1, borderColor: noir.gold28, borderRadius: 14, padding: 12 },
  noteText: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 17, color: noir.ivory62 },
  section: { marginTop: 34 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: noir.ivory, marginTop: 8 },
  stats: { flexDirection: 'row', marginTop: 14, gap: 10 },
  stat: { flex: 1, borderWidth: 1, borderColor: noir.ivory10, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12 },
  statValue: { fontFamily: fonts.display, fontSize: 17, color: noir.ivory },
  label: { fontFamily: fonts.medium, fontSize: 11.5, color: noir.ivory52, marginTop: 16, marginBottom: 8, letterSpacing: track(0.06, 11.5) },
  body: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18.75, color: noir.ivory62, marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowLabel: { fontFamily: fonts.body, fontSize: 13, color: noir.ivory60 },
  rowValue: { fontFamily: fonts.medium, fontSize: 13, color: noir.ivory, textAlign: 'right', flexShrink: 1, marginLeft: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { borderRadius: 99, borderWidth: 1, borderColor: noir.gold45, backgroundColor: noir.gold16, paddingVertical: 6, paddingHorizontal: 12 },
  tagText: { fontFamily: fonts.body, fontSize: 11.5, color: noir.goldText },
  disclaimer: { fontFamily: fonts.body, fontSize: 10.5, color: noir.ivory42, marginTop: 12, fontStyle: 'italic' },
  step: { flexDirection: 'row', gap: 14, paddingVertical: 13 },
  stepNum: { fontFamily: fonts.monoMedium, fontSize: 11, color: noir.gold, marginTop: 2 },
  stepTitle: { fontFamily: fonts.medium, fontSize: 13.5, color: noir.ivory },
  stepBody: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: noir.ivory62, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 28 },
});
