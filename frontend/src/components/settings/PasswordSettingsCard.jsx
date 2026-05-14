import { KeyRound, ShieldAlert } from "lucide-react";

const inputClassName =
  "h-11 w-full rounded-[12px] border border-[#E9E1F8] bg-white px-3.5 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A78BFA] focus:ring-4 focus:ring-[#F3ECFF]";

export default function PasswordSettingsCard({
  passwordForm,
  submitting,
  isValid,
  error,
  success,
  onChange,
  onSubmit,
}) {
  return (
    <section className="rounded-[18px] border border-[#E9E1F8] bg-white p-5 shadow-[0_14px_28px_rgba(88,20,142,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full border border-[#E9E1F8] bg-[#F3ECFF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B21D9]">
            Sécurité
          </span>
          <h2 className="mt-3 text-[18px] font-semibold text-slate-900">Changer le mot de passe</h2>
          <p className="mt-1 text-[12px] text-slate-500">
            Utilisez au minimum 8 caractères et confirmez le nouveau mot de passe.
          </p>
          <span className="mt-2 block h-[2px] w-10 rounded-full bg-[#F4B740]" />
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F8F2FF] text-[#58148E]">
          <KeyRound className="h-5 w-5" />
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Mot de passe actuel
          </label>
          <input
            type="password"
            name="current_password"
            value={passwordForm.current_password}
            onChange={onChange}
            className={inputClassName}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              name="new_password"
              value={passwordForm.new_password}
              onChange={onChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              name="confirm_password"
              value={passwordForm.confirm_password}
              onChange={onChange}
              className={inputClassName}
            />
          </div>
        </div>

        {!isValid && passwordForm.new_password ? (
          <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700">
            Le nouveau mot de passe doit contenir au moins 8 caractères et correspondre à la confirmation.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] text-rose-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="inline-flex items-center gap-2 rounded-[12px] bg-[#58148E] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_20px_rgba(88,20,142,0.18)] transition hover:bg-[#4A1178] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ShieldAlert className="h-4 w-4" />
            {submitting ? "Mise à jour..." : "Changer le mot de passe"}
          </button>
        </div>
      </form>
    </section>
  );
}
