import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { generateContent } from '../lib/api';

type ContentType = 'cold_email' | 'proposal' | 'contract' | 'social_pack';

const TABS: { key: ContentType; labelKey: keyof typeof import('../lib/translations').translations.en }[] = [
  { key: 'cold_email', labelKey: 'coldEmail' },
  { key: 'proposal', labelKey: 'proposal' },
  { key: 'contract', labelKey: 'contract' },
  { key: 'social_pack', labelKey: 'socialPack' },
];

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<ContentType>('cold_email');
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const [coldEmailForm, setColdEmailForm] = useState({
    target: '',
    service: '',
    tone: '',
    language: 'English',
  });

  const [proposalForm, setProposalForm] = useState({
    clientType: '',
    projectScope: '',
    deliverables: '',
    budgetRange: '',
    language: 'English',
  });

  const [contractForm, setContractForm] = useState({
    clientName: '',
    providerName: '',
    serviceDescription: '',
    paymentTerms: '',
    jurisdiction: '',
    language: 'English',
  });

  const [socialPackForm, setSocialPackForm] = useState({
    businessType: '',
    niche: '',
    tone: '',
    platform: '',
    language: 'English',
  });

  async function handleGenerate() {
    let inputs: Record<string, string>;

    switch (activeTab) {
      case 'cold_email':
        inputs = coldEmailForm;
        break;
      case 'proposal':
        inputs = proposalForm;
        break;
      case 'contract':
        inputs = contractForm;
        break;
      case 'social_pack':
        inputs = socialPackForm;
        break;
    }

    setIsLoading(true);
    setOutput('');

    try {
      const result = await generateContent({
        tool: activeTab,
        inputs,
      });

      if (result.error) {
        Alert.alert('Error', result.error);
      } else if (result.content) {
        setOutput(result.content);
        refreshUser();
      }
    } catch (error) {
      Alert.alert('Error', t.generationError);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function renderForm() {
    switch (activeTab) {
      case 'cold_email':
        return (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.targetAudience}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.targetPlaceholder}
                placeholderTextColor="#94a3b8"
                value={coldEmailForm.target}
                onChangeText={(text) => setColdEmailForm({ ...coldEmailForm, target: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.serviceOffered}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.servicePlaceholder}
                placeholderTextColor="#94a3b8"
                value={coldEmailForm.service}
                onChangeText={(text) => setColdEmailForm({ ...coldEmailForm, service: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.tone}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.tonePlaceholder}
                placeholderTextColor="#94a3b8"
                value={coldEmailForm.tone}
                onChangeText={(text) => setColdEmailForm({ ...coldEmailForm, tone: text })}
              />
            </View>
          </View>
        );

      case 'proposal':
        return (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.clientType}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.clientTypePlaceholder}
                placeholderTextColor="#94a3b8"
                value={proposalForm.clientType}
                onChangeText={(text) => setProposalForm({ ...proposalForm, clientType: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.projectScope}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t.projectScopePlaceholder}
                placeholderTextColor="#94a3b8"
                value={proposalForm.projectScope}
                onChangeText={(text) => setProposalForm({ ...proposalForm, projectScope: text })}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.deliverables}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t.deliverablesPlaceholder}
                placeholderTextColor="#94a3b8"
                value={proposalForm.deliverables}
                onChangeText={(text) => setProposalForm({ ...proposalForm, deliverables: text })}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.budgetRange}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.budgetPlaceholder}
                placeholderTextColor="#94a3b8"
                value={proposalForm.budgetRange}
                onChangeText={(text) => setProposalForm({ ...proposalForm, budgetRange: text })}
              />
            </View>
          </View>
        );

      case 'contract':
        return (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.clientName}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.clientNamePlaceholder}
                placeholderTextColor="#94a3b8"
                value={contractForm.clientName}
                onChangeText={(text) => setContractForm({ ...contractForm, clientName: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.providerName}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.providerPlaceholder}
                placeholderTextColor="#94a3b8"
                value={contractForm.providerName}
                onChangeText={(text) => setContractForm({ ...contractForm, providerName: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.serviceDescription}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t.serviceDescPlaceholder}
                placeholderTextColor="#94a3b8"
                value={contractForm.serviceDescription}
                onChangeText={(text) => setContractForm({ ...contractForm, serviceDescription: text })}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.paymentTerms}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.paymentPlaceholder}
                placeholderTextColor="#94a3b8"
                value={contractForm.paymentTerms}
                onChangeText={(text) => setContractForm({ ...contractForm, paymentTerms: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.jurisdiction}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.jurisdictionPlaceholder}
                placeholderTextColor="#94a3b8"
                value={contractForm.jurisdiction}
                onChangeText={(text) => setContractForm({ ...contractForm, jurisdiction: text })}
              />
            </View>
          </View>
        );

      case 'social_pack':
        return (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.businessType}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.businessPlaceholder}
                placeholderTextColor="#94a3b8"
                value={socialPackForm.businessType}
                onChangeText={(text) => setSocialPackForm({ ...socialPackForm, businessType: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.niche}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.nichePlaceholder}
                placeholderTextColor="#94a3b8"
                value={socialPackForm.niche}
                onChangeText={(text) => setSocialPackForm({ ...socialPackForm, niche: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.platform}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.platformPlaceholder}
                placeholderTextColor="#94a3b8"
                value={socialPackForm.platform}
                onChangeText={(text) => setSocialPackForm({ ...socialPackForm, platform: text })}
              />
            </View>
          </View>
        );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>{t.appName}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => setLanguage(language === 'en' ? 'tr' : 'en')}
          >
            <Text style={styles.langText}>{language === 'en' ? 'TR' : 'EN'}</Text>
          </TouchableOpacity>
          {user && (
            <View style={styles.creditsContainer}>
              <Text style={styles.creditsText}>
                {user.role === 'admin' ? t.unlimitedCredits : `${user.credits} ${t.creditsLeft}`}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {t[tab.labelKey]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {renderForm()}

        <TouchableOpacity
          style={[styles.generateButton, isLoading && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>{t.generate}</Text>
          )}
        </TouchableOpacity>

        {output && (
          <View style={styles.outputContainer}>
            <View style={styles.outputHeader}>
              <Text style={styles.outputTitle}>Generated Content</Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                <Text style={styles.copyButtonText}>{copied ? t.copied : t.copy}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.outputScroll}>
              <Text style={styles.outputText}>{output}</Text>
            </ScrollView>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366f1',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  creditsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 6,
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366f1',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabsContainer: {
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  outputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  outputScroll: {
    maxHeight: 300,
  },
  outputText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
});
