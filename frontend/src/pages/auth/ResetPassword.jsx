import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { resetPassword } from "../../api/auth";
import qonformeLogo from "../../assets/icons/qonforme-logo.svg";

function getErrorMessage(data) {
  if (!data) return "Impossible de reinitialiser le mot de passe.";
  if (typeof data.detail === "string") return data.detail;

  const values = Object.values(data).flatMap((value) =>
    Array.isArray(value) ? value : [value],
  );
  const firstMessage = values.find((value) => typeof value === "string");

  return firstMessage || "Impossible de reinitialiser le mot de passe.";
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";
  const linkIsValid = Boolean(uid && token);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await resetPassword({
        uid,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccess(data?.detail || "Mot de passe reinitialise avec succes.");

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            message: "Votre mot de passe a ete reinitialise. Vous pouvez maintenant vous connecter.",
          },
        });
      }, 1200);
    } catch (requestError) {
      setError(getErrorMessage(requestError?.response?.data));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] px-5 py-8">
      <div className="w-full max-w-md rounded-[20px] border border-[#EEE8F7] bg-white px-7 py-10 shadow-[0_18px_38px_rgba(88,20,142,0.08)] sm:px-8">
        <div className="flex items-center justify-center gap-3">
          <img src={qonformeLogo} alt="Qonforme" className="h-8 w-8" />
          <span className="text-[23px] font-medium tracking-[-0.04em] text-slate-900">
            Qonforme
          </span>
        </div>

        <h1 className="mt-6 text-center text-[26px] font-semibold tracking-[-0.03em] text-slate-900">
          Reinitialiser le mot de passe
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Definissez un nouveau mot de passe pour votre compte.
        </p>

        {!linkIsValid ? (
          <div className="mt-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            Lien invalide. Revenez a la page de connexion pour demander un nouveau lien.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Nouveau mot de passe
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-[46px] w-full rounded-md border border-[#E7E1F2] bg-white pl-12 pr-12 text-[13px] text-slate-900 outline-none transition focus:border-[#58148E] focus:ring-2 focus:ring-[#E9DDFE]"
                  placeholder="Minimum 8 caracteres"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Confirmer le mot de passe
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirmation ? "text" : "password"}
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  className="h-[46px] w-full rounded-md border border-[#E7E1F2] bg-white pl-12 pr-12 text-[13px] text-slate-900 outline-none transition focus:border-[#58148E] focus:ring-2 focus:ring-[#E9DDFE]"
                  placeholder="Retapez le mot de passe"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmation((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  aria-label={showConfirmation ? "Masquer la confirmation" : "Afficher la confirmation"}
                >
                  {showConfirmation ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            {error ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-md bg-[#58148E] px-4 text-[14px] font-medium text-white transition hover:bg-[#4B14A8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enregistrer le nouveau mot de passe
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link className="text-sm font-medium text-[#58148E] hover:text-[#4B1178]" to="/login">
            Retour a la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
