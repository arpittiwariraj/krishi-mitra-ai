export const formatDate = (value, language = "en") => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (value, language = "en") => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(language === "hi" ? "hi-IN" : "en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatMoney = (value, language = "en") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat(language === "hi" ? "hi-IN" : "en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value));
};

export const formatNumber = (value, digits = 1) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(digits);
};

export const severityClass = (severity) => {
  if (severity === "high") return "border-red-200 bg-red-50 text-red-800";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-sky-200 bg-sky-50 text-sky-900";
};
