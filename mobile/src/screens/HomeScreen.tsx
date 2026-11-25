import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { generateContent } from '../lib/api';
import {
  emptyContentResults,
  resultForType,
  withTypeResult,
  type ContentType,
} from '../lib/contentDrafts';
import { PLATFORM_PRESETS, tonePresets } from '../lib/generationOptions';
import { theme } from '../lib/theme';
import { isResultCardInView } from '../lib/resultScroll';
import { OptionChips } from '../components/OptionChips';
import { LanguageField } from '../components/LanguageField';
import { AdvancedOptions, type PremiumOptionsState } from '../components/AdvancedOptions';

const TABS: { key: ContentType; labelKey: 'coldEmail' | 'proposal' | 'contract' | 'socialPack' }[] = [
  { key: 'cold_email', labelKey: 'coldEmail' },
  { key: 'proposal', labelKey: 'proposal' },
  { key: 'contract', labelKey: 'contract' },
  { key: 'social_pack', labelKey: 'socialPack' },
];

interface ColdEmailForm {
  target: string;
  service: string;
  tone: string;
  language: string;
}

interface ProposalForm {
  clientType: string;
  projectScope: string;
  deliverables: string;
  budgetRange: string;
  language: string;
}

interface ContractForm {
  clientName: string;
  providerName: string;
  serviceDescription: string;
  paymentTerms: string;
  jurisdiction: string;
  language: string;
}

interface SocialPackForm {
  businessType: string;
  niche: string;
  tone: string;
  platform: string;
  language: string;
}

const DEFAULT_PREMIUM: PremiumOptionsState = {
  length: 'standard',
  creativity: 50,
  customInstructions: '',
};

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const { t, language, generationLanguage, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const pendingScrollTool = useRef<ContentType | null>(null);
  const scrollMetrics = useRef({ scrollY: 0, viewport: 0, y: 0, height: 0 });
  const [resultInView, setResultInView] = useState(true);
  const [autoScrolling, setAutoScrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentType>('cold_email');
  const activeTabRef = useRef<ContentType>('cold_email');
  activeTabRef.current = activeTab;
  const [loadingTool, setLoadingTool] = useState<ContentType | null>(null);
  const [results, setResults] = useState(emptyContentResults);
  const [copiedType, setCopiedType] = useState<ContentType | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [premium, setPremium] = useState<PremiumOptionsState>(DEFAULT_PREMIUM);

  const [coldEmailForm, setColdEmailForm] = useState<ColdEmailForm>({
    target: '',
    service: '',
    tone: '',
    language: generationLanguage,
  });
  const [proposalForm, setProposalForm] = useState<ProposalForm>({
    clientType: '',
    projectScope: '',
    deliverables: '',
    budgetRange: '',
    language: generationLanguage,
  });
  const [contractForm, setContractForm] = useState<ContractForm>({
    clientName: '',
    providerName: '',
    serviceDescription: '',
    paymentTerms: '',
    jurisdiction: '',
    language: generationLanguage,
  });
  const [socialPackForm, setSocialPackForm] = useState<SocialPackForm>({
    businessType: '',
    niche: '',
    tone: '',
    platform: '',
    language: generationLanguage,
  });

  const output = resultForType(results, activeTab);
  const isLoading = loadingTool === activeTab;

  function updateResultVisibility() {
    const metrics = scrollMetrics.current;
    const visible = isResultCardInView(
      metrics.height > 0 ? { y: metrics.y, height: metrics.height } : null,
      metrics.scrollY,
      metrics.viewport,
    );
    setResultInView((current) => (current === visible ? current : visible));
    if (visible) setAutoScrolling(false);
  }

  function scrollToResult(y = scrollMetrics.current.y) {
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
  }
  const toneOptions = tonePresets(language).map((tone) => ({ value: tone, label: tone }));
  const platformOptions = PLATFORM_PRESETS.map((platform) => ({ value: platform, label: platform }));

  function inputsFor(tool: ContentType): Record<string, string> {
    switch (tool) {
      case 'cold_email':
        return { ...coldEmailForm };
      case 'proposal':
        return { ...proposalForm };
      case 'contract':
        return { ...contractForm };
      case 'social_pack':
        return { ...socialPackForm };
    }
  }

  async function handleGenerate() {
    const tool = activeTab;
    const inputs = inputsFor(tool);
    setLoadingTool(tool);
    setResults((current) => withTypeResult(current, tool, ''));

    try {
      const result = await generateContent({
        tool,
        inputs,
        premiumOptions: showAdvanced
          ? {
              length: premium.length,
              creativity: premium.creativity,
              customInstructions: premium.customInstructions,
            }
          : undefined,
      });

      if (result.error) {
        Alert.alert('Error', result.error);
      } else if (result.content) {
        const content = result.content;
        pendingScrollTool.current = tool;
        if (tool === activeTabRef.current) setAutoScrolling(true);
        setResults((current) => withTypeResult(current, tool, content));
        refreshUser();
      }
    } catch {
      Alert.alert('Error', t.generationError);
    } finally {
      setLoadingTool((current) => (current === tool ? null : current));
    }
  }

  async function handleCopy() {
    if (!output) return;
    const tool = activeTab;
    await Clipboard.setStringAsync(output);
    setCopiedType(tool);
    setTimeout(() => {
      setCopiedType((current) => (current === tool ? null : current));
    }, 2000);
  }

  function renderChoiceField(
    label: string,
    placeholder: string,
    value: string,
    onChange: (value: string) => void,
    options: { value: string; label: string }[],
  ) {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <OptionChips options={options} value={value} onChange={onChange} allowDeselect />
        <TextInput
          style={[styles.input, styles.choiceInput]}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          value={value}
          onChangeText={onChange}
        />
      </View>
    );
  }

  function renderForm() {
    switch (activeTab) {
      case 'cold_email':
        return (
          <View style={styles.formContainer}>
            <Field label={t.targetAudience} placeholder={t.targetPlaceholder} value={coldEmailForm.target} onChangeText={(target) => setColdEmailForm({ ...coldEmailForm, target })} />
            <Field label={t.serviceOffered} placeholder={t.servicePlaceholder} value={coldEmailForm.service} onChangeText={(service) => setColdEmailForm({ ...coldEmailForm, service })} />
            {renderChoiceField(t.tone, t.tonePlaceholder, coldEmailForm.tone, (tone) => setColdEmailForm({ ...coldEmailForm, tone }), toneOptions)}
            <LanguageField value={coldEmailForm.language} onChange={(language) => setColdEmailForm({ ...coldEmailForm, language })} />
          </View>
        );
      case 'proposal':
        return (
          <View style={styles.formContainer}>
            <Field label={t.clientType} placeholder={t.clientTypePlaceholder} value={proposalForm.clientType} onChangeText={(clientType) => setProposalForm({ ...proposalForm, clientType })} />
            <Field label={t.projectScope} placeholder={t.projectScopePlaceholder} value={proposalForm.projectScope} onChangeText={(projectScope) => setProposalForm({ ...proposalForm, projectScope })} multiline />
            <Field label={t.deliverables} placeholder={t.deliverablesPlaceholder} value={proposalForm.deliverables} onChangeText={(deliverables) => setProposalForm({ ...proposalForm, deliverables })} multiline />
            <Field label={t.budgetRange} placeholder={t.budgetPlaceholder} value={proposalForm.budgetRange} onChangeText={(budgetRange) => setProposalForm({ ...proposalForm, budgetRange })} />
            <LanguageField value={proposalForm.language} onChange={(language) => setProposalForm({ ...proposalForm, language })} />
          </View>
        );
      case 'contract':
        return (
          <View style={styles.formContainer}>
            <Field label={t.clientName} placeholder={t.clientNamePlaceholder} value={contractForm.clientName} onChangeText={(clientName) => setContractForm({ ...contractForm, clientName })} />
            <Field label={t.providerName} placeholder={t.providerPlaceholder} value={contractForm.providerName} onChangeText={(providerName) => setContractForm({ ...contractForm, providerName })} />
            <Field label={t.serviceDescription} placeholder={t.serviceDescPlaceholder} value={contractForm.serviceDescription} onChangeText={(serviceDescription) => setContractForm({ ...contractForm, serviceDescription })} multiline />
            <Field label={t.paymentTerms} placeholder={t.paymentPlaceholder} value={contractForm.paymentTerms} onChangeText={(paymentTerms) => setContractForm({ ...contractForm, paymentTerms })} />
            <Field label={t.jurisdiction} placeholder={t.jurisdictionPlaceholder} value={contractForm.jurisdiction} onChangeText={(jurisdiction) => setContractForm({ ...contractForm, jurisdiction })} />
            <LanguageField value={contractForm.language} onChange={(language) => setContractForm({ ...contractForm, language })} />
          </View>
        );
      case 'social_pack':
        return (
          <View style={styles.formContainer}>
            <Field label={t.businessType} placeholder={t.businessPlaceholder} value={socialPackForm.businessType} onChangeText={(businessType) => setSocialPackForm({ ...socialPackForm, businessType })} />
            <Field label={t.niche} placeholder={t.nichePlaceholder} value={socialPackForm.niche} onChangeText={(niche) => setSocialPackForm({ ...socialPackForm, niche })} />
            {renderChoiceField(t.tone, t.tonePlaceholder, socialPackForm.tone, (tone) => setSocialPackForm({ ...socialPackForm, tone }), toneOptions)}
            {renderChoiceField(t.platform, t.platformPlaceholder, socialPackForm.platform, (platform) => setSocialPackForm({ ...socialPackForm, platform }), platformOptions)}
            <LanguageField value={socialPackForm.language} onChange={(language) => setSocialPackForm({ ...socialPackForm, language })} />
          </View>
        );
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={[styles.contentInner, { paddingBottom: Math.max(insets.bottom, 24) }]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        scrollEventThrottle={16}
        onLayout={(event: LayoutChangeEvent) => {
          scrollMetrics.current.viewport = event.nativeEvent.layout.height;
          updateResultVisibility();
        }}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          scrollMetrics.current.scrollY = event.nativeEvent.contentOffset.y;
          updateResultVisibility();
        }}
        onMomentumScrollEnd={() => setAutoScrolling(false)}
      >
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.brandMark}
              accessibilityLabel="PitchCrafter"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.logo} numberOfLines={1}>{t.appName}</Text>
          </View>
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

        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {t[tab.labelKey]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderForm()}

        <AdvancedOptions
          open={showAdvanced}
          onToggle={() => setShowAdvanced((current) => !current)}
          value={premium}
          onChange={setPremium}
        />

        <TouchableOpacity
          style={[styles.generateButton, loadingTool !== null && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={loadingTool !== null}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.onButton} />
          ) : (
            <Text style={styles.generateButtonText}>{t.generate}</Text>
          )}
        </TouchableOpacity>

        {output ? (
          <View
            style={styles.outputContainer}
            onLayout={(event: LayoutChangeEvent) => {
              const { y, height } = event.nativeEvent.layout;
              scrollMetrics.current.y = y;
              scrollMetrics.current.height = height;
              updateResultVisibility();
              if (pendingScrollTool.current === activeTab) {
                pendingScrollTool.current = null;
                scrollToResult(y);
              }
            }}
          >
            <View style={styles.outputHeader}>
              <Text style={styles.outputTitle}>{t.generatedContent}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                <Text style={styles.copyButtonText}>{copiedType === activeTab ? t.copied : t.copy}</Text>
              </TouchableOpacity>
            </View>
            <Text selectable style={styles.outputText}>{output}</Text>
          </View>
        ) : null}
      </ScrollView>
      {output && !autoScrolling && !resultInView ? (
        <View pointerEvents="box-none" style={styles.seeResult}>
          <TouchableOpacity
            style={styles.seeResultButton}
            onPress={() => scrollToResult()}
            accessibilityRole="button"
          >
            <Text style={styles.seeResultText}>{t.seeResult}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
      />
    </View>
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
  contentInner: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    marginBottom: 16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.brand,
    flexShrink: 1,
  },
  seeResult: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: 'center',
  },
  seeResultButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeResultText: {
    color: theme.onButton,
    fontSize: 13,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  creditsContainer: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: theme.tint,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.brand,
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.ink,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: 4,
    backgroundColor: theme.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: theme.tint,
    borderColor: theme.brand,
  },
  tabText: {
    width: '100%',
    fontSize: 13,
    fontWeight: '600',
    color: theme.muted,
    textAlign: 'center',
  },
  tabTextActive: {
    color: theme.ink,
  },
  formContainer: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.line,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    minHeight: 44,
    backgroundColor: theme.page,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.ink,
  },
  choiceInput: {
    marginTop: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateButton: {
    minHeight: 44,
    backgroundColor: theme.button,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: theme.onButton,
    fontSize: 16,
    fontWeight: '600',
  },
  outputContainer: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.line,
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
    color: theme.ink,
  },
  copyButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  outputText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
});
