import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="mt-16 border-t border-leaf-100 bg-leaf-950 text-leaf-100">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-900">
              <Sprout size={21} />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-white">{t("common.appName")}</p>
              <p className="text-xs text-leaf-300">{t("common.tagline")}</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-leaf-300">{t("footer.description")}</p>
          <p className="mt-4 text-xs text-leaf-400">{t("common.poweredBy")}</p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-leaf-300">{t("footer.quickLinks")}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/" className="text-leaf-100 hover:text-white">{t("nav.home")}</Link></li>
            <li><Link to="/about" className="text-leaf-100 hover:text-white">{t("nav.about")}</Link></li>
            <li><Link to="/dashboard" className="text-leaf-100 hover:text-white">{t("nav.dashboard")}</Link></li>
            <li><Link to="/login" className="text-leaf-100 hover:text-white">{t("nav.login")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-leaf-300">{t("footer.modules")}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/disease" className="text-leaf-100 hover:text-white">{t("nav.disease")}</Link></li>
            <li><Link to="/weather" className="text-leaf-100 hover:text-white">{t("nav.weather")}</Link></li>
            <li><Link to="/market" className="text-leaf-100 hover:text-white">{t("nav.market")}</Link></li>
            <li><Link to="/schemes" className="text-leaf-100 hover:text-white">{t("nav.schemes")}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-leaf-900">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-leaf-400 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-3xl leading-relaxed">{t("footer.importantText")}</p>
          <p className="shrink-0">© {new Date().getFullYear()} Krishi Mitra AI</p>
        </div>
      </div>
    </footer>
  );
}
