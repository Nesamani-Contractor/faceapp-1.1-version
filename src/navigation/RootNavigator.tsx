import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { fonts, noir } from '../theme/noir';
import { useAppState } from '../state/AppState';
import type { RootStackParamList, TabParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import LooksScreen from '../screens/LooksScreen';
import VaultScreen from '../screens/VaultScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import CameraScreen from '../screens/CameraScreen';
import AnalyzingScreen from '../screens/AnalyzingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import LookDetailScreen from '../screens/LookDetailScreen';
import MakeupMatchScreen from '../screens/MakeupMatchScreen';
import SeasonsScreen from '../screens/SeasonsScreen';
import PaywallScreen from '../screens/PaywallScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: noir.bg, card: noir.bg, primary: noir.gold, text: noir.ivory },
};

// 1b tab glyphs: rounded square (Scan), circle (Looks), diamond (Vault).
function TabGlyph({ name, color }: { name: keyof TabParamList; color: string }) {
  const base = { width: 17, height: 17, borderWidth: 1.6, borderColor: color };
  if (name === 'Scan') return <View style={[base, { borderRadius: 5 }]} />;
  if (name === 'Looks') return <View style={[base, { borderRadius: 9 }]} />;
  return <View style={[base, { width: 14, height: 14, margin: 1.5, transform: [{ rotate: '45deg' }] }]} />;
}

function NoirTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: noir.tabBar }]} />
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? noir.gold : noir.ivory42;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={route.name}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.tab}
            hitSlop={8}
          >
            <TabGlyph name={route.name as keyof TabParamList} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <NoirTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: noir.bg } }}
    >
      <Tab.Screen name="Scan" component={HomeScreen} />
      <Tab.Screen name="Looks" component={LooksScreen} />
      <Tab.Screen name="Vault" component={VaultScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { hasOnboarded } = useAppState();
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        initialRouteName={hasOnboarded ? 'Tabs' : 'Welcome'}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: noir.bg }, animation: 'fade_from_bottom' }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Tabs" component={Tabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="Camera" component={CameraScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Analyzing" component={AnalyzingScreen} options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="LookDetail" component={LookDetailScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="MakeupMatch" component={MakeupMatchScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Seasons" component={SeasonsScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: noir.ivory10,
    overflow: 'hidden',
  },
  tab: { alignItems: 'center', gap: 5, minWidth: 60 },
  tabLabel: { fontFamily: fonts.body, fontSize: 10 },
});
