import { Save, ShieldCheck, UserRound } from "lucide-react";

const inputClassName =
  "h-11 w-full rounded-[12px] border border-[#E9E1F8] bg-white px-3.5 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A78BFA] focus:ring-4 focus:ring-[#F3ECFF] disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500";

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </label>
      <div className="flex min-h-11 items-center rounded-[12px] border border-[#E9E1F8] bg-[#FCFAFF] px-3.5 text-[13px] text-slate-700">
        {value || "Non renseigné"}
      </div>
    </div>
  );
}

export default function ProfileSettingsCard({
  settings,
  profileForm,
  saving,
  error,
  success,
  onChange,
  onSubmit,
}) {
  const primaryRole = settings?.roles?.[0] || "Aucun rôle";
  const departmentName = settings?.departement?.nom || "Non assigné";

  return (
    <section className="rounded-[18px] border border-[#E9E1F8] bg-white p-5 shadow-[0_14px_28px_rgba(88,20,142,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full border border-[#E9E1F8] bg-[#F3ECFF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B21D9]">
            Compte utilisateur
          </span>
          <h2 className="mt-3 text-[18px] font-semibold text-slate-900">Informations du profil</h2>
          <p className="mt-1 text-[12px] text-slate-500">
            Mettez à jour uniquement les informations autorisées pour votre compte.
          </p>
          <span className="mt-2 block h-[2px] w-10 rounded-full bg-[#F4B740]" />
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F8F2FF] text-[#58148E]">
          <UserRound className="h-5 w-5" />
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Nom
            </label>
            <input
              type="text"
              name="nom"
              value={profileForm.nom}
              onChange={onChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Prénom
            </label>
            <input
              type="text"
              name="prenom"
              value={profileForm.prenom}
              onChange={onChange}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField label="Email" value={settings?.email} />
          <ReadOnlyField label="Rôle principal" value={primaryRole} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField label="Département" value={departmentName} />

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Statut actif
            </label>
            <div className="flex min-h-11 items-center justify-between rounded-[12px] border border-[#E9E1F8] bg-[#FCFAFF] px-3.5">
              <span className="text-[13px] text-slate-700">
                {settings?.est_actif ? "Compte actif" : "Compte inactif"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  settings?.est_actif
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {settings?.est_actif ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
        </div>

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
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-[12px] bg-[#58148E] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_20px_rgba(88,20,142,0.18)] transition hover:bg-[#4A1178] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Save className="h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </section>
  );
}
