import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, getTranslation, translations } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  async function loadLanguage() {
    try {
      const stored = await AsyncStorage.getItem('bizkit_lang');
      if (stored === 'en' || stored === 'tr') {
        setLanguageState(stored);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  }

  async function setLanguage(lang: Language) {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('bizkit_lang', lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }

  const t = getTranslation(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
