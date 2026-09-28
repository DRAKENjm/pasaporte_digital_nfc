import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Lang, TranslationKey, translate } from "../i18n/translations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
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
      t: (key: TranslationKey) => translate(lang, key),
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
