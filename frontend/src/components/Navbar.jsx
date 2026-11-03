import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, Sprout, User, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? "bg-leaf-50 text-leaf-900" : "text-leaf-700 hover:bg-leaf-50 hover:text-leaf-900"
  }`;

export default function Navbar() {
  const { t } = useLanguage();
  const { isAuthenticated, farmer, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-leaf-100/80 bg-soil-50/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-leaf-900 text-leaf-100 shadow-sm">
            <Sprout size={22} strokeWidth={2.1} />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold text-leaf-950">{t("common.appName")}</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-leaf-600 sm:block">
              {t("common.tagline")}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          <NavLink to="/" end className={navLinkClass}>
            {t("nav.home")}
          </NavLink>
          <a href="/#features" className="rounded-lg px-3 py-2 text-sm font-semibold text-leaf-700 hover:bg-leaf-50 hover:text-leaf-900">
            {t("nav.features")}
          </a>
          <a href="/#how" className="rounded-lg px-3 py-2 text-sm font-semibold text-leaf-700 hover:bg-leaf-50 hover:text-leaf-900">
            {t("nav.howItWorks")}
          </a>
          <NavLink to="/about" className={navLinkClass}>
            {t("nav.about")}
          </NavLink>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher compact />
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn-primary !px-3.5">
                <LayoutDashboard size={16} />
                {t("nav.dashboard")}
              </Link>
              <div className="group relative">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf-100 text-sm font-bold text-leaf-800"
                  aria-label={farmer?.full_name || "Farmer"}
                  title={farmer?.full_name}
                >
                  {(farmer?.full_name || "K").slice(0, 1).toUpperCase()}
                </button>
                <div className="invisible absolute right-0 top-12 w-52 rounded-xl border border-leaf-100 bg-white p-2 opacity-0 shadow-soft transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold text-leaf-950">{farmer?.full_name}</p>
                    <p className="truncate text-xs text-leaf-500">{farmer?.email}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-leaf-700 hover:bg-leaf-50">
                    <User size={15} /> {t("nav.profile")}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} /> {t("common.logout")}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                {t("nav.login")}
              </Link>
              <Link to="/register" className="btn-primary">
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-xl border border-leaf-200 bg-white p-2 text-leaf-800"
            aria-label={t("nav.menu")}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-leaf-100 bg-soil-50 px-4 pb-4 pt-2 md:hidden">
          <nav className="space-y-1" aria-label="Mobile navigation">
            <NavLink to="/" end className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-leaf-800 hover:bg-white">
              {t("nav.home")}
            </NavLink>
            <a href="/#features" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-leaf-800 hover:bg-white">
              {t("nav.features")}
            </a>
            <a href="/#how" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-leaf-800 hover:bg-white">
              {t("nav.howItWorks")}
            </a>
            <NavLink to="/about" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-leaf-800 hover:bg-white">
              {t("nav.about")}
            </NavLink>
          </nav>
          <div className="mt-4 grid gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn-primary w-full">
                  <LayoutDashboard size={16} /> {t("nav.dashboard")}
                </Link>
                <button type="button" onClick={handleLogout} className="btn-secondary w-full !text-red-600">
                  <LogOut size={16} /> {t("common.logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary w-full">
                  {t("nav.login")}
                </Link>
                <Link to="/register" className="btn-primary w-full">
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
