import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, noir } from '../theme/noir';
import { getLook } from '../data/looks';
import { matchLook } from '../services/analysis';
import { LookCard } from '../components/LookCard';
import { ScanArch } from '../components/ScanArch';
import { BackButton, Eyebrow, GoldCta, Photo, PillButton } from '../components/ui';

export default function MakeupMatchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [uri, setUri] = useState<string>();
  const [matching, setMatching] = useState(false);
  const [result, setResult] = useState<{ lookId: string; reason: string }>();

  const run = async (res: ImagePicker.ImagePickerResult) => {
    if (res.canceled || !res.assets[0]?.base64) return;
    setUri(res.assets[0].uri);
    setResult(undefined);
    setMatching(true);
    try {
      setResult(await matchLook(res.assets[0].base64));
    } finally {
      setMatching(false);
    }
  };

  const fromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted && Platform.OS !== 'web') return;
    run(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, base64: true }));
  };

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    run(await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true }));
  };

  const look = result ? getLook(result.lookId) : undefined;

  return (
    <View style={styles.fill}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40, paddingHorizontal: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <BackButton onPress={() => navigation.goBack()} />
        <Eyebrow size={10} spacing={0.2} style={{ marginTop: 22 }}>MAKEUP MATCH</Eyebrow>
        <Text style={styles.title}>Seen a look{'\n'}you love?</Text>
        <Text style={styles.sub}>
          Upload a photo — a celebrity, a friend, a magazine page — and we'll match it to the closest Shine Me look.
        </Text>

        <View style={styles.stage}>
          {matching ? (
            <ScanArch>{uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}</ScanArch>
          ) : uri ? (
            <Image source={{ uri }} style={styles.preview} contentFit="cover" />
          ) : (
            <Photo source="makeupMatch" width={700} style={styles.preview}>
              <View style={styles.previewScrim}>
                <Text style={styles.previewText}>Your reference photo</Text>
              </View>
            </Photo>
          )}
        </View>

        {matching && <Text style={styles.matching}>Reading the palette and finish…</Text>}

        {look && result && !matching && (
          <View style={{ marginTop: 26 }}>
            <Eyebrow size={9.5} spacing={0.18}>CLOSEST MATCH</Eyebrow>
            <Text style={styles.reason}>{result.reason}</Text>
            <View style={{ marginTop: 14 }}>
              <LookCard
                look={look}
                width="100%"
                height={220}
                onPress={() => navigation.navigate('LookDetail', { lookId: look.id })}
              />
            </View>
          </View>
        )}

        <GoldCta label={uri ? 'TRY ANOTHER PHOTO' : 'CHOOSE A PHOTO'} onPress={fromLibrary} style={{ marginTop: 26 }} disabled={matching} />
        {Platform.OS !== 'web' && (
          <PillButton label="Take a photo" variant="ghost" onPress={fromCamera} style={{ marginTop: 12 }} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: noir.bg },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: noir.ivory, marginTop: 10 },
  sub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19.5, color: noir.ivory62, marginTop: 10 },
  stage: { alignItems: 'center', marginTop: 26 },
  preview: { width: '100%', height: 330, borderRadius: 22, borderWidth: 1, borderColor: noir.gold28, overflow: 'hidden' },
  previewScrim: { flex: 1, backgroundColor: 'rgba(20,16,16,0.45)', alignItems: 'center', justifyContent: 'flex-end', padding: 18 },
  previewText: { fontFamily: fonts.displayItalic, fontSize: 17, color: noir.ivory },
  matching: { fontFamily: fonts.displayItalic, fontSize: 18, color: noir.ivory, textAlign: 'center', marginTop: 20 },
  reason: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: noir.ivory80, marginTop: 8 },
});
