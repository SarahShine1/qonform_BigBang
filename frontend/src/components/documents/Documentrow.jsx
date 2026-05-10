import { FileText, FileBarChart2, ShieldCheck } from "lucide-react";

const TYPE_ICON = {
  BPMN: <FileBarChart2 className="w-4 h-4 text-blue-500" />,
  Rapport: <FileText className="w-4 h-4 text-purple-500" />,
  Preuve: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
};

const SUPPORT_BADGE = {
  Guide: "bg-blue-50 text-blue-700",
  Reglementation: "bg-amber-50 text-amber-700",
  Norme: "bg-emerald-50 text-emerald-700",
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
    month: "short",
    year: "numeric",
  });
}

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function DocumentRow({ document: doc, isSelected, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-t text-[13px] transition-colors ${
        isSelected
          ? "bg-purple-50 border-l-2 border-l-purple-600"
          : "hover:bg-gray-50"
      }`}
    >
      {/* TYPE */}
      <td className="p-3">
        <div className="flex items-center gap-2">
          
          <div>
            <p className="font-medium text-slate-800 leading-tight">
              {doc.nom_fichier}
            </p>
            
          </div>
        </div>
      </td>

      {/* TYPE SUPPORT */}
      <td className="pr-4">
        {doc.type_support ? (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
              SUPPORT_BADGE[doc.type_support] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {SUPPORT_LABEL[doc.type_support] ?? doc.type_support}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>

     

   

      {/* DATE */}
      <td className="pr-4 text-slate-500">{formatDate(doc.date_upload)}</td>

      {/* DÉPOSÉ PAR */}
      <td className="pr-4 text-slate-600">{doc.depose_par}</td>

      {/* TAILLE */}
      <td className="pr-4 text-slate-400">{formatSize(doc.taille)}</td>
    </tr>
  );
}