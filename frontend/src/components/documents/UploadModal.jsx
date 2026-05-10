import { useRef, useState } from "react";
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { TYPE_DOCUMENT_OPTIONS, TYPE_SUPPORT_OPTIONS } from "../../api/documents";

const INITIAL = {
  nom_fichier: "",
  type_support: "",
  version_doc: "",
  description: "",
};

export default function UploadModal({ onClose, onUpload }) {
  const [form, setForm] = useState(INITIAL);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    // Pré-remplir nom_fichier avec le nom du fichier (sans extension)
    if (!form.nom_fichier) {
      setForm((prev) => ({
        ...prev,
        nom_fichier: f.name.replace(/\.[^.]+$/, ""),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!file) return setError("Veuillez sélectionner un fichier.");
    if (!form.nom_fichier.trim()) return setError("Le nom du fichier est requis.");
   

    const fd = new FormData();
    fd.append("fichier", file);
    Object.entries(form).forEach(([k, v]) => {
      if (v) fd.append(k, v);
    });

    setLoading(true);
    try {
      await onUpload(fd);
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      const detail = err?.response?.data;
      if (typeof detail === "object") {
        const msgs = Object.entries(detail)
          .map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        setError(msgs);
      } else {
        setError(detail || "Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[20px] bg-white shadow-xl mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900">
              Importer un document
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Réservé aux membres CAQ
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* Zone de dépôt */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-[14px] border-2 border-dashed p-6 cursor-pointer transition-colors ${
              file
                ? "border-purple-400 bg-purple-50"
                : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.png,.jpg,.jpeg,.xlsx"
              onChange={handleFile}
            />
            {file ? (
              <>
                <FileText className="w-8 h-8 text-purple-500 mb-2" />
                <p className="text-[13px] font-medium text-purple-700">
                  {file.name}
                </p>
                <p className="text-[11px] text-purple-400">
                  {(file.size / 1024).toFixed(0)} Ko
                </p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-[13px] text-gray-400">
                  Glisser-déposer ou{" "}
                  <span className="text-purple-600 font-medium underline">
                    choisir un fichier
                  </span>
                </p>
                <p className="text-[11px] text-gray-300 mt-1">
                  PDF, DOCX, images — max 20 Mo
                </p>
              </>
            )}
          </div>

          {/* Nom du fichier */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Nom du fichier <span className="text-red-400">*</span>
            </label>
            <input
              value={form.nom_fichier}
              onChange={set("nom_fichier")}
              placeholder="ex : Norme_iso9001"
              className="w-full rounded-[10px] border px-3 py-2 text-[13px] outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200"
            />
          </div>

          {/* Type de document + Type de support */}
          <div className="grid grid-cols-2 gap-3">
            

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Type de support
              </label>
              <select
                value={form.type_support}
                onChange={set("type_support")}
                className="w-full rounded-[10px] border px-3 py-2 text-[13px] outline-none focus:border-purple-400 bg-white"
              >
                <option value="">— Optionnel —</option>
                {TYPE_SUPPORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

        

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={3}
              placeholder="Brève description du contenu…"
              className="w-full rounded-[10px] border px-3 py-2 text-[13px] outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 resize-none"
            />
          </div>

          {/* Erreur / Succès */}
          {error && (
            <div className="flex items-start gap-2 rounded-[10px] bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-[10px] bg-emerald-50 border border-emerald-200 px-3 py-2 text-[12px] text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Document importé avec succès !
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border px-4 py-2 text-[13px] hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="inline-flex items-center gap-2 rounded-[10px] bg-purple-700 px-5 py-2 text-[13px] font-medium text-white hover:bg-purple-800 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Import en cours…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}