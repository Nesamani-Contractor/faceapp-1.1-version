import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, noir } from '../theme/noir';
import { Stripes } from './ui';

// The 1b face frame: 250×330, radius 130/130/120/120, champagne hairline,
// with a sweep band travelling top → bottom every 1.4s.
export const ARCH = { width: 250, height: 330 };

export function ScanArch({ children, sweeping = true, style, scale = 1 }: {
  children?: React.ReactNode;
  sweeping?: boolean;
  style?: StyleProp<ViewStyle>;
  scale?: number;
}) {
  const t = useRef(new Animated.Value(0)).current;
  const w = ARCH.width * scale;
  const h = ARCH.height * scale;

  useEffect(() => {
    if (!sweeping) return;
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [sweeping, t]);

  const band = h * 0.34;
  // translateY(-100%) → translateY(200%) of the band's own height.
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-band, band * 2] });

  return (
    <View
      style={[
        styles.arch,
        {
          width: w,
          height: h,
          borderTopLeftRadius: 130 * scale,
          borderTopRightRadius: 130 * scale,
          borderBottomLeftRadius: 120 * scale,
          borderBottomRightRadius: 120 * scale,
        },
        style,
      ]}
    >
      <Stripes />
      {children}
      {sweeping && (
        <Animated.View style={[styles.band, { height: band, transform: [{ translateY }] }]} pointerEvents="none">
          <LinearGradient colors={gradients.sweep} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  arch: { overflow: 'hidden', borderWidth: 1, borderColor: noir.gold40, backgroundColor: noir.stripeA },
  band: { position: 'absolute', left: 0, right: 0, top: 0 },
});
