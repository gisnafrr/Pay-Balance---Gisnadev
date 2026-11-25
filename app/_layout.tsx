import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors } from '@/theme/colors';
import { OnboardingModal, PinLockModal } from '@/components/security/SecurityModals';
import { LaunchSplash } from '@/components/onboarding/LaunchSplash';
import { AppTutorialModal } from '@/components/onboarding/AppTutorialModal';

export default function RootLayout() {
  const {
    initialized,
    initializeApp,
    themeMode,
    profile,
    isLocked,
    showTutorial,
    setShowTutorial,
  } = useAppStore();
  const colors = getThemeColors(themeMode);
  const [splashDone, setSplashDone] = useState(false);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Show interactive tutorial automatically once on first launch
  useEffect(() => {
    if (splashDone && initialized && profile?.onboarding_completed === 1) {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          const seen = window.localStorage.getItem('qoupay_tutorial_seen_v1');
          if (!seen) {
            window.localStorage.setItem('qoupay_tutorial_seen_v1', '1');
            setShowTutorial(true);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [splashDone, initialized, profile?.onboarding_completed, setShowTutorial]);

  const showOnboarding = initialized && profile?.onboarding_completed === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'light'} />

      {initialized && fontsLoaded && (
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modals/add-transaction"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/add-journal"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/workspace-transfer"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="modules/accounts" />
          <Stack.Screen name="modules/coa" />
          <Stack.Screen name="modules/journals" />
          <Stack.Screen name="modules/budgets" />
          <Stack.Screen name="modules/debts" />
          <Stack.Screen name="modules/currencies" />
          <Stack.Screen name="modules/trash" />
          <Stack.Screen name="modules/backup" />
          <Stack.Screen name="modules/about" />
        </Stack>
      )}

      {/* Cinematic Launch Splash Animation */}
      {!splashDone && <LaunchSplash onFinish={() => setSplashDone(true)} />}

      <OnboardingModal visible={splashDone && showOnboarding} />
      <PinLockModal visible={splashDone && !showOnboarding && isLocked} />
      <AppTutorialModal
        visible={splashDone && !showOnboarding && !isLocked && showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </View>
  );
}
