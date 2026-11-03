import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  FileText,
  Landmark,
  ListChecks,
  LoaderCircle,
  MapPin,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { schemeService } from "../services/schemeService";

function DetailList({ title, items, icon: Icon, numbered = false, tone = "leaf" }) {
  if (!items?.length) return null;
  const toneClass = tone === "amber" ? "text-amber-600" : "text-leaf-600";
  return (
    <section className="card">
      <h2 className="flex items-center gap-2 font-bold text-leaf-950">
        <Icon size={18} className={toneClass} /> {title}
      </h2>
      <ul className="mt-3 space-y-2.5">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2.5 text-sm leading-relaxed text-leaf-700">
            {numbered ? (
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-[10px] font-bold text-leaf-800">
                {index + 1}
              </span>
            ) : (
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-leaf-500" />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function GovernmentSchemeDetails() {
  const { schemeId } = useParams();
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await schemeService.get(schemeId, language);
      setScheme(data);
      if (isAuthenticated) {
        const items = await schemeService.saved();
        setSaved((items || []).some((item) => item.id === schemeId));
      }
    } catch (err) {
      setError(err.message || t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }, [schemeId, language, isAuthenticated, t]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSave = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/schemes/${schemeId}` } });
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      if (saved) {
        await schemeService.unsave(schemeId);
        setSaved(false);
        setNotice(t("schemes.schemeRemoved"));
      } else {
        await schemeService.save(schemeId);
        setSaved(true);
        setNotice(t("schemes.schemeSaved"));
      }
    } catch (err) {
      setError(err.message || t("errors.generic"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ModuleLayout><LoadingSpinner label={t("common.loading")} fullScreen /></ModuleLayout>;
  }

  if (error || !scheme) {
    return (
      <ModuleLayout>
        <div className="mx-auto max-w-2xl">
          <ErrorMessage message={error || t("errors.notFound")} onRetry={load} />
          <Link to="/schemes" className="btn-secondary mt-4"><ArrowLeft size={15} /> {t("schemes.backToSchemes")}</Link>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout>
      <Link to="/schemes" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-700 hover:text-leaf-900">
        <ArrowLeft size={15} /> {t("schemes.backToSchemes")}
      </Link>

      <div className="overflow-hidden rounded-3xl border border-leaf-100 bg-white shadow-soft">
        <div className="bg-gradient-to-br from-leaf-950 via-leaf-900 to-leaf-800 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-leaf-100">
                <Landmark size={12} /> {t("schemes.detailTitle")}
              </span>
              <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {scheme.name_display || scheme.name}
              </h1>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-leaf-200">
                <Building2 size={15} className="mt-0.5 shrink-0" /> {scheme.department}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-leaf-100">
                {scheme.description_display || scheme.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(scheme.state_applicability || []).map((item) => (
                  <span key={item} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-leaf-100">
                    <MapPin size={10} /> {item}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={toggleSave}
              disabled={saving}
              className={`btn shrink-0 ${saved ? "!bg-white !text-leaf-900" : "!bg-leaf-700 !text-white hover:!bg-leaf-600"}`}
            >
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {saved ? t("schemes.savedScheme") : t("schemes.saveScheme")}
            </button>
          </div>
        </div>

        {notice && (
          <div className="border-b border-leaf-100 bg-leaf-50 px-6 py-3 text-sm font-medium text-leaf-800">{notice}</div>
        )}

        <div className="grid gap-5 p-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <DetailList title={t("schemes.eligibility")} items={scheme.eligibility} icon={ListChecks} />
            <DetailList title={t("schemes.benefits")} items={scheme.benefits} icon={Sparkles} />
            <DetailList title={t("schemes.documents")} items={scheme.required_documents} icon={FileText} />
            <DetailList title={t("schemes.procedure")} items={scheme.application_procedure} icon={ListChecks} numbered />
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-leaf-200 bg-leaf-50 p-4">
              <h2 className="text-sm font-bold text-leaf-950">{t("schemes.applyTitle")}</h2>
              <p className="mt-1 text-xs leading-relaxed text-leaf-600">{t("schemes.applyText")}</p>
              <a
                href={scheme.official_application_url}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-primary mt-3 w-full"
              >
                {t("schemes.applyNow")} <ExternalLink size={14} />
              </a>
              <a
                href={scheme.source_url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-leaf-700 hover:text-leaf-900"
              >
                {t("schemes.officialSource")} <ExternalLink size={12} />
              </a>
            </div>

            <div className="rounded-2xl border border-soil-200 bg-soil-50 p-4 text-xs text-soil-800">
              <p className="flex items-center gap-1.5 font-bold"><CalendarCheck size={14} /> {t("schemes.lastVerified")}</p>
              <p className="mt-1">{scheme.last_verified_date || "—"}</p>
              <p className="mt-3 flex items-center gap-1.5 font-bold"><ShieldAlert size={14} /> {t("common.disclaimer")}</p>
              <p className="mt-1 leading-relaxed">{scheme.eligibility_note || t("schemes.disclaimer")}</p>
            </div>

            {scheme.match_reasons?.length > 0 && (
              <div className="rounded-2xl border border-leaf-200 bg-white p-4">
                <h2 className="text-sm font-bold text-leaf-950">{t("schemes.matchReasons")}</h2>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-leaf-700">
                  {scheme.match_reasons.map((reason) => <li key={reason}>• {reason}</li>)}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        <p className="font-semibold">{t("schemes.disclaimerTitle")}</p>
        <p className="mt-1">{t("schemes.disclaimer")}</p>
      </div>
    </ModuleLayout>
  );
}
