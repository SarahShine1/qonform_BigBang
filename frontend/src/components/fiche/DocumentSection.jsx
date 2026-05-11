import { useEffect, useRef, useState } from "react";
import {
  ExternalLink, File, FileImage, FileText, Loader2, Trash2, UploadCloud,
} from "lucide-react";
import { getDocuments, uploadDocument, deleteDocument } from "../../api/documents.api";
import { useAuth } from "../../hooks/useAuth";

const PURPLE       = "#58148E";
const PURPLE_LIGHT = "#EDE9FE";
const BORDER       = "#D1D5DB";

const MAX_MB   = 20;
const MAX_SIZE = MAX_MB * 1024 * 1024;

const ACCEPTED = ".png,.svg,.jpg,.jpeg,.pdf,.doc,.docx";
const ACCEPTED_MIME = new Set([
  "image/png", "image/jpeg", "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function fileIcon(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "svg", "gif"].includes(ext))
    return <FileImage size={20} style={{ color: PURPLE }} strokeWidth={1.5} />;
  if (ext === "pdf")
    return <FileText size={20} className="text-red-500" strokeWidth={1.5} />;
  if (["doc", "docx"].includes(ext))
    return <FileText size={20} className="text-blue-500" strokeWidth={1.5} />;
  return <File size={20} className="text-slate-400" strokeWidth={1.5} />;
}

function canPreview(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  return ["png", "jpg", "jpeg", "svg", "gif", "pdf"].includes(ext);
}

// ── Single-file drop zone ─────────────────────────────────────────────────────
function SingleDropZone({ label, accept, onFile, uploading, error }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl py-7 transition"
        style={{
          border: `2px dashed ${dragging ? PURPLE : "#C4B5FD"}`,
          backgroundColor: dragging ? "#F5F0FF" : PURPLE_LIGHT,
        }}
      >
        {uploading
          ? <Loader2 size={22} className="animate-spin" style={{ color: PURPLE }} />
          : <UploadCloud size={22} style={{ color: PURPLE }} strokeWidth={1.6} />}
        <span className="text-[12px] font-medium" style={{ color: PURPLE }}>
          {uploading ? "Envoi en cours…" : "Glissez ou cliquez pour sélectionner"}
        </span>
        <span className="text-[10.5px] text-slate-400">PNG · SVG · JPG · PDF · Word — max {MAX_MB} Mo</span>
      </div>
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = ""; }} />
    </div>
  );
}

function FileCard({ doc, onDelete, deleting }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3"
      style={{ borderColor: "#C4B5FD" }}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: PURPLE_LIGHT }}>
        {fileIcon(doc.nom_fichier)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-slate-700">{doc.nom_fichier}</p>
        {doc.taille && (
          <p className="text-[10.5px] text-slate-400">{(doc.taille / 1024).toFixed(0)} Ko</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {doc.url && canPreview(doc.nom_fichier) && (
          <a href={doc.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition hover:bg-slate-100"
            style={{ color: PURPLE }}>
            <ExternalLink size={12} /> Voir
          </a>
        )}
        <button type="button" onClick={() => onDelete(doc)} disabled={deleting}
          className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-400 disabled:opacity-40">
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── Multi-file drop zone ──────────────────────────────────────────────────────
function MultiDropZone({ label, accept, onFiles, uploading, error }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    onFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl py-7 transition"
        style={{
          border: `2px dashed ${dragging ? PURPLE : "#C4B5FD"}`,
          backgroundColor: dragging ? "#F5F0FF" : PURPLE_LIGHT,
        }}
      >
        {uploading
          ? <Loader2 size={22} className="animate-spin" style={{ color: PURPLE }} />
          : <UploadCloud size={22} style={{ color: PURPLE }} strokeWidth={1.6} />}
        <span className="text-[12px] font-medium" style={{ color: PURPLE }}>
          {uploading ? "Envoi en cours…" : "Glissez ou cliquez pour ajouter des fichiers"}
        </span>
        <span className="text-[10.5px] text-slate-400">Plusieurs fichiers acceptés — max {MAX_MB} Mo chacun</span>
      </div>
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} multiple className="hidden"
        onChange={(e) => { if (e.target.files.length) onFiles(Array.from(e.target.files)); e.target.value = ""; }} />
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export default function DocumentSection({ versionId, readOnly = false, sectionIndex }) {
  const { user } = useAuth();
  const [bpmn,          setBpmn]          = useState(null);
  const [preuves,       setPreuves]       = useState([]);
  const [uploadingBpmn, setUploadingBpmn] = useState(false);
  const [uploadingPrv,  setUploadingPrv]  = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);
  const [bpmnError,     setBpmnError]     = useState("");
  const [prvError,      setPrvError]      = useState("");

  // Load existing documents when versionId is available
  useEffect(() => {
    if (!versionId) return;
    getDocuments(versionId).then((docs) => {
      setBpmn(docs.find((d) => d.type_document === "BPMN") ?? null);
      setPreuves(docs.filter((d) => d.type_document === "Preuve"));
    }).catch(() => {});
  }, [versionId]);

  const validateFile = (file, setError) => {
    if (file.size > MAX_SIZE) {
      setError(`Fichier trop volumineux (max ${MAX_MB} Mo).`);
      return false;
    }
    const mime = file.type || "";
    if (!ACCEPTED_MIME.has(mime)) {
      setError("Type de fichier non autorisé (PNG, SVG, JPG, PDF, Word).");
      return false;
    }
    setError("");
    return true;
  };

  const handleBpmnDrop = async (file) => {
    if (!validateFile(file, setBpmnError)) return;
    setUploadingBpmn(true);
    try {
      const doc = await uploadDocument(versionId, "BPMN", file, user?.id_user);
      setBpmn(doc);
    } catch (e) {
      setBpmnError(e?.response?.data?.detail ?? "Erreur lors de l'upload.");
    } finally {
      setUploadingBpmn(false);
    }
  };

  const handlePreuvesDrop = async (files) => {
    const valid = files.filter((f) => {
      if (!validateFile(f, setPrvError)) return false;
      return true;
    });
    if (!valid.length) return;
    setUploadingPrv(true);
    try {
      const uploaded = await Promise.all(valid.map((f) => uploadDocument(versionId, "Preuve", f, user?.id_user)));
      setPreuves((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setPrvError(e?.response?.data?.detail ?? "Erreur lors de l'upload.");
    } finally {
      setUploadingPrv(false);
    }
  };

  const handleDelete = async (doc) => {
    setDeletingId(doc.id_document);
    try {
      await deleteDocument(doc.id_document);
      if (doc.type_document === "BPMN") setBpmn(null);
      else setPreuves((prev) => prev.filter((d) => d.id_document !== doc.id_document));
    } finally {
      setDeletingId(null);
    }
  };

  const noVersion = !versionId;

  return (
    <div style={{ borderTop: `1px solid ${BORDER}` }}>
      {/* Section header */}
      <div className="flex items-center gap-3 px-6 py-3"
        style={{ backgroundColor: "#F9FAFB", borderBottom: `1px solid ${BORDER}` }}>
        <span
          className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold text-white"
          style={{ backgroundColor: PURPLE }}>
          {sectionIndex}
        </span>
        <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500">
          Documents &amp; Fichiers
        </span>
      </div>

      {/* Body */}
      <div className="bg-white px-6 py-5 space-y-6">
        {noVersion && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] text-slate-500">
            Enregistrez d'abord la fiche pour pouvoir ajouter des documents.
          </p>
        )}

        {!noVersion && (
          <>
            {/* BPMN field */}
            <div style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: "1.25rem" }}>
              {bpmn ? (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Diagramme BPMN
                  </p>
                  <FileCard
                    doc={bpmn}
                    onDelete={handleDelete}
                    deleting={deletingId === bpmn.id_document}
                  />
                </div>
              ) : (
                !readOnly && (
                  <SingleDropZone
                    label="Diagramme BPMN (un seul fichier)"
                    accept={ACCEPTED}
                    onFile={handleBpmnDrop}
                    uploading={uploadingBpmn}
                    error={bpmnError}
                  />
                )
              )}
              {readOnly && !bpmn && (
                <p className="text-[12px] italic text-slate-400">Aucun diagramme BPMN.</p>
              )}
            </div>

            {/* Preuves field */}
            <div>
              {!readOnly && (
                <MultiDropZone
                  label="Preuves de déroulement du processus"
                  accept={ACCEPTED}
                  onFiles={handlePreuvesDrop}
                  uploading={uploadingPrv}
                  error={prvError}
                />
              )}
              {readOnly && preuves.length === 0 && (
                <p className="text-[12px] italic text-slate-400">Aucune preuve.</p>
              )}
              {preuves.length > 0 && (
                <div className={`space-y-2 ${!readOnly ? "mt-3" : ""}`}>
                  {!readOnly && preuves.length > 0 && (
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Preuves ajoutées ({preuves.length})
                    </p>
                  )}
                  {preuves.map((doc) => (
                    <FileCard
                      key={doc.id_document}
                      doc={doc}
                      onDelete={handleDelete}
                      deleting={deletingId === doc.id_document}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
