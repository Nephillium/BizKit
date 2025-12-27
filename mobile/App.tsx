import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BuyCreditsScreen from './src/screens/BuyCreditsScreen';

type Screen = 'login' | 'register' | 'home' | 'profile' | 'buyCredits';

function TabBar({ currentScreen, setCurrentScreen }: { currentScreen: Screen; setCurrentScreen: (s: Screen) => void }) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, currentScreen === 'home' && styles.tabActive]}
        onPress={() => setCurrentScreen('home')}
      >
        <View style={[styles.homeIcon, currentScreen === 'home' && styles.iconActive]} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, currentScreen === 'profile' && styles.tabActive]}
        onPress={() => setCurrentScreen('profile')}
      >
        <View style={[styles.profileIcon, currentScreen === 'profile' && styles.iconActive]} />
      </TouchableOpacity>
    </View>
  );
}

function AppContent({ currentScreen, setCurrentScreen }: { currentScreen: Screen; setCurrentScreen: (s: Screen) => void }) {
  const { isLoading, isAuthenticated } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
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
        <ProfileScreen onNavigateToBuyCredits={() => setCurrentScreen('buyCredits')} />
      );
    case 'buyCredits':
      return <BuyCreditsScreen onGoBack={() => setCurrentScreen('profile')} />;
    default:
      return <HomeScreen />;
  }
}

function MainApp() {
  const { isAuthenticated } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <AppContent currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      </View>
      {isAuthenticated && (
        <TabBar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: '#6366f1',
  },
  homeIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#94a3b8',
    borderRadius: 4,
  },
  profileIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#94a3b8',
    borderRadius: 10,
  },
  iconActive: {
    backgroundColor: '#6366f1',
  },
});
