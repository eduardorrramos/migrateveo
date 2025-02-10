import { inject } from 'vue';
import type { translations } from '@/lib/translations';

export function useTranslations() {
  const t = inject<(key: keyof typeof translations.en) => string>('t');
  if (!t) throw new Error('Translations not provided');
  return { t };
}