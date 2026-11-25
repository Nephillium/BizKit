import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, getTranslation, translations } from '../lib/translations';
import { LANGUAGES } from '../lib/generationOptions';
import {
  INTERFACE_LANGUAGE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LEGACY_LANGUAGE_STORAGE_KEY,
  generationLanguageForInterface,
  interfaceLanguageForGeneration,
  readStoredGenerationLanguage,
  readStoredLanguage,
  type LanguageRead,
} from '../lib/languagePreference';

interface LanguageContextType {
  language: Language;
  generationLanguage: string;
  setLanguage: (lang: Language) => void;
  setPreferredLanguage: (generationLanguage: string) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [generationLanguage, setGenerationLanguageState] = useState('English');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  async function loadLanguage() {
    try {
      const current = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      const legacy = await AsyncStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
      const interfaceLanguage = await AsyncStorage.getItem(INTERFACE_LANGUAGE_STORAGE_KEY);
      const read: LanguageRead = (key) => {
        if (key === LANGUAGE_STORAGE_KEY) return current;
        if (key === LEGACY_LANGUAGE_STORAGE_KEY) return legacy;
        if (key === INTERFACE_LANGUAGE_STORAGE_KEY) return interfaceLanguage;
        return null;
      };
      const stored = readStoredLanguage(read);
      if (stored) setLanguageState(stored);
      setGenerationLanguageState(readStoredGenerationLanguage(read, LANGUAGES));
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setReady(true);
    }
  }

  async function setLanguage(lang: Language) {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(INTERFACE_LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }

  async function setPreferredLanguage(nextGeneration: string) {
    const ui = interfaceLanguageForGeneration(nextGeneration);
    if (ui) {
      const storedGeneration = generationLanguageForInterface(ui);
      setLanguageState(ui);
      setGenerationLanguageState(storedGeneration);
      try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, ui);
        await AsyncStorage.setItem(INTERFACE_LANGUAGE_STORAGE_KEY, ui);
      } catch (error) {
        console.error('Error saving language:', error);
      }
      return;
    }
    setGenerationLanguageState(nextGeneration);
    try {
      await AsyncStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, language);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextGeneration);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }

  const t = getTranslation(language);

  if (!ready) return null;

  return (
    <LanguageContext.Provider value={{ language, generationLanguage, setLanguage, setPreferredLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
