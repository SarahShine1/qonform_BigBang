import { useState } from "react";
import {
  Search,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FolderPlus,
  SlidersHorizontal,
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";
import { useDocuments } from "../hooks/useDocuments";
import { useAuth } from "../hooks/useAuth";
import DocumentRow from "../components/documents/DocumentRow";
import DocumentPreviewPanel from "../components/documents/DocumentPreviewPanel";
import UploadModal from "../components/documents/UploadModal";
import { TYPE_DOCUMENT_OPTIONS, TYPE_SUPPORT_OPTIONS } from "../api/documents";

export default function DocumentationPage() {
  const { user } = useAuth();
  const isCAQ = user?.roles?.some((r) =>
    ["CAQ", "ADMIN", "Admin"].includes(r)
  );

  const {
    documents,
    pagination,
    loading,
    error,
    filters,
    applyFilters,
    goToPage,
    upload,
    remove,
  } = useDocuments();

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const userName =
    `${user?.prenom || ""} ${user?.nom || ""}`.trim() ||
    user?.email ||
    "Utilisateur";
  const userRole = user?.roles?.[0] || "Utilisateur";

  const handleDocClick = (doc) => {
    setSelectedDoc((prev) =>
      prev?.id_document === doc.id_document ? null : doc
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce document définitivement ?")) return;
    await remove(id);
    if (selectedDoc?.id_document === id) setSelectedDoc(null);
  };

  const handleExport = () => {
    const headers = [
      "Fichier",
     
      "Type support",
     
      "Date",
      "Déposé par",
      "Taille",
    ];
    const rows = documents.map((d) => [
      d.nom_fichier,
   
      d.type_support ?? "",
      
   
      d.date_upload,
      d.depose_par,
      d.taille ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "documents.csv";
    a.click();
  };

  const hasFilters =
    filters.search || filters.type_support;

  return (
    <AppLayout
      pageTitle="Support Documentaire"
      userName={userName}
      userRole={userRole}
    >
      <div className="flex gap-4 h-full">

        {/* ─── COLONNE PRINCIPALE ─── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* HEADER */}
          <div className="rounded-[16px] border border-[#E9E1F8] bg-white px-5 py-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-semibold text-slate-900">
                  Support Documentaire
                </h1>
                <p className="text-[12px] text-slate-500">
                  Guides d'audit, réglementations, normes et manuels qualité
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[12px] hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exporter le registre
                </button>

                {isCAQ && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="inline-flex items-center gap-2 rounded-[10px] bg-purple-700 px-3 py-2 text-[12px] text-white hover:bg-purple-800 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Importer un document
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* FILTRES */}
          <div className="rounded-[14px] border bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">

              {/* Recherche */}
              <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  className="w-full text-[13px] outline-none placeholder:text-gray-300"
                  placeholder="Rechercher un document…"
                  value={filters.search}
                  onChange={(e) => applyFilters({ search: e.target.value })}
                />
              </div>

              <div className="w-px h-5 bg-gray-200" />

             

              {/* Filtre type support */}
              <select
                value={filters.type_support}
                onChange={(e) =>
                  applyFilters({ type_support: e.target.value })
                }
                className="text-[12px] text-slate-600 border rounded-[8px] px-2.5 py-1.5 outline-none focus:border-purple-400 bg-white"
              >
                <option value="">Type de support</option>
                {TYPE_SUPPORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {/* Reset filtres */}
              {hasFilters && (
                <button
                  onClick={() =>
                    applyFilters({
                      search: "",
                    
                      type_support: "",
                    })
                  }
                  className="text-[12px] text-purple-600 hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="rounded-[16px] border bg-white shadow-sm overflow-hidden">

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 py-12 text-red-500 text-[13px]">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <FolderPlus className="w-8 h-8" />
                <p className="text-[13px]">Aucun document trouvé</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">Fichier</th>
                    <th className="pr-4 py-3">Support</th>
                   
                    
                    <th className="pr-4 py-3">Date dépôt</th>
                    <th className="pr-4 py-3">Déposé par</th>
                    <th className="pr-4 py-3">Taille</th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map((doc) => (
                    <DocumentRow
                      key={doc.id_document}
                      document={doc}
                      isSelected={selectedDoc?.id_document === doc.id_document}
                      onClick={() => handleDocClick(doc)}
                    />
                  ))}
                </tbody>
              </table>
            )}

            {/* PAGINATION */}
            {!loading && !error && documents.length > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3 text-[12px] text-slate-500">
                <p>
                  Affichage de{" "}
                  <span className="font-medium text-slate-700">
                    {(pagination.page - 1) * pagination.page_size + 1} à{" "}
                    {Math.min(
                      pagination.page * pagination.page_size,
                      pagination.total_items
                    )}
                  </span>{" "}
                  sur {pagination.total_items} documents
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Numéros de pages */}
                  {Array.from(
                    { length: Math.min(pagination.total_pages, 5) },
                    (_, i) => i + 1
                  ).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`rounded-lg w-7 h-7 text-[12px] font-medium ${
                        p === pagination.page
                          ? "bg-purple-700 text-white"
                          : "hover:bg-gray-100 text-slate-500"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.total_pages}
                    className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── PANNEAU PRÉVISUALISATION ─── */}
        {selectedDoc && (
          <div className="w-72 shrink-0">
            <DocumentPreviewPanel
              document={selectedDoc}
              onClose={() => setSelectedDoc(null)}
              onDelete={handleDelete}
              isCAQ={isCAQ}
            />
          </div>
        )}
      </div>

      {/* MODAL UPLOAD */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={upload}
        />
      )}
    </AppLayout>
  );
}