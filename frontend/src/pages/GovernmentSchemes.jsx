import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Building2,
  Filter,
  Landmark,
  LoaderCircle,
  MapPin,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { schemeService } from "../services/schemeService";
import { CROP_OPTIONS, STATES } from "../utils/locations";

const emptyFilters = { q: "", state: "", farmer_category: "", land_size_ha: "", crop: "" };

export default function GovernmentSchemes() {
  const { t, language } = useLanguage();
  const { isAuthenticated, farmer } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(emptyFilters);
  const [schemes, setSchemes] = useState([]);
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [mode, setMode] = useState("browse");
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState("");
  const [disclaimer, setDisclaimer] = useState("");

  const savedIds = useMemo(() => new Set(savedSchemes.map((item) => item.id)), [savedSchemes]);

  const loadSaved = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedSchemes([]);
      return;
    }
    try {
      const data = await schemeService.saved();
      setSavedSchemes(data || []);
    } catch {
      setSavedSchemes([]);
    }
  }, [isAuthenticated]);

  const runSearch = useCallback(
    async (activeFilters = filters) => {
      setMode("browse");
      setLoading(true);
      setError("");
      setNotice("");
      try {
        const data = await schemeService.list({ ...activeFilters, language });
        setSchemes(data.schemes || []);
        setDisclaimer(data.disclaimer || "");
      } catch (err) {
        setError(err.message || t("errors.generic"));
        setSchemes([]);
      } finally {
        setLoading(false);
      }
    },
    [filters, language, t]
  );

  useEffect(() => {
    runSearch(emptyFilters);
    // Search once on entry and when UI language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const recommend = async () => {
    setMode("recommend");
    setShowSaved(false);
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const data = await schemeService.recommend({
        state: filters.state || farmer?.state || null,
        district: farmer?.district || null,
        farmer_category: filters.farmer_category || null,
        land_size_ha: filters.land_size_ha !== "" ? Number(filters.land_size_ha) : null,
        crop: filters.crop || farmer?.profile?.primary_crop || null,
        language,
      });
      setSchemes(data.schemes || []);
      setDisclaimer(data.disclaimer || "");
    } catch (err) {
      setError(err.message || t("errors.generic"));
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (scheme) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/schemes" } });
      return;
    }
    setSavingId(scheme.id);
    setNotice("");
    try {
      if (savedIds.has(scheme.id)) {
        await schemeService.unsave(scheme.id);
        setSavedSchemes((items) => items.filter((item) => item.id !== scheme.id));
        setNotice(t("schemes.schemeRemoved"));
      } else {
        await schemeService.save(scheme.id);
        setSavedSchemes((items) => [...items, scheme]);
        setNotice(t("schemes.schemeSaved"));
      }
    } catch (err) {
      setError(err.message || t("errors.generic"));
    } finally {
      setSavingId("");
    }
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setShowSaved(false);
    runSearch(emptyFilters);
  };

  const visibleSchemes = showSaved ? savedSchemes : schemes;

  return (
    <ModuleLayout>
      <PageHeader
        eyebrow={t("nav.schemes")}
        title={t("schemes.title")}
        subtitle={t("schemes.subtitle")}
        icon={Landmark}
        actions={
          isAuthenticated && (
            <button
              type="button"
              onClick={() => { setShowSaved((value) => !value); setMode("saved"); }}
              className={showSaved ? "btn-primary" : "btn-secondary"}
            >
              <Bookmark size={16} /> {t("schemes.savedTitle")} ({savedSchemes.length})
            </button>
          )
        }
      />

      <div className="card mb-6">
        <form
          onSubmit={(event) => { event.preventDefault(); setShowSaved(false); runSearch(); }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="scheme-search" className="label">{t("common.search")}</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-leaf-400" />
              <input
                id="scheme-search"
                className="input pl-9"
                value={filters.q}
                onChange={(event) => setFilters({ ...filters, q: event.target.value })}
                placeholder={t("schemes.searchPlaceholder")}
              />
            </div>
          </div>
          <div>
            <label htmlFor="scheme-state" className="label">{t("common.state")}</label>
            <select
              id="scheme-state"
              className="select"
              value={filters.state}
              onChange={(event) => setFilters({ ...filters, state: event.target.value })}
            >
              <option value="">{t("common.all")}</option>
              {STATES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="scheme-category" className="label">{t("schemes.category")}</label>
            <select
              id="scheme-category"
              className="select"
              value={filters.farmer_category}
              onChange={(event) => setFilters({ ...filters, farmer_category: event.target.value })}
            >
              <option value="">{t("schemes.categoryAll")}</option>
              <option value="small">{t("schemes.categorySmall")}</option>
              <option value="marginal">{t("schemes.categoryMarginal")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="scheme-crop" className="label">{t("common.crop")}</label>
            <select
              id="scheme-crop"
              className="select"
              value={filters.crop}
              onChange={(event) => setFilters({ ...filters, crop: event.target.value })}
            >
              <option value="">{t("common.all")}</option>
              {CROP_OPTIONS.map((item) => <option key={item.value} value={item.value}>{language === "hi" ? item.hi : item.en}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="scheme-land" className="label">{t("schemes.landholding")}</label>
            <input
              id="scheme-land"
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={filters.land_size_ha}
              onChange={(event) => setFilters({ ...filters, land_size_ha: event.target.value })}
              placeholder="e.g. 1.5"
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn-primary" disabled={loading}>
              <Filter size={16} /> {t("schemes.applyFilters")}
            </button>
            <button type="button" onClick={recommend} className="btn-secondary" disabled={loading}>
              <Sparkles size={16} /> {t("schemes.recommend")}
            </button>
            <button type="button" onClick={clearFilters} className="btn-ghost">
              {t("schemes.clear")}
            </button>
          </div>
        </form>
      </div>

      {notice && (
        <div className="mb-5 rounded-xl border border-leaf-200 bg-leaf-50 px-4 py-3 text-sm font-medium text-leaf-800">
          {notice}
        </div>
      )}
      {error && <div className="mb-5"><ErrorMessage message={error} onRetry={() => runSearch()} /></div>}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-leaf-950">
            {showSaved ? t("schemes.savedTitle") : mode === "recommend" ? t("schemes.recommendationTitle") : t("schemes.allSchemes")}
          </h2>
          {!showSaved && <p className="mt-0.5 text-xs text-leaf-500">{visibleSchemes.length} {t("schemes.results")}</p>}
        </div>
        {mode === "recommend" && !showSaved && <span className="badge-green">{t("schemes.personalised")}</span>}
      </div>

      {loading ? (
        <LoadingSpinner label={t("common.loading")} fullScreen />
      ) : visibleSchemes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={showSaved ? Bookmark : Landmark}
            title={showSaved ? t("schemes.noSaved") : t("schemes.noResults")}
            description={showSaved ? t("schemes.noSavedHint") : t("schemes.noResultsHint")}
            action={
              !showSaved && (
                <button type="button" onClick={clearFilters} className="btn-secondary">
                  {t("schemes.clear")}
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleSchemes.map((scheme) => {
            const isSaved = savedIds.has(scheme.id);
            return (
              <article key={scheme.id} className="card flex flex-col !p-0">
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-xl bg-leaf-100 p-2 text-leaf-700"><Landmark size={18} /></span>
                    {isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => toggleSave(scheme)}
                        disabled={savingId === scheme.id}
                        className={`rounded-lg p-2 transition ${isSaved ? "bg-leaf-100 text-leaf-700" : "text-leaf-400 hover:bg-leaf-50 hover:text-leaf-700"}`}
                        title={isSaved ? t("schemes.removeSaved") : t("schemes.saveScheme")}
                      >
                        {savingId === scheme.id ? <LoaderCircle size={18} className="animate-spin" /> : isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      </button>
                    ) : null}
                  </div>
                  <Link to={`/schemes/${scheme.id}`} className="mt-3 block">
                    <h3 className="font-display text-lg font-semibold leading-snug text-leaf-950 hover:text-leaf-700">
                      {scheme.name_display || scheme.name}
                    </h3>
                  </Link>
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-leaf-500">
                    <Building2 size={13} className="mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{scheme.department}</span>
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-leaf-600">
                    {scheme.description_display || scheme.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(scheme.state_applicability || []).slice(0, 2).map((item) => (
                      <span key={item} className="badge-blue !text-[10px]"><MapPin size={10} /> {item}</span>
                    ))}
                    {scheme.match_score != null && <span className="badge-green !text-[10px]">Match {scheme.match_score}/5</span>}
                  </div>

                  {scheme.match_reasons?.length > 0 && mode === "recommend" && (
                    <ul className="mt-3 space-y-1 rounded-xl bg-leaf-50 p-2.5">
                      {scheme.match_reasons.slice(0, 3).map((reason) => (
                        <li key={reason} className="text-[11px] leading-relaxed text-leaf-700">• {reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-leaf-100 px-5 py-3">
                  <span className="text-[11px] text-leaf-500">{t("schemes.lastVerified")}: {scheme.last_verified_date}</span>
                  <Link to={`/schemes/${scheme.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-leaf-700 hover:text-leaf-900">
                    {t("common.viewDetails")} <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        <p className="font-semibold">{t("schemes.disclaimerTitle")}</p>
        <p className="mt-1">{disclaimer || t("schemes.disclaimer")}</p>
        {!isAuthenticated && (
          <p className="mt-2">
            <Link to="/login" className="font-bold underline">{t("schemes.loginToSave")}</Link>
          </p>
        )}
      </div>
    </ModuleLayout>
  );
}
