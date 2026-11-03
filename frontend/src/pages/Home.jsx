import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bug,
  CheckCircle2,
  CloudSun,
  Cpu,
  Landmark,
  Languages,
  MessageSquare,
  Satellite,
  ShieldCheck,
  Smartphone,
  Store,
  Sprout,
} from "lucide-react";
import PublicLayout from "../components/PublicLayout";
import FarmIllustration from "../components/FarmIllustration";
import FeatureCard from "../components/FeatureCard";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const featureConfig = [
  { key: "feature1", to: "/disease", icon: Bug, accent: "leaf" },
  { key: "feature2", to: "/weather", icon: CloudSun, accent: "sky" },
  { key: "feature3", to: "/market", icon: Store, accent: "amber" },
  { key: "feature4", to: "/schemes", icon: Landmark, accent: "leaf" },
];

const whyConfig = [
  { icon: ShieldCheck, title: "why1Title", text: "why1Text" },
  { icon: CheckCircle2, title: "why2Title", text: "why2Text" },
  { icon: Languages, title: "why3Title", text: "why3Text" },
  { icon: Sprout, title: "why4Title", text: "why4Text" },
];

export default function Home() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  return (
    <PublicLayout>
      <section className="hero-grid relative overflow-hidden border-b border-leaf-100">
        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="animate-fadeUp">
            <span className="badge-leaf">
              <Sprout size={13} /> {t("home.badge")}
            </span>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1.08] text-leaf-950 text-balance sm:text-5xl lg:text-6xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-leaf-700 sm:text-lg">
              {t("home.heroDescription")}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to={isAuthenticated ? "/dashboard" : "/register"} className="btn-primary !px-5 !py-3">
                {t("home.getStarted")} <ArrowRight size={17} />
              </Link>
              <a href="#features" className="btn-secondary !px-5 !py-3">
                {t("home.exploreFeatures")}
              </a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs font-medium text-leaf-500">
              <Smartphone size={14} /> {t("home.heroNote")}
            </p>
          </div>
          <div className="relative animate-fadeUp">
            <FarmIllustration />
          </div>
        </div>
      </section>

      <section id="features" className="container-page scroll-mt-20 py-16">
        <div className="text-center">
          <p className="section-eyebrow">Krishi Mitra AI</p>
          <h2 className="section-title mt-2">{t("home.featuresTitle")}</h2>
          <p className="section-copy mx-auto text-center">{t("home.featuresSubtitle")}</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featureConfig.map(({ key, to, icon, accent }) => (
            <FeatureCard
              key={key}
              icon={icon}
              accent={accent}
              to={to}
              title={t(`home.${key}Title`)}
              description={t(`home.${key}Text`)}
            />
          ))}
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-y border-leaf-100 bg-white py-16">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="section-eyebrow">{t("nav.howItWorks")}</p>
            <h2 className="section-title mt-2">{t("home.howTitle")}</h2>
            <p className="section-copy">{t("home.howSubtitle")}</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="relative rounded-2xl border border-leaf-100 bg-soil-50 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-leaf-900 font-display text-lg font-semibold text-white">
                  {step}
                </span>
                <h3 className="mt-4 text-lg font-bold text-leaf-950">{t(`home.step${step}Title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-leaf-600">{t(`home.step${step}Text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="text-center">
          <p className="section-eyebrow">{t("home.whyTitle")}</p>
          <h2 className="section-title mt-2">{t("home.whySubtitle")}</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {whyConfig.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card flex gap-4">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf-100 text-leaf-700">
                <Icon size={20} />
              </span>
              <div>
                <h3 className="font-bold text-leaf-950">{t(`home.${title}`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-leaf-600">{t(`home.${text}`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-leaf-950 py-16 text-white">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf-300">{t("home.techTitle")}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">{t("home.techTitle")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-leaf-200 sm:text-base">{t("home.techText")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["React", "Tailwind CSS", "FastAPI", "PostgreSQL", "OpenAI Vision", "OpenWeather", "data.gov.in", "Leaflet"].map((item) => (
                <span key={item} className="rounded-full border border-leaf-800 bg-leaf-900 px-3 py-1.5 text-xs font-semibold text-leaf-100">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-leaf-800 bg-leaf-900 p-5">
              <Cpu className="text-leaf-300" size={22} />
              <h3 className="mt-3 font-bold">{t("home.techTitle")}</h3>
              <p className="mt-1 text-xs leading-relaxed text-leaf-300">Structured, validated AI output with verified knowledge-base grounding.</p>
            </div>
            <div className="rounded-2xl border border-leaf-800 bg-leaf-900 p-5">
              <ShieldCheck className="text-leaf-300" size={22} />
              <h3 className="mt-3 font-bold">{t("home.whyTitle")}</h3>
              <p className="mt-1 text-xs leading-relaxed text-leaf-300">No fabricated numbers, no silent demo substitution, clear source labels.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-leaf-100 bg-white p-7">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-leaf-100 p-3 text-leaf-700"><Satellite size={22} /></span>
              <h2 className="font-display text-2xl font-semibold text-leaf-950">{t("home.futureTitle")}</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-leaf-600">{t("home.futureText")}</p>
            <ul className="mt-5 space-y-2 text-sm text-leaf-700">
              <li className="flex items-center gap-2"><MessageSquare size={15} className="text-leaf-500" /> Two-way SMS for keypad phones</li>
              <li className="flex items-center gap-2"><Satellite size={15} className="text-leaf-500" /> Sentinel-2 crop health / NDVI (future)</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-leaf-800 p-7 text-white">
            <h2 className="font-display text-2xl font-semibold">{t("home.ctaTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-leaf-100">{t("home.ctaText")}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to={isAuthenticated ? "/dashboard" : "/register"} className="btn bg-white text-leaf-900 hover:bg-leaf-50">
                {t("home.ctaButton")} <ArrowRight size={16} />
              </Link>
              <Link to="/disease" className="btn border border-leaf-600 text-white hover:bg-leaf-700">
                {t("nav.disease")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
