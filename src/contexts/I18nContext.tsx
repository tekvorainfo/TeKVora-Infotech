import { createContext, useContext, useState, ReactNode } from 'react';
import { TRANSLATIONS } from '../lib/i18n';

type Language = 'en' | 'hi' | 'mr';

interface I18nContextType {
  locale: Language;
  setLocale: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Language>(() => {
    return (localStorage.getItem('tekvora_lang') as Language) || 'en';
  });

  const setLocale = (lang: Language) => {
    setLocaleState(lang);
    localStorage.setItem('tekvora_lang', lang);
  };

  const t = (key: keyof typeof TRANSLATIONS['en']): string => {
    return TRANSLATIONS[locale]?.[key] || TRANSLATIONS['en']?.[key] || (key as string);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
}
