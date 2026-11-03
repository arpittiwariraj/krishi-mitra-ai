import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  Bug,
  Camera,
  CheckCircle2,
  Download,
  History,
  Image as ImageIcon,
  Leaf,
  LoaderCircle,
  ShieldAlert,
  UploadCloud,
  X,
} from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";
import PageHeader from "../components/PageHeader";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { diseaseService } from "../services/diseaseService";
import { CROP_OPTIONS } from "../utils/locations";
import { formatDateTime } from "../utils/format";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const certaintyClass = (level) => {
  if (level === "High") return "badge bg-red-100 text-red-700";
  if (level === "Moderate") return "badge bg-amber-100 text-amber-800";
  return "badge bg-sky-100 text-sky-700";
};

function ResultList({ title, items, icon: Icon }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-bold text-leaf-950">
        {Icon && <Icon size={15} className="text-leaf-500" />}
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {(items || []).map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-relaxed text-leaf-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DiseaseDetection() {
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [crop, setCrop] = useState("");
  const [location, setLocation] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const data = await diseaseService.history(6);
      setHistory(data || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const acceptFile = (selected) => {
    setError("");
    setErrorCode("");
    setResult(null);
    if (!selected) return;
    if (!ALLOWED.includes(selected.type)) {
      setError(t("disease.validationType"));
      setErrorCode("UNSUPPORTED_FORMAT");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError(t("disease.validationSize"));
      setErrorCode("FILE_TOO_LARGE");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const analyze = async () => {
    if (!file) {
      setError(t("disease.uploadTitle"));
      return;
    }
    setLoading(true);
    setError("");
    setErrorCode("");
    setResult(null);
    try {
      const data = await diseaseService.analyze({
        file,
        cropName: crop,
        location,
        language,
      });
      setResult(data);
      loadHistory();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || t("errors.generic"));
      setErrorCode(err.code || "REQUEST_FAILED");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const sections = [
      `${t("disease.resultTitle")} - ${result.crop_name}`,
      `${t("disease.possibleDisease")}: ${result.possible_disease}`,
      `${t("disease.certainty")}: ${result.certainty_level}`,
      `${t("disease.imageQuality")}: ${result.image_quality}`,
      "",
      `${t("disease.observations")}:`,
      ...(result.visual_observations || []).map((item) => `- ${item}`),
      "",
      `${t("disease.symptoms")}:`,
      ...(result.symptoms || []).map((item) => `- ${item}`),
      "",
      `${t("disease.actions")}:`,
      ...(result.recommended_actions || []).map((item) => `- ${item}`),
      "",
      `${t("disease.prevention")}:`,
      ...(result.prevention || []).map((item) => `- ${item}`),
      "",
      `${t("common.disclaimer")}: ${result.disclaimer}`,
      "",
      `${t("disease.expertWarning")}`,
    ];
    const blob = new Blob([sections.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `krishi-mitra-diagnosis-${Date.now()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ModuleLayout>
      <PageHeader
        eyebrow={t("nav.disease")}
        title={t("disease.title")}
        subtitle={t("disease.subtitle")}
        icon={Bug}
      />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div className="card">
            <h2 className="font-bold text-leaf-950">{t("disease.uploadTitle")}</h2>
            <p className="mt-1 text-sm text-leaf-600">{t("disease.uploadText")}</p>

            <div
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`mt-4 rounded-2xl border-2 border-dashed p-4 transition ${
                dragging ? "border-leaf-500 bg-leaf-50" : "border-leaf-200 bg-soil-50"
              }`}
            >
              {preview ? (
                <div>
                  <div className="relative overflow-hidden rounded-xl bg-black/5">
                    <img src={preview} alt={t("disease.preview")} className="mx-auto max-h-72 w-full object-contain" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-red-600 shadow-sm hover:bg-white"
                      aria-label={t("disease.remove")}
                    >
                      <X size={17} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary">
                      <ImageIcon size={16} /> {t("disease.chooseFile")}
                    </button>
                    <button type="button" onClick={() => cameraInputRef.current?.click()} className="btn-secondary">
                      <Camera size={16} /> {t("disease.camera")}
                    </button>
                    <button type="button" onClick={removeImage} className="btn-danger">
                      <X size={16} /> {t("disease.remove")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="rounded-full bg-leaf-100 p-4 text-leaf-700"><UploadCloud size={26} /></span>
                  <p className="mt-3 text-sm font-semibold text-leaf-900">{dragging ? t("disease.dragActive") : t("disease.uploadText")}</p>
                  <p className="mt-1 text-xs text-leaf-500">JPG · JPEG · PNG · WEBP · max 10 MB</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-primary">
                      <ImageIcon size={16} /> {t("disease.chooseFile")}
                    </button>
                    <button type="button" onClick={() => cameraInputRef.current?.click()} className="btn-secondary">
                      <Camera size={16} /> {t("disease.camera")}
                    </button>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => acceptFile(event.target.files?.[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => acceptFile(event.target.files?.[0])}
              />
            </div>

            {error && <div className="mt-4"><ErrorMessage message={error} code={errorCode} compact /></div>}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="disease-crop" className="label">{t("disease.cropLabel")} <span className="font-normal text-leaf-500">({t("common.optional")})</span></label>
                <input
                  id="disease-crop"
                  className="input"
                  list="disease-crops"
                  value={crop}
                  onChange={(event) => setCrop(event.target.value)}
                  placeholder={t("disease.cropPlaceholder")}
                />
                <datalist id="disease-crops">
                  {CROP_OPTIONS.map((item) => <option key={item.value} value={item.value}>{language === "hi" ? item.hi : item.en}</option>)}
                </datalist>
              </div>
              <div>
                <label htmlFor="disease-location" className="label">{t("disease.locationLabel")} <span className="font-normal text-leaf-500">({t("common.optional")})</span></label>
                <input
                  id="disease-location"
                  className="input"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder={t("disease.locationPlaceholder")}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="disease-language" className="label">{t("disease.languageLabel")}</label>
                <select id="disease-language" className="select" value={language} onChange={(event) => setLanguage(event.target.value)}>
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>
            </div>

            <button type="button" onClick={analyze} className="btn-primary mt-5 w-full" disabled={loading || !file}>
              {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Leaf size={17} />}
              {loading ? t("disease.analyzing") : t("disease.analyze")}
            </button>
            {loading && <p className="mt-2 text-center text-xs text-leaf-500">{t("disease.analyzingHint")}</p>}
          </div>

          <div className="card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-bold text-leaf-950"><History size={17} /> {t("disease.history")}</h2>
              {isAuthenticated && (
                <button type="button" onClick={loadHistory} className="text-xs font-semibold text-leaf-700 hover:text-leaf-900">
                  {t("common.retry")}
                </button>
              )}
            </div>
            {!isAuthenticated ? (
              <p className="mt-3 rounded-xl bg-leaf-50 p-3 text-sm text-leaf-600">
                {t("disease.noHistory")} <Link to="/login" className="link">{t("nav.login")}</Link>
              </p>
            ) : historyLoading ? (
              <LoadingSpinner label={t("common.loading")} />
            ) : history.length === 0 ? (
              <p className="mt-3 rounded-xl bg-leaf-50 p-3 text-sm text-leaf-600">{t("disease.noHistory")}</p>
            ) : (
              <div className="mt-3 space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setResult(item.recommendations); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="block w-full rounded-xl border border-leaf-100 p-3 text-left transition hover:border-leaf-300 hover:bg-leaf-50"
                  >
                    <p className="text-sm font-semibold text-leaf-950">{item.crop_name} · {item.possible_disease}</p>
                    <p className="mt-0.5 text-xs text-leaf-500">{item.certainty_level} · {formatDateTime(item.created_at, language)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {!result ? (
            <div className="card sticky top-24">
              <EmptyState
                icon={SparkleIcon}
                title={t("disease.resultTitle")}
                description={t("disease.subtitle")}
              />
            </div>
          ) : (
            <div className="card sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-eyebrow">{t("disease.resultTitle")}</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-leaf-950">{result.possible_disease}</h2>
                  <p className="mt-1 text-sm text-leaf-600">{result.crop_name}</p>
                </div>
                <span className={certaintyClass(result.certainty_level)}>{result.certainty_level}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-leaf-50 p-3">
                  <p className="text-leaf-500">{t("disease.imageQuality")}</p>
                  <p className="mt-0.5 font-bold text-leaf-900">{result.image_quality}</p>
                </div>
                <div className="rounded-xl bg-leaf-50 p-3">
                  <p className="text-leaf-500">{t("disease.certainty")}</p>
                  <p className="mt-0.5 font-bold text-leaf-900">{result.certainty_level}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-leaf-500">{t("disease.confidenceNote")}</p>

              <div className="mt-5 space-y-4">
                <ResultList title={t("disease.observations")} items={result.visual_observations} icon={CheckCircle2} />
                {(result.alternative_possibilities || []).length > 0 && (
                  <ResultList title={t("disease.alternatives")} items={result.alternative_possibilities} icon={AlertTriangle} />
                )}
                {(result.symptoms || []).length > 0 && <ResultList title={t("disease.symptoms")} items={result.symptoms} icon={Leaf} />}
                {(result.possible_causes || []).length > 0 && <ResultList title={t("disease.causes")} items={result.possible_causes} icon={Bug} />}
                {(result.recommended_actions || []).length > 0 && <ResultList title={t("disease.actions")} items={result.recommended_actions} icon={CheckCircle2} />}
                {(result.prevention || []).length > 0 && <ResultList title={t("disease.prevention")} items={result.prevention} icon={ShieldAlert} />}
              </div>

              {result.knowledge_base_match ? (
                <div className="mt-5 rounded-xl border border-leaf-100 bg-leaf-50 p-3 text-xs text-leaf-700">
                  <p className="flex items-center gap-1.5 font-bold text-leaf-900"><BookOpen size={14} /> {t("disease.knowledgeSource")}</p>
                  <p className="mt-1 leading-relaxed">{result.knowledge_source}</p>
                  <p className="mt-1">{t("disease.lastVerified")}: {result.knowledge_last_verified}</p>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                  <p className="flex items-center gap-1.5 font-bold"><AlertTriangle size={14} /> {t("disease.alternatives")}</p>
                  <p className="mt-1">No verified knowledge-base entry matched this suggestion. Generic guidance is shown; confirm with an expert.</p>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold leading-relaxed text-red-800">
                {t("disease.expertWarning")}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-leaf-500">{result.disclaimer || t("disease.disclaimer")}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={downloadReport} className="btn-secondary">
                  <Download size={15} /> {t("disease.downloadReport")}
                </button>
                <button type="button" onClick={removeImage} className="btn-primary">
                  {t("disease.newAnalysis")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}

function SparkleIcon(props) {
  return <Leaf {...props} />;
}
