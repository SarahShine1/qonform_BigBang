import {
  X,
  Download,
  Trash2,
  FileText,
  FileBarChart2,
  ShieldCheck,
  Calendar,
  User,
  Tag,
  Layers,
} from "lucide-react";
import { getDownloadUrl } from "../../api/documents";
import { useState } from "react";

const TYPE_ICON = {
  BPMN: <FileBarChart2 className="w-10 h-10 text-blue-400" />,
  Rapport: <FileText className="w-10 h-10 text-purple-400" />,
  Preuve: <ShieldCheck className="w-10 h-10 text-emerald-400" />,
};

const SUPPORT_BADGE = {
  Guide: "bg-blue-100 text-blue-700",
  Reglementation: "bg-amber-100 text-amber-700",
  Norme: "bg-emerald-100 text-emerald-700",
};

const SUPPORT_LABEL = {
  Guide: "Guide",
  Reglementation: "Réglementation",
  Norme: "Norme",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
          {label}
        </p>
        <p className="text-[13px] text-slate-800 font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function DocumentPreviewPanel({
  document: doc,
  onClose,
  onDelete,
  isCAQ,
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { url, nom_fichier } = await getDownloadUrl(doc.id_document);
      const a = document.createElement("a");
      a.href = url;
      a.download = nom_fichier;
      a.click();
    } catch {
      alert("Impossible de télécharger le fichier.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-[16px] border border-[#E9E1F8] bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
          Aperçu du document
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-gray-100 text-gray-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Icône + nom */}
        <div className="flex flex-col items-center gap-2 py-3">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-50 border border-dashed border-gray-200">
            {TYPE_ICON[doc.type_document] ?? (
              <FileText className="w-10 h-10 text-gray-300" />
            )}
          </div>
          <p className="text-[13px] font-semibold text-slate-700 text-center max-w-[200px] truncate">
            {doc.nom_fichier}
          </p>
          {doc.type_support && (
            <span
              className={`text-[11px] rounded-full px-2 py-0.5 font-medium ${
                SUPPORT_BADGE[doc.type_support] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {SUPPORT_LABEL[doc.type_support] ?? doc.type_support}
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="space-y-4 border-t pt-4">
         
         
          <InfoRow
            icon={<User className="w-4 h-4" />}
            label="Déposé par"
            value={doc.depose_par}
          />
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Date de dépôt"
            value={formatDate(doc.date_upload)}
          />
         
          {doc.taille && (
            <InfoRow
              icon={<FileText className="w-4 h-4" />}
              label="Taille"
              value={formatSize(doc.taille)}
            />
          )}
          {doc.description && (
            <div className="rounded-lg bg-gray-50 p-3 text-[12px] text-slate-600 leading-relaxed">
              {doc.description}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t pt-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-2 w-full rounded-[10px] bg-purple-700 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-purple-800 disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Téléchargement…" : "Télécharger"}
          </button>

          {isCAQ && (
            <button
              onClick={() => onDelete(doc.id_document)}
              className="flex items-center justify-center gap-2 w-full rounded-[10px] border border-red-200 px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}