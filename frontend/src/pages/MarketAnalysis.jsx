import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeIndianRupee,
  CalendarDays,
  Info,
  LocateFixed,
  MapPin,
  RefreshCcw,
  Store,
  Truck,
  Trophy,
} from "lucide-react";
import L from "leaflet";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ModuleLayout from "../components/ModuleLayout";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { marketService } from "../services/marketService";
import { CROP_OPTIONS, STATES, getDistricts } from "../utils/locations";
import { formatMoney, formatNumber } from "../utils/format";

const priceLabel = (value) => (value === null || value === undefined ? "—" : `₹${formatMoney(value)}`);

export default function MarketAnalysis() {
  const { t, language } = useLanguage();
  const { farmer } = useAuth();
  const [crop, setCrop] = useState(farmer?.profile?.primary_crop || "Tomato");
  const [state, setState] = useState(farmer?.state || "Maharashtra");
  const [district, setDistrict] = useState(farmer?.district || "Pune");
  const [transportCost, setTransportCost] = useState("");
  const [coords, setCoords] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const mapElementRef = useRef(null);
  const districts = getDistricts(state);

  const chartData = useMemo(
    () =>
      (result?.records || []).map((record) => ({
        market: record.market?.length > 14 ? `${record.market.slice(0, 13)}…` : record.market,
        modal: record.modal_price,
        net: record.estimated_net_return,
      })),
    [result]
  );

  const mappableRecords = useMemo(
    () =>
      (result?.records || []).filter(
        (record) => record.latitude != null && record.longitude != null
      ),
    [result]
  );

  useEffect(() => {
    const element = mapElementRef.current;
    if (!element || mappableRecords.length === 0) return undefined;

    const map = L.map(element, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const coordinates = [];
    mappableRecords.forEach((record, index) => {
      const point = [record.latitude, record.longitude];
      coordinates.push(point);
      const icon = L.divIcon({
        className: "",
        html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:${record.market === result?.recommended_market ? "#14532d" : "#16a34a"};color:white;font-weight:700;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)">${index + 1}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
      });
      const marker = L.marker(point, { icon }).addTo(map);
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = record.market || "Market";
      const price = document.createElement("div");
      price.textContent = `${priceLabel(record.modal_price)} / quintal`;
      popup.append(title, price);
      if (record.distance_km != null) {
        const distance = document.createElement("div");
        distance.textContent = `${formatNumber(record.distance_km)} km`;
        popup.appendChild(distance);
      }
      marker.bindPopup(popup);
    });

    if (coordinates.length === 1) {
      map.setView(coordinates[0], 11);
    } else {
      map.fitBounds(L.latLngBounds(coordinates), { padding: [28, 28], maxZoom: 11 });
    }
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 120);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
    };
  }, [mappableRecords, result?.recommended_market]);

  const compare = async (override = {}) => {
    const payload = {
      crop: override.crop ?? crop,
      state: override.state ?? state,
      district: override.district ?? district,
      transport_cost_per_km_quintal: Number(override.transportCost ?? transportCost) || 0,
      language,
      ...(override.coords ?? coords ? { ...(override.coords ?? coords) } : {}),
    };
    if (!payload.crop || !payload.state || !payload.district) {
      setError("Select a crop, state and district.");
      return;
    }
    setLoading(true);
    setError("");
    setErrorCode("");
    try {
      const data = await marketService.compare(payload);
      setResult(data);
    } catch (err) {
      setError(err.message || t("errors.generic"));
      setErrorCode(err.code || "REQUEST_FAILED");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoords(next);
        setGeoLoading(false);
        compare({ coords: next });
      },
      () => {
        setGeoLoading(false);
        setError(t("market.locationPermissionDenied"));
      },
      { enableHighAccuracy: false, timeout: 12000 }
    );
  };

  const recommended = result?.records?.find((item) => item.market === result.recommended_market);

  return (
    <ModuleLayout>
      <PageHeader
        eyebrow={t("nav.market")}
        title={t("market.title")}
        subtitle={t("market.subtitle")}
        icon={Store}
        actions={
          result && (
            <button type="button" onClick={() => compare()} className="btn-secondary" disabled={loading}>
              <RefreshCcw size={15} /> {t("common.retry")}
            </button>
          )
        }
      />

      <div className="card mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="market-crop" className="label">{t("market.cropLabel")}</label>
            <input
              id="market-crop"
              className="input"
              list="market-crops"
              value={crop}
              onChange={(event) => setCrop(event.target.value)}
            />
            <datalist id="market-crops">
              {CROP_OPTIONS.map((item) => <option key={item.value} value={item.value}>{language === "hi" ? item.hi : item.en}</option>)}
            </datalist>
          </div>
          <div>
            <label htmlFor="market-state" className="label">{t("common.state")}</label>
            <select id="market-state" className="select" value={state} onChange={(event) => {
              const value = event.target.value;
              setState(value);
              setDistrict(getDistricts(value)[0] || "");
              setCoords(null);
            }}>
              {STATES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="market-district" className="label">{t("common.district")}</label>
            <input
              id="market-district"
              className="input"
              list="market-districts"
              value={district}
              onChange={(event) => { setDistrict(event.target.value); setCoords(null); }}
            />
            <datalist id="market-districts">
              {districts.map((item) => <option key={item} value={item} />)}
            </datalist>
          </div>
          <div>
            <label htmlFor="transport-cost" className="label">{t("market.transportCost")}</label>
            <input
              id="transport-cost"
              type="number"
              min="0"
              max="10000"
              step="0.5"
              className="input"
              value={transportCost}
              onChange={(event) => setTransportCost(event.target.value)}
              placeholder={t("market.transportPlaceholder")}
            />
          </div>
          <div className="flex items-end gap-2">
            <button type="button" onClick={() => compare()} className="btn-primary flex-1" disabled={loading}>
              <Store size={16} /> {t("market.compare")}
            </button>
            <button type="button" onClick={useMyLocation} className="btn-secondary" disabled={geoLoading} title={t("market.useMyLocation")}>
              <LocateFixed size={16} />
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-leaf-500">
          <span className="flex items-center gap-1"><Truck size={13} /> {t("market.transportHelp")}</span>
          {coords && <span className="flex items-center gap-1 text-leaf-700"><MapPin size={13} /> Device location will be used for distance.</span>}
        </div>
      </div>

      {error && <div className="mb-6"><ErrorMessage message={error} code={errorCode} onRetry={() => compare()} /></div>}

      {loading ? (
        <LoadingSpinner label={t("market.loading")} fullScreen />
      ) : result ? (
        <div className="space-y-6">
          {result.is_demo && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} />
              <div>
                <p className="text-sm font-bold text-amber-950">{t("market.demoTitle")}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-800">{t("market.demoText")}</p>
              </div>
            </div>
          )}

          {result.records?.length === 0 ? (
            <EmptyState icon={Store} title={t("market.noRecords")} description={result.notification || result.recommendation_reason} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card border-leaf-200 bg-gradient-to-br from-leaf-900 to-leaf-800 text-white">
                  <div className="flex items-center justify-between text-leaf-200">
                    <p className="text-xs font-bold uppercase tracking-wide">{t("market.recommended")}</p>
                    <Trophy size={18} />
                  </div>
                  <p className="mt-2 font-display text-2xl font-semibold">{result.recommended_market || "—"}</p>
                  <p className="mt-1 text-xs text-leaf-200">
                    {recommended ? `${priceLabel(recommended.modal_price)} / quintal` : t("market.noRecommendation")}
                  </p>
                </div>
                <div className="card">
                  <div className="flex items-center justify-between text-leaf-500">
                    <p className="text-xs font-bold uppercase tracking-wide">{t("market.highestPrice")}</p>
                    <ArrowUpRight size={18} />
                  </div>
                  <p className="mt-2 text-xl font-bold text-leaf-950">{result.highest_modal_market || "—"}</p>
                  <p className="mt-1 text-xs text-leaf-500">{t("market.reportedModal")}</p>
                </div>
                <div className="card">
                  <div className="flex items-center justify-between text-leaf-500">
                    <p className="text-xs font-bold uppercase tracking-wide">{t("market.netReturn")}</p>
                    <BadgeIndianRupee size={18} />
                  </div>
                  <p className="mt-2 text-xl font-bold text-leaf-950">
                    {recommended?.estimated_net_return != null ? priceLabel(recommended.estimated_net_return) : "—"}
                  </p>
                  <p className="mt-1 text-xs text-leaf-500">{t("market.netReturnHelp")}</p>
                </div>
                <div className="card">
                  <div className="flex items-center justify-between text-leaf-500">
                    <p className="text-xs font-bold uppercase tracking-wide">{t("market.transportUsed")}</p>
                    <Truck size={18} />
                  </div>
                  <p className="mt-2 text-xl font-bold text-leaf-950">
                    {result.transport_cost_used > 0 ? `${priceLabel(result.transport_cost_used)}/km` : t("market.notSet")}
                  </p>
                  <p className="mt-1 text-xs text-leaf-500">{t("market.transportUsedHelp")}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-leaf-200 bg-leaf-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-leaf-950">
                  <Info size={16} /> {t("market.recommendation")}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-leaf-700">{result.recommendation_reason}</p>
                {result.transport_cost_used === 0 && (
                  <p className="mt-2 text-xs font-medium text-amber-800">{t("market.transportHint")}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {result.records.map((record, index) => {
                  const isBest = record.market === result.recommended_market;
                  return (
                    <article key={`${record.market}-${record.variety}-${index}`} className={`card relative ${isBest ? "border-leaf-300 ring-1 ring-leaf-200" : ""}`}>
                      {isBest && (
                        <span className="absolute -top-2.5 left-4 badge-green shadow-sm">{t("market.best")}</span>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <span className="rounded-xl bg-leaf-100 p-2 text-leaf-700"><Store size={16} /></span>
                        <span className="text-[11px] text-leaf-500">{record.price_date || result.last_updated || "—"}</span>
                      </div>
                      <h3 className="mt-3 text-base font-bold leading-snug text-leaf-950">{record.market}</h3>
                      <p className="mt-0.5 text-xs text-leaf-500">{record.district}, {record.state}</p>
                      <div className="mt-3 rounded-xl bg-leaf-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-leaf-500">{t("market.modalPrice")}</p>
                        <p className="mt-0.5 text-2xl font-bold text-leaf-950">{priceLabel(record.modal_price)}</p>
                        <p className="text-[11px] text-leaf-500">₹/quintal · {record.variety || "—"}</p>
                      </div>
                      <div className="mt-3 space-y-1.5 text-xs text-leaf-600">
                        <p className="flex items-center justify-between gap-2">
                          <span>{t("market.priceRange")}</span>
                          <span className="font-semibold text-leaf-800">{priceLabel(record.min_price)} – {priceLabel(record.max_price)}</span>
                        </p>
                        <p className="flex items-center justify-between gap-2">
                          <span>{t("market.distance")}</span>
                          <span className="font-semibold text-leaf-800">{record.distance_km != null ? `${formatNumber(record.distance_km)} km` : "—"}</span>
                        </p>
                        <p className="flex items-center justify-between gap-2">
                          <span>{t("market.netReturn")}</span>
                          <span className="font-semibold text-leaf-800">{record.estimated_net_return != null ? priceLabel(record.estimated_net_return) : "—"}</span>
                        </p>
                      </div>
                      <p className="mt-3 flex items-center gap-1 text-[11px] text-leaf-400">
                        <CalendarDays size={12} /> {t("market.sourceNote")}
                      </p>
                    </article>
                  );
                })}
              </div>

              <div className="card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 font-bold text-leaf-950"><MapPin size={18} /> {t("market.mapTitle")}</h2>
                  <span className="text-[11px] text-leaf-500">OpenStreetMap · Leaflet</span>
                </div>
                {mappableRecords.length > 0 ? (
                  <div ref={mapElementRef} className="relative z-0 mt-4 h-80 w-full overflow-hidden rounded-2xl border border-leaf-100" aria-label={t("market.mapTitle")} />
                ) : (
                  <p className="mt-4 rounded-xl bg-soil-50 p-3 text-sm text-leaf-600">{t("market.mapUnavailable")}</p>
                )}
              </div>

              {chartData.length > 0 && (
                <div className="card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-bold text-leaf-950">{t("market.chartTitle")}</h2>
                    <span className="text-xs text-leaf-500">{t("market.chartNote")}</span>
                  </div>
                  <div className="mt-4 h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ecfccb" vertical={false} />
                        <XAxis dataKey="market" tick={{ fontSize: 10, fill: "#365314" }} interval={0} angle={-12} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 10, fill: "#365314" }} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                        <Tooltip formatter={(value) => (value == null ? "Not calculated" : `₹${formatMoney(value)}`)} contentStyle={{ borderRadius: 12, borderColor: "#bbf7d0", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="modal" name={t("market.modalPrice")} radius={[5, 5, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={entry.market} fill={index === 0 ? "#166534" : "#86efac"} />
                          ))}
                        </Bar>
                        <Bar dataKey="net" name={t("market.estimatedNet")} fill="#fbbf24" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="card overflow-hidden !p-0">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-leaf-100 p-4">
                  <h2 className="font-bold text-leaf-950">{t("market.comparisonTitle")}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={result.is_demo ? "badge-amber" : "badge-green"}>{result.data_source}</span>
                    {result.last_updated && <span className="text-leaf-500">{t("market.priceDate")}: {result.last_updated}</span>}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-leaf-50 text-xs uppercase tracking-wide text-leaf-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">{t("market.market")}</th>
                        <th className="px-4 py-3 font-semibold">{t("market.variety")}</th>
                        <th className="px-4 py-3 text-right font-semibold">{t("market.modalPrice")}</th>
                        <th className="px-4 py-3 text-right font-semibold">{t("market.priceRange")}</th>
                        <th className="px-4 py-3 text-right font-semibold">{t("market.distance")}</th>
                        <th className="px-4 py-3 text-right font-semibold">{t("market.netReturn")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-leaf-50">
                      {result.records.map((record) => {
                        const isBest = record.market === result.recommended_market;
                        return (
                          <tr key={`${record.market}-${record.variety}`} className={isBest ? "bg-leaf-50/70" : "hover:bg-soil-50"}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-semibold text-leaf-950">{record.market}</p>
                                  <p className="text-xs text-leaf-500">{record.district}, {record.state}</p>
                                </div>
                                {isBest && <span className="badge-green">{t("market.best")}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-leaf-600">{record.variety || "—"}</td>
                            <td className="px-4 py-3 text-right font-bold text-leaf-950">{priceLabel(record.modal_price)}</td>
                            <td className="px-4 py-3 text-right text-xs text-leaf-600">
                              {priceLabel(record.min_price)} – {priceLabel(record.max_price)}
                            </td>
                            <td className="px-4 py-3 text-right text-leaf-600">
                              {record.distance_km != null ? `${formatNumber(record.distance_km)} km` : "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-leaf-800">
                              {record.estimated_net_return != null ? priceLabel(record.estimated_net_return) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="border-t border-leaf-100 px-4 py-3 text-[11px] leading-relaxed text-leaf-500">
                  {t("market.sourceNote")}
                  {result.notification ? ` ${result.notification}` : ""}
                </p>
              </div>
            </>
          )}

          <div className="rounded-2xl border border-soil-200 bg-soil-50 p-4 text-xs leading-relaxed text-soil-800">
            <p className="font-semibold">{t("market.disclaimerTitle")}</p>
            <p className="mt-1">{t("market.disclaimer")}</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <EmptyState icon={Store} title={t("market.emptyTitle")} description={t("market.emptyText")} />
        </div>
      )}
    </ModuleLayout>
  );
}
