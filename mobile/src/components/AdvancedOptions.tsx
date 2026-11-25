import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { CREATIVITY_STEPS, OUTPUT_LENGTHS, type OutputLength } from '../lib/generationOptions';
import { theme } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { OptionChips } from './OptionChips';

export interface PremiumOptionsState {
  length: OutputLength;
  creativity: number;
  customInstructions: string;
}

interface AdvancedOptionsProps {
  open: boolean;
  onToggle: () => void;
  value: PremiumOptionsState;
  onChange: (value: PremiumOptionsState) => void;
}

export function AdvancedOptions({ open, onToggle, value, onChange }: AdvancedOptionsProps) {
  const { t } = useLanguage();
  const lengthOptions = OUTPUT_LENGTHS.map((length) => ({ value: length, label: t[length] }));
  const creativityOptions = CREATIVITY_STEPS.map((step) => ({
    value: String(step),
    label: `${step}%`,
  }));

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.toggle} onPress={onToggle} accessibilityRole="button">
        <Text style={styles.toggleText}>{open ? t.hideAdvanced : t.advancedOptions}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.panel}>
          <Text style={styles.label}>{t.outputLength}</Text>
          <OptionChips
            options={lengthOptions}
            value={value.length}
            onChange={(length) => onChange({ ...value, length: length as OutputLength })}
          />
          <Text style={[styles.label, styles.spaced]}>{t.creativity}</Text>
          <View style={styles.scale}>
            <Text style={styles.scaleLabel}>{t.precise}</Text>
            <Text style={styles.scaleLabel}>{value.creativity}%</Text>
            <Text style={styles.scaleLabel}>{t.creative}</Text>
          </View>
          <OptionChips
            options={creativityOptions}
            value={String(value.creativity)}
            onChange={(step) => onChange({ ...value, creativity: Number(step) })}
          />
          <Text style={[styles.label, styles.spaced]}>{t.customInstructions}</Text>
          <TextInput
            style={styles.input}
            value={value.customInstructions}
            onChangeText={(customInstructions) => onChange({ ...value, customInstructions })}
            placeholder={t.customPlaceholder}
            placeholderTextColor={theme.muted}
            multiline
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  toggle: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  toggleText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  panel: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  spaced: {
    marginTop: 16,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scaleLabel: {
    color: theme.muted,
    fontSize: 12,
  },
  input: {
    minHeight: 80,
    backgroundColor: theme.page,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: theme.ink,
    textAlignVertical: 'top',
  },
});
