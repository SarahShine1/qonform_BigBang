// frontend/src/pages/GestionDocumentaire.jsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Upload, FolderOpen, AlertCircle, CheckCircle } from 'lucide-react';
import DocumentPreview from '../components/documents/DocumentPreview';
import UploadModal from '../components/documents/UploadModal';
import { fetchDocuments, downloadDocument } from '../api/documents';

const PRIMARY = '#58148E';

export default function GestionDocumentaire({ user }) {
  const isChefProjet = user?.role === 'chef_projet';

  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchDocuments(search ? { search } : {});
      setDocuments(res.data);

      if (res.data.length > 0) {
        setSelected(prev => prev ?? res.data[0]);
      }
    } catch {
      notify('Erreur chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filtered = useMemo(() => {
    return documents.filter(d =>
      d.titre.toLowerCase().includes(search.toLowerCase())
    );
  }, [documents, search]);

  const handleUploadSuccess = (doc) => {
    setDocuments(prev => [doc, ...prev]);
    setSelected(doc);
    setShowUpload(false);
    notify('Document ajouté');
  };

  const handleDownload = async (doc) => {
    try {
      const res = await downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));

      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.titre}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch {
      notify('Erreur téléchargement', 'error');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">

      <main className="flex-1 flex flex-col">

        {/* Header */}
        <div className="p-6 bg-white border-b flex justify-between">
          <h1 className="font-semibold">Support documentaire</h1>

          {isChefProjet && (
            <button
              onClick={() => setShowUpload(true)}
              style={{ background: PRIMARY }}
              className="text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Upload size={14} />
              Upload
            </button>
          )}
        </div>

        {/* Search */}
        <div className="p-4 bg-white">
          <div className="relative w-60">
            <Search size={14} className="absolute left-2 top-2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 border rounded-lg px-2 py-1 text-sm w-full"
              placeholder="Rechercher..."
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <div className="text-gray-400 text-center mt-10">
                <FolderOpen className="mx-auto mb-2" />
                Aucun document
              </div>
            ) : (
              filtered.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelected(doc)}
                  className="p-3 bg-white rounded-lg mb-2 cursor-pointer hover:bg-gray-50"
                >
                  {doc.titre}
                </div>
              ))
            )}
          </div>

          {/* Preview */}
          {selected && (
            <DocumentPreview
              document={selected}
              onDownload={() => handleDownload(selected)}
            />
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
          primaryColor={PRIMARY}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded text-white
          ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}