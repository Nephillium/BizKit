export const OUTPUT_LENGTHS = ['short', 'standard', 'detailed'] as const;

export type OutputLength = (typeof OUTPUT_LENGTHS)[number];

/** Same steps the web creativity slider can land on, as tappable values. */
export const CREATIVITY_STEPS = [0, 25, 50, 75, 100] as const;

/**
 * Output languages from the website LanguagePicker in pages/index.tsx.
 * Values are the strings sent as inputs.language.
 */
export const LANGUAGES: readonly string[] = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Italian',
  'Dutch',
  'Swedish',
  'Danish',
  'Norwegian',
  'Finnish',
  'Polish',
  'Turkish',
  'Arabic',
  'Hebrew',
  'Russian',
  'Ukrainian',
  'Hindi',
  'Bengali',
  'Indonesian',
  'Malay',
  'Vietnamese',
  'Thai',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'Japanese',
  'Korean',
];

/** Placeholder examples on the website tone fields, in the UI language. */
export const TONE_PRESETS = {
  en: ['Professional', 'Friendly', 'Casual'],
  tr: ['Profesyonel', 'Samimi', 'Resmi'],
} as const;

/** Placeholder examples on the website platform field. */
export const PLATFORM_PRESETS = ['Instagram', 'LinkedIn', 'Twitter'] as const;

export function tonePresets(language: 'en' | 'tr'): readonly string[] {
  return TONE_PRESETS[language];
}
