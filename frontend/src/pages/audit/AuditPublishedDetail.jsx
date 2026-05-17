import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Download,
  Eye,
  FileText,
  UserCircle2,
} from "lucide-react";
import { useParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { auditApi } from "../../api/audit.api";
import { useAuth } from "../../hooks/useAuth";

export default function AuditPublishedDetail() {
  const { idVersion } = useParams();
  const { user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    auditApi
      .getFicheDetail(idVersion)
      .then((payload) => {
        if (mounted) setDetail(payload);
      })
      .catch(() => {
        if (mounted) setError("Impossible de charger la fiche auditée.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [idVersion]);

  const userName = useMemo(() => {
    if (!user) return "";
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-slate-500">
        Chargement de la fiche auditée...
      </div>
    );
  }

  if (!detail || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-red-600">
        {error || "Fiche auditée introuvable."}
      </div>
    );
  }

  const piloteName = `${detail.redacteur?.prenom || ""} ${detail.redacteur?.nom || ""}`.trim();
  const auditeurName = `${detail.audit?.auditeur?.prenom || ""} ${detail.audit?.auditeur?.nom || ""}`.trim();
  const complianceRate = detail.taux_conformite || 0;
  const nonConformities = detail.non_conformites || [];
  const correctiveActions = nonConformities.flatMap((nc) =>
    (nc.actions_correctives || []).map((action) => ({
      ...action,
      ncTitle: nc.titre,
      section: nc.section,
    }))
  );

  return (
    <AppLayout
      pageTitle="Fiche auditée"
      userName={userName}
      userRole="Auditeur"
      contentClassName="bg-gray-50 px-4 py-4 pb-6"
    >
      <div className="space-y-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Audit interne / Fiches auditées / Détail fiche
            </p>
            <h1 className="mt-1 text-xl font-bold text-gray-950">Fiche auditée</h1>
            <p className="mt-1 text-xs text-slate-500">
              Consultation d'une fiche finalisée et déjà auditée.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {formatStatus(detail.statut) || "Publiée"}
          </span>
        </header>

        <section className="grid gap-3 lg:grid-cols-[210px_minmax(0,1fr)]">
          <ComplianceCard rate={complianceRate} />
          <div className="grid gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm md:grid-cols-3 xl:grid-cols-6">
            <InfoItem label="Code" value={detail.processus?.code_process} />
            <InfoItem label="Processus" value={detail.processus?.nom} wide />
            <InfoItem label="Version" value={detail.numero_version} />
            <InfoItem label="Type" value={detail.processus?.type_process} />
            <InfoItem label="Pilote" value={piloteName || "Non renseigné"} />
            <InfoItem label="Auditeur" value={auditeurName || "Non renseigné"} />
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <TraceLine
            title="Remplie par"
            name={piloteName || "Non renseigné"}
            role={detail.redacteur?.role || "Pilote de processus"}
            date={detail.date_validation || detail.date_creation}
          />
          <TraceLine
            title="Auditée par"
            name={auditeurName || "Non renseigné"}
            role={detail.audit?.auditeur?.role || "Auditeur interne"}
            date={detail.audit?.date_realisation}
          />
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-bold text-gray-950">Fiche processus complète</h2>
            </div>

            <div className="space-y-3 p-3">
              {(detail.sections || []).map((section) => (
                <ProcessSection key={section.id_section_template || section.nom} section={section} />
              ))}
            </div>
          </section>

          <aside className="space-y-3">
            <ReportPanel detail={detail} />
            <NonConformitiesPanel items={nonConformities} />
            <CorrectiveActionsPanel items={correctiveActions} />
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

function ComplianceCard({ rate }) {
  return (
    <div className="rounded-lg border border-emerald-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase text-slate-400">Taux de conformité</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-2xl font-bold leading-none text-emerald-700">{rate}%</span>
        <span className="text-[11px] font-medium text-slate-500">Audit finalisé</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

function InfoItem({ label, value, wide = false }) {
  return (
    <div className={wide ? "md:col-span-2 xl:col-span-2" : ""}>
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
      <p className="mt-1 truncate text-[13px] font-semibold text-gray-950">{value || "-"}</p>
    </div>
  );
}

function TraceLine({ title, name, role, date }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-50 text-purple-700">
        <UserCircle2 className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-400">{title}</p>
        <p className="truncate text-[13px] font-bold text-gray-950">{name}</p>
        <p className="truncate text-xs text-slate-500">{role}</p>
      </div>
      <div className="inline-flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
        <CalendarDays className="h-3.5 w-3.5" />
        {formatDate(date)}
      </div>
    </div>
  );
}

function ProcessSection({ section }) {
  const fields = section.champs || [];

  return (
    <div className="rounded-md border border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2">
        <h3 className="text-xs font-bold text-gray-900">{section.nom}</h3>
        <span className="text-[11px] font-semibold text-slate-400">
          {fields.length} champ{fields.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {fields.length === 0 ? (
          <div className="px-3 py-2.5 text-xs text-slate-500">
            Aucune information renseignée pour cette section.
          </div>
        ) : (
          fields.map((champ) => {
            const structured = isStructuredTableValue(champ.valeur);
            return (
              <div
                key={champ.id_champ}
                className={
                  structured
                    ? "px-3 py-3"
                    : "grid gap-2 px-3 py-2.5 md:grid-cols-[170px_minmax(0,1fr)]"
                }
              >
                <div className={structured ? "mb-3 text-xs font-semibold text-purple-700" : "text-xs font-semibold text-purple-700"}>
                  {champ.libelle}
                </div>
                <div className="min-w-0 text-xs leading-5 text-slate-700">
                  <FieldValue value={champ.valeur} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ReportPanel({ detail }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-purple-50 text-purple-700">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-gray-950">Rapport d'audit lié</h2>
          <p className="mt-1 truncate text-xs font-semibold text-slate-700">
            {detail.rapport?.titre || "Rapport d'audit"}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Généré le {formatDate(detail.rapport?.genere_le)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => auditApi.openReport(detail.id_version)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-gray-50"
        >
          <Eye className="h-3.5 w-3.5" />
          Ouvrir
        </button>
        <button
          type="button"
          onClick={() => auditApi.downloadReport(detail.id_version, detail.rapport?.fichier)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-gray-50"
        >
          <Download className="h-3.5 w-3.5" />
          Télécharger
        </button>
      </div>
    </section>
  );
}

function NonConformitiesPanel({ items }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <h2 className="text-sm font-bold text-gray-950">Non-conformités relevées</h2>
      </div>

      <div className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState text="Aucune non-conformité relevée sur cette fiche pour le moment." />
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-left font-bold text-slate-500">
                <th className="px-3 py-2">Section</th>
                <th className="px-3 py-2">Titre</th>
                <th className="px-3 py-2">Gravité</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id_nc} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-slate-600">{item.section || "-"}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {item.titre || item.description || "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{item.gravite || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function CorrectiveActionsPanel({ items }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-3 py-2.5">
        <h2 className="text-sm font-bold text-gray-950">Actions correctives</h2>
      </div>

      {items.length === 0 ? (
        <EmptyState text="Aucune action corrective liée à cette fiche pour le moment." />
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((action) => (
            <div key={action.id_action} className="px-3 py-2.5">
              <p className="text-xs font-semibold text-slate-800">
                {action.description || "Action corrective"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {action.section || "Section non liée"} - {action.statut || "À faire"}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState({ text }) {
  return <div className="px-3 py-3 text-xs text-slate-500">{text}</div>;
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}

function FieldValue({ value }) {
  const parsedValue = parseStructuredValue(value);

  if (Array.isArray(parsedValue)) {
    if (parsedValue.length === 0) {
      return <div className="text-xs italic text-slate-400">Non renseigné</div>;
    }

    if (parsedValue.every((item) => isPlainObject(item))) {
      return <StructuredTable rows={parsedValue} />;
    }

    return (
      <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
        {parsedValue.map((item, index) => (
          <li key={`${String(item)}-${index}`}>{formatCellValue(item)}</li>
        ))}
      </ul>
    );
  }

  if (isPlainObject(parsedValue)) {
    return <StructuredTable rows={[parsedValue]} />;
  }

  return <div className="text-xs leading-5 text-slate-700">{formatCellValue(parsedValue)}</div>;
}

function StructuredTable({ rows }) {
  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set())
  );

  if (!columns.length) {
    return <div className="text-xs italic text-slate-400">Non renseigné</div>;
  }

  const minWidth = Math.max(columns.length * 190, 680);

  return (
    <div className="block w-full max-w-full overflow-x-auto rounded-xl border border-purple-100 bg-white">
      <table
        className="w-full table-auto border-collapse text-left text-xs"
        style={{ minWidth: `${minWidth}px` }}
      >
        <thead className="bg-purple-50 text-[#5b1fa8]">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="whitespace-nowrap border-b border-purple-100 px-4 py-3 align-top font-bold uppercase tracking-[0.06em]"
              >
                {formatColumnLabel(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top">
              {columns.map((column) => (
                <td
                  key={`${rowIndex}-${column}`}
                  className="min-w-[190px] whitespace-normal break-words px-4 py-3 align-top leading-5 text-slate-700"
                >
                  {formatCellValue(row?.[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseStructuredValue(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed || !["[", "{"].includes(trimmed[0])) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function isStructuredTableValue(value) {
  const parsedValue = parseStructuredValue(value);
  if (Array.isArray(parsedValue)) {
    return parsedValue.length > 0 && parsedValue.every((item) => isPlainObject(item));
  }
  return isPlainObject(parsedValue);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatColumnLabel(value) {
  const labels = {
    etape: "Étape",
    acteur: "Acteur",
    entree: "Entrée",
    sortie: "Sortie",
    description: "Description",
    consequences: "Conséquences",
    causes: "Causes",
    client: "Client",
    type: "Type",
    besoin_attendu: "Besoin attendu",
    format: "Format",
    document: "Document",
    approbation: "Approbation",
    proprietaire: "Propriétaire",
    responsable: "Responsable",
    enregistrement: "Enregistrement",
    duree_conservation: "Durée de conservation",
    competence: "Compétence",
    moyen: "Moyen",
    cible: "Cible",
    frequence: "Fréquence",
  };

  const key = String(value || "");
  const normalizedKey = key.toLowerCase();
  if (labels[key]) return labels[key];
  if (labels[normalizedKey]) return labels[normalizedKey];

  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Non renseigné";
  }

  if (Array.isArray(value)) {
    return value.map(formatCellValue).join(", ");
  }

  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([key, item]) => `${formatColumnLabel(key)} : ${formatCellValue(item)}`)
      .join(" - ");
  }

  return String(value);
}

function formatStatus(status) {
  const labels = {
    Publiee: "Publiée",
    En_revision: "En révision",
  };
  return labels[status] || status;
}
