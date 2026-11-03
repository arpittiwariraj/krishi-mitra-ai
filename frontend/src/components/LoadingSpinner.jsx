import { LoaderCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function LoadingSpinner({ label, size = 24, fullScreen = false }) {
  const { t } = useLanguage();
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-leaf-700" role="status">
      <LoaderCircle className="animate-spin text-leaf-600" size={size} />
      <span className="text-sm font-medium">{label || t("common.loading")}</span>
    </div>
  );
  if (fullScreen) {
    return <div className="flex min-h-[50vh] items-center justify-center">{content}</div>;
  }
  return <div className="py-10">{content}</div>;
}
