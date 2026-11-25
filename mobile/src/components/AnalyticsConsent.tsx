import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import {
  applyStoredAnalyticsConsent,
  isAnalyticsConfigured,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from '../lib/analytics';

/**
 * Android-only prompt. Collection stays denied until Allow is pressed.
 * When this build has no Firebase config, the prompt is not shown.
 */
export default function AnalyticsConsent() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android' || !isAnalyticsConfigured()) return;
    let cancelled = false;
    (async () => {
      await applyStoredAnalyticsConsent();
      const consent = await readAnalyticsConsent();
      if (!cancelled && consent === null) setVisible(true);
    })().catch(() => {
      // Consent stays unset, which is denied.
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function choose(granted: boolean) {
    setVisible(false);
    try {
      await writeAnalyticsConsent(granted ? 'granted' : 'denied');
    } catch {
      // Leaving the prompt stores nothing, and an unset choice is denied.
    }
  }

  if (Platform.OS !== 'android' || !visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => choose(false)}>
      <View style={[styles.backdrop, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.card}>
          <Text style={styles.title}>{t.analyticsTitle}</Text>
          <Text style={styles.body}>{t.analyticsPrompt}</Text>
          <TouchableOpacity
            style={styles.allowButton}
            onPress={() => choose(true)}
            accessibilityRole="button"
          >
            <Text style={styles.allowText}>{t.analyticsAllow}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.denyButton}
            onPress={() => choose(false)}
            accessibilityRole="button"
          >
            <Text style={styles.denyText}>{t.analyticsDeny}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
    marginBottom: 20,
  },
  allowButton: {
    backgroundColor: theme.button,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  allowText: {
    color: theme.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  denyButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  denyText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },
});
