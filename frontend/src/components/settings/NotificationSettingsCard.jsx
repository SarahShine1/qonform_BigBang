import { BellRing } from "lucide-react";

const notificationItems = [
  {
    key: "messagerie",
    label: "Notifications messagerie",
    description: "Recevoir les alertes liées aux nouveaux messages et réponses.",
  },
  {
    key: "audits",
    label: "Notifications audits",
    description: "Suivre les événements importants des audits planifiés ou publiés.",
  },
  {
    key: "taches",
    label: "Notifications tâches planifiées",
    description: "Être prévenu lors des échéances ou changements de planification.",
  },
  {
    key: "documents",
    label: "Notifications documents",
    description: "Recevoir les mises à jour sur les documents et ressources partagés.",
  },
];

export default function NotificationSettingsCard({
  notifications,
  saving,
  error,
  success,
  onToggle,
  onSubmit,
}) {
  return (
    <section className="rounded-[18px] border border-[#E9E1F8] bg-white p-5 shadow-[0_14px_28px_rgba(88,20,142,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full border border-[#E9E1F8] bg-[#F3ECFF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B21D9]">
            Notifications
          </span>
          <h2 className="mt-3 text-[18px] font-semibold text-slate-900">Préférences de notification</h2>
          <p className="mt-1 text-[12px] text-slate-500">
            Choisissez les catégories que vous souhaitez continuer à recevoir.
          </p>
          <span className="mt-2 block h-[2px] w-10 rounded-full bg-[#F4B740]" />
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F8F2FF] text-[#58148E]">
          <BellRing className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {notificationItems.map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-start justify-between gap-4 rounded-[14px] border border-[#E9E1F8] bg-[#FCFAFF] px-4 py-3 transition hover:bg-white"
          >
            <div>
              <p className="text-[13px] font-semibold text-slate-800">{item.label}</p>
              <p className="mt-1 text-[11px] text-slate-500">{item.description}</p>
            </div>

            <span className="relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={Boolean(notifications[item.key])}
                onChange={() => onToggle(item.key)}
              />
              <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-[#58148E]" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:left-[22px]" />
            </span>
          </label>
        ))}

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
            {saving ? "Enregistrement..." : "Enregistrer les notifications"}
          </button>
        </div>
      </div>
    </section>
  );
}
