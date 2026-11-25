export const LANGUAGE_STORAGE_KEY = 'pitchcrafter_lang';
export const LEGACY_LANGUAGE_STORAGE_KEY = 'bizkit_lang';

export type StoredLanguage = 'en' | 'tr';

/** Prefer the current key. Fall back to the previous key so an existing choice is kept. */
export function readStoredLanguage(read: (key: string) => string | null): StoredLanguage | null {
  for (const key of [LANGUAGE_STORAGE_KEY, LEGACY_LANGUAGE_STORAGE_KEY]) {
    const saved = read(key);
    if (saved === 'en' || saved === 'tr') return saved;
  }
  return null;
}
