import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { ContentResults, ContentType } from '../mobile/src/lib/contentDrafts';

const require = createRequire(import.meta.url);
const {
  emptyContentResults,
  resultForType,
  withTypeResult,
} = require('../mobile/src/lib/contentDrafts.ts') as typeof import('../mobile/src/lib/contentDrafts');
const {
  CREATIVITY_STEPS,
  LANGUAGES,
  OUTPUT_LENGTHS,
  PLATFORM_PRESETS,
  TONE_PRESETS,
} = require('../mobile/src/lib/generationOptions.ts') as typeof import('../mobile/src/lib/generationOptions');

const home = readFileSync('mobile/src/screens/HomeScreen.tsx', 'utf8');
const web = readFileSync('pages/index.tsx', 'utf8');
const appJson = readFileSync('mobile/app.json', 'utf8');
const theme = readFileSync('mobile/src/lib/theme.ts', 'utf8');
const googleButton = readFileSync('mobile/src/components/ContinueWithGoogleButton.tsx', 'utf8');

const types: ContentType[] = ['cold_email', 'proposal', 'contract', 'social_pack'];
let results: ContentResults = emptyContentResults();
assert.equal(resultForType(results, 'proposal'), '');
results = withTypeResult(results, 'cold_email', 'email draft');
assert.equal(resultForType(results, 'cold_email'), 'email draft');
assert.equal(resultForType(results, 'proposal'), '');
assert.equal(resultForType(results, 'contract'), '');
assert.equal(resultForType(results, 'social_pack'), '');
results = withTypeResult(results, 'proposal', 'proposal draft');
assert.equal(resultForType(results, 'cold_email'), 'email draft');
assert.equal(resultForType(results, 'proposal'), 'proposal draft');
results = withTypeResult(results, 'cold_email', '');
assert.equal(resultForType(results, 'cold_email'), '');
assert.equal(resultForType(results, 'proposal'), 'proposal draft');
assert.deepEqual(types.map((type) => resultForType(emptyContentResults(), type)), ['', '', '', '']);

assert.equal(LANGUAGES.includes('English'), true);
assert.equal(LANGUAGES.includes('Turkish'), true);
assert.equal(LANGUAGES.includes('Korean'), true);
assert.deepEqual(OUTPUT_LENGTHS, ['short', 'standard', 'detailed']);
assert.deepEqual(CREATIVITY_STEPS, [0, 25, 50, 75, 100]);
assert.deepEqual(TONE_PRESETS.en, ['Professional', 'Friendly', 'Casual']);
assert.deepEqual(TONE_PRESETS.tr, ['Profesyonel', 'Samimi', 'Resmi']);
assert.deepEqual(PLATFORM_PRESETS, ['Instagram', 'LinkedIn', 'Twitter']);
assert.equal(web.includes("from '../mobile/src/lib/generationOptions'"), true);
assert.equal(web.includes('const LANGUAGES'), false);

assert.match(home, /keyboardShouldPersistTaps="handled"/);
assert.match(home, /flexGrow: 1/);
assert.match(home, /nestedScrollEnabled/);
assert.match(home, /selectable/);
assert.match(home, /withTypeResult/);
assert.match(home, /resultForType/);
assert.match(home, /LanguageField/);
assert.match(home, /OptionChips/);
assert.match(home, /premiumOptions/);
assert.match(home, /minHeight: 44/);
assert.doesNotMatch(home, /maxHeight:\s*300/);
assert.doesNotMatch(home, /setOutput/);

assert.match(web, /withTypeResult/);
assert.match(web, /resultForType/);
assert.doesNotMatch(web, /setOutput\(/);

assert.match(appJson, /"versionCode": 8/);
assert.match(home, /adjustsFontSizeToFit/);
assert.match(home, /numberOfLines=\{1\}/);
assert.match(home, /flex: 1/);
assert.match(home, /minWidth: 0/);
assert.doesNotMatch(home, /horizontal/);
assert.match(readFileSync('mobile/src/lib/translations.ts', 'utf8'), /coldEmail: 'Cold Mail'/);
assert.match(readFileSync('mobile/src/lib/translations.ts', 'utf8'), /coldEmail: 'Soğuk Posta'/);
assert.match(readFileSync('lib/translations.ts', 'utf8'), /coldEmail: 'Cold Mail'/);
assert.match(readFileSync('lib/translations.ts', 'utf8'), /coldEmail: 'Soğuk Posta'/);
assert.match(appJson, /#6366F1/);
assert.match(appJson, /#FAFAFA/);
assert.doesNotMatch(appJson, /#FD7C55/);
assert.match(theme, /#6366F1/);
assert.match(theme, /#6265EF/);
assert.match(theme, /#FAFAFA/);
assert.match(theme, /#EEF2FF/);
assert.match(theme, /#0F172A/);
assert.match(googleButton, /#747775/);
assert.match(googleButton, /#1f1f1f/);

console.log('create screen tests passed');
