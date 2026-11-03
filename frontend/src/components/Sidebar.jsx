import { Link, NavLink } from "react-router-dom";
import {
  Bug,
  CloudSun,
  LayoutDashboard,
  Store,
  UserRound,
  Landmark,
  LogIn,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const items = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { to: "/disease", key: "nav.disease", icon: Bug },
  { to: "/weather", key: "nav.weather", icon: CloudSun },
  { to: "/market", key: "nav.market", icon: Store },
  { to: "/schemes", key: "nav.schemes", icon: Landmark },
  { to: "/profile", key: "nav.profile", icon: UserRound },
];

export default function Sidebar() {
  const { t } = useLanguage();
  const { farmer, isAuthenticated } = useAuth();

  return (
    <aside className="lg:w-64 lg:shrink-0">
      <div className="lg:sticky lg:top-24">
        <div className="mb-3 hidden rounded-2xl border border-leaf-100 bg-white p-4 lg:block">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-leaf-500">
            {t("nav.dashboardMenu")}
          </p>
          {isAuthenticated ? (
            <div className="mt-2 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-100 text-sm font-bold text-leaf-800">
                {(farmer?.full_name || "K").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-leaf-950">{farmer?.full_name}</p>
                <p className="truncate text-xs text-leaf-500">
                  {[farmer?.district, farmer?.state].filter(Boolean).join(", ") || t("common.farmer")}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-leaf-600">{t("common.loginToSave")}</p>
          )}
        </div>

        <nav
          className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
          aria-label="Farmer workspace"
        >
          {items.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition lg:w-full ${
                  isActive
                    ? "bg-leaf-900 text-white shadow-sm"
                    : "border border-leaf-100 bg-white text-leaf-700 hover:border-leaf-300 hover:bg-leaf-50"
                }`
              }
            >
              <Icon size={17} />
              <span className="whitespace-nowrap">{t(key)}</span>
            </NavLink>
          ))}
          {!isAuthenticated && (
            <Link
              to="/login"
              className="flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-leaf-300 bg-leaf-50 px-3 py-2.5 text-sm font-semibold text-leaf-800 lg:w-full"
            >
              <LogIn size={17} /> {t("nav.login")}
            </Link>
          )}
        </nav>
      </div>
    </aside>
  );
}
