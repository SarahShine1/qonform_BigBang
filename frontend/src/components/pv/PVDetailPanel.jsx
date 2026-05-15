import { X, FileText, Download, Calendar, Users, Tag, Hash } from "lucide-react";
import { useState } from "react";
import { apiClient } from "../../api/auth";

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
      <div className="mt-0.5 text-slate-400 shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
          {label}
        </p>
        <p className="text-[13px] text-slate-800 font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

const TYPE_CONFIG = {
 
  SUIVI: { label: "Suivi", bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  REVUE_DG: { label: "Revue", bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
};

export default function PVDetailPanel({ pv, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const typeConfig = TYPE_CONFIG[pv.type] || TYPE_CONFIG.SUIVI;

  const handleDownload = async () => {
    if (!pv.document_data) return;
    setDownloading(true);
    try {
      const { data } = await apiClient.get(
        `/documents/${pv.document_data.id}/download/`
      );
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.nom_fichier;
      a.click();
    } catch {
      alert("Impossible de télécharger le fichier.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-72 shrink-0">
      <div className="rounded-[16px] border border-[#E9E1F8] bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
            <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot} inline-block`} />
            Détail du PV
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Icon + code */}
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 border border-dashed border-purple-200">
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-[15px] font-bold text-slate-800">{pv.code}</p>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${typeConfig.bg} ${typeConfig.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`} />
              {typeConfig.label}
            </span>
          </div>

          {/* Infos */}
          <div className="space-y-3 border-t pt-4">
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Date du PV"
              value={formatDate(pv.date)}
            />
            <InfoRow
              icon={<Hash className="w-4 h-4" />}
              label="Code"
              value={pv.code}
            />
            <InfoRow
              icon={<Tag className="w-4 h-4" />}
              label="Type"
              value={typeConfig.label}
            />
          </div>

          {/* Participants */}
          {pv.participants_data?.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Participants ({pv.participants_data.length})
                </p>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {pv.participants_data.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold shrink-0">
                      {(p.username || p.email)?.[0]?.toUpperCase()}
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">{p.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document */}
          {pv.document_data && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Fichier joint
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2">
                <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-purple-700 truncate">
                    {pv.document_data.nom_fichier}
                  </p>
                  <p className="text-[10px] text-purple-400">
                    {formatSize(pv.document_data.taille)} ·{" "}
                    {formatDate(pv.document_data.date_upload)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-2 w-full rounded-[10px] bg-purple-700 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-purple-800 disabled:opacity-60 transition-colors"
              >
                <Download className="w-4 h-4" />
                {downloading ? "Téléchargement…" : "Télécharger le PDF"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}