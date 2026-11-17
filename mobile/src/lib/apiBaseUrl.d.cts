export const PRODUCTION_API_BASE_URL: string;
export const LOCAL_API_BASE_URL: string;

export function stripTrailingSlash(url: string): string;

export function isLocalApiUrl(value: string): boolean;

export function resolveApiBaseUrl(input: {
  envValue?: string | null;
  extraValue?: string | null;
  dev: boolean;
}): string;

export function resolveConfigApiBaseUrl(envValue: string | undefined, release: boolean): string;
