import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
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

const PURPLE = "#58148E";
const PURPLE_LIGHT = "#EDE9FE";
const BORDER = "#D1D5DB";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

function AddNormeForm({ onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    code: "",
    version: "",
    titre: "",
    date_publication: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const inputCls =
    "w-full rounded-lg border px-3 py-2 text-[12.5px] text-slate-700 outline-none focus:ring-1 focus:ring-[#58148E]/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        style={{ border: "1px solid #E5E7EB" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <p className="text-[14px] font-bold text-slate-800">Nouvelle norme</p>
        </div>
        <div className="space-y-3 px-6 py-4">
          {[
            { key: "code", label: "Code", placeholder: "ex : ISO 9001" },
            { key: "version", label: "Version", placeholder: "ex : 2015" },
            {
              key: "titre",
              label: "Titre",
              placeholder: "Systèmes de management de la qualité…",
            },
            {
              key: "date_publication",
              label: "Date de publication",
              placeholder: "",
              type: "date",
            },
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
    </div>
  );
}

function NormeCard({ norme, onToggle, onDelete, onOpen }) {
  return (
    <div
      className="group flex cursor-pointer items-center gap-4 rounded-xl border bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
      style={{ borderColor: norme.est_active ? PURPLE : BORDER }}
      onClick={onOpen}
    >
      {/* Icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: norme.est_active ? PURPLE : PURPLE_LIGHT }}
      >
        <BookOpen
          size={18}
          style={{ color: norme.est_active ? "#fff" : PURPLE }}
          strokeWidth={1.8}
        />
      </div>

      {/* Info */}
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
          {norme.date_publication && (
            <span>Publiée le {fmtDate(norme.date_publication)}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex shrink-0 items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
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
          {norme.est_active ? (
            <ToggleRight size={15} />
          ) : (
            <ToggleLeft size={15} />
          )}
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

export default function CanevasFichePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [normes, setNormes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type: "toggle"|"delete", norme }

  const userName =
    `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() ||
    user?.email ||
    "Utilisateur";
  const userRole = user?.roles?.[0] ?? "";

  const load = () => {
    setLoading(true);
    getNormes()
      .then(setNormes)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

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
    if (!norme.est_active) {
      const active = normes.find((n) => n.est_active);
      if (active) {
        setConfirm({ type: "toggle", norme });
        return;
      }
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
      }),
    );
    setConfirm(null);
  };

  const handleDelete = (norme) => {
    setConfirm({ type: "delete", norme });
  };

  const doDelete = async (norme) => {
    await deleteNorme(norme.id_norme);
    setNormes((prev) => prev.filter((n) => n.id_norme !== norme.id_norme));
    setConfirm(null);
  };

  return (
    <AppLayout
      pageTitle="Canevas fiche"
      userName={userName}
      userRole={userRole}
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-[16px] font-bold text-slate-800"></h1>
            <p className="text-[11.5px] text-slate-400">
              Une seule norme peut être active à la fois. Les sections de la
              fiche sont liées à la norme active.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-white shadow transition"
            style={{ backgroundColor: PURPLE }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#45107A")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = PURPLE)
            }
          >
            <Plus size={14} /> Ajouter une norme
          </button>
        </div>

        {/* List */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-[13px] text-slate-400">
            Chargement…
          </div>
        )}

        {!loading && normes.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-16">
            <BookOpen size={28} className="text-slate-300" />
            <p className="text-[13px] text-slate-400">
              Aucune norme enregistrée
            </p>
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
              onOpen={() =>
                navigate(`/cartographie/canevas-fiche/${norme.id_norme}`)
              }
              onToggle={() => handleToggle(norme)}
              onDelete={() => handleDelete(norme)}
            />
          ))}
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

      {/* Toggle confirmation */}
      {confirm?.type === "toggle" && (
        <ConfirmationPopup
          title="Changer la norme active ?"
          message={`La norme actuellement active sera désactivée. "${confirm.norme.code} — ${confirm.norme.titre}" deviendra la nouvelle norme active et ses sections apparaîtront dans le formulaire fiche.`}
          confirmLabel="Changer la norme active"
          onConfirm={() => doToggle(confirm.norme)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Delete confirmation */}
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
