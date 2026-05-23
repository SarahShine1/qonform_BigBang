import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Eye,
  GripVertical,
  Info,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import AddChampPopup from "../../components/template/AddChampPopup";
import ConfirmationPopup from "../../components/template/ConfirmationPopup";
import { useAuth } from "../../hooks/useAuth";
import {
  getNormes,
  getSectionTemplates,
  getChampTemplates,
  createSection,
  updateSection,
  deleteSection,
  createChamp,
  updateChamp,
  deleteChamp,
} from "../../api/fiches.api";

const PURPLE = "#58148E";
const PURPLE_LIGHT = "#EDE9FE";
const BORDER = "#D1D5DB";

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

function CollapsibleIsoHint() {
  const [open, setOpen] = useState(true);
  return (
    <div
      className="mb-3 overflow-hidden rounded-xl"
      style={{
        border: "1px solid #c4b5fd",
        background: open
          ? "linear-gradient(135deg,#f5f3ff,#ede9fe)"
          : "#faf5ff",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-violet-50"
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full shrink-0"
          style={{ backgroundColor: PURPLE }}
        >
          <Info size={10} className="text-white" />
        </span>
        <span
          className="flex-1 text-[11px] font-semibold"
          style={{ color: PURPLE }}
        >
          Rappel — Articles standard ISO
        </span>
        {open ? (
          <ChevronDown size={13} style={{ color: PURPLE }} />
        ) : (
          <ChevronRight size={13} style={{ color: PURPLE }} />
        )}
      </button>
      {open && (
        <div className="px-3 pb-3">
          <p className="mb-2 text-[10px] text-violet-500 italic">
            Pour une norme ISO, les sections correspondent généralement aux
            articles :
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {ISO_ARTICLES.map((a) => (
              <div key={a.num} className="flex items-center gap-2">
                <span
                  className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] text-[8.5px] font-bold text-white"
                  style={{ backgroundColor: PURPLE }}
                >
                  {a.num}
                </span>
                <span className="text-[10px] font-medium text-violet-800 leading-tight">
                  {a.titre}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

let _tempCounter = 0;
const tempId = () => `temp_${++_tempCounter}`;

const TYPE_LABELS = {
  text: "Texte",
  checklist: "Checklist",
  tableau: "Tableau",
};

// ── Champ row ────────────────────────────────────────────────────────────────
function ChampRow({
  champ,
  editMode,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}) {
  return (
    <div
      draggable={editMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex items-center gap-2 px-4 py-2.5 transition"
      style={{
        borderTop: `1px solid ${BORDER}`,
        opacity: isDragging ? 0.4 : 1,
        cursor: editMode ? "grab" : "default",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Left: delete + grip */}
      {editMode && (
        <>
          <button
            type="button"
            onClick={() => onDelete(champ)}
            className="shrink-0 rounded-lg p-1 text-red-300 transition hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={13} />
          </button>
          <GripVertical size={13} className="shrink-0 text-slate-300" />
        </>
      )}

      {/* Type badge */}
      <span
        className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
      >
        {TYPE_LABELS[champ.type_champ] ?? champ.type_champ}
      </span>

      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-slate-700">
        {champ.libelle}
      </span>

      {champ.est_obligatoire && (
        <span className="shrink-0 text-[10px] font-bold text-red-400">*</span>
      )}

      {champ._pending && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
          style={{ backgroundColor: PURPLE_LIGHT, color: PURPLE }}
        >
          Non enregistré
        </span>
      )}
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function SectionCard({
  section,
  editMode,
  onAddChamp,
  onDeleteChamp,
  onDeleteSection,
  onSectionDragStart,
  onSectionDragOver,
  onSectionDrop,
  onChampDragStart,
  onChampDragOver,
  onChampDrop,
  draggingChamp,
}) {
  const visibleChamps = section.champs.filter((c) => !c._deleted);

  return (
    <div
      draggable={editMode}
      onDragStart={onSectionDragStart}
      onDragOver={onSectionDragOver}
      onDrop={onSectionDrop}
      className="overflow-hidden rounded-xl bg-white"
      style={{ border: `1px solid ${BORDER}` }}
    >
      {/* Section header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          backgroundColor: "#F9FAFB",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        {editMode && (
          <GripVertical
            size={14}
            className="shrink-0 cursor-grab text-slate-300 active:cursor-grabbing"
          />
        )}
        <span
          className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold text-white"
          style={{ backgroundColor: PURPLE }}
        >
          {section.ordre}
        </span>
        <span className="flex-1 text-[10.5px] font-bold uppercase tracking-widest text-slate-500">
          {section.nom}
        </span>

        {editMode && (
          <div className="flex items-center gap-2">
            {/* Add champ — outlined green */}
            <button
              type="button"
              onClick={() => onAddChamp(section)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition hover:bg-emerald-50"
              style={{
                border: "1.5px dashed #6EE7B7",
                color: "#065F46",
                backgroundColor: "transparent",
              }}
            >
              <Plus size={11} /> Ajouter un champ
            </button>
            {/* Delete section */}
            <button
              type="button"
              onClick={() => onDeleteSection(section)}
              className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-400"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Champs */}
      <div>
        {visibleChamps.length === 0 && (
          <p
            className="px-4 py-3 text-[11.5px] italic text-slate-400"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Aucun champ —{" "}
            {editMode ? "cliquez « Ajouter un champ »." : "section vide."}
          </p>
        )}
        {visibleChamps.map((champ, ci) => (
          <ChampRow
            key={champ.id_champ_template}
            champ={champ}
            editMode={editMode}
            onDelete={onDeleteChamp}
            onDragStart={() =>
              onChampDragStart(section.id_section_template, ci)
            }
            onDragOver={(e) => {
              e.stopPropagation();
              onChampDragOver(e);
            }}
            onDrop={(e) => {
              e.stopPropagation();
              onChampDrop(section.id_section_template, ci);
            }}
            isDragging={
              draggingChamp?.sectionId === section.id_section_template &&
              draggingChamp?.champIdx === ci
            }
          />
        ))}
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function NormeTemplatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [norme, setNorme] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [addChampFor, setAddChampFor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [addingSect, setAddingSect] = useState(false);
  const [newSectName, setNewSectName] = useState("");

  const sectionDragIdx = useRef(null);
  const champDragRef = useRef(null); // { sectionId, champIdx }
  const [draggingChamp, setDraggingChamp] = useState(null);

  const userName =
    `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() ||
    user?.email ||
    "Utilisateur";
  const userRole = user?.roles?.[0] ?? "";

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadSections = useCallback(async () => {
    const raw = await getSectionTemplates({ id_norme: id });
    const withChamps = await Promise.all(
      raw.map(async (s) => {
        const champs = await getChampTemplates(s.id_section_template);
        return { ...s, champs };
      }),
    );
    setSections(withChamps.sort((a, b) => a.ordre - b.ordre));
  }, [id]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const normes = await getNormes();
        setNorme(normes.find((n) => String(n.id_norme) === String(id)) ?? null);
        await loadSections();
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, loadSections]);

  // ── Add section (immediate — needs real id for champs) ────────────────────
  const handleAddSection = async () => {
    if (!newSectName.trim()) return;
    const created = await createSection({
      nom: newSectName.trim(),
      id_norme: Number(id),
      ordre: sections.length + 1,
    });
    setSections((prev) => [...prev, { ...created, champs: [] }]);
    setNewSectName("");
    setAddingSect(false);
  };

  // ── Delete section (immediate) ────────────────────────────────────────────
  const doDeleteSection = async (section) => {
    await deleteSection(section.id_section_template);
    setSections((prev) =>
      prev.filter((s) => s.id_section_template !== section.id_section_template),
    );
    setConfirm(null);
  };

  // ── Add champ (buffered in local state) ───────────────────────────────────
  const handleAddChamp = (data) => {
    const newChamp = {
      id_champ_template: tempId(),
      id_section_template: addChampFor.id_section_template,
      libelle: data.libelle,
      type_champ: data.type_champ,
      placeholder: data.placeholder,
      aide: data.aide,
      est_obligatoire: data.est_obligatoire,
      ordre: addChampFor.champs.filter((c) => !c._deleted).length + 1,
      colonnes: data.colonnes ?? [],
      options: data.options ?? [],
      _pending: true,
    };
    setSections((prev) =>
      prev.map((s) =>
        s.id_section_template === addChampFor.id_section_template
          ? { ...s, champs: [...s.champs, newChamp] }
          : s,
      ),
    );
    setAddChampFor(null);
  };

  // ── Delete champ (buffered) ───────────────────────────────────────────────
  const handleDeleteChamp = (champ) => {
    if (champ._pending) {
      // Not saved yet — just remove from state
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          champs: s.champs.filter(
            (c) => c.id_champ_template !== champ.id_champ_template,
          ),
        })),
      );
    } else {
      setConfirm({ type: "champ", target: champ });
    }
  };

  const doDeleteChamp = (champ) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        champs: s.champs.map((c) =>
          c.id_champ_template === champ.id_champ_template
            ? { ...c, _deleted: true }
            : c,
        ),
      })),
    );
    setConfirm(null);
  };

  // ── Global save ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        const visible = section.champs.filter((c) => !c._deleted);

        // Create pending champs
        for (let i = 0; i < visible.length; i++) {
          const champ = visible[i];
          if (champ._pending) {
            await createChamp({
              id_section_template: section.id_section_template,
              libelle: champ.libelle,
              type_champ: champ.type_champ,
              placeholder: champ.placeholder,
              aide: champ.aide,
              est_obligatoire: champ.est_obligatoire,
              ordre: i + 1,
              colonnes: champ.colonnes,
              options: champ.options,
            });
          } else if (champ.ordre !== i + 1) {
            // Order changed
            await updateChamp(champ.id_champ_template, { ordre: i + 1 });
          }
        }

        // Hard-delete marked champs
        for (const champ of section.champs.filter(
          (c) => c._deleted && !c._pending,
        )) {
          await deleteChamp(champ.id_champ_template);
        }
      }
      await loadSections();
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel — reload from API ──────────────────────────────────────────────
  const handleCancel = async () => {
    setLoading(true);
    await loadSections();
    setLoading(false);
  };

  const hasPendingChanges = sections.some((s) =>
    s.champs.some((c) => c._pending || c._deleted),
  );

  // ── Section drag ──────────────────────────────────────────────────────────
  const handleSectionDragStart = (idx) => {
    sectionDragIdx.current = idx;
  };
  const handleSectionDragOver = (e) => {
    e.preventDefault();
  };
  const handleSectionDrop = async (targetIdx) => {
    const from = sectionDragIdx.current;
    if (from === null || from === targetIdx) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(targetIdx, 0, moved);
    const withOrdre = reordered.map((s, i) => ({ ...s, ordre: i + 1 }));
    setSections(withOrdre);
    sectionDragIdx.current = null;
    await Promise.all(
      withOrdre.map((s) =>
        updateSection(s.id_section_template, { ordre: s.ordre }),
      ),
    );
  };

  // ── Champ drag within section ─────────────────────────────────────────────
  const handleChampDragStart = (sectionId, champIdx) => {
    champDragRef.current = { sectionId, champIdx };
    setDraggingChamp({ sectionId, champIdx });
  };
  const handleChampDragOver = (e) => {
    e.preventDefault();
  };
  const handleChampDrop = (targetSectionId, targetIdx) => {
    const drag = champDragRef.current;
    if (!drag || drag.sectionId !== targetSectionId) return;
    if (drag.champIdx === targetIdx) {
      setDraggingChamp(null);
      return;
    }
    setSections((prev) =>
      prev.map((s) => {
        if (s.id_section_template !== targetSectionId) return s;
        const visible = s.champs.filter((c) => !c._deleted);
        const hidden = s.champs.filter((c) => c._deleted);
        const [moved] = visible.splice(drag.champIdx, 1);
        visible.splice(targetIdx, 0, moved);
        return {
          ...s,
          champs: [
            ...visible.map((c, i) => ({ ...c, ordre: i + 1 })),
            ...hidden,
          ],
        };
      }),
    );
    champDragRef.current = null;
    setDraggingChamp(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout
      pageTitle="Canevas fiche"
      userName={userName}
      userRole={userRole}
    >
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="pb-12">
        {/* Row 1 — Breadcrumb */}
        <div className="mb-3 flex items-center gap-1.5 text-[12px] text-slate-500">
          <button
            type="button"
            onClick={() => navigate("/cartographie/canevas-fiche")}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronLeft size={14} /> Normes
          </button>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <BookOpen size={13} style={{ color: PURPLE }} />
            <span className="font-semibold text-slate-700">
              {norme ? `${norme.code} ${norme.version}` : `Norme #${id}`}
            </span>
          </div>
        </div>

        {/* Row 2 — Controls bar */}
        <div className="mb-4 flex items-center justify-between">
          {/* Left: edit mode toggle */}
          <button
            type="button"
            onClick={() => setEditMode((m) => !m)}
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-semibold transition"
            style={
              editMode
                ? {
                    backgroundColor: "#fff",
                    borderColor: PURPLE,
                    color: PURPLE,
                  }
                : {
                    backgroundColor: "#F3F4F6",
                    borderColor: "#E5E7EB",
                    color: "#6B7280",
                  }
            }
          >
            {editMode ? <Pencil size={13} /> : <Eye size={13} />}
            {editMode ? "Mode édition" : "Mode lecture"}
          </button>

          {/* Center: hint (edit mode only) */}
          {editMode && (
            <p className="hidden text-[11px] text-slate-400 sm:block">
              Icône rouge pour supprimer un champ · + Ajouter pour en créer un
              nouveau
            </p>
          )}

          {/* Right: cancel + save */}
          {editMode && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasPendingChanges}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: PURPLE }}
                onMouseEnter={(e) =>
                  !saving && (e.currentTarget.style.backgroundColor = "#45107A")
                }
                onMouseLeave={(e) =>
                  !saving && (e.currentTarget.style.backgroundColor = PURPLE)
                }
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />{" "}
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Save size={13} /> Enregistrer
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Add section bar */}
        {editMode && (
          <div className="mb-4">
            {addingSect ? (
              <div className="flex flex-col gap-2">
                <CollapsibleIsoHint />
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newSectName}
                    onChange={(e) => setNewSectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSection();
                      if (e.key === "Escape") setAddingSect(false);
                    }}
                    placeholder="Nom de la section…"
                    className="flex-1 rounded-xl border px-4 py-2 text-[12.5px] text-slate-700 outline-none focus:ring-1 focus:ring-[#58148E]/30"
                    style={{ borderColor: PURPLE }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSection}
                    disabled={!newSectName.trim()}
                    className="rounded-xl px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50 transition"
                    style={{ backgroundColor: PURPLE }}
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingSect(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingSect(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-white transition"
                style={{ backgroundColor: PURPLE }}
              >
                <Plus size={13} /> Ajouter une section
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-[13px] text-slate-400">
            <Loader2
              size={18}
              className="mr-2 animate-spin"
              style={{ color: PURPLE }}
            />{" "}
            Chargement…
          </div>
        )}

        {/* Empty state */}
        {!loading && sections.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-16">
            <p className="text-[13px] text-slate-400">
              Aucune section pour cette norme.
            </p>
            {editMode && (
              <button
                type="button"
                onClick={() => setAddingSect(true)}
                className="mt-1 rounded-lg px-4 py-1.5 text-[12px] font-semibold text-white"
                style={{ backgroundColor: PURPLE }}
              >
                Ajouter la première section
              </button>
            )}
          </div>
        )}

        {/* Sections list */}
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <SectionCard
              key={section.id_section_template}
              section={section}
              editMode={editMode}
              onAddChamp={(s) => setAddChampFor(s)}
              onDeleteChamp={handleDeleteChamp}
              onDeleteSection={(s) =>
                setConfirm({ type: "section", target: s })
              }
              onSectionDragStart={() => handleSectionDragStart(idx)}
              onSectionDragOver={handleSectionDragOver}
              onSectionDrop={() => handleSectionDrop(idx)}
              onChampDragStart={handleChampDragStart}
              onChampDragOver={handleChampDragOver}
              onChampDrop={handleChampDrop}
              draggingChamp={draggingChamp}
            />
          ))}
        </div>
      </div>

      {/* Add champ popup */}
      {addChampFor && (
        <AddChampPopup
          onAdd={handleAddChamp}
          onCancel={() => setAddChampFor(null)}
        />
      )}

      {/* Confirm delete champ (existing only) */}
      {confirm?.type === "champ" && (
        <ConfirmationPopup
          title="Supprimer ce champ ?"
          message={`Le champ "${confirm.target.libelle}" sera marqué pour suppression. Cliquez sur Enregistrer pour appliquer.`}
          confirmLabel="Marquer pour suppression"
          onConfirm={() => doDeleteChamp(confirm.target)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Confirm delete section */}
      {confirm?.type === "section" && (
        <ConfirmationPopup
          title="Supprimer cette section ?"
          message={`La section "${confirm.target.nom}" et tous ses champs seront supprimés définitivement.`}
          confirmLabel="Supprimer"
          onConfirm={() => doDeleteSection(confirm.target)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </AppLayout>
  );
}
