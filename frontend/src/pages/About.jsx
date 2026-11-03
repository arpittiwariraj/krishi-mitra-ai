import { Link } from "react-router-dom";
import { AlertTriangle, HeartHandshake, Mail, ShieldCheck, Sprout } from "lucide-react";
import PublicLayout from "../components/PublicLayout";
import { useLanguage } from "../context/LanguageContext";

export default function About() {
  const { t } = useLanguage();
  return (
    <PublicLayout>
      <section className="border-b border-leaf-100 bg-white">
        <div className="container-page py-14">
          <p className="section-eyebrow">{t("nav.about")}</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold text-leaf-950 sm:text-5xl">
            {t("about.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-leaf-600 sm:text-lg">{t("about.subtitle")}</p>
        </div>
      </section>

      <section className="container-page grid gap-6 py-12 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <span className="inline-flex rounded-2xl bg-leaf-100 p-3 text-leaf-700"><Sprout size={24} /></span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-leaf-950">{t("about.missionTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-leaf-700">{t("about.missionText")}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex gap-2.5 rounded-xl bg-leaf-50 p-3 text-sm text-leaf-800">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-leaf-600" />
                <span>{t(`about.trust${item}`)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-amber-50">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-700"><AlertTriangle size={24} /></span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-amber-950">{t("about.limitsTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-amber-900">{t("about.limitsText")}</p>
        </div>
      </section>

      <section id="contact" className="container-page scroll-mt-24 pb-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <span className="inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700"><Mail size={23} /></span>
            <h2 className="mt-4 font-display text-2xl font-semibold text-leaf-950">{t("about.contactTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-leaf-700">{t("about.contactText")}</p>
            <div className="mt-5 rounded-xl border border-leaf-100 bg-soil-50 p-4 text-sm text-leaf-700">
              <p className="font-semibold text-leaf-900">Krishi Mitra AI</p>
              <p className="mt-1">Agricultural advisory project · India</p>
              <p className="mt-1 text-xs">This demo does not provide a live emergency helpline.</p>
            </div>
          </div>
          <div className="card bg-leaf-900 text-white">
            <span className="inline-flex rounded-2xl bg-leaf-800 p-3 text-leaf-200"><HeartHandshake size={23} /></span>
            <h2 className="mt-4 font-display text-2xl font-semibold">{t("home.ctaTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-leaf-200">{t("home.ctaText")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/dashboard" className="btn bg-white text-leaf-900 hover:bg-leaf-50">{t("nav.dashboard")}</Link>
              <Link to="/schemes" className="btn border border-leaf-700 text-white hover:bg-leaf-800">{t("nav.schemes")}</Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
