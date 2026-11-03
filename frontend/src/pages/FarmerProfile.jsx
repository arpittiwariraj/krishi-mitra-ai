import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bug,
  CheckCircle2,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  Save,
  Sprout,
  UserRound,
} from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { farmerService } from "../services/farmerService";
import { diseaseService } from "../services/diseaseService";
import { CROP_OPTIONS, STATES, getDistricts } from "../utils/locations";
import { formatDate } from "../utils/format";

const emptyPersonal = {
  full_name: "",
  phone: "",
  state: "",
  district: "",
  preferred_language: "en",
};

const emptyFarm = {
  primary_crop: "",
  land_size: "",
  land_unit: "hectare",
  irrigation_type: "",
};

const irrigationOptions = ["Rainfed", "Canal", "Borewell", "Drip", "Sprinkler", "Open well", "Other"];

export default function FarmerProfile() {
  const { t, language, setLanguage } = useLanguage();
  const { updateFarmer } = useAuth();
  const [farmer, setFarmer] = useState(null);
  const [personal, setPersonal] = useState(emptyPersonal);
  const [farm, setFarm] = useState(emptyFarm);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingFarm, setSavingFarm] = useState(false);
  const [personalNotice, setPersonalNotice] = useState("");
  const [farmNotice, setFarmNotice] = useState("");

  const applyFarmer = useCallback((data) => {
    setFarmer(data);
    updateFarmer(data);
    setPersonal({
      full_name: data.full_name || "",
      phone: data.phone || "",
      state: data.state || "",
      district: data.district || "",
      preferred_language: data.preferred_language || "en",
    });
    setFarm({
      primary_crop: data.profile?.primary_crop || "",
      land_size: data.profile?.land_size ?? "",
      land_unit: data.profile?.land_unit || "hectare",
      irrigation_type: data.profile?.irrigation_type || "",
    });
  }, [updateFarmer]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [profileData, historyData] = await Promise.all([
        farmerService.profile(),
        diseaseService.history(5).catch(() => []),
      ]);
      applyFarmer(profileData);
      setHistory(historyData || []);
    } catch (err) {
      setError(err.message || t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }, [applyFarmer, t]);

  useEffect(() => {
    load();
  }, [load]);

  const savePersonal = async (event) => {
    event.preventDefault();
    setSavingPersonal(true);
    setPersonalNotice("");
    setError("");
    try {
      const data = await farmerService.update({
        full_name: personal.full_name.trim(),
        phone: personal.phone.trim() || null,
        state: personal.state || null,
        district: personal.district || null,
        preferred_language: personal.preferred_language,
      });
      applyFarmer(data);
      if (data.preferred_language && data.preferred_language !== language) {
        setLanguage(data.preferred_language);
      }
      setPersonalNotice(t("profile.saved"));
    } catch (err) {
      setError(err.message || t("errors.generic"));
    } finally {
      setSavingPersonal(false);
    }
  };

  const saveFarm = async (event) => {
    event.preventDefault();
    setSavingFarm(true);
    setFarmNotice("");
    setError("");
    try {
      const data = await farmerService.updateFarm({
        primary_crop: farm.primary_crop || null,
        land_size: farm.land_size === "" ? null : Number(farm.land_size),
        land_unit: farm.land_unit,
        irrigation_type: farm.irrigation_type || null,
      });
      applyFarmer(data);
      setFarmNotice(t("profile.saved"));
    } catch (err) {
      setError(err.message || t("errors.generic"));
    } finally {
      setSavingFarm(false);
    }
  };

  const districts = getDistricts(personal.state);

  return (
    <ModuleLayout>
      <PageHeader
        eyebrow={t("nav.profile")}
        title={t("profile.title")}
        subtitle={t("profile.subtitle")}
        icon={UserRound}
        actions={
          <Link to="/dashboard" className="btn-secondary">
            <LayoutDashboard size={15} /> {t("nav.dashboard")}
          </Link>
        }
      />

      {loading ? (
        <LoadingSpinner label={t("common.loading")} fullScreen />
      ) : error && !farmer ? (
        <ErrorMessage message={error} onRetry={load} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {error && <ErrorMessage message={error} compact />}

            <form onSubmit={savePersonal} className="card">
              <h2 className="flex items-center gap-2 font-bold text-leaf-950"><UserRound size={18} /> {t("profile.personalTitle")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-name" className="label">{t("profile.name")}</label>
                  <input
                    id="profile-name"
                    className="input"
                    required
                    minLength={2}
                    maxLength={120}
                    value={personal.full_name}
                    onChange={(event) => setPersonal({ ...personal, full_name: event.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="profile-email" className="label">{t("profile.email")}</label>
                  <input id="profile-email" className="input bg-leaf-50" value={farmer?.email || ""} readOnly />
                </div>
                <div>
                  <label htmlFor="profile-phone" className="label">{t("profile.phone")}</label>
                  <input
                    id="profile-phone"
                    type="tel"
                    className="input"
                    value={personal.phone}
                    onChange={(event) => setPersonal({ ...personal, phone: event.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label htmlFor="profile-language" className="label">{t("profile.preferredLanguage")}</label>
                  <select
                    id="profile-language"
                    className="select"
                    value={personal.preferred_language}
                    onChange={(event) => setPersonal({ ...personal, preferred_language: event.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="profile-state" className="label">{t("common.state")}</label>
                  <select
                    id="profile-state"
                    className="select"
                    value={personal.state}
                    onChange={(event) => setPersonal({ ...personal, state: event.target.value, district: "" })}
                  >
                    <option value="">{t("common.selectState")}</option>
                    {STATES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="profile-district" className="label">{t("common.district")}</label>
                  <input
                    id="profile-district"
                    className="input"
                    list="profile-districts"
                    value={personal.district}
                    onChange={(event) => setPersonal({ ...personal, district: event.target.value })}
                    placeholder={t("common.selectDistrict")}
                  />
                  <datalist id="profile-districts">
                    {districts.map((item) => <option key={item} value={item} />)}
                  </datalist>
                </div>
              </div>
              {personalNotice && (
                <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-leaf-50 p-2.5 text-xs font-semibold text-leaf-800">
                  <CheckCircle2 size={14} /> {personalNotice}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <button type="submit" className="btn-primary" disabled={savingPersonal}>
                  {savingPersonal ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  {t("profile.savePersonal")}
                </button>
              </div>
            </form>

            <form onSubmit={saveFarm} className="card">
              <h2 className="flex items-center gap-2 font-bold text-leaf-950"><Sprout size={18} /> {t("profile.farmTitle")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-crop" className="label">{t("profile.primaryCrop")}</label>
                  <input
                    id="profile-crop"
                    className="input"
                    list="profile-crops"
                    value={farm.primary_crop}
                    onChange={(event) => setFarm({ ...farm, primary_crop: event.target.value })}
                    placeholder="e.g. Tomato"
                  />
                  <datalist id="profile-crops">
                    {CROP_OPTIONS.map((item) => <option key={item.value} value={item.value}>{language === "hi" ? item.hi : item.en}</option>)}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="profile-irrigation" className="label">{t("profile.irrigation")}</label>
                  <select
                    id="profile-irrigation"
                    className="select"
                    value={farm.irrigation_type}
                    onChange={(event) => setFarm({ ...farm, irrigation_type: event.target.value })}
                  >
                    <option value="">{t("profile.selectIrrigation")}</option>
                    {irrigationOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="profile-land" className="label">{t("profile.landSize")}</label>
                  <input
                    id="profile-land"
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={farm.land_size}
                    onChange={(event) => setFarm({ ...farm, land_size: event.target.value })}
                    placeholder="e.g. 1.5"
                  />
                </div>
                <div>
                  <label htmlFor="profile-unit" className="label">{t("profile.landUnit")}</label>
                  <select
                    id="profile-unit"
                    className="select"
                    value={farm.land_unit}
                    onChange={(event) => setFarm({ ...farm, land_unit: event.target.value })}
                  >
                    <option value="hectare">Hectare</option>
                    <option value="acre">Acre</option>
                    <option value="bigha">Bigha</option>
                  </select>
                </div>
              </div>
              <p className="mt-3 rounded-xl bg-soil-50 p-2.5 text-xs leading-relaxed text-soil-700">
                {t("profile.landNote")}
              </p>
              {farmNotice && (
                <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-leaf-50 p-2.5 text-xs font-semibold text-leaf-800">
                  <CheckCircle2 size={14} /> {farmNotice}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <button type="submit" className="btn-primary" disabled={savingFarm}>
                  {savingFarm ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  {t("profile.saveFarm")}
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-5">
            <div className="card">
              <h2 className="font-bold text-leaf-950">{t("profile.snapshot")}</h2>
              <div className="mt-3 space-y-2 text-sm text-leaf-700">
                <p className="flex items-center gap-2"><UserRound size={15} className="text-leaf-500" /> {farmer?.full_name}</p>
                <p className="flex items-center gap-2"><MapPin size={15} className="text-leaf-500" /> {[farmer?.district, farmer?.state].filter(Boolean).join(", ") || t("profile.locationMissing")}</p>
                <p className="flex items-center gap-2"><Sprout size={15} className="text-leaf-500" /> {farmer?.profile?.primary_crop || t("profile.cropMissing")}</p>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold text-leaf-950"><Bug size={17} /> {t("profile.diagnoses")}</h2>
                <Link to="/disease" className="text-xs font-semibold text-leaf-700 hover:text-leaf-900">{t("common.viewAll")}</Link>
              </div>
              <div className="mt-3 space-y-2">
                {history.length === 0 ? (
                  <p className="rounded-xl bg-leaf-50 p-3 text-sm text-leaf-600">{t("profile.noDiagnoses")}</p>
                ) : (
                  history.map((item) => (
                    <Link key={item.id} to="/disease" className="block rounded-xl border border-leaf-100 p-3 hover:bg-leaf-50">
                      <p className="text-sm font-semibold text-leaf-950">{item.crop_name}</p>
                      <p className="text-xs text-leaf-600">{item.possible_disease}</p>
                      <p className="mt-0.5 text-[11px] text-leaf-500">{formatDate(item.created_at, language)}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-leaf-200 bg-leaf-50 p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-leaf-950"><LockKeyhole size={16} /> {t("profile.healthTitle")}</h2>
              <p className="mt-2 text-xs leading-relaxed text-leaf-700">{t("profile.privacyNote")}</p>
            </div>
          </aside>
        </div>
      )}
    </ModuleLayout>
  );
}
