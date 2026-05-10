export default function AuditHeader({ audit, complianceRate }) {
  const statusClass = audit.status === "Publié"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-purple-100 text-purple-700";

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-bold text-gray-950">Exécution de l'audit interne</div>
          <p className="mt-1 text-sm text-slate-500">
            Analyse comparative entre la fiche processus publiée et la checklist ISO 9001.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_1fr] gap-3 rounded-xl border border-gray-100 bg-white px-5 py-3 shadow-sm">
        <Info label="Code" value={audit.code} />
        <Info label="Processus" value={`${audit.processCode} ${audit.processName}`} />
        <Info label="Auditeur" value={audit.auditor} />
        <Info label="Date" value={formatDate(audit.date)} />
        <div>
          <p className="text-xs font-semibold text-slate-400">Statut</p>
          <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
            {audit.status}
          </span>
        </div>
        <Info label="Conformité" value={`${complianceRate}%`} strong />
      </div>
    </section>
  );
}

function Info({ label, value, strong = false }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-sm ${strong ? "font-bold text-emerald-700" : "font-semibold text-gray-950"}`}>
        {value}
      </p>
    </div>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}
