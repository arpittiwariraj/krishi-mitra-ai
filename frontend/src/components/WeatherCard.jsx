import { CloudRain, Droplets, MapPin, Thermometer, Wind } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function WeatherCard({ weather, compact = false }) {
  const { t } = useLanguage();
  if (!weather) return null;
  const condition = weather.condition || {};
  const iconCode = condition.icon;
  const iconUrl = iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : null;

  return (
    <div className={`rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700">
            <MapPin size={13} />
            <span className="line-clamp-1">
              {weather.location?.name || weather.location?.district || "—"}
              {weather.location?.state ? `, ${weather.location.state}` : ""}
            </span>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-4xl font-semibold text-leaf-950">
              {weather.temperature_c != null ? Math.round(weather.temperature_c) : "—"}°
            </span>
            <span className="pb-1 text-sm capitalize text-leaf-700">{condition.description || condition.main}</span>
          </div>
        </div>
        {iconUrl ? (
          <img src={iconUrl} alt={condition.description || "weather"} className="h-16 w-16" />
        ) : (
          <div className="rounded-full bg-sky-100 p-3 text-sky-600">
            <CloudRain size={24} />
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl bg-white/80 p-2.5">
          <Droplets size={15} className="mb-1 text-sky-600" />
          <div className="font-semibold text-leaf-950">{weather.humidity_percent ?? "—"}%</div>
          <div className="text-leaf-600">{t("weather.humidity")}</div>
        </div>
        <div className="rounded-xl bg-white/80 p-2.5">
          <Wind size={15} className="mb-1 text-sky-600" />
          <div className="font-semibold text-leaf-950">{weather.wind_speed_kmh ?? "—"} km/h</div>
          <div className="text-leaf-600">{t("weather.wind")}</div>
        </div>
        <div className="rounded-xl bg-white/80 p-2.5">
          <Thermometer size={15} className="mb-1 text-sky-600" />
          <div className="font-semibold text-leaf-950">{weather.feels_like_c != null ? Math.round(weather.feels_like_c) : "—"}°</div>
          <div className="text-leaf-600">{t("weather.feelsLike")}</div>
        </div>
      </div>
      {weather.observed_at && (
        <p className="mt-3 text-[11px] text-leaf-500">
          {t("common.updated")}: {new Date(weather.observed_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
