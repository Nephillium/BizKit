import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { StyleSheet, ActivityIndicator, View, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import AnalyticsConsent from './src/components/AnalyticsConsent';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BuyCreditsScreen from './src/screens/BuyCreditsScreen';
import { sellsCreditsInApp } from './src/lib/playBilling';
import { theme } from './src/lib/theme';

type Screen = 'login' | 'register' | 'home' | 'profile' | 'buyCredits';

function TabBar({
  currentScreen,
  setCurrentScreen,
  bottomInset,
}: {
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
  bottomInset: number;
}) {
  const { t } = useLanguage();
  const tabs: { key: Screen; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: t.tabCreate, icon: 'create-outline' },
    { key: 'profile', label: t.tabAccount, icon: 'person-outline' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(bottomInset, 8) }]}>
      {tabs.map((tab) => {
        const active = tab.key === 'profile'
          ? currentScreen === 'profile' || currentScreen === 'buyCredits'
          : currentScreen === tab.key;
        const color = active ? theme.primary : theme.muted;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => setCurrentScreen(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
          >
            <Ionicons name={tab.icon} size={22} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AppContent({ currentScreen, setCurrentScreen }: { currentScreen: Screen; setCurrentScreen: (s: Screen) => void }) {
  const { isLoading, isAuthenticated } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    if (authScreen === 'login') {
      return <LoginScreen onNavigateToRegister={() => setAuthScreen('register')} />;
    }
    return <RegisterScreen onNavigateToLogin={() => setAuthScreen('login')} />;
  }

  switch (currentScreen) {
    case 'profile':
      return (
        <ProfileScreen
          onNavigateToBuyCredits={
            sellsCreditsInApp(Platform.OS) ? () => setCurrentScreen('buyCredits') : undefined
          }
        />
      );
    case 'buyCredits':
      if (!sellsCreditsInApp(Platform.OS)) {
        return (
          <ProfileScreen />
        );
      }
      return <BuyCreditsScreen onGoBack={() => setCurrentScreen('profile')} />;
    default:
      return <HomeScreen />;
  }
}

function MainApp() {
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={{ height: insets.top, backgroundColor: theme.brand }} />
      <View style={styles.content}>
        <AppContent currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      </View>
      {isAuthenticated ? (
        <TabBar
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
          bottomInset={insets.bottom}
        />
      ) : (
        <View style={{ height: insets.bottom, backgroundColor: theme.page }} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainApp />
          <AnalyticsConsent />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.page,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.page,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.page,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
