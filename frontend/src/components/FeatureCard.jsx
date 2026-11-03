import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function FeatureCard({ icon: Icon, title, description, to, accent = "leaf" }) {
  const accents = {
    leaf: "bg-leaf-100 text-leaf-700",
    sky: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
    soil: "bg-soil-100 text-soil-200",
  };
  return (
    <Link to={to} className="card-hover group flex h-full flex-col p-6">
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accents[accent] || accents.leaf}`}>
        <Icon size={24} strokeWidth={1.9} />
      </div>
      <h3 className="text-lg font-bold text-leaf-950">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-leaf-700">{description}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-700 group-hover:text-leaf-900">
        Open tool <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
