import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LANGUAGES = {
  EN: 'en',
  JA: 'ja'
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem('app_language');
    return stored || LANGUAGES.EN;
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
    // Set html lang attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === LANGUAGES.EN ? LANGUAGES.JA : LANGUAGES.EN);
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    isJapanese: language === LANGUAGES.JA,
    isEnglish: language === LANGUAGES.EN
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
