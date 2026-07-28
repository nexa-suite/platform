export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return value === 'en' || value === 'es';
}
