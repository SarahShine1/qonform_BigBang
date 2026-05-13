import { useEffect, useRef, useState } from "react";
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
} from "lucide-react";


const INITIAL = {
  id_departement: "",
  date_audit: "",
  observation: "",
  nom_rapport: "",
};

export default function AuditTerrainModal({ onClose, onSubmit, departements }) {
  const [form, setForm] = useState(INITIAL);
  const [fichier, setFichier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFichier(f);
    if (!form.nom_rapport) {
      setForm((prev) => ({
        ...prev,
        nom_rapport: f.name.replace(/\.[^.]+$/, ""),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.id_departement) return setError("Veuillez sélectionner un département.");
    if (!form.date_audit) return setError("La date d'audit est requise.");
    if (!fichier) return setError("Un rapport d'audit (fichier) est obligatoire."); // ← ajouté

    const fd = new FormData();
    fd.append("id_departement", form.id_departement);
    fd.append("date_audit", form.date_audit);
    if (form.observation) fd.append("observation", form.observation);
    fd.append("rapport", fichier);
    fd.append("nom_rapport", form.nom_rapport || fichier.name);

    setLoading(true);
    try {
      await onSubmit(fd);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[20px] bg-white shadow-xl mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900">
              Nouvel audit terrain
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Renseignez les informations et joignez le rapport
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

          {/* Département */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              <Building2 className="w-3.5 h-3.5 inline mr-1" />
              Département audité <span className="text-red-400">*</span>
            </label>
            <select
              value={form.id_departement}
              onChange={set("id_departement")}
              className="w-full rounded-[10px] border px-3 py-2 text-[13px] outline-none focus:border-purple-400 bg-white"
            >
              <option value="">— Sélectionner un département —</option>
              {departements.map((d) => (
                <option key={d.id_departement} value={d.id_departement}>
                  {d.code} — {d.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Date de l'audit <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={form.date_audit}
              onChange={set("date_audit")}
              className="w-full rounded-[10px] border px-3 py-2 text-[13px] outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200"
            />
          </div>

          {/* Observation */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Observation
            </label>
            <textarea
              value={form.observation}
              onChange={set("observation")}
              rows={3}
              placeholder="Observations générales de l'audit…"
              className="w-full rounded-[10px] border px-3 py-2 text-[13px] outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 resize-none"
            />
          </div>

          {/* Upload rapport — OBLIGATOIRE */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Rapport d'audit <span className="text-red-400">*</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-[14px] border-2 border-dashed p-5 cursor-pointer transition-colors ${
                fichier
                  ? "border-purple-400 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.xlsx,.png,.jpg"
                onChange={handleFile}
              />
              {fichier ? (
                <>
                  <FileText className="w-7 h-7 text-purple-500 mb-1" />
                  <p className="text-[12px] font-medium text-purple-700">{fichier.name}</p>
                  <p className="text-[11px] text-purple-400">
                    {(fichier.size / 1024).toFixed(0)} Ko
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-gray-300 mb-1" />
                  <p className="text-[12px] text-gray-400">
                    Joindre le rapport —{" "}
                    <span className="text-purple-600 font-medium underline">
                      choisir un fichier
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-300 mt-0.5">PDF, DOCX, images</p>
                </>
              )}
            </div>
          </div>

          {/* Nom du rapport */}
          {fichier && (
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Nom du rapport
              </label>
              <input
                value={form.nom_rapport}
                onChange={set("nom_rapport")}
                placeholder="ex : Rapport-Audit-DRH-Mai2026"
                className="w-full rounded-[10px] border px-3 py-2 text-[13px] outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200"
              />
            </div>
          )}

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
              Audit créé avec succès !
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
                  Création…
                </>
              ) : (
                "Créer l'audit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}