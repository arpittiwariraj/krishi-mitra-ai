import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CloudRain,
  CloudSun,
  Droplets,
  LocateFixed,
  MapPin,
  RefreshCcw,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ModuleLayout from "../components/ModuleLayout";
import PageHeader from "../components/PageHeader";
import WeatherCard from "../components/WeatherCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { weatherService } from "../services/weatherService";
import { STATES, getDistricts, CROP_OPTIONS } from "../utils/locations";
import { formatDateTime, formatNumber, severityClass } from "../utils/format";

const emojiForCondition = (condition = "") => {
  const value = condition.toLowerCase();
  if (value.includes("rain") || value.includes("drizzle")) return "🌧️";
  if (value.includes("thunder")) return "⛈️";
  if (value.includes("cloud")) return "⛅";
  if (value.includes("clear")) return "☀️";
  if (value.includes("snow")) return "❄️";
  return "🌤️";
};

export default function WeatherAdvisory() {
  const { t, language } = useLanguage();
  const { farmer } = useAuth();
  const [state, setState] = useState(farmer?.state || "Maharashtra");
  const [district, setDistrict] = useState(farmer?.district || "Pune");
  const [crop, setCrop] = useState(farmer?.profile?.primary_crop || "");
  const [growthStage, setGrowthStage] = useState("");
  const [coords, setCoords] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const districts = getDistricts(state);

  const chartData = useMemo(
    () =>
      (forecast?.daily || []).map((day) => ({
        day: new Date(day.date).toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", {
          weekday: "short",
          day: "numeric",
        }),
        max: day.max_temp_c,
        min: day.min_temp_c,
        rain: Math.round((day.max_rain_probability || 0) * 100),
        rainfall: day.total_rain_mm,
      })),
    [forecast, language]
  );

  const load = useCallback(
    async (override = {}) => {
      const useCoords = override.coords ?? coords;
      const payload = {
        state: override.state ?? state,
        district: override.district ?? district,
        crop: (override.crop ?? crop) || null,
        growth_stage: (override.growthStage ?? growthStage) || null,
        language,
        ...(useCoords ? { latitude: useCoords.latitude, longitude: useCoords.longitude } : {}),
      };
      if (!useCoords && (!payload.state || !payload.district)) {
        setError("Please select a state and district.");
        return;
      }
      setLoading(true);
      setError("");
      setErrorCode("");
      try {
        const [advisoryData, forecastData] = await Promise.all([
          weatherService.advisory(payload),
          weatherService.forecast(payload),
        ]);
        setAdvisory(advisoryData);
        setForecast(forecastData);
      } catch (err) {
        setError(err.message || t("errors.generic"));
        setErrorCode(err.code || "REQUEST_FAILED");
        setAdvisory(null);
        setForecast(null);
      } finally {
        setLoading(false);
      }
    },
    [state, district, crop, growthStage, language, coords, t]
  );

  useEffect(() => {
    if (farmer?.state && farmer?.district) {
      load({ state: farmer.state, district: farmer.district });
    }
    // Run once for the farmer's saved location.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setCoords(next);
        setGeoLoading(false);
        load({ coords: next });
      },
      () => {
        setGeoLoading(false);
        setError(t("market.locationPermissionDenied"));
      },
      { enableHighAccuracy: false, timeout: 12000 }
    );
  };

  const current = advisory?.current;
  const summary = advisory?.summary;

  return (
    <ModuleLayout>
      <PageHeader
        eyebrow={t("nav.weather")}
        title={t("weather.title")}
        subtitle={t("weather.subtitle")}
        icon={CloudSun}
        actions={
          <button type="button" onClick={() => load()} className="btn-secondary" disabled={loading}>
            <RefreshCcw size={15} /> {t("common.retry")}
          </button>
        }
      />

      <div className="card mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="weather-state" className="label">{t("common.state")}</label>
              <select id="weather-state" className="select" value={state} onChange={(event) => {
                const value = event.target.value;
                setState(value);
                setDistrict(getDistricts(value)[0] || "");
                setCoords(null);
              }}>
                {STATES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="weather-district" className="label">{t("common.district")}</label>
              <input
                id="weather-district"
                className="input"
                list="weather-districts"
                value={district}
                onChange={(event) => { setDistrict(event.target.value); setCoords(null); }}
              />
              <datalist id="weather-districts">
                {districts.map((item) => <option key={item} value={item} />)}
              </datalist>
            </div>
            <div>
              <label htmlFor="weather-crop" className="label">{t("weather.cropLabel")}</label>
              <select id="weather-crop" className="select" value={crop} onChange={(event) => setCrop(event.target.value)}>
                <option value="">{t("common.selectCrop")}</option>
                {CROP_OPTIONS.map((item) => <option key={item.value} value={item.value}>{language === "hi" ? item.hi : item.en}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="growth-stage" className="label">{t("weather.growthStage")}</label>
              <input id="growth-stage" className="input" value={growthStage} onChange={(event) => setGrowthStage(event.target.value)} placeholder={t("weather.growthStagePlaceholder")} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => load()} className="btn-primary" disabled={loading}>
              <CloudSun size={16} /> {t("weather.getAdvisory")}
            </button>
            <button type="button" onClick={useMyLocation} className="btn-secondary" disabled={geoLoading} title={t("weather.useMyLocation")}>
              <LocateFixed size={16} />
              <span className="hidden sm:inline">{t("weather.useMyLocation")}</span>
            </button>
          </div>
        </div>
        {coords && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-leaf-600">
            <MapPin size={13} /> Using device location: {coords.latitude.toFixed(3)}, {coords.longitude.toFixed(3)}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage
            message={error}
            code={errorCode}
            onRetry={() => load()}
          />
        </div>
      )}

      {loading ? (
        <LoadingSpinner label={t("weather.loading")} fullScreen />
      ) : advisory ? (
        <div className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="card">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-bold text-leaf-950">{t("weather.currentTitle")}</h2>
                <span className="badge-blue">{advisory.weather_observed_at ? formatDateTime(advisory.weather_observed_at, language) : "—"}</span>
              </div>
              {current && <div className="mt-4"><WeatherCard weather={current} /></div>}
              {summary && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div className="rounded-xl bg-leaf-50 p-3"><Thermometer size={15} className="mb-1 text-leaf-600" /><p className="font-bold text-leaf-950">{formatNumber(summary.max_temp_next_3d_c)}° / {formatNumber(summary.min_temp_next_3d_c)}°</p><p className="text-leaf-500">3-day range</p></div>
                  <div className="rounded-xl bg-sky-50 p-3"><Droplets size={15} className="mb-1 text-sky-600" /><p className="font-bold text-leaf-950">{formatNumber(summary.avg_humidity_next_3d_percent, 0)}%</p><p className="text-leaf-500">{t("weather.humidity3d")}</p></div>
                  <div className="rounded-xl bg-amber-50 p-3"><CloudRain size={15} className="mb-1 text-amber-600" /><p className="font-bold text-leaf-950">{formatNumber(summary.rain_next_3d_mm)} mm</p><p className="text-leaf-500">{t("weather.rainfall3d")}</p></div>
                  <div className="rounded-xl bg-soil-100 p-3"><Wind size={15} className="mb-1 text-leaf-600" /><p className="font-bold text-leaf-950">{formatNumber(summary.max_wind_next_3d_kmh)} km/h</p><p className="text-leaf-500">{t("weather.wind3d")}</p></div>
                </div>
              )}
              <p className="mt-4 text-[11px] leading-relaxed text-leaf-500">{t("weather.sourceNote")}</p>
            </div>

            <div className="card">
              <h2 className="font-bold text-leaf-950">{t("weather.advisoryTitle")}</h2>
              <div className="mt-3 space-y-2">
                {(advisory.advisories || []).map((item) => (
                  <div key={item.code} className={`rounded-xl border p-3 ${severityClass(item.severity)}`}>
                    <div className="flex items-start gap-2">
                      {item.severity === "high" ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <Sun size={16} className="mt-0.5 shrink-0" />}
                      <div>
                        <p className="text-sm font-bold">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed opacity-90">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-xl bg-leaf-50 p-3 text-xs leading-relaxed text-leaf-700">{advisory.disclaimer}</p>
            </div>
          </div>

          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-leaf-950">{t("weather.forecastTitle")}</h2>
              <span className="text-xs text-leaf-500">
                {t("weather.forecastTimestamp")}: {forecast?.source_timestamp ? formatDateTime(forecast.source_timestamp, language) : "—"}
              </span>
            </div>
            {chartData.length > 0 && (
              <div className="mt-5 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dcfce7" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#166534" }} />
                    <YAxis yAxisId="temp" tick={{ fontSize: 11, fill: "#166534" }} />
                    <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 11, fill: "#0369a1" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#bbf7d0", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="rain" dataKey="rain" name={t("weather.chartRain")} fill="#7dd3fc" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="temp" type="monotone" dataKey="max" name={`${t("weather.chartTemperature")} max`} stroke="#15803d" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line yAxisId="temp" type="monotone" dataKey="min" name={`${t("weather.chartTemperature")} min`} stroke="#65a30d" strokeWidth={2} dot={{ r: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {(forecast?.daily || []).map((day) => (
                <div key={day.date} className="rounded-xl border border-leaf-100 bg-soil-50 p-3 text-center">
                  <p className="text-xs font-bold text-leaf-900">
                    {new Date(day.date).toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <p className="my-1 text-2xl">{emojiForCondition(day.dominant_condition)}</p>
                  <p className="text-sm font-semibold text-leaf-950">{formatNumber(day.max_temp_c)}° / {formatNumber(day.min_temp_c)}°</p>
                  <p className="mt-1 text-[11px] text-sky-700">🌧 {Math.round((day.max_rain_probability || 0) * 100)}% · {formatNumber(day.total_rain_mm)} mm</p>
                  <p className="text-[11px] capitalize text-leaf-500">{day.dominant_condition}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-xs leading-relaxed text-sky-900">
            <p className="font-semibold">Source and limitations</p>
            <p className="mt-1">
              Forecast values are provided by OpenWeather and are shown with their source timestamp. Local official warnings always take precedence. Agricultural rules use the measured forecast; they are not a guarantee of field outcomes.
            </p>
          </div>
        </div>
      ) : null}
    </ModuleLayout>
  );
}
