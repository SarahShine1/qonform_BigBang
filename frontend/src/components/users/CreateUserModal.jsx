import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Eye, EyeOff, X } from "lucide-react";

const fieldClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#58148E] focus:ring-4 focus:ring-[#ede9fe] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500";

function getDepartmentId(department) {
  return (
    department?.id ??
    department?.id_unit ??
    department?.id_unite ??
    department?.id_departement ??
    department?.value ??
    ""
  );
}

function getDepartmentName(department) {
  return (
    department?.name ??
    department?.nom ??
    department?.libelle ??
    department?.title ??
    department?.label ??
    "Unité sans nom"
  );
}

function getDepartmentCode(department) {
  return (
    department?.code ??
    department?.displayCode ??
    department?.display_code ??
    department?.sigle ??
    ""
  );
}

function getDepartmentType(department) {
  return String(department?.type ?? department?.unit_type ?? "").toUpperCase();
}

export default function CreateUserModal({
  open,
  onClose,
  onSubmit,
  roles = [],
  departments = [],
  submitting = false,
  error = "",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [sendInvitation, setSendInvitation] = useState(true);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    telephone: "",
    role: "",
    departement: "",
    est_actif: true,
    password: "Temporaire123!",
  });

  const availableDepartments = useMemo(() => {
    const normalized = departments
      .map((department) => {
        const id = getDepartmentId(department);
        const name = getDepartmentName(department);
        const code = getDepartmentCode(department);
        const type = getDepartmentType(department);

        return {
          value: id ? String(id) : "",
          label: code ? `${name} (${code})` : name,
          type,
        };
      })
      .filter((department) => department.value)
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));

    return [{ label: "Non assigné", value: "" }, ...normalized];
  }, [departments]);

  useEffect(() => {
    if (!open) return undefined;

    const defaultRole = roles[0]?.libelle || "";

    setForm({
      full_name: "",
      email: "",
      telephone: "",
      role: defaultRole,
      departement: "",
      est_actif: true,
      password: "Temporaire123!",
    });

    setSendInvitation(true);

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, roles, submitting]);

  if (!open) return null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      departement: form.departement ? Number(form.departement) : null,
      est_actif: form.est_actif,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[22px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)] dark:bg-slate-950"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-slate-100">
              Créer un nouvel utilisateur
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Renseignez les informations du compte qualité
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Nom complet
              </span>
              <input
                className={fieldClassName}
                type="text"
                placeholder="ex: BOUALI RIMA"
                value={form.full_name}
                onChange={(event) => updateField("full_name", event.target.value)}
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email institutionnel
              </span>
              <input
                className={fieldClassName}
                type="email"
                placeholder="j.dupont@esi.dz"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Téléphone
              </span>
              <input
                className={fieldClassName}
                type="tel"
                placeholder="+213..."
                value={form.telephone}
                onChange={(event) => updateField("telephone", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Rôle
              </span>
              <div className="relative">
                <select
                  className={`${fieldClassName} appearance-none pr-10`}
                  value={form.role}
                  onChange={(event) => updateField("role", event.target.value)}
                  required
                >
                  {roles.length === 0 ? (
                    <option value="">Aucun rôle disponible</option>
                  ) : (
                    roles.map((role) => (
                      <option key={role.id_role ?? role.libelle} value={role.libelle}>
                        {role.libelle}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              </div>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Département / unité
              </span>
              <div className="relative">
                <select
                  className={`${fieldClassName} appearance-none pr-10`}
                  value={form.departement}
                  onChange={(event) => updateField("departement", event.target.value)}
                >
                  {availableDepartments.map((department) => (
                    <option key={department.value || "none"} value={department.value}>
                      {department.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              </div>

              {departments.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Aucun département trouvé dans l’organigramme.
                </p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Statut
              </span>
              <div className="relative">
                <select
                  className={`${fieldClassName} appearance-none pr-10`}
                  value={form.est_actif ? "actif" : "desactive"}
                  onChange={(event) =>
                    updateField("est_actif", event.target.value === "actif")
                  }
                >
                  <option value="actif">Actif</option>
                  <option value="desactive">Désactivé</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              </div>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Mot de passe
            </span>
            <span className="relative block">
              <input
                className={`${fieldClassName} pr-12`}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </span>
          </label>

          <button
            type="button"
            onClick={() => setSendInvitation((current) => !current)}
            className="flex w-full items-center gap-3 rounded-xl border border-[#e9ddff] bg-[#f6f0ff] px-4 py-3 text-left transition hover:border-[#d8c4ff] dark:border-violet-900 dark:bg-violet-950/60"
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-md ${
                sendInvitation
                  ? "bg-[#58148E] text-white"
                  : "border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              {sendInvitation && <Check className="h-4 w-4" />}
            </span>
            <span className="text-sm font-medium text-[#58148E] dark:text-violet-300">
              Envoyer l&apos;invitation par email à l&apos;utilisateur immédiatement.
            </span>
          </button>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 md:flex-row md:justify-end dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#58148E] px-6 py-2.5 text-sm font-medium text-white shadow-[0_12px_24px_rgba(88,20,142,0.22)] transition hover:bg-[#4A1178] disabled:opacity-60"
          >
            {submitting ? "Création..." : "Créer utilisateur"}
          </button>
        </div>
      </form>
    </div>
  );
}