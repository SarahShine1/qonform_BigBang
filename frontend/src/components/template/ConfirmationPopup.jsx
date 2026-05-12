import { AlertTriangle, X } from "lucide-react";

export default function ConfirmationPopup({ title, message, confirmLabel = "Confirmer", onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <AlertTriangle size={18} className="text-amber-500" />
            </span>
            <p className="text-[14px] font-bold text-slate-800">{title}</p>
          </div>
          <button type="button" onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <p className="px-6 pb-5 text-[13px] text-slate-500 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50">
            Annuler
          </button>
          <button type="button" onClick={onConfirm}
            className="rounded-xl px-5 py-2 text-[12px] font-semibold text-white transition"
            style={{ backgroundColor: "#58148E" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#45107A")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#58148E")}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
