// frontend/src/components/documents/DocumentPreview.jsx

import { Download, Eye, User, Calendar, FileText } from 'lucide-react';

const PRIMARY = '#58148E';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function DocumentPreview({ document, onDownload }) {
  return (
    <aside className="w-[280px] border-l border-gray-100 bg-white flex flex-col shrink-0 overflow-y-auto">
      <div className="p-5 flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center"
            style={{ borderColor: PRIMARY }}>
            <span className="text-[9px] font-bold" style={{ color: PRIMARY }}>i</span>
          </div>
          <span className="text-[12px] font-medium text-gray-500">Aperçu du document</span>
        </div>

        {/* PDF thumbnail */}
        <div className="rounded-2xl border border-gray-100 bg-[#FAFAFA] flex flex-col
          items-center justify-center py-9 mb-6">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
            style={{ background: '#FEE2E2' }}>
            <div className="flex flex-col items-center">
              <FileText size={20} className="text-red-400" strokeWidth={1.8} />
              <span className="text-[8px] font-bold text-red-500 mt-0.5 tracking-widest">PDF</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 truncate max-w-[180px] text-center px-2">
            {document.fichier || `${document.titre}.pdf`}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-5 flex-1">

          {/* Nom */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Nom du document
            </p>
            <p className="text-[13px] font-semibold text-gray-800 leading-snug">
              {document.titre}
            </p>
          </div>

          {/* Date */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={11} className="text-gray-400" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Date de publication
              </p>
            </div>
            <p className="text-[13px] font-semibold text-gray-800">
              {fmtDate(document.date_publication)}
            </p>
          </div>

          {/* Publié par */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <User size={11} className="text-gray-400" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Publié par
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ background: PRIMARY }}>
                {document.publie_par_nom?.charAt(0) || '?'}
              </div>
              <p className="text-[13px] font-semibold text-gray-800">
                {document.publie_par_nom || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-6">
          <button
            onClick={onDownload}
            className="w-full py-2.5 rounded-xl text-white text-[13px] font-medium
              flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98]
              transition-all shadow-sm"
            style={{ background: PRIMARY }}>
            <Eye size={14} strokeWidth={2.2} />
            Consulter
          </button>

          <button
            onClick={onDownload}
            className="w-full py-2.5 rounded-xl text-[13px] font-medium flex items-center
              justify-center gap-2 border border-gray-200 text-gray-600
              hover:bg-gray-50 active:scale-[0.98] transition-all">
            <Download size={14} strokeWidth={2.2} />
            Télécharger
          </button>
        </div>

      </div>
    </aside>
  );
}
