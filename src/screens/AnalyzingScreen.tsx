import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts, noir } from '../theme/noir';
import { SCAN_STEPS } from '../data/copy';
import { analyzeFace, buildRecord, ScanError, API_URL } from '../services/analysis';
import { useAppState } from '../state/AppState';
import { clearPendingCapture, takePendingCapture } from '../utils/capture';
import { ScanArch } from '../components/ScanArch';
import { Eyebrow, PillButton } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';

export default function AnalyzingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { addScan } = useAppState();
  const capture = useRef(takePendingCapture()).current;
  const [pct, setPct] = useState(0);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string>();
  const done = useRef(false);

  useEffect(() => {
    if (!capture) {
      navigation.goBack();
      return;
    }
    // Ease toward 92% while waiting; the last stretch completes on response.
    const tick = setInterval(() => {
      setPct((p) => (done.current ? p : Math.min(92, p + Math.max(0.4, (92 - p) * 0.045))));
    }, 60);
    const words = setInterval(() => setStep((s) => (s + 1) % SCAN_STEPS.length), 1700);
    let cancelled = false;

    analyzeFace(capture.base64, capture.mediaType)
      .then(({ analysis, source }) => {
        if (cancelled) return;
        done.current = true;
        setPct(100);
        const record = buildRecord(analysis, source, capture.uri);
        addScan(record);
        clearPendingCapture();
        setTimeout(() => navigation.replace('Results', { recordId: record.id, fresh: true }), 350);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof ScanError
            ? e.message
            : `Couldn't reach the Shine Me AI (${API_URL}). Check that the server in /server is running.`
        );
      });

    return () => {
      cancelled = true;
      clearInterval(tick);
      clearInterval(words);
    };
  }, []);

  const shown = `${Math.round(pct)}%`;

  return (
    <View style={styles.fill}>
      <ScanArch sweeping={!error}>
        {capture ? <Image source={{ uri: capture.uri }} style={[StyleSheet.absoluteFill, { opacity: 0.85 }]} contentFit="cover" /> : null}
      </ScanArch>

      {error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.title}>We couldn't finish that scan</Text>
          <Text style={styles.error}>{error}</Text>
          <PillButton label="TRY AGAIN" onPress={() => navigation.goBack()} style={{ alignSelf: 'stretch', marginTop: 22 }} />
        </View>
      ) : (
        <>
          <Text style={styles.title}>{SCAN_STEPS[step]}</Text>
          <View style={styles.progressRow}>
            <View style={styles.track}>
              <View style={[styles.bar, { width: shown as `${number}%` }]} />
            </View>
            <Text style={styles.pct}>{shown}</Text>
          </View>
          <Eyebrow color={noir.ivory42} size={9.5} spacing={0.18}>
            FACE · COLOUR · MAKEUP
          </Eyebrow>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: noir.bgDeep, alignItems: 'center', justifyContent: 'center', gap: 26 },
  title: { fontFamily: fonts.displayItalic, fontSize: 21, color: noir.ivory, textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { width: 170, height: 1.5, backgroundColor: noir.ivory16 },
  bar: { height: '100%', backgroundColor: noir.gold },
  pct: { fontFamily: fonts.monoMedium, fontSize: 11, color: noir.gold, minWidth: 34 },
  errorWrap: { alignItems: 'center', paddingHorizontal: 36, alignSelf: 'stretch' },
  error: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: noir.ivory62, textAlign: 'center', marginTop: 10 },
});
