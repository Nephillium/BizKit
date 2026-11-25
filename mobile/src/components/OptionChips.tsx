import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

export interface ChipOption {
  value: string;
  label: string;
}

interface OptionChipsProps {
  options: readonly ChipOption[];
  value: string;
  onChange: (value: string) => void;
  allowDeselect?: boolean;
}

export function OptionChips({ options, value, onChange, allowDeselect = false }: OptionChipsProps) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(selected && allowDeselect ? '' : option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
          >
            <Text style={styles.chipText}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: theme.tint,
    borderColor: theme.brand,
  },
  chipText: {
    color: theme.ink,
    fontSize: 14,
    fontWeight: '600',
  },
});
