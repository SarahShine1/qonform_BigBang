import {
  BookOpen,
  Loader2,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createDictionaryTerm,
  fetchDictionaryTerms,
  updateDictionaryTerm,
} from "../../api/dictionary.api";
import { useAuth } from "../../hooks/useAuth";
import { TOPBAR_HEIGHT } from "./layout.constants";

const MANAGER_ROLES = [
  "Chef cellule qualité",
  "CAQ",
  "Auditeur interne",
  "Auditeur",
  "Admin",
  "ADMIN",
];

const CATEGORY_OPTIONS = [
  { value: "Qualite", label: "Qualité" },
  { value: "Audit", label: "Audit" },
  { value: "Processus", label: "Processus" },
  { value: "ISO 9001", label: "ISO 9001" },
  { value: "Documentaire", label: "Documentaire" },
  { value: "Risque", label: "Risque" },
  { value: "Indicateur", label: "Indicateur" },
  { value: "Autre", label: "Autre" },
];

const CATEGORY_STYLES = {
  Qualite: "bg-violet-100 text-violet-700",
  Audit: "bg-cyan-100 text-cyan-700",
  Processus: "bg-emerald-100 text-emerald-700",
  "ISO 9001": "bg-amber-100 text-amber-700",
  Documentaire: "bg-slate-100 text-slate-700",
  Risque: "bg-rose-100 text-rose-700",
  Indicateur: "bg-teal-100 text-teal-700",
  Autre: "bg-[#F3E8FF] text-[#58148E]",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function formatApiError(error, fallbackMessage) {
  const detail =
    error?.response?.data?.detail ||
    error?.response?.data?.term?.[0] ||
    error?.response?.data?.definition?.[0] ||
    error?.response?.data?.category?.[0] ||
    error?.response?.data?.synonyms?.[0] ||
    error?.response?.data?.non_field_errors?.[0];
  return detail || fallbackMessage;
}

function formatDate(value) {
  if (!value) return "";
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return "";
  }
}

function buildInitialFormState(entry = null) {
  return {
    term: entry?.term || "",
    category: entry?.category || "Qualite",
    definition: entry?.definition || "",
    example: entry?.example || "",
    synonyms: Array.isArray(entry?.synonyms) ? entry.synonyms.join(", ") : "",
  };
}

export default function DictionaryPanel({ open, onClose }) {
  const { user } = useAuth();
  const [terms, setTerms] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formValues, setFormValues] = useState(buildInitialFormState());

  const canManageDictionary = useMemo(() => {
    const allowed = new Set(MANAGER_ROLES.map(normalizeRole));
    return (user?.roles || []).map(normalizeRole).some((role) => allowed.has(role));
  }, [user?.roles]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchValue]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let cancelled = false;

    async function loadTerms() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchDictionaryTerms(debouncedSearch);
        if (!cancelled) {
          setTerms(data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(formatApiError(requestError, "Impossible de charger le dictionnaire."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTerms();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, open]);

  if (!open) {
    return null;
  }

  function resetForm() {
    setEditingEntry(null);
    setShowForm(false);
    setSaveError("");
    setFormValues(buildInitialFormState());
  }

  function openCreateForm() {
    setEditingEntry(null);
    setShowForm(true);
    setSaveError("");
    setFormValues(buildInitialFormState());
  }

  function openEditForm(entry) {
    setEditingEntry(entry);
    setShowForm(true);
    setSaveError("");
    setFormValues(buildInitialFormState(entry));
  }

  async function refreshTerms() {
    const data = await fetchDictionaryTerms(debouncedSearch);
    setTerms(data);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");

    try {
      const payload = {
        term: formValues.term,
        category: formValues.category,
        definition: formValues.definition,
        example: formValues.example,
        synonyms: formValues.synonyms,
      };

      if (editingEntry?.id) {
        await updateDictionaryTerm(editingEntry.id, payload);
      } else {
        await createDictionaryTerm(payload);
      }

      await refreshTerms();
      resetForm();
    } catch (requestError) {
      setSaveError(
        formatApiError(requestError, "Impossible d'enregistrer ce terme.")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed right-4 z-40 flex w-[min(408px,calc(100vw-20px))] flex-col overflow-hidden rounded-[18px] border border-[#E9E1F8] bg-white shadow-[0_24px_60px_rgba(49,16,92,0.18)]"
      style={{
        top: TOPBAR_HEIGHT + 14,
        maxHeight: `calc(100vh - ${TOPBAR_HEIGHT + 28}px)`,
      }}
      role="dialog"
      aria-modal="false"
      aria-label="Dictionnaire qualité"
    >
      <div className="border-b border-[#EEE7FA] bg-[linear-gradient(135deg,#FCFAFF_0%,#FFFFFF_100%)] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F3E8FF] text-[#58148E]">
              <BookOpen className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-slate-900">
                Dictionnaire qualité
              </p>
              <div className="mt-1 h-[3px] w-16 rounded-full bg-[#D4A017]" />
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Recherchez un terme qualité, audit ou processus.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Fermer le dictionnaire qualité"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="border-b border-[#EEE7FA] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Rechercher un mot..."
              className="h-10 w-full rounded-[12px] border border-[#E4D8F6] bg-[#FCFAFF] pl-9 pr-3 text-[12px] text-slate-700 outline-none transition focus:border-[#58148E]"
            />
          </label>

          {canManageDictionary ? (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-10 items-center gap-1.5 rounded-[12px] bg-[#58148E] px-3 text-[11px] font-semibold text-white transition hover:bg-[#4A1278]"
              aria-label="Ajouter un terme au dictionnaire"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un terme
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#FFFEFF] px-4 py-3">
        {showForm && canManageDictionary ? (
          <form
            onSubmit={handleSubmit}
            className="mb-4 rounded-[16px] border border-[#E9E1F8] bg-[#FCFAFF] p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold text-slate-900">
                  {editingEntry ? "Modifier le terme" : "Ajouter un terme"}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Renseignez une définition claire et concise.
                </p>
              </div>
            </div>

            {saveError ? (
              <div className="mb-3 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                {saveError}
              </div>
            ) : null}

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-slate-600">
                  Terme
                </span>
                <input
                  type="text"
                  value={formValues.term}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      term: event.target.value,
                    }))
                  }
                  required
                  className="h-10 w-full rounded-[12px] border border-[#E4D8F6] bg-white px-3 text-[12px] text-slate-700 outline-none transition focus:border-[#58148E]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-slate-600">
                  Catégorie
                </span>
                <select
                  value={formValues.category}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-[12px] border border-[#E4D8F6] bg-white px-3 text-[12px] text-slate-700 outline-none transition focus:border-[#58148E]"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-slate-600">
                  Définition
                </span>
                <textarea
                  rows={4}
                  value={formValues.definition}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      definition: event.target.value,
                    }))
                  }
                  required
                  className="w-full resize-none rounded-[12px] border border-[#E4D8F6] bg-white px-3 py-2 text-[12px] text-slate-700 outline-none transition focus:border-[#58148E]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-slate-600">
                  Exemple
                </span>
                <textarea
                  rows={3}
                  value={formValues.example}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      example: event.target.value,
                    }))
                  }
                  className="w-full resize-none rounded-[12px] border border-[#E4D8F6] bg-white px-3 py-2 text-[12px] text-slate-700 outline-none transition focus:border-[#58148E]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-slate-600">
                  Synonymes
                </span>
                <input
                  type="text"
                  value={formValues.synonyms}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      synonyms: event.target.value,
                    }))
                  }
                  placeholder="Ex: NC, écart, anomalie"
                  className="h-10 w-full rounded-[12px] border border-[#E4D8F6] bg-white px-3 text-[12px] text-slate-700 outline-none transition focus:border-[#58148E]"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-9 items-center rounded-[10px] border border-[#E4D8F6] px-3 text-[11px] font-medium text-slate-600 transition hover:bg-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#58148E] px-3 text-[11px] font-semibold text-white transition hover:bg-[#4A1278] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Enregistrer
              </button>
            </div>
          </form>
        ) : null}

        {error ? (
          <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 rounded-[14px] border border-dashed border-[#DCCBFA] bg-white px-4 py-4 text-[12px] text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement du dictionnaire...
          </div>
        ) : terms.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#DCCBFA] bg-white px-4 py-6 text-center text-[12px] text-slate-500">
            Aucun terme trouvé.
          </div>
        ) : (
          <div className="space-y-3">
            {terms.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[14px] border border-[#E9E1F8] bg-[#FCFAFF] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[13px] font-semibold text-slate-900">
                        {entry.term}
                      </h3>
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold",
                          CATEGORY_STYLES[entry.category] || CATEGORY_STYLES.Autre,
                        ].join(" ")}
                      >
                        {CATEGORY_OPTIONS.find((option) => option.value === entry.category)?.label ||
                          entry.category}
                      </span>
                    </div>
                  </div>

                  {canManageDictionary ? (
                    <button
                      type="button"
                      onClick={() => openEditForm(entry)}
                      className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#E4D8F6] bg-white text-[#58148E] transition hover:bg-[#F8F2FF]"
                      aria-label={`Modifier le terme ${entry.term}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>

                <p className="mt-2 text-[12px] leading-5 text-slate-600">
                  {entry.definition}
                </p>

                {entry.example ? (
                  <p className="mt-2 text-[11px] italic leading-5 text-slate-500">
                    Exemple: {entry.example}
                  </p>
                ) : null}

                {Array.isArray(entry.synonyms) && entry.synonyms.length > 0 ? (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Synonymes: {entry.synonyms.join(", ")}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.08em] text-slate-400">
                  {entry.created_by_name ? <span>Par {entry.created_by_name}</span> : null}
                  {entry.updated_at ? <span>Mis à jour le {formatDate(entry.updated_at)}</span> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
