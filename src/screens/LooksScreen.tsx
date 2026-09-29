import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, noir, TAB_BAR_HEIGHT } from '../theme/noir';
import { LOOKS } from '../data/looks';
import { useAppState } from '../state/AppState';
import { LookCard } from '../components/LookCard';
import { Chevron, Eyebrow, Photo } from '../components/ui';

export default function LooksScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { latest, savedLooks } = useAppState();

  return (
    <View style={styles.fill}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Eyebrow size={10} spacing={0.2}>THE LOOKBOOK</Eyebrow>
          <Text style={styles.title}>Seven looks</Text>
          <Text style={styles.sub}>Each one is tuned to your season and features after a scan.</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('MakeupMatch')}
          style={({ pressed }) => [styles.bannerWrap, pressed && { opacity: 0.9 }]}
        >
          <Photo source="makeupMatch" width={900} style={styles.banner} position="top">
            <LinearGradient
              colors={['rgba(20,16,16,0.92)', 'rgba(20,16,16,0.55)', 'rgba(20,16,16,0.05)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.bannerCopy}>
              <Eyebrow size={9} spacing={0.18}>MAKEUP MATCH</Eyebrow>
              <Text style={styles.bannerTitle}>Copy any look{'\n'}you love</Text>
              <View style={styles.bannerLink}>
                <Text style={styles.bannerLinkText}>Upload a photo</Text>
                <Chevron />
              </View>
            </View>
          </Photo>
        </Pressable>

        <View style={styles.grid}>
          {LOOKS.map((look) => (
            <View key={look.id} style={styles.cell}>
              <LookCard
                look={look}
                width="100%"
                height={220}
                badge={latest?.lookId === look.id ? 'FOR YOU' : savedLooks.includes(look.id) ? 'SAVED' : undefined}
                onPress={() => navigation.navigate('LookDetail', { lookId: look.id })}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: noir.bg },
  header: { paddingHorizontal: 20 },
  title: { fontFamily: fonts.display, fontSize: 34, color: noir.ivory, marginTop: 10 },
  sub: { fontFamily: fonts.body, fontSize: 12.5, color: noir.ivory60, marginTop: 6 },
  bannerWrap: { marginHorizontal: 20, marginTop: 22 },
  banner: { height: 150, borderRadius: 18, borderWidth: 1, borderColor: noir.gold28 },
  bannerCopy: { position: 'absolute', left: 18, top: 18, bottom: 18, justifyContent: 'space-between' },
  bannerTitle: { fontFamily: fonts.display, fontSize: 21, lineHeight: 25, color: noir.ivory },
  bannerLink: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerLinkText: { fontFamily: fonts.medium, fontSize: 12, color: noir.gold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, marginTop: 16 },
  cell: { width: '50%', padding: 6 },
});

