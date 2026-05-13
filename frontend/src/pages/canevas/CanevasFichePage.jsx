import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import ConfirmationPopup from "../../components/template/ConfirmationPopup";
import { useAuth } from "../../hooks/useAuth";
import {
  getNormes,
  createNorme,
  deleteNorme,
  toggleNormeActive,
} from "../../api/fiches.api";

const PURPLE       = "#58148E";
const PURPLE_LIGHT = "#EDE9FE";
const BORDER       = "#D1D5DB";

const ISO_ARTICLES = [
  { num: "1", titre: "Contexte de l'organisme" },
  { num: "2", titre: "Leadership" },
  { num: "3", titre: "Planification" },
  { num: "4", titre: "Support" },
  { num: "5", titre: "Réalisation des activités opérationnelles" },
  { num: "6", titre: "Évaluation des performances" },
  { num: "7", titre: "Amélioration" },
  { num: "8", titre: "Documents et preuves" },
];

// ── ISO Reminder panel content (shared) ──────────────────────────────────────
function IsoArticlesList() {
  return (
    <>
      <p className="mb-3 text-[10.5px] italic leading-relaxed text-violet-500">
        Pour une norme ISO, les sections de votre fiche correspondent généralement aux articles suivants :
      </p>
      <div className="space-y-2">
        {ISO_ARTICLES.map((a) => (
          <div key={a.num} className="flex items-center gap-2.5">
            <span
              className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[5px] text-[9.5px] font-bold text-white"
              style={{ backgroundColor: PURPLE }}
            >
              {a.num}
            </span>
            <span className="text-[11px] font-medium leading-tight text-violet-900">{a.titre}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Sidebar ISO panel (page principale, right side) ───────────────────────────
function IsoSidePanel({ open, onToggle }) {
  return (
    <div className="flex shrink-0 items-start" style={{ width: open ? 256 : 32 }}>
      {open ? (
        <div
          className="relative w-64 overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(160deg, #f5f3ff 0%, #ede9fe 55%, #ddd6fe 100%)",
            border: "1px solid #c4b5fd",
          }}
        >
          {/* Decorative blob */}
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }}
          />
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ backgroundColor: PURPLE }}
              >
                <Info size={12} className="text-white" />
              </span>
              <p className="text-[11.5px] font-bold" style={{ color: PURPLE }}>
                Rappel ISO
              </p>
            </div>
            <button
              type="button"
              onClick={onToggle}
              title="Masquer"
              className="flex h-6 w-6 items-center justify-center rounded-lg transition hover:bg-violet-100"
              style={{ color: PURPLE }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="px-4 pb-4">
            <IsoArticlesList />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          title="Afficher le rappel ISO"
          className="flex h-8 w-8 items-center justify-center rounded-xl transition hover:bg-violet-100"
          style={{ border: "1px solid #c4b5fd", backgroundColor: PURPLE_LIGHT, color: PURPLE }}
        >
          <ChevronLeft size={14} />
        </button>
      )}
    </div>
  );
}

// ── Fixed ISO panel (inside popup backdrop) ───────────────────────────────────
function IsoFixedPanel({ open, onToggle }) {
  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
      {open ? (
        <div
          className="relative w-60 overflow-hidden rounded-2xl shadow-xl"
          style={{
            background: "linear-gradient(160deg, #f5f3ff 0%, #ede9fe 55%, #ddd6fe 100%)",
            border: "1px solid #c4b5fd",
          }}
        >
          {/* Decorative blob */}
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }}
          />
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ backgroundColor: PURPLE }}
              >
                <Info size={12} className="text-white" />
              </span>
              <p className="text-[11.5px] font-bold" style={{ color: PURPLE }}>
                Rappel ISO
              </p>
            </div>
            <button
              type="button"
              onClick={onToggle}
              title="Masquer"
              className="flex h-6 w-6 items-center justify-center rounded-lg transition hover:bg-violet-100"
              style={{ color: PURPLE }}
            >
              <ChevronLeft size={14} />
            </button>
          </div>
          <div className="px-4 pb-4">
            <IsoArticlesList />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          title="Afficher le rappel ISO"
          className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg transition hover:scale-105"
          style={{ border: "1px solid #c4b5fd", backgroundColor: PURPLE, color: "#fff" }}
        >
          <Info size={15} />
        </button>
      )}
    </div>
  );
}

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

// ── Add norme modal ───────────────────────────────────────────────────────────
function AddNormeForm({ onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    code: "",
    version: "",
    titre: "",
    date_publication: "",
  });
  const [isoOpen, setIsoOpen] = useState(true);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const inputCls =
    "w-full rounded-lg border px-3 py-2 text-[12.5px] text-slate-700 outline-none focus:ring-1 focus:ring-[#58148E]/30";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Row: form (left) + ISO panel (right, aligned to bottom) */}
      <div className="flex items-end gap-4">

        {/* ── Form modal ── */}
        <div
          className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
          style={{ border: "1px solid #E5E7EB", minWidth: 400 }}
        >
          {/* Purple header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ backgroundColor: PURPLE }}
          >
            <p className="text-[14px] font-bold text-white">Nouvelle norme</p>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 transition hover:bg-white/20 text-[18px] leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 px-6 py-4">
            {[
              { key: "code",             label: "Code",                placeholder: "ex : ISO 9001" },
              { key: "version",          label: "Version",             placeholder: "ex : 2015" },
              { key: "titre",            label: "Titre",               placeholder: "Systèmes de management de la qualité…" },
              { key: "date_publication", label: "Date de publication", placeholder: "", type: "date" },
            ].map(({ key, label, placeholder, type = "text" }) => (
              <div key={key}>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className={inputCls}
                  style={{ borderColor: BORDER }}
                />
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-end gap-2 px-6 py-4"
            style={{ borderTop: `1px solid ${BORDER}` }}
          >
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!form.code || !form.titre || saving}
              onClick={() => onSave(form)}
              className="rounded-xl px-5 py-2 text-[12px] font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: PURPLE }}
            >
              {saving ? "Création…" : "Créer"}
            </button>
          </div>
        </div>

        {/* ── ISO panel to the right ── */}
        {isoOpen ? (
          <div
            className="relative w-56 overflow-hidden rounded-2xl shadow-xl self-end mb-2"
            style={{
              background: "linear-gradient(160deg, #f5f3ff 0%, #ede9fe 55%, #ddd6fe 100%)",
              border: "1px solid #c4b5fd",
            }}
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25"
              style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: PURPLE }}>
                  <Info size={11} className="text-white" />
                </span>
                <p className="text-[11px] font-bold" style={{ color: PURPLE }}>Rappel ISO</p>
              </div>
              <button
                type="button"
                onClick={() => setIsoOpen(false)}
                className="flex h-5 w-5 items-center justify-center rounded-lg transition hover:bg-violet-200"
                style={{ color: PURPLE }}
                title="Masquer"
              >
                <ChevronRight size={13} />
              </button>
            </div>
            <div className="px-4 pb-4">
              <IsoArticlesList />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsoOpen(true)}
            title="Afficher le rappel ISO"
            className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl shadow-lg transition hover:scale-105"
            style={{ border: "1px solid #c4b5fd", backgroundColor: PURPLE, color: "#fff" }}
          >
            <Info size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Norme card ────────────────────────────────────────────────────────────────
function NormeCard({ norme, onToggle, onDelete, onOpen }) {
  return (
    <div
      className="group flex cursor-pointer items-center gap-4 rounded-xl border bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
      style={{ borderColor: norme.est_active ? PURPLE : BORDER }}
      onClick={onOpen}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: norme.est_active ? PURPLE : PURPLE_LIGHT }}
      >
        <BookOpen size={18} style={{ color: norme.est_active ? "#fff" : PURPLE }} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-slate-800">
            {norme.code} — {norme.titre}
          </p>
          {norme.est_active && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}
            >
              <CheckCircle2 size={10} /> Active
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <span>Version {norme.version}</span>
          {norme.date_publication && <span>Publiée le {fmtDate(norme.date_publication)}</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          title={norme.est_active ? "Désactiver" : "Activer"}
          onClick={onToggle}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition"
          style={{
            backgroundColor: norme.est_active ? "#EDE9FE" : "#F3F4F6",
            color: norme.est_active ? PURPLE : "#6B7280",
          }}
        >
          {norme.est_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
          {norme.est_active ? "Active" : "Activer"}
        </button>
        <button
          type="button"
          title="Supprimer"
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-400"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CanevasFichePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [normes,  setNormes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [isoOpen, setIsoOpen] = useState(true);

  const userName = `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() || user?.email || "Utilisateur";
  const userRole = user?.roles?.[0] ?? "";

  const load = () => {
    setLoading(true);
    getNormes().then(setNormes).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      const created = await createNorme(data);
      setNormes((n) => [...n, created]);
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (norme) => {
    if (!norme.est_active && normes.find((n) => n.est_active)) {
      setConfirm({ type: "toggle", norme });
      return;
    }
    await doToggle(norme);
  };

  const doToggle = async (norme) => {
    const updated = await toggleNormeActive(norme.id_norme);
    setNormes((prev) =>
      prev.map((n) => {
        if (n.id_norme === updated.id_norme) return updated;
        if (updated.est_active) return { ...n, est_active: false };
        return n;
      })
    );
    setConfirm(null);
  };

  const doDelete = async (norme) => {
    await deleteNorme(norme.id_norme);
    setNormes((prev) => prev.filter((n) => n.id_norme !== norme.id_norme));
    setConfirm(null);
  };

  return (
    <AppLayout pageTitle="Canevas fiche" userName={userName} userRole={userRole}>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Top bar: title left + button right ── */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11.5px] text-slate-400">
              Une seule norme peut être active à la fois. Les sections de la fiche sont liées à la norme active.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-white shadow transition"
            style={{ backgroundColor: PURPLE }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#45107A")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PURPLE)}
          >
            <Plus size={14} /> Ajouter une norme
          </button>
        </div>

        {/* ── Two-column layout: list (left) + ISO panel (right) ── */}
        <div className="flex items-start gap-5">

          {/* List */}
          <div className="flex-1 min-w-0">
            {loading && (
              <div className="flex items-center justify-center py-16 text-[13px] text-slate-400">
                Chargement…
              </div>
            )}

            {!loading && normes.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-16">
                <BookOpen size={28} className="text-slate-300" />
                <p className="text-[13px] text-slate-400">Aucune norme enregistrée</p>
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="mt-1 rounded-lg px-4 py-1.5 text-[12px] font-semibold text-white"
                  style={{ backgroundColor: PURPLE }}
                >
                  Ajouter la première norme
                </button>
              </div>
            )}

            <div className="space-y-3">
              {normes.map((norme) => (
                <NormeCard
                  key={norme.id_norme}
                  norme={norme}
                  onOpen={() => navigate(`/cartographie/canevas-fiche/${norme.id_norme}`)}
                  onToggle={() => handleToggle(norme)}
                  onDelete={() => setConfirm({ type: "delete", norme })}
                />
              ))}
            </div>
          </div>

          {/* ISO sidebar */}
          <div className="sticky top-4">
            <IsoSidePanel open={isoOpen} onToggle={() => setIsoOpen((o) => !o)} />
          </div>
        </div>
      </div>

      {/* Add norme popup */}
      {showAdd && (
        <AddNormeForm
          saving={saving}
          onSave={handleCreate}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {confirm?.type === "toggle" && (
        <ConfirmationPopup
          title="Changer la norme active ?"
          message={`La norme actuellement active sera désactivée. "${confirm.norme.code} — ${confirm.norme.titre}" deviendra la nouvelle norme active et ses sections apparaîtront dans le formulaire fiche.`}
          confirmLabel="Changer la norme active"
          onConfirm={() => doToggle(confirm.norme)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm?.type === "delete" && (
        <ConfirmationPopup
          title="Supprimer cette norme ?"
          message={`La norme "${confirm.norme.code} — ${confirm.norme.titre}" sera supprimée définitivement avec toutes ses sections et champs.`}
          confirmLabel="Supprimer"
          onConfirm={() => doDelete(confirm.norme)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </AppLayout>
  );
}
