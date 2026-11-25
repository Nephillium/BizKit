export const LANGUAGE_STORAGE_KEY = 'pitchcrafter_lang';
export const LEGACY_LANGUAGE_STORAGE_KEY = 'bizkit_lang';

export type StoredLanguage = 'en' | 'tr';

export type LanguageRead = (key: string) => string | null;

/** English and Turkish are the interface languages. Other names are generation-only. */
export function interfaceLanguageForGeneration(value: string | null | undefined): StoredLanguage | null {
  if (value === 'en' || value === 'English') return 'en';
  if (value === 'tr' || value === 'Turkish') return 'tr';
  return null;
}

export function generationLanguageForInterface(language: StoredLanguage): string {
  return language === 'tr' ? 'Turkish' : 'English';
}

/**
 * Prefer the current key. Fall back to the previous key so an existing choice is kept.
 * Full names English and Turkish count as the same choice as en and tr.
 * Any other stored value is a generation language and does not change the interface,
 * so the reader keeps looking at the legacy key.
 */
export function readStoredLanguage(read: LanguageRead): StoredLanguage | null {
  for (const key of [LANGUAGE_STORAGE_KEY, LEGACY_LANGUAGE_STORAGE_KEY]) {
    const ui = interfaceLanguageForGeneration(read(key));
    if (ui && (read(key) === 'en' || read(key) === 'tr' || read(key) === 'English' || read(key) === 'Turkish')) {
      return ui;
    }
  }
  return null;
}

/**
 * Generation language stored in the current key.
 * en/tr and English/Turkish map to the names the generator expects.
 * Any other non-empty current value is a list or custom generation language.
 * Otherwise the interface choice, or English, supplies the default.
 */
export function readStoredGenerationLanguage(
  read: LanguageRead,
  languages: readonly string[] = [],
): string {
  const current = (read(LANGUAGE_STORAGE_KEY) || '').trim();
  if (current === 'en' || current === 'English') return 'English';
  if (current === 'tr' || current === 'Turkish') return 'Turkish';
  if (current && (languages.includes(current) || isCustomGenerationLanguage(current))) {
    return current;
  }
  const ui = readStoredLanguage(read);
  return ui ? generationLanguageForInterface(ui) : 'English';
}

function isCustomGenerationLanguage(value: string): boolean {
  if (value === 'en' || value === 'tr' || value === 'nope') return false;
  return /^[\p{L}][\p{L}\s().'-]{0,40}$/u.test(value);
}
