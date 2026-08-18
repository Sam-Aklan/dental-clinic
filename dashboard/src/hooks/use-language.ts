import { useTranslation } from "react-i18next";
import type { LanguageCode } from "@/types";
import { useEffect } from "react";

export function useLanguage() {
  const { i18n } = useTranslation();
  const lang = (i18n.language.startsWith("ar") ? "ar" : "en") as LanguageCode;
  const dir = lang === "ar" ? "rtl" as const : "ltr" as const;
  const isRtl = lang === "ar";

  useEffect(()=>{
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
	document.documentElement.lang = lang;
  },[i18n.language])

  const setLanguage = (lng: LanguageCode) => {
    i18n.changeLanguage(lng);
  };

  const toggle = () => {
    const nextLang: LanguageCode = lang === "ar" ? "en" : "ar";
    i18n.changeLanguage(nextLang);
  };

  return { lang, dir, isRtl, setLanguage, toggle } as const;
}
