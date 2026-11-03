import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getTranslation } from "../utils/translations";

const LanguageContext = createContext(null);
const STORAGE_KEY = "km_language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "hi" ? "hi" : "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((value) => {
    setLanguageState(value === "hi" ? "hi" : "en");
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === "hi" ? "en" : "hi"));
  }, []);

  const t = useCallback(
    (path) => {
      const value = getTranslation(language, path);
      return value ?? path;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
