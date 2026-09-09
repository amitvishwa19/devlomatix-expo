import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Toast from "react-native-toast-message";
import { translate } from "~/utils/languages";

const LANGUAGE_STORAGE_KEY = "devlomatix.app-language";

export const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    category: "Global",
    subtext: "Default language",
    icon: "globe-outline",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    category: "North / Central",
    subtext: "हिंदी भाषा",
    icon: "language-outline",
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    category: "Western",
    subtext: "ગુજરાતી ભાષા",
    icon: "language-outline",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    category: "Western",
    subtext: "मराठी भाषा",
    icon: "language-outline",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    category: "South Indian",
    subtext: "தமிழ் மொழி",
    icon: "language-outline",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    category: "South Indian",
    subtext: "తెలుగు భాష",
    icon: "language-outline",
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    category: "South Indian",
    subtext: "ಕನ್ನಡ ಭಾಷೆ",
    icon: "language-outline",
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    category: "South Indian",
    subtext: "മലയാള ഭാഷ",
    icon: "language-outline",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    category: "Eastern",
    subtext: "বাংলা ভাষা",
    icon: "language-outline",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    category: "Northern",
    subtext: "ਪੰਜਾਬੀ ਭਾਸ਼ਾ",
    icon: "language-outline",
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    category: "Eastern",
    subtext: "ଓଡ଼ିଆ ଭାଷା",
    icon: "language-outline",
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    category: "National",
    subtext: "اردو زبان",
    icon: "language-outline",
  },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("en");
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    async function loadLanguage() {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
          setSelectedLanguageCode(stored);
        }
      } catch {
        // ignore
      } finally {
        setIsLanguageReady(true);
      }
    }
    loadLanguage();
  }, []);

  const changeLanguage = async (code, showToast = true) => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    if (!lang) return;
    setSelectedLanguageCode(code);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      if (showToast) {
        Toast.show({
          type: "success",
          text1: "Language Updated",
          text2: `App language set to ${lang.nativeName} (${lang.name})`,
          visibilityTime: 2500,
        });
      }
    } catch {
      // ignore
    }
  };

  const currentLanguage = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguageCode) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [selectedLanguageCode]);

  const t = (key, params) => translate(key, selectedLanguageCode, params);

  const value = useMemo(
    () => ({
      language: selectedLanguageCode,
      currentLanguage,
      setLanguage: changeLanguage,
      availableLanguages: SUPPORTED_LANGUAGES,
      isLanguageReady,
      t,
      translate: (key, lang, params) =>
        translate(key, lang || selectedLanguageCode, params),
    }),
    [selectedLanguageCode, currentLanguage, isLanguageReady]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
