import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { login as apiLogin } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";

import qonformeLogo from "../../assets/icons/qonforme-logo.svg";
import googleLogo from "../../assets/icons/google-logo.svg";
import loginIllustration from "../../assets/images/login-illustration.svg";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError("Veuillez saisir votre email et votre mot de passe.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Veuillez saisir un email valide, par exemple sarra@qonforme.dz.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiLogin(normalizedEmail, password);
      login(data);
      navigate("/", { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail || "";
      if (detail.includes("désactivé") || detail.includes("desactive")) {
        setError("Compte désactivé. Contactez l'administrateur.");
      } else if (err?.response?.status === 401) {
        setError("Identifiants incorrects. Veuillez réessayer.");
      } else {
        setError(detail || "Impossible de se connecter. Vérifiez que le backend est lancé.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; width: 100%; overflow: hidden; }
        body { font-family: Inter, Segoe UI, system-ui, sans-serif; }
        * { box-sizing: border-box; }
        input, button { font-family: inherit; }
        input::placeholder { color: #9ca3af; }
      `}</style>

      <div className="flex h-screen w-screen overflow-hidden bg-white text-left">
        <div className="relative hidden flex-1 items-center justify-center bg-[#eeeaf2] p-10 md:flex">
          <div className="absolute left-7 top-6 flex items-center gap-3">
            <img src={qonformeLogo} alt="Qonforme" className="h-8 w-8" />
            <span className="text-base font-bold text-gray-900">Qonforme</span>
          </div>
          <img
            src={loginIllustration}
            alt=""
            draggable={false}
            className="w-full max-w-[460px] select-none object-contain"
          />
        </div>

        <div className="flex w-full shrink-0 flex-col justify-center overflow-y-auto px-8 py-10 md:w-[520px] md:px-12">
          <h1 className="mb-5 text-3xl font-bold leading-tight text-gray-900">
            Bienvenue sur
          </h1>

          <div className="mb-6 inline-flex w-fit items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
            <img src={qonformeLogo} alt="" className="h-7 w-7" />
            <span className="text-sm font-semibold text-gray-900">Qonforme</span>
          </div>

          <button
            type="button"
            className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <img src={googleLogo} alt="" className="h-5 w-5" />
            Se connecter avec Google
          </button>

          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-semibold tracking-wide text-gray-400">OU</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex h-16 items-center gap-3 rounded-xl bg-[#f3f3f6] px-4">
              <Mail className="h-5 w-5 shrink-0 text-gray-900" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="sarra@qonforme.dz"
                autoComplete="email"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-gray-900 outline-none"
              />
            </div>

            <div className="flex h-16 items-center gap-3 rounded-xl bg-[#f3f3f6] px-4">
              <KeyRound className="h-5 w-5 shrink-0 text-gray-900" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mot de passe"
                autoComplete="current-password"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-gray-900 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="my-1 flex items-center justify-between">
              <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 accent-purple-700"
                />
                Se souvenir de moi
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-purple-700">
                Mot de passe oublié?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-[#5b1fa8] py-4 text-sm font-semibold text-white transition hover:bg-[#4a1890] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
