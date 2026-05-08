// frontend/src/components/documents/UploadModal.jsx

import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { uploadDocument } from '../../api/documents';

export default function UploadModal({ onClose, onSuccess, primaryColor }) {
  const [titre, setTitre] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateAndSetFile = (f) => {
    if (!f) return;

    if (f.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.');
      return;
    }

    if (f.size > 20 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 20 Mo.');
      return;
    }

    setFile(f);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!file) return setError('Veuillez sélectionner un fichier PDF.');
    if (!titre.trim()) return setError('Le nom du document est requis.');

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append('file', file);
      fd.append('titre', titre);

      const res = await uploadDocument(fd);

      onSuccess(res.data);
    } catch (err) {
      setError("Erreur lors de l'upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[440px]">

        {/* Header */}
        <div className="flex justify-between px-6 py-5 border-b">
          <h2 className="text-sm font-semibold">Uploader un document</h2>
          <button onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">

          {/* Drop zone */}
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl py-8 text-center cursor-pointer
              ${dragging ? 'border-purple-400' : 'border-gray-200'}`}
          >
            {file ? (
              <div>
                <CheckCircle2 className="mx-auto text-green-500" />
                <p className="text-sm">{file.name}</p>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto text-gray-400" />
                <p className="text-sm text-gray-500">Glisser ou cliquer</p>
              </div>
            )}

            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => validateAndSetFile(e.target.files?.[0])}
            />
          </label>

          {/* Titre */}
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Nom du document"
            className="border rounded-lg px-3 py-2 text-sm"
          />

          {/* Error */}
          {error && (
            <div className="text-red-500 text-sm flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border rounded-lg py-2">
            Annuler
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ background: primaryColor }}
            className="flex-1 text-white rounded-lg py-2"
          >
            {loading ? 'Upload...' : 'Uploader'}
          </button>
        </div>
      </div>
    </div>
  );
}