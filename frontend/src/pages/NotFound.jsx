import { Link } from "react-router-dom";
import { ArrowLeft, Home, Sprout } from "lucide-react";
import PublicLayout from "../components/PublicLayout";
import { useLanguage } from "../context/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <PublicLayout>
      <section className="container-page flex min-h-[62vh] flex-col items-center justify-center py-16 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-leaf-100 text-leaf-700">
          <Sprout size={38} />
        </span>
        <p className="mt-6 font-display text-6xl font-semibold text-leaf-900">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-leaf-950 sm:text-3xl">{t("notFound.title")}</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-leaf-600">{t("notFound.text")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/" className="btn-primary"><Home size={16} /> {t("nav.home")}</Link>
          <Link to="/dashboard" className="btn-secondary"><ArrowLeft size={16} /> {t("nav.dashboard")}</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
