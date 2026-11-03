import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function ErrorMessage({ message, code, onRetry, compact = false }) {
  const { t } = useLanguage();
  if (!message) return null;
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-950 ${
        compact ? "p-3" : "p-4"
      }`}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={compact ? 18 : 20} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-relaxed">{message}</p>
        {code && <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700">{code}</p>}
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-secondary mt-3 !py-2 text-xs">
            <RefreshCcw size={14} /> {t("common.retry")}
          </button>
        )}
      </div>
    </div>
  );
}
