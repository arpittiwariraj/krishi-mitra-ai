import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher({ compact = false }) {
  const { language, toggleLanguage, t } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-white font-semibold text-leaf-800 transition hover:border-leaf-400 hover:bg-leaf-50 ${
        compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
      }`}
      aria-label={`${t("common.language")}: ${language === "en" ? "English" : "Hindi"}`}
      title={language === "en" ? "हिन्दी में बदलें" : "Switch to English"}
    >
      <Languages size={compact ? 14 : 16} />
      <span>{language === "en" ? "हिन्दी" : "English"}</span>
    </button>
  );
}
