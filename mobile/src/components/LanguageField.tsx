import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LANGUAGES } from '../lib/generationOptions';
import { theme } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function LanguageField({ value, onChange }: LanguageFieldProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const filtered = useMemo(
    () => LANGUAGES.filter((language) => language.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  function close() {
    setOpen(false);
    setQuery('');
    setCustomMode(false);
    setCustomValue('');
  }

  function select(language: string) {
    onChange(language);
    close();
  }

  function addCustom() {
    const next = customValue.trim();
    if (!next) return;
    select(next);
  }

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{t.language}</Text>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t.selectLanguage}
      >
        <Text style={styles.triggerText}>{value || t.selectLanguage}</Text>
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.selectLanguage}</Text>
            <TouchableOpacity style={styles.done} onPress={close} accessibilityRole="button">
              <Text style={styles.doneText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder={t.searchLanguages}
            placeholderTextColor={theme.muted}
            autoCorrect={false}
          />
          {customMode ? (
            <View style={styles.customBox}>
              <TextInput
                style={styles.search}
                value={customValue}
                onChangeText={setCustomValue}
                placeholder={t.enterCustomLanguage}
                placeholderTextColor={theme.muted}
              />
              <TouchableOpacity
                style={[styles.trigger, !customValue.trim() && styles.disabled]}
                onPress={addCustom}
                disabled={!customValue.trim()}
                accessibilityRole="button"
              >
                <Text style={styles.triggerText}>{t.add}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.done} onPress={() => setCustomMode(false)}>
                <Text style={styles.doneText}>{t.backToList}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {filtered.map((language) => {
                const selected = language === value;
                return (
                  <TouchableOpacity
                    key={language}
                    style={[styles.row, selected && styles.rowSelected]}
                    onPress={() => select(language)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={styles.rowText}>{language}</Text>
                  </TouchableOpacity>
                );
              })}
              {filtered.length === 0 && (
                <Text style={styles.empty}>{t.noLanguagesFound}</Text>
              )}
              <TouchableOpacity style={styles.row} onPress={() => setCustomMode(true)} accessibilityRole="button">
                <Text style={styles.rowText}>{t.customLanguage}</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 6,
  },
  trigger: {
    minHeight: 44,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.ink,
  },
  disabled: {
    opacity: 0.5,
  },
  modal: {
    flex: 1,
    backgroundColor: theme.page,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.ink,
  },
  done: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  doneText: {
    color: theme.brand,
    fontSize: 16,
    fontWeight: '600',
  },
  search: {
    minHeight: 44,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: theme.ink,
    marginBottom: 12,
  },
  customBox: {
    gap: 8,
  },
  row: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  rowSelected: {
    backgroundColor: theme.tint,
    borderColor: theme.brand,
  },
  rowText: {
    fontSize: 16,
    color: theme.ink,
  },
  empty: {
    color: theme.muted,
    padding: 12,
  },
});
