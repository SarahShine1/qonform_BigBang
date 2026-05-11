import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Edit2,
  GitBranch,
  Minus,
  Network,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Button } from "./ui/Button";

const connectorClass = "bg-[#BDAAF4]";

const typeLabels = {
  ROOT: "RACINE",
  DIRECTION: "DIRECTION",
  DEPARTMENT: "DEPARTEMENT",
  SERVICE: "SERVICE",
  CELLULE: "CELLULE",
};

function accentForUnit(unit) {
  const label = `${unit.name || ""} ${unit.displayCode || ""}`.toLowerCase();

  if (unit.type === "ROOT" || label.includes("direction")) {
    return {
      border: "border-violet-300",
      badge: "bg-violet-100 text-violet-700",
      icon: "bg-violet-50 text-violet-700",
    };
  }

  if (label.includes("qualit") || label.includes("cq")) {
    return {
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      icon: "bg-amber-50 text-amber-700",
    };
  }

  if (label.includes("ressource") || label.includes("rh")) {
    return {
      border: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
      icon: "bg-emerald-50 text-emerald-700",
    };
  }

  if (label.includes("informat") || label.includes("it")) {
    return {
      border: "border-sky-200",
      badge: "bg-sky-100 text-sky-700",
      icon: "bg-sky-50 text-sky-700",
    };
  }

  return {
    border: "border-[#E9E1F8]",
    badge: "bg-indigo-100 text-indigo-700",
    icon: "bg-indigo-50 text-indigo-700",
  };
}

function UnitIcon({ unit, className }) {
  if (unit?.type === "ROOT") return <Building2 className={className} />;
  if (unit?.type === "DIRECTION" || unit?.type === "DEPARTMENT") return <Network className={className} />;
  if (unit?.type === "SERVICE") return <Users className={className} />;
  return <GitBranch className={className} />;
}

function flattenTree(nodes, parent = null) {
  return nodes.flatMap((node) => [
    { ...node, parentName: parent?.name || null },
    ...flattenTree(node.children || [], node),
  ]);
}

function matchesFilters(unit, query, type) {
  const normalizedQuery = query.trim().toLowerCase();
  const haystack = `${unit.name || ""} ${unit.displayCode || ""} ${unit.type || ""}`.toLowerCase();
  const queryMatch = !normalizedQuery || haystack.includes(normalizedQuery);
  const typeMatch = type === "ALL" || unit.type === type;
  return queryMatch && typeMatch;
}

function filterTree(nodes, query, type) {
  return nodes
    .map((node) => {
      const children = filterTree(node.children || [], query, type);
      if (matchesFilters(node, query, type) || children.length > 0) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean);
}

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getEmployeeName(employee) {
  return `${employee?.prenom || ""} ${employee?.nom || ""}`.trim() || employee?.email || "";
}

function isPilot(employee) {
  return (employee?.roles || []).map(normalizeRole).some((role) => role.includes("PILOTE"));
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex min-h-[28px] items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 text-slate-500">
        <Icon className="h-3 w-3" />
      </div>
      <div className="min-w-0 text-[11px] text-slate-700">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {label}:
        </span>{" "}
        <span>{value || "—"}</span>
      </div>
    </div>
  );
}

function NodeCard({
  unit,
  level,
  selectedId,
  onSelect,
  canManage,
  onCreate,
  onEdit,
  onDelete,
}) {
  const accent = accentForUnit(unit);
  const isSelected = selectedId === unit.id;

  const sizes =
    level === 0
      ? {
          width: "w-[216px]",
          minHeight: "min-h-[72px]",
          padding: "px-3 py-3",
          iconWrap: "h-9 w-9",
          icon: "h-[18px] w-[18px]",
          title: "text-[12.5px]",
          code: "text-[10px]",
        }
      : level === 1
        ? {
            width: "w-[184px]",
            minHeight: "min-h-[60px]",
            padding: "px-2.5 py-2.5",
            iconWrap: "h-8 w-8",
            icon: "h-4 w-4",
            title: "text-[11.5px]",
            code: "text-[9.5px]",
          }
        : {
            width: "w-[152px]",
            minHeight: "min-h-[48px]",
            padding: "px-2 py-2",
            iconWrap: "h-6.5 w-6.5",
            icon: "h-3.5 w-3.5",
            title: "text-[10.5px]",
            code: "text-[9px]",
          };

  return (
    <button
      type="button"
      onClick={() => onSelect(unit)}
      className="group relative text-left transition-transform hover:-translate-y-px"
    >
      <div
        className={[
          "relative rounded-[12px] border bg-white shadow-[0_4px_14px_rgba(45,11,104,0.05)] transition",
          sizes.width,
          sizes.minHeight,
          sizes.padding,
          accent.border,
          isSelected ? "ring-1 ring-[#6B21D9]" : "",
        ].join(" ")}
      >
        {isSelected ? <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-[#F4B740]" /> : null}

        <div className="flex items-start gap-2.5">
          <div
            className={[
              "flex flex-shrink-0 items-center justify-center rounded-full",
              sizes.iconWrap,
              accent.icon,
            ].join(" ")}
          >
            <UnitIcon unit={unit} className={sizes.icon} />
          </div>

          <div className="min-w-0 flex-1">
            <p className={["truncate font-semibold leading-tight text-slate-900", sizes.title].join(" ")}>
              {unit.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={["font-medium uppercase tracking-[0.04em] text-slate-500", sizes.code].join(" ")}>
                {unit.displayCode || unit.code || "—"}
              </span>
              <span
                className={`inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${accent.badge}`}
              >
                {typeLabels[unit.type] || unit.type}
              </span>
            </div>
          </div>
        </div>

        {canManage ? (
          <div className="absolute -bottom-3 left-1/2 hidden -translate-x-1/2 gap-1 rounded-full border border-slate-200 bg-white px-1 py-1 shadow-sm group-hover:flex">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCreate(unit);
              }}
              className="rounded-full p-1 text-violet-700 transition hover:bg-violet-50"
              title="Ajouter"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(unit);
              }}
              className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100"
              title="Modifier"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(unit);
              }}
              className="rounded-full p-1 text-rose-500 transition hover:bg-rose-50"
              title="Supprimer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ) : null}
      </div>
    </button>
  );
}

function ServiceStack({ childrenUnits, level, selectedId, onSelect, canManage, onCreate, onEdit, onDelete }) {
  if (!childrenUnits.length) return null;

  return (
    <div className="mt-5 flex flex-col items-center">
      <div className={`h-4 w-px rounded-full ${connectorClass}`} />
      <div className="relative pt-4">
        {childrenUnits.length > 1 ? (
          <div className={`absolute left-[76px] right-[76px] top-0 h-px rounded-full ${connectorClass}`} />
        ) : null}
        <div className="flex items-start justify-center gap-4">
          {childrenUnits.map((child) => (
            <DirectionColumn
              key={child.id}
              unit={child}
              level={level}
              selectedId={selectedId}
              onSelect={onSelect}
              canManage={canManage}
              onCreate={onCreate}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DirectionColumn({ unit, level = 1, selectedId, onSelect, canManage, onCreate, onEdit, onDelete }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className={`absolute left-1/2 top-[-16px] h-[16px] w-px -translate-x-1/2 rounded-full ${connectorClass}`} />
      <NodeCard
        unit={unit}
        level={Math.min(level, 2)}
        selectedId={selectedId}
        onSelect={onSelect}
        canManage={canManage}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <ServiceStack
        childrenUnits={unit.children || []}
        level={level + 1}
        selectedId={selectedId}
        onSelect={onSelect}
        canManage={canManage}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

function RootTree({ root, selectedId, onSelect, canManage, onCreate, onEdit, onDelete }) {
  const children = root.children || [];

  return (
    <div className="flex flex-col items-center">
      <NodeCard
        unit={root}
        level={0}
        selectedId={selectedId}
        onSelect={onSelect}
        canManage={canManage}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {children.length > 0 ? (
        <div className="mt-6 flex flex-col items-center">
          <div className={`h-4 w-px rounded-full ${connectorClass}`} />
          <div className="relative pt-4">
            {children.length > 1 ? (
              <div className={`absolute left-[92px] right-[92px] top-0 h-px rounded-full ${connectorClass}`} />
            ) : null}
            <div className="flex items-start justify-center gap-5">
              {children.map((child) => (
                <DirectionColumn
                  key={child.id}
                  unit={child}
                  level={1}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  canManage={canManage}
                  onCreate={onCreate}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function OrgChart({
  tree = [],
  loading,
  error,
  canManage,
  employees = [],
  processes = [],
  onManage,
  onCreate,
  onEdit,
  onDelete,
}) {
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(100);
  const [selectedId, setSelectedId] = useState(null);
  const [detailsDismissed, setDetailsDismissed] = useState(false);
  const [processListOpen, setProcessListOpen] = useState(false);

  const filteredTree = useMemo(() => filterTree(tree, query, "ALL"), [tree, query]);
  const flatTree = useMemo(() => flattenTree(filteredTree), [filteredTree]);
  const hasTree = filteredTree.length > 0;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!flatTree.length) {
        setSelectedId(null);
        setDetailsDismissed(false);
        return;
      }
      if (detailsDismissed) {
        return;
      }
      if (!selectedId || !flatTree.some((unit) => unit.id === selectedId)) {
        setSelectedId(flatTree[0].id);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [flatTree, selectedId, detailsDismissed]);

  const selectedUnit = useMemo(() => {
    if (detailsDismissed || selectedId == null) return null;
    return flatTree.find((unit) => unit.id === selectedId) || null;
  }, [flatTree, selectedId, detailsDismissed]);

  const selectedAccent = selectedUnit ? accentForUnit(selectedUnit) : null;
  const selectedEmployees = useMemo(
    () =>
      selectedUnit
        ? employees.filter(
            (employee) => String(employee.departement ?? employee.id_departement ?? "") === String(selectedUnit.id),
          )
        : [],
    [employees, selectedUnit],
  );
  const selectedResponsible = useMemo(() => {
    if (!selectedUnit) return null;
    const assignedPilot = selectedEmployees.find(isPilot);
    if (assignedPilot) return assignedPilot;
    if (selectedUnit.responsable) return selectedUnit.responsable;
    return selectedEmployees[0] || null;
  }, [selectedEmployees, selectedUnit]);
  const selectedProcesses = useMemo(
    () =>
      selectedUnit
        ? processes.filter(
            (process) => String(process.id_departement ?? process.departement_id ?? "") === String(selectedUnit.id),
          )
        : [],
    [processes, selectedUnit],
  );

  const updateZoom = (delta) => {
    setZoom((current) => Math.max(80, Math.min(115, current + delta)));
  };

  return (
    <section className="rounded-[14px] border border-[#E9E1F8] bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E9E1F8] px-4 py-3">
        <label className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une unité..."
            className="h-9 w-full rounded-[10px] border border-[#E9E1F8] bg-white pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-300"
          />
        </label>

        <div className="flex h-9 items-center gap-1 rounded-[10px] border border-[#E9E1F8] bg-white px-1.5">
          <button
            type="button"
            onClick={() => updateZoom(-5)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[42px] text-center text-[12px] font-medium text-slate-700">{zoom}%</span>
          <button
            type="button"
            onClick={() => updateZoom(5)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {canManage ? (
          <Button
            onClick={onManage}
            className="h-9 rounded-[10px] bg-[#58148E] px-3.5 text-[12px] text-white hover:bg-[#4A1178]"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </Button>
        ) : null}
      </div>

      <div
        className={[
          "grid items-start bg-white",
          selectedUnit ? "grid-cols-[minmax(0,1fr)_280px]" : "grid-cols-1",
        ].join(" ")}
      >
        <div className="relative overflow-x-auto overflow-y-visible bg-[radial-gradient(circle_at_top,rgba(124,86,231,0.05),transparent_42%),linear-gradient(180deg,#ffffff_0%,#fcfbff_100%)] px-5 py-5">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-purple-100 text-sm text-gray-400">
              Chargement de l&apos;organigramme...
            </div>
          ) : null}

          {!loading && error ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {!loading && !error && !hasTree ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-purple-100 text-center text-sm text-slate-400">
              <Users className="mb-3 h-8 w-8 text-slate-300" />
              <p>Aucune unité ne correspond au filtre actuel.</p>
            </div>
          ) : null}

          {!loading && !error && hasTree ? (
            <div className="flex min-w-max justify-center pt-2">
              <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}>
                <div className="flex items-start justify-center gap-8 px-3 pb-4">
                  {filteredTree.map((root) => (
                    <RootTree
                      key={root.id}
                      root={root}
                      selectedId={selectedId}
                      onSelect={(unit) => {
                        setDetailsDismissed(false);
                        setProcessListOpen(false);
                        setSelectedId(unit.id);
                      }}
                      canManage={canManage}
                      onCreate={onCreate}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {selectedUnit ? (
        <aside className="w-[280px] border-l border-[#E9E1F8] bg-white p-3">
            <>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[13px] font-semibold text-slate-900">Détails de l&apos;unité</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setDetailsDismissed(true);
                    setProcessListOpen(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 flex items-start gap-2.5">
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    selectedAccent?.icon || "bg-violet-50 text-violet-700",
                  ].join(" ")}
                >
                  <UnitIcon unit={selectedUnit} className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold leading-tight text-slate-900">{selectedUnit.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${selectedAccent?.badge || ""}`}
                    >
                      {typeLabels[selectedUnit.type] || selectedUnit.type}
                    </span>
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                      {selectedUnit.displayCode || selectedUnit.code || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 space-y-2">
                <DetailRow icon={Tag} label="Code" value={selectedUnit.displayCode || selectedUnit.code} />
                <DetailRow icon={Network} label="Type" value={typeLabels[selectedUnit.type] || selectedUnit.type} />
                <DetailRow icon={GitBranch} label="Parent" value={selectedUnit.parentName || "—"} />
                <DetailRow
                  icon={UserRound}
                  label="Responsable"
                  value={selectedResponsible ? getEmployeeName(selectedResponsible) : "Aucun responsable"}
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProcessListOpen((open) => !open)}
                    className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#E9E1F8] text-[11px] font-medium text-[#6B21D9] transition hover:bg-[#FBF8FF]"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Processus lies ({selectedProcesses.length})
                  </button>

                  {processListOpen ? (
                    <div className="absolute left-0 right-0 top-9 z-20 rounded-[12px] border border-[#E9E1F8] bg-white p-2 shadow-[0_14px_28px_rgba(45,11,104,0.12)]">
                      {selectedProcesses.length > 0 ? (
                        <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                          {selectedProcesses.map((process) => (
                            <div
                              key={process.id_processus}
                              className="rounded-[9px] border border-slate-100 bg-slate-50 px-2.5 py-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-[11px] font-semibold text-slate-800">{process.nom}</p>
                                <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-semibold text-slate-500">
                                  {process.type_process}
                                </span>
                              </div>
                              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                                {process.code_process}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="px-2 py-4 text-center text-[11px] text-slate-400">
                          Aucun processus rattache a ce departement.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
                <DetailRow icon={CircleCheck} label="Statut" value="Actif" />
                <DetailRow icon={CalendarDays} label="Créé le" value={selectedUnit.createdAt || "—"} />
                <DetailRow icon={CalendarDays} label="Mise à jour" value={selectedUnit.updatedAt || "—"} />
              </div>

              {canManage ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(selectedUnit)}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#E9E1F8] text-[12px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(selectedUnit)}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-rose-200 text-[12px] font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                </div>
              ) : null}
            </>
        </aside>
        ) : null}
      </div>
    </section>
  );
}
