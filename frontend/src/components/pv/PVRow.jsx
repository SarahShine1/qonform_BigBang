import { FileText, Trash2, Download, Eye, Paperclip } from "lucide-react";

const PV_TYPES = {
  SUIVI: {
    label: "Suivi",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  REVUE_DG: {
    label: "Revue avec DG",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
};

function TypeBadge({ type }) {
  const cfg = PV_TYPES[type] || {};
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cfg.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label || type}
    </span>
  );
}

// isCAQ vient de PVPage (calculé une seule fois depuis useAuth)
export default function PVRow({ pv, typeConfig, onDelete, isSelected, onClick, isCAQ }) {
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (pv.document?.chemin_stockage) {
      window.open(`/media/${pv.document.chemin_stockage}`, "_blank");
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(pv.id);
  };

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-b transition-colors ${
        isSelected ? "bg-[#F3ECFF]" : "border-slate-100 hover:bg-slate-50"
      }`}
      style={isSelected ? { borderColor: "#EEE7FA" } : {}}
    >
      {/* Code */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-[#F3ECFF] flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-[#6B21D9]" />
          </div>
          <span className="text-[13px] font-semibold text-slate-800 font-mono tracking-tight">
            {pv.code}
          </span>
        </div>
      </td>

      {/* Type */}
      <td className="pr-4 py-3">
        <TypeBadge type={pv.type} />
      </td>

      {/* Date */}
      <td className="pr-4 py-3">
        <span className="text-[12px] text-slate-500">{formatDate(pv.date)}</span>
      </td>

      {/* Participants */}
      <td className="pr-4 py-3">
        {pv.participants_data && pv.participants_data.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {pv.participants_data.slice(0, 3).map((p, i) => (
                <div
                  key={i}
                  title={p.username}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold"
                  style={{ background: "#EDE9FE", color: "#6B21D9", zIndex: 3 - i }}
                >
                  {p.username?.[0]?.toUpperCase()}
                </div>
              ))}
              {pv.participants_data.length > 3 && (
                <div
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold"
                  style={{ background: "#F1F5F9", color: "#64748B" }}
                >
                  +{pv.participants_data.length - 3}
                </div>
              )}
            </div>
            <span className="text-[12px] text-slate-500">
              {pv.participants_data.length} participant{pv.participants_data.length > 1 ? "s" : ""}
            </span>
          </div>
        ) : (
          <span className="text-[12px] text-slate-300">—</span>
        )}
      </td>

      {/* Document + pièce jointe */}
      <td className="pr-4 py-3">
        {pv.document ? (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
              style={{ background: "#F3ECFF" }}
            >
              <Paperclip className="w-3.5 h-3.5 text-[#6B21D9]" />
            </div>
            <div className="min-w-0">
              <p
                className="text-[12px] font-medium text-slate-700 truncate max-w-[130px] leading-tight"
                title={pv.document.nom_fichier}
              >
                {pv.document.nom_fichier}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {(pv.document.taille / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              onClick={handleDownload}
              title="Télécharger"
              className="ml-1 p-1.5 rounded-[7px] transition-colors hover:bg-[#EDE9FE] text-slate-300 hover:text-[#6B21D9] shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
            <Paperclip className="w-3 h-3" />
            Non joint
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="pr-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="p-1.5 rounded-[6px] text-slate-300 hover:text-[#6B21D9] hover:bg-[#F3ECFF] transition-colors"
            title="Voir le détail"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {isCAQ && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-[6px] text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}