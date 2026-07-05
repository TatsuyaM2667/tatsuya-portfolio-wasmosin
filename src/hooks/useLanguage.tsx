import { createContext, useContext, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { PortfolioData } from '../types/portfolio';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: PortfolioData;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();
  
  // Get the translations for the current language.
  // i18n.resolvedLanguage is the language that was actually found in resources.
  const t = (i18n.getResourceBundle(i18n.resolvedLanguage || i18n.language, 'translation') || 
             i18n.getResourceBundle('en', 'translation')) as PortfolioData;

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const contextValue: LanguageContextType = {
    language: i18n.resolvedLanguage || i18n.language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
