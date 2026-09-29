import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, gradients, noir } from '../theme/noir';
import { PLANS, PREMIUM_FEATURES } from '../data/copy';
import { useAppState } from '../state/AppState';
import { BackButton, ChampagneGlow, Eyebrow, GoldCta, Photo } from '../components/ui';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unlockPremium } = useAppState();
  const [plan, setPlan] = useState<string>('yearly');

  // TODO(store): wire to StoreKit / Play Billing (e.g. RevenueCat). Until then
  // this unlocks locally so the premium flow can be reviewed end to end.
  const purchase = () => {
    unlockPremium();
    navigation.goBack();
  };

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <Photo source="paywall" width={1000} style={{ height: 340 }}>
          <ChampagneGlow />
          <LinearGradient colors={gradients.heroFade} locations={gradients.heroFadeStops} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', top: 16, left: 20 }}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.heroCopy}>
            <Eyebrow size={10} spacing={0.24}>SHINE ME PREMIUM</Eyebrow>
            <Text style={styles.title}>
              Glow without{'\n'}<Text style={styles.em}>limits</Text>
            </Text>
          </View>
        </Photo>

        <View style={styles.body}>
          {PREMIUM_FEATURES.map((f) => (
            <View key={f.label} style={styles.feature}>
              <Ionicons name={f.icon} size={17} color={noir.gold} />
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}

          <View style={styles.plans}>
            {PLANS.map((p) => {
              const on = plan === p.id;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setPlan(p.id)}
                  style={[styles.plan, on && styles.planOn]}
                >
                  {'badge' in p && p.badge ? (
                    <View style={styles.badge}>
                      <Eyebrow size={8} spacing={0.14} color={noir.ink}>{p.badge.toUpperCase()}</Eyebrow>
                    </View>
                  ) : null}
                  <Text style={styles.planLabel}>{p.label}</Text>
                  <Text style={styles.planPrice}>
                    {p.price}
                    <Text style={styles.planPeriod}>{p.period}</Text>
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <GoldCta label="CONTINUE" onPress={purchase} style={{ marginTop: 22 }} />
          <Text style={styles.fine}>Cancel anytime. Payment is charged to your store account at confirmation.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: noir.bg },
  heroCopy: { position: 'absolute', left: 22, right: 22, bottom: 20 },
  title: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42, color: noir.ivory, marginTop: 12 },
  em: { fontFamily: fonts.displayItalic, color: noir.gold },
  body: { paddingHorizontal: 22 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  featureText: { fontFamily: fonts.body, fontSize: 14, color: noir.ivory80 },
  plans: { flexDirection: 'row', gap: 12, marginTop: 20 },
  plan: { flex: 1, borderWidth: 1, borderColor: noir.ivory16, borderRadius: 18, padding: 16, paddingTop: 20 },
  planOn: { borderColor: noir.gold, backgroundColor: noir.gold12 },
  badge: { position: 'absolute', top: -10, right: 12, backgroundColor: noir.gold, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  planLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: noir.ivory66 },
  planPrice: { fontFamily: fonts.display, fontSize: 24, color: noir.ivory, marginTop: 6 },
  planPeriod: { fontFamily: fonts.body, fontSize: 12, color: noir.ivory52 },
  fine: { fontFamily: fonts.body, fontSize: 10.5, color: noir.ivory42, textAlign: 'center', marginTop: 14 },
});
