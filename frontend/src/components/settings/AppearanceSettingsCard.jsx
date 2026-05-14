import { LayoutGrid, MoonStar } from "lucide-react";

function ChoiceButton({ active, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[14px] border px-4 py-3 text-left transition ${
        active
          ? "border-[#C9B5F5] bg-[#F6F0FF] shadow-[0_8px_18px_rgba(107,33,217,0.08)]"
          : "border-[#E9E1F8] bg-white hover:bg-[#FCFAFF]"
      }`}
    >
      <p className={`text-[13px] font-semibold ${active ? "text-[#58148E]" : "text-slate-800"}`}>
        {label}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{description}</p>
    </button>
  );
}

export default function AppearanceSettingsCard({
  preferences,
  saving,
  error,
  success,
  onThemeChange,
  onDensityChange,
  onSubmit,
}) {
  return (
    <section className="rounded-[18px] border border-[#E9E1F8] bg-white p-5 shadow-[0_14px_28px_rgba(88,20,142,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full border border-[#E9E1F8] bg-[#F3ECFF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B21D9]">
            Apparence
          </span>
          <h2 className="mt-3 text-[18px] font-semibold text-slate-900">Préférences d’interface</h2>
          <p className="mt-1 text-[12px] text-slate-500">
            Le thème est appliqué immédiatement. La densité est mémorisée avec votre compte.
          </p>
          <span className="mt-2 block h-[2px] w-10 rounded-full bg-[#F4B740]" />
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F8F2FF] text-[#58148E]">
          <MoonStar className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Mode interface
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <ChoiceButton
              active={preferences.theme === "light"}
              label="Clair"
              description="Conserve le rendu lumineux actuel de Qonform."
              onClick={() => onThemeChange("light")}
            />
            <ChoiceButton
              active={preferences.theme === "dark"}
              label="Sombre"
              description="Réduit la luminosité pour les environnements moins éclairés."
              onClick={() => onThemeChange("dark")}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-[#58148E]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Densité
            </p>
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <ChoiceButton
              active={preferences.density === "compact"}
              label="Compacte"
              description="Réduit légèrement l’espace utile pour afficher plus d’informations."
              onClick={() => onDensityChange("compact")}
            />
            <ChoiceButton
              active={preferences.density === "normal"}
              label="Normale"
              description="Conserve un espacement plus généreux entre les zones d’interface."
              onClick={() => onDensityChange("normal")}
            />
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
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="inline-flex items-center rounded-[12px] bg-[#58148E] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_20px_rgba(88,20,142,0.18)] transition hover:bg-[#4A1178] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? "Enregistrement..." : "Enregistrer l’apparence"}
          </button>
        </div>
      </div>
    </section>
  );
}
