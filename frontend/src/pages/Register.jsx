import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sprout, UserPlus } from "lucide-react";
import PublicLayout from "../components/PublicLayout";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { STATES, getDistricts } from "../utils/locations";

const initialForm = {
  full_name: "",
  email: "",
  password: "",
  phone: "",
  state: "Maharashtra",
  district: "Pune",
  preferred_language: "en",
};

export default function Register() {
  const { t, language, setLanguage } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...initialForm, preferred_language: language });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const districts = getDistricts(form.state);

  const update = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "state") {
        const options = getDistricts(value);
        next.district = options[0] || "";
      }
      if (field === "preferred_language") setLanguage(value);
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError(t("auth.passwordHint"));
      return;
    }
    setSubmitting(true);
    try {
      await register({
        ...form,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        district: form.district || null,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="container-page py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-leaf-100 bg-white shadow-soft md:grid-cols-[0.8fr_1.2fr]">
          <div className="hidden flex-col justify-between bg-leaf-900 p-8 text-white md:flex">
            <div>
              <span className="inline-flex rounded-2xl bg-leaf-800 p-3"><Sprout size={24} /></span>
              <h1 className="mt-6 font-display text-3xl font-semibold">{t("common.appName")}</h1>
              <p className="mt-3 text-sm leading-relaxed text-leaf-200">{t("auth.registerSubtitle")}</p>
            </div>
            <div className="mt-8 rounded-2xl bg-leaf-800 p-4 text-xs leading-relaxed text-leaf-200">
              {t("profile.privacyNote")}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-leaf-950">{t("auth.registerTitle")}</h2>
            <form onSubmit={submit} className="mt-5 space-y-4">
              {error && <ErrorMessage message={error} compact />}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="full_name" className="label">{t("auth.name")}</label>
                  <input
                    id="full_name"
                    required
                    minLength={2}
                    className="input"
                    value={form.full_name}
                    onChange={(event) => update("full_name", event.target.value)}
                    placeholder="Ramesh Patil"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="label">{t("auth.email")}</label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="input"
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    placeholder="farmer@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="label">{t("auth.phone")}</label>
                  <input
                    id="phone"
                    type="tel"
                    className="input"
                    value={form.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    placeholder="9876543210"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="password" className="label">{t("auth.password")}</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      className="input pr-11"
                      value={form.password}
                      onChange={(event) => update("password", event.target.value)}
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
                  <p className="mt-1 text-xs text-leaf-500">{t("auth.passwordHint")}</p>
                </div>
                <div>
                  <label htmlFor="state" className="label">{t("common.state")}</label>
                  <select id="state" className="select" value={form.state} onChange={(event) => update("state", event.target.value)}>
                    {STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="district" className="label">{t("common.district")}</label>
                  <input
                    id="district"
                    className="input"
                    list="register-districts"
                    value={form.district}
                    onChange={(event) => update("district", event.target.value)}
                    required
                  />
                  <datalist id="register-districts">
                    {districts.map((district) => <option key={district} value={district} />)}
                  </datalist>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="preferred_language" className="label">{t("auth.language")}</label>
                  <select
                    id="preferred_language"
                    className="select"
                    value={form.preferred_language}
                    onChange={(event) => update("preferred_language", event.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                <UserPlus size={17} /> {submitting ? t("common.loading") : t("auth.submitRegister")}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-leaf-600">
              {t("auth.haveAccount")}{" "}
              <Link to="/login" className="link">{t("auth.loginInstead")}</Link>
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
