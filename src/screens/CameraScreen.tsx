import React, { useRef, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, noir, track } from '../theme/noir';
import { SCAN_TIPS } from '../data/copy';
import { setPendingCapture, mediaTypeFor } from '../utils/capture';
import { ScanArch } from '../components/ScanArch';
import { BackButton, ChampagneGlow, Eyebrow, GoldCta, PillButton } from '../components/ui';

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [tipsOpen, setTipsOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const camera = useRef<CameraView>(null);

  const go = (uri: string, base64: string | null | undefined) => {
    if (!base64) {
      Alert.alert("Couldn't read that photo", 'Please try again.');
      return;
    }
    const clean = base64.replace(/^data:[^,]+,/, '');
    setPendingCapture({ uri, base64: clean, mediaType: mediaTypeFor(uri) });
    navigation.navigate('Analyzing');
  };

  const capture = async () => {
    if (busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const photo = await camera.current?.takePictureAsync({ quality: 0.6, base64: true, skipProcessing: false });
      if (photo) go(photo.uri, photo.base64);
    } catch {
      Alert.alert("Couldn't capture that", 'Please try the shutter again.');
    } finally {
      setBusy(false);
    }
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted && Platform.OS !== 'web') return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
      aspect: [3, 4],
      base64: true,
    });
    if (res.canceled || !res.assets[0]) return;
    go(res.assets[0].uri, res.assets[0].base64);
  };

  const granted = permission?.granted;

  return (
    <View style={styles.fill}>
      <ChampagneGlow opacity={0.12} />

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <BackButton onPress={() => navigation.goBack()} />
        <Eyebrow size={10} spacing={0.2}>FACE READER</Eyebrow>
        <Pressable
          accessibilityLabel="Flip camera"
          onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
          style={styles.iconBtn}
          hitSlop={10}
        >
          <Ionicons name="camera-reverse-outline" size={18} color={noir.ivory} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <ScanArch sweeping={busy}>
          {granted ? (
            <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={facing} mirror={facing === 'front'} />
          ) : (
            <View style={styles.permission}>
              <Text style={styles.permTitle}>Let us see your light</Text>
              <Text style={styles.permBody}>Camera access lets Shine Me read your face shape and colour season.</Text>
              <PillButton label="ENABLE CAMERA" onPress={requestPermission} style={{ marginTop: 18, alignSelf: 'stretch' }} />
            </View>
          )}
        </ScanArch>
        <Text style={styles.hint}>{busy ? 'Hold still…' : 'Fit your face inside the frame'}</Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable accessibilityLabel="Choose from library" onPress={pickFromLibrary} style={styles.iconBtnLg}>
          <Ionicons name="images-outline" size={20} color={noir.ivory} />
        </Pressable>
        <Pressable
          accessibilityLabel="Take photo"
          disabled={!granted || busy}
          onPress={capture}
          style={({ pressed }) => [styles.shutter, { opacity: granted ? 1 : 0.4, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
        >
          <View style={styles.shutterInner} />
        </Pressable>
        <Pressable accessibilityLabel="Scan tips" onPress={() => setTipsOpen(true)} style={styles.iconBtnLg}>
          <Ionicons name="help-outline" size={20} color={noir.ivory} />
        </Pressable>
      </View>

      <Modal visible={tipsOpen} transparent animationType="fade" onRequestClose={() => setTipsOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setTipsOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 30 }]}>
          <View style={styles.grabber} />
          <Eyebrow size={10} spacing={0.2}>BEFORE YOU SCAN</Eyebrow>
          <Text style={styles.sheetTitle}>For the truest reading</Text>
          {SCAN_TIPS.map((tip) => (
            <View key={tip.text} style={styles.tipRow}>
              <View style={[styles.tipDot, { borderColor: tip.ok ? noir.gold : noir.ivory42 }]}>
                <Ionicons name={tip.ok ? 'checkmark' : 'close'} size={11} color={tip.ok ? noir.gold : noir.ivory60} />
              </View>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
          <GoldCta label="I'M READY" onPress={() => setTipsOpen(false)} style={{ marginTop: 22 }} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: noir.bgDeep },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: noir.cream35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 },
  hint: { fontFamily: fonts.displayItalic, fontSize: 19, color: noir.ivory },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  permTitle: { fontFamily: fonts.display, fontSize: 20, color: noir.ivory, textAlign: 'center' },
  permBody: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: noir.ivory62, textAlign: 'center', marginTop: 8 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  iconBtnLg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: noir.ivory22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1.5,
    borderColor: noir.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: noir.goldLight },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: noir.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: noir.sheet,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderColor: noir.gold35,
    paddingTop: 14,
    paddingHorizontal: 22,
  },
  grabber: { width: 38, height: 4, borderRadius: 9, backgroundColor: noir.ivory22, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontFamily: fonts.display, fontSize: 26, color: noir.ivory, marginTop: 10, marginBottom: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  tipDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tipText: { fontFamily: fonts.body, fontSize: 13.5, color: noir.ivory80, letterSpacing: track(0.01, 13.5) },
});
