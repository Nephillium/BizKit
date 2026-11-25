export const CONTENT_TYPES = ['cold_email', 'proposal', 'contract', 'social_pack'] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export type ContentResults = Record<ContentType, string>;

export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}

export function emptyContentResults(): ContentResults {
  return {
    cold_email: '',
    proposal: '',
    contract: '',
    social_pack: '',
  };
}

export function resultForType(results: ContentResults, type: ContentType): string {
  return results[type] ?? '';
}

export function withTypeResult(
  results: ContentResults,
  type: ContentType,
  content: string,
): ContentResults {
  return { ...results, [type]: content };
}
