import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bug,
  CloudSun,
  Landmark,
  MapPin,
  RefreshCcw,
  Store,
  UserRound,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";
import PageHeader from "../components/PageHeader";
import WeatherCard from "../components/WeatherCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { farmerService } from "../services/farmerService";
import { weatherService } from "../services/weatherService";
import { marketService } from "../services/marketService";
import { formatDate, formatMoney, severityClass } from "../utils/format";

const tools = [
  { to: "/disease", key: "home.feature1Title", icon: Bug, className: "bg-leaf-100 text-leaf-700" },
  { to: "/weather", key: "home.feature2Title", icon: CloudSun, className: "bg-sky-100 text-sky-700" },
  { to: "/market", key: "home.feature3Title", icon: Store, className: "bg-amber-100 text-amber-700" },
  { to: "/schemes", key: "home.feature4Title", icon: Landmark, className: "bg-leaf-100 text-leaf-700" },
];

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { farmer } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weather, setWeather] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [weatherError, setWeatherError] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [market, setMarket] = useState(null);
  const [marketError, setMarketError] = useState("");
  const [marketLoading, setMarketLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await farmerService.dashboard();
      setData(result);
    } catch (err) {
      setError(err.message || t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadWeather = useCallback(async () => {
    const profileFarmer = data?.farmer || farmer;
    if (!profileFarmer?.state || !profileFarmer?.district) {
      setWeatherError("");
      return;
    }
    setWeatherLoading(true);
    setWeatherError("");
    try {
      const result = await weatherService.advisory({
        state: profileFarmer.state,
        district: profileFarmer.district,
        crop: data?.farmer?.profile?.primary_crop || null,
        language,
      });
      setWeather(result.current);
      setAdvisory(result);
    } catch (err) {
      setWeatherError(err.message || t("dashboard.weatherUnavailable"));
      setWeather(null);
      setAdvisory(null);
    } finally {
      setWeatherLoading(false);
    }
  }, [data?.farmer, farmer, language, t]);

  const loadMarket = useCallback(async () => {
    const profileFarmer = data?.farmer || farmer;
    const cropName =
      profileFarmer?.profile?.primary_crop || data?.recent_market_searches?.[0]?.crop_name;
    if (!profileFarmer?.state || !profileFarmer?.district || !cropName) {
      setMarket(null);
      setMarketError("");
      return;
    }
    setMarketLoading(true);
    setMarketError("");
    try {
      const result = await marketService.compare({
        crop: cropName,
        state: profileFarmer.state,
        district: profileFarmer.district,
        transport_cost_per_km_quintal: 0,
        language,
      });
      setMarket(result);
    } catch (err) {
      setMarketError(err.message || t("dashboard.marketUnavailable"));
      setMarket(null);
    } finally {
      setMarketLoading(false);
    }
  }, [data?.farmer, data?.recent_market_searches, farmer, language, t]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!loading && data) {
      loadWeather();
      loadMarket();
    }
  }, [loading, data, loadWeather, loadMarket]);

  const profileFarmer = data?.farmer || farmer;
  const firstName = (profileFarmer?.full_name || "").split(" ")[0];
  const marketCrop =
    profileFarmer?.profile?.primary_crop || data?.recent_market_searches?.[0]?.crop_name;

  return (
    <ModuleLayout>
      <PageHeader
        eyebrow={t("dashboard.welcome")}
        title={`${t("dashboard.greeting")}${firstName ? `, ${firstName}` : ""}`}
        subtitle={
          profileFarmer?.district
            ? `${profileFarmer.district}, ${profileFarmer.state} · ${t("dashboard.welcomeGuest")}`
            : t("dashboard.welcomeGuest")
        }
        actions={
          <>
            <button type="button" onClick={() => { loadDashboard(); loadWeather(); loadMarket(); }} className="btn-secondary">
              <RefreshCcw size={15} /> {t("common.retry")}
            </button>
            <Link to="/profile" className="btn-primary">
              <UserRound size={16} /> {t("nav.profile")}
            </Link>
          </>
        }
      />

      {loading ? (
        <LoadingSpinner label={t("common.loading")} />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadDashboard} />
      ) : (
        <div className="space-y-6">
          {(!profileFarmer?.profile?.primary_crop || profileFarmer?.profile?.land_size == null) && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 text-amber-600" size={20} />
                <div>
                  <p className="font-semibold text-amber-950">{t("dashboard.completeProfile")}</p>
                  <p className="text-sm text-amber-800">{t("dashboard.completeProfileText")}</p>
                </div>
              </div>
              <Link to="/profile" className="btn-secondary shrink-0 !border-amber-300 !bg-white !text-amber-900">
                {t("dashboard.completeProfile")}
              </Link>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="section-eyebrow">{t("dashboard.weather")}</p>
                    <h2 className="mt-1 text-lg font-bold text-leaf-950">
                      {profileFarmer?.district ? `${profileFarmer.district}, ${profileFarmer.state}` : t("dashboard.location")}
                    </h2>
                  </div>
                  <Link to="/weather" className="text-sm font-semibold text-leaf-700 hover:text-leaf-900">
                    {t("common.viewAll")} →
                  </Link>
                </div>
                {weatherLoading ? (
                  <LoadingSpinner label={t("weather.loading")} />
                ) : weather ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <WeatherCard weather={weather} compact />
                    <div className="space-y-2">
                      {(advisory?.advisories || []).slice(0, 3).map((item) => (
                        <div key={item.code} className={`rounded-xl border p-3 ${severityClass(item.severity)}`}>
                          <p className="text-xs font-bold">{item.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed opacity-90">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : weatherError ? (
                  <div className="mt-4">
                    <ErrorMessage
                      message={weatherError}
                      code={weatherError.includes("OPENWEATHER") ? "WEATHER_NOT_CONFIGURED" : undefined}
                      onRetry={loadWeather}
                      compact
                    />
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-leaf-50 p-4 text-sm text-leaf-700">
                    <MapPin size={16} className="mb-2" /> Add your state and district in {t("nav.profile")}.
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {tools.map(({ to, key, icon: Icon, className }) => (
                  <Link key={to} to={to} className="card-hover flex items-start gap-3 p-4">
                    <span className={`rounded-xl p-2.5 ${className}`}><Icon size={19} /></span>
                    <div>
                      <p className="text-sm font-bold text-leaf-950">{t(key)}</p>
                      <p className="mt-0.5 text-xs text-leaf-600">{t("dashboard.allTools")}</p>
                    </div>
                    <ArrowRight size={16} className="ml-auto mt-2 text-leaf-400" />
                  </Link>
                ))}
              </div>

              <div className="card mt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="section-eyebrow">{t("dashboard.marketSummary")}</p>
                    <h2 className="mt-1 text-lg font-bold text-leaf-950">
                      {marketCrop ? `${marketCrop} · ${profileFarmer?.district}, ${profileFarmer?.state}` : t("dashboard.marketSummary")}
                    </h2>
                  </div>
                  <Link to="/market" className="text-sm font-semibold text-leaf-700 hover:text-leaf-900">
                    {t("common.viewAll")} →
                  </Link>
                </div>

                {marketLoading ? (
                  <LoadingSpinner label={t("market.loading")} />
                ) : marketError ? (
                  <div className="mt-4">
                    <ErrorMessage message={marketError} onRetry={loadMarket} compact />
                  </div>
                ) : market?.records?.length ? (
                  <>
                    {(market.is_demo || market.notification) && (
                      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
                        {t("market.demoNotice")}
                      </p>
                    )}
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {market.records.slice(0, 4).map((record, index) => (
                        <div key={`${record.market}-${index}`} className="rounded-xl border border-leaf-100 bg-leaf-50/60 p-3">
                          <p className="truncate text-xs font-bold text-leaf-950" title={record.market}>{record.market}</p>
                          <p className="mt-0.5 text-[11px] text-leaf-500">{record.district} · {record.price_date || "—"}</p>
                          <p className="mt-2 text-xl font-bold text-leaf-950">₹{formatMoney(record.modal_price, language)}</p>
                          <p className="text-[10px] uppercase tracking-wide text-leaf-500">{t("market.modalPrice")} · ₹/quintal</p>
                          {record.distance_km != null && (
                            <p className="mt-1 text-[11px] text-leaf-600">{record.distance_km} km · {t("market.netReturn")}: {record.estimated_net_return != null ? `₹${formatMoney(record.estimated_net_return, language)}` : "—"}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {market.recommendation_reason && (
                      <p className="mt-3 text-xs leading-relaxed text-leaf-600">{market.recommendation_reason}</p>
                    )}
                  </>
                ) : (
                  <p className="mt-3 rounded-xl bg-leaf-50 p-3 text-sm text-leaf-600">
                    {marketCrop && profileFarmer?.district ? t("market.noData") : t("dashboard.marketPrompt")}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="card">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-leaf-950">{t("dashboard.recentDiagnosis")}</h2>
                  <Bug size={18} className="text-leaf-500" />
                </div>
                <div className="mt-3 space-y-2">
                  {(data?.recent_diagnoses || []).length === 0 ? (
                    <p className="rounded-xl bg-leaf-50 p-3 text-sm text-leaf-600">{t("dashboard.noDiagnosis")}</p>
                  ) : (
                    data.recent_diagnoses.map((item) => (
                      <Link key={item.id} to="/disease" className="block rounded-xl border border-leaf-100 p-3 hover:bg-leaf-50">
                        <p className="text-sm font-semibold text-leaf-950">{item.crop_name} · {item.possible_disease}</p>
                        <p className="mt-0.5 text-xs text-leaf-500">{item.certainty_level} · {formatDate(item.created_at, language)}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-leaf-950">{t("dashboard.recommendedSchemes")}</h2>
                  <Landmark size={18} className="text-leaf-500" />
                </div>
                <div className="mt-3 space-y-2">
                  {(data?.recommended_schemes || []).length === 0 ? (
                    <p className="rounded-xl bg-leaf-50 p-3 text-sm text-leaf-600">{t("dashboard.noSchemes")}</p>
                  ) : (
                    data.recommended_schemes.map((scheme) => (
                      <Link key={scheme.id} to={`/schemes/${scheme.id}`} className="block rounded-xl border border-leaf-100 p-3 hover:bg-leaf-50">
                        <p className="text-sm font-semibold leading-snug text-leaf-950">{scheme.name_display || scheme.name}</p>
                        <p className="mt-0.5 text-xs text-leaf-500">{scheme.department}</p>
                      </Link>
                    ))
                  )}
                </div>
                <Link to="/schemes" className="mt-3 inline-flex text-sm font-semibold text-leaf-700 hover:text-leaf-900">
                  {t("common.viewAll")} →
                </Link>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-leaf-950">{t("dashboard.recentActivity")}</h2>
                  <Activity size={18} className="text-leaf-500" />
                </div>
                <ul className="mt-3 space-y-3 text-sm">
                  {(data?.recent_advisories || []).length === 0 && (data?.recent_market_searches || []).length === 0 ? (
                    <li className="rounded-xl bg-leaf-50 p-3 text-leaf-600">{t("dashboard.noActivity")}</li>
                  ) : (
                    <>
                      {(data?.recent_advisories || []).map((item) => (
                        <li key={`a-${item.id}`} className="flex gap-2.5">
                          <CloudSun size={15} className="mt-0.5 text-sky-600" />
                          <div>
                            <p className="font-medium text-leaf-800">{t("nav.weather")} · {item.location}</p>
                            <p className="text-xs text-leaf-500">{formatDate(item.created_at, language)}</p>
                          </div>
                        </li>
                      ))}
                      {(data?.recent_market_searches || []).map((item) => (
                        <li key={`m-${item.id}`} className="flex gap-2.5">
                          <Store size={15} className="mt-0.5 text-amber-600" />
                          <div>
                            <p className="font-medium text-leaf-800">{item.crop_name} · {item.selected_market || item.location}</p>
                            <p className="text-xs text-leaf-500">{formatDate(item.created_at, language)}</p>
                          </div>
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              </div>

              <div className="card bg-leaf-900 text-white">
                <div className="flex items-center gap-2 text-leaf-200">
                  <CheckCircle2 size={17} />
                  <p className="text-xs font-bold uppercase tracking-wide">{t("dashboard.status")}</p>
                </div>
                <p className="mt-2 text-sm font-semibold">{t("dashboard.backendOnline")}</p>
                <p className="mt-1 text-xs leading-relaxed text-leaf-300">
                  Health checks and source configuration are visible in the API health endpoint.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  );
}
