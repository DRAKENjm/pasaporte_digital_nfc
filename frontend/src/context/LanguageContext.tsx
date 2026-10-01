import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Lang, TranslationKey, translate } from "../i18n/translations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey | string) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const s = localStorage.getItem("pd_idioma") as Lang | null;
    return s && ["es", "en", "pt", "ru", "qu"].includes(s) ? s : "es";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("pd_idioma", l);
    document.documentElement.lang = l;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: TranslationKey | string) => {
        try {
          return translate(lang, key as TranslationKey);
        } catch {
          return String(key);
        }
      },
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

/** Nunca lanza error si falta el Provider */
export const useLanguage = (): Ctx => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    const fallbackLang = (localStorage.getItem("pd_idioma") || "es") as Lang;
    return {
      lang: fallbackLang,
      setLang: (l: Lang) => localStorage.setItem("pd_idioma", l),
      t: (key: string) => String(key),
    };
  }
  return ctx;
};
