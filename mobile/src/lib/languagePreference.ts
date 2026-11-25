/**
 * Mobile copy of the language helpers. EAS uploads only this package, so this
 * file must not import the repo-root lib/. Keep it in step with lib/languagePreference.ts.
 */
export const LANGUAGE_STORAGE_KEY = 'pitchcrafter_lang';
export const LEGACY_LANGUAGE_STORAGE_KEY = 'bizkit_lang';
/** Interface language only. The header EN/TR control writes this and leaves the generation preference alone. */
export const INTERFACE_LANGUAGE_STORAGE_KEY = 'pitchcrafter_ui_lang';

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
 * An explicit interface choice in pitchcrafter_ui_lang wins over both.
 */
export function readStoredLanguage(read: LanguageRead): StoredLanguage | null {
  const explicit = read(INTERFACE_LANGUAGE_STORAGE_KEY);
  if (explicit === 'en' || explicit === 'tr') return explicit;
  for (const key of [LANGUAGE_STORAGE_KEY, LEGACY_LANGUAGE_STORAGE_KEY]) {
    const ui = interfaceLanguageForGeneration(read(key));
    if (ui && (read(key) === 'en' || read(key) === 'tr' || read(key) === 'English' || read(key) === 'Turkish')) {
      return ui;
    }
  }
  return null;
}

/**
 * Generation language from pitchcrafter_lang, then bizkit_lang.
 * en/tr and English/Turkish map to the names the generator expects.
 * Any other accepted value is a list or custom generation language.
 * The interface key is not consulted here: a header toggle must not
 * replace a legacy generation choice. Only when neither storage key
 * holds a generation language does the interface language, or English, apply.
 */
export function readStoredGenerationLanguage(
  read: LanguageRead,
  languages: readonly string[] = [],
): string {
  for (const key of [LANGUAGE_STORAGE_KEY, LEGACY_LANGUAGE_STORAGE_KEY]) {
    const generation = generationLanguageFromStored(read(key), languages);
    if (generation) return generation;
  }
  const ui = readStoredLanguage(read);
  return ui ? generationLanguageForInterface(ui) : 'English';
}

function generationLanguageFromStored(
  value: string | null | undefined,
  languages: readonly string[],
): string | null {
  const current = (value || '').trim();
  if (!current) return null;
  if (current === 'en' || current === 'English') return 'English';
  if (current === 'tr' || current === 'Turkish') return 'Turkish';
  if (languages.includes(current) || isCustomGenerationLanguage(current)) return current;
  return null;
}

function isCustomGenerationLanguage(value: string): boolean {
  if (value === 'en' || value === 'tr' || value === 'nope') return false;
  return /^[\p{L}][\p{L}\s().'-]{0,40}$/u.test(value);
}
