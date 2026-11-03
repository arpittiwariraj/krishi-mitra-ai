import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Sprout } from "lucide-react";
import PublicLayout from "../components/PublicLayout";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Login() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || t("auth.invalid"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="container-page py-12 sm:py-16">
        <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-leaf-100 bg-white shadow-soft md:grid-cols-2">
          <div className="hidden flex-col justify-between bg-leaf-900 p-8 text-white md:flex">
            <div>
              <span className="inline-flex rounded-2xl bg-leaf-800 p-3"><Sprout size={24} /></span>
              <h1 className="mt-6 font-display text-3xl font-semibold">{t("common.appName")}</h1>
              <p className="mt-3 text-sm leading-relaxed text-leaf-200">{t("footer.description")}</p>
            </div>
            <ul className="mt-8 space-y-2 text-sm text-leaf-200">
              <li>• {t("home.feature1Title")}</li>
              <li>• {t("home.feature2Title")}</li>
              <li>• {t("home.feature3Title")}</li>
              <li>• {t("home.feature4Title")}</li>
            </ul>
          </div>

          <div className="p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-leaf-950">{t("auth.loginTitle")}</h2>
            <p className="mt-2 text-sm text-leaf-600">{t("auth.loginSubtitle")}</p>
            <p className="mt-3 rounded-xl bg-leaf-50 px-3 py-2 text-xs leading-relaxed text-leaf-700">{t("auth.demoHint")}</p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              {error && <ErrorMessage message={error} compact />}
              <div>
                <label htmlFor="email" className="label">{t("auth.email")}</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="farmer@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="label">{t("auth.password")}</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="input pr-11"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-leaf-500 hover:text-leaf-800"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                <LogIn size={17} /> {submitting ? t("common.loading") : t("auth.submitLogin")}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-leaf-600">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="link">{t("auth.createOne")}</Link>
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
