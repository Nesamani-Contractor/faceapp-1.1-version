import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_500Medium_Italic,
  PlayfairDisplay_600SemiBold,
} from '@expo-google-fonts/playfair-display';
import { Jost_300Light, Jost_400Regular, Jost_500Medium, Jost_600SemiBold } from '@expo-google-fonts/jost';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { AppStateProvider, useAppState } from './src/state/AppState';
import RootNavigator from './src/navigation/RootNavigator';
import { noir } from './src/theme/noir';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready } = useAppState();
  const show = ready && fontsLoaded;
  useEffect(() => {
    if (show) SplashScreen.hideAsync().catch(() => {});
  }, [show]);
  if (!show) return <View style={{ flex: 1, backgroundColor: noir.bg }} />;
  return <RootNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_500Medium_Italic,
    PlayfairDisplay_600SemiBold,
    Jost_300Light,
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: noir.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppStateProvider>
          <Gate fontsLoaded={fontsLoaded} />
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
