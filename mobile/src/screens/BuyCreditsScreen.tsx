import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { createCheckoutSession } from '../lib/api';
import { sellsCreditsInApp } from '../lib/playBilling';
import { theme } from '../lib/theme';

const CREDIT_PACKAGES = [
  { credits: 10, price: 5, priceId: 'price_10_credits' },
  { credits: 50, price: 20, priceId: 'price_50_credits', popular: true },
  { credits: 100, price: 35, priceId: 'price_100_credits' },
];

interface Props {
  onGoBack: () => void;
}

export default function BuyCreditsScreen({ onGoBack }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const sellsInApp = sellsCreditsInApp(Platform.OS);

  async function handlePurchase(credits: number, priceId: string) {
    if (!user) {
      Alert.alert(t.pleaseLogIn, t.needToLogIn);
      return;
    }

    setLoadingPriceId(priceId);

    try {
      const result = await createCheckoutSession(credits, priceId);
      
      if (result.url) {
        await Linking.openURL(result.url);
      } else if (result.error) {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start checkout. Please try again.');
    } finally {
      setLoadingPriceId(null);
    }
  }

  // Android must not show prices or a link to buy credits on the web.
  if (!sellsInApp) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backText}>{t.backToHome}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t.credits}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.notice}>{t.creditsUnavailable}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Text style={styles.backText}>{t.backToHome}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.buyCredits}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>{t.purchaseCredits}</Text>

        <View style={styles.packagesContainer}>
          {CREDIT_PACKAGES.map((pkg) => (
            <TouchableOpacity
              key={pkg.priceId}
              style={[styles.packageCard, pkg.popular && styles.packageCardPopular]}
              onPress={() => handlePurchase(pkg.credits, pkg.priceId)}
              disabled={loadingPriceId !== null}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>{t.mostPopular}</Text>
                </View>
              )}
              
              <Text style={styles.creditsAmount}>{pkg.credits}</Text>
              <Text style={styles.creditsLabel}>{t.credits}</Text>
              
              <Text style={styles.price}>${pkg.price}</Text>
              <Text style={styles.perCredit}>
                ${(pkg.price / pkg.credits).toFixed(2)} {t.perCredit}
              </Text>

              <View style={[styles.buyButton, pkg.popular && styles.buyButtonPopular]}>
                {loadingPriceId === pkg.priceId ? (
                  <ActivityIndicator color={pkg.popular ? theme.onPrimary : theme.primary} />
                ) : (
                  <Text style={[styles.buyButtonText, pkg.popular && styles.buyButtonTextPopular]}>
                    {t.buyNow}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 14,
    color: theme.primary,
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
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  notice: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
    textAlign: 'center',
    marginTop: 24,
  },
  packagesContainer: {
    gap: 16,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  packageCardPopular: {
    borderColor: theme.primary,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: theme.primary,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  creditsAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 8,
  },
  creditsLabel: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.primary,
  },
  perCredit: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  buyButton: {
    width: '100%',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  buyButtonPopular: {
    backgroundColor: theme.primary,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
  },
  buyButtonTextPopular: {
    color: '#fff',
  },
});
