import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  isAnalyticsConfigured,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from '../lib/analytics';
import type { AnalyticsConsent } from '../lib/analyticsPolicy';
import { sellsCreditsInApp } from '../lib/playBilling';
import { theme } from '../lib/theme';

interface Props {
  onNavigateToBuyCredits?: () => void;
}

export default function ProfileScreen({ onNavigateToBuyCredits }: Props) {
  const { user, logout, deleteAccount } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const sellsInApp = sellsCreditsInApp(Platform.OS);
  const analyticsAvailable = Platform.OS === 'android' && isAnalyticsConfigured();
  const [analyticsConsent, setAnalyticsConsent] = useState<AnalyticsConsent | null>(null);

  useEffect(() => {
    if (!analyticsAvailable) return;
    readAnalyticsConsent().then(setAnalyticsConsent).catch(() => setAnalyticsConsent(null));
  }, [analyticsAvailable]);

  async function handleLogout() {
    Alert.alert(
      t.logout,
      'Are you sure you want to log out?',
      [
        { text: t.cancel, style: 'cancel' },
        { text: t.logout, style: 'destructive', onPress: () => logout() },
      ]
    );
  }

  function handleDeleteAccount() {
    Alert.alert(t.deleteAccountTitle, t.deleteAccountBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.deleteAccount,
        style: 'destructive',
        onPress: () => {
          deleteAccount().then((result) => {
            if (!result.success) {
              Alert.alert(t.deleteAccount, result.error || t.deleteAccountFailed);
            }
          });
        },
      },
    ]);
  }

  async function toggleAnalytics() {
    const next = analyticsConsent === 'granted' ? 'denied' : 'granted';
    await writeAnalyticsConsent(next);
    setAnalyticsConsent(next);
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.profile}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.email.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.email}>{user.email}</Text>

          {user.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>{t.admin}</Text>
            </View>
          )}

          <View style={styles.creditsCard}>
            <Text style={styles.creditsLabel}>{t.credits}</Text>
            <Text style={styles.creditsValue}>
              {user.role === 'admin' ? t.unlimitedCredits : user.credits}
            </Text>
            {!sellsInApp && (
              <Text style={styles.creditsNote}>{t.creditsUnavailable}</Text>
            )}
          </View>

          {user.role !== 'admin' && sellsInApp && onNavigateToBuyCredits && (
            <TouchableOpacity
              style={styles.buyButton}
              onPress={onNavigateToBuyCredits}
              accessibilityRole="button"
            >
              <Text style={styles.buyButtonText}>{t.buyCredits}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{t.settings}</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setLanguage(language === 'en' ? 'tr' : 'en')}
          >
            <Text style={styles.settingLabel}>{t.language}</Text>
            <Text style={styles.settingValue}>
              {language === 'en' ? 'English' : 'Turkce'}
            </Text>
          </TouchableOpacity>

          {analyticsAvailable && (
            <TouchableOpacity style={styles.settingRow} onPress={toggleAnalytics} accessibilityRole="button">
              <Text style={styles.settingLabel}>{t.analyticsTitle}</Text>
              <Text style={styles.settingValue}>
                {analyticsConsent === 'granted' ? t.analyticsOn : t.analyticsOff}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t.logout}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          accessibilityRole="button"
        >
          <Text style={styles.deleteButtonText}>{t.deleteAccount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.page,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.page,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.onButton,
  },
  email: {
    fontSize: 18,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 8,
  },
  adminBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    marginBottom: 16,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  creditsCard: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.tint,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.brand,
    alignItems: 'center',
    marginTop: 8,
  },
  creditsLabel: {
    fontSize: 14,
    color: theme.ink,
    marginBottom: 4,
  },
  creditsValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.ink,
  },
  creditsNote: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: theme.ink,
    textAlign: 'center',
  },
  buyButton: {
    width: '100%',
    marginTop: 16,
    backgroundColor: theme.button,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buyButtonText: {
    color: theme.onButton,
    fontSize: 16,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  settingLabel: {
    fontSize: 15,
    color: '#374151',
  },
  settingValue: {
    fontSize: 15,
    color: theme.brand,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
});
