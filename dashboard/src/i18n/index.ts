import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./en.json";
import ar from "./ar.json";

i18next
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			en: { translation: en },
			ar: { translation: ar },
		},
		fallbackLng: "en",
		supportedLngs: ["en", "ar"],
		detection: {
			order: ["localStorage", "navigator"],
			lookupLocalStorage: "lang",
			caches: ["localStorage"],
		},
		interpolation: {
			escapeValue: false,
		},
	});

i18next.on("languageChanged", (lng) => {
	document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
	document.documentElement.lang = lng;
});

export default i18next;
