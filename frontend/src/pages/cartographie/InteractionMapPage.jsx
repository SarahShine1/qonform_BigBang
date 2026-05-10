import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Briefcase,
  Download,
  Factory,
  FileOutput,
  GitBranch,
  Network,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../hooks/useAuth";
import { getProcessInteractions } from "../../api/processInteractions.api";

const FILTERS = [
  { label: "Tous", value: "all" },
  { label: "Pilotage", value: "Management" },
  { label: "Réalisation", value: "Realisation" },
  { label: "Support", value: "Support" },
];

const TYPE_STYLES = {
  Management: {
    label: "Pilotage",
    badge: "bg-[#F4EAFF] text-[#6B21D9]",
    iconBg: "bg-[#F2EAFF]",
    iconColor: "text-[#6B21D9]",
  },
  Realisation: {
    label: "Réalisation",
    badge: "bg-[#EEE7FF] text-[#6D28D9]",
    iconBg: "bg-[#F0E9FF]",
    iconColor: "text-[#6B21D9]",
  },
  Support: {
    label: "Support",
    badge: "bg-[#EAFBF7] text-[#0F766E]",
    iconBg: "bg-[#E8FAF4]",
    iconColor: "text-[#0F766E]",
  },
};

const SURFACE_CLASS =
  "rounded-[14px] border border-[#E9E1F8] bg-white shadow-[0_10px_22px_rgba(88,20,142,0.045)]";

function getTypeStyle(type) {
  return (
    TYPE_STYLES[type] ?? {
      label: type || "Processus",
      badge: "bg-slate-100 text-slate-600",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    }
  );
}

function GoldUnderline({ className = "" }) {
  return (
    <span
      className={`mt-1.5 block h-[2px] w-8 rounded-full bg-[#F4B740] ${className}`}
    />
  );
}

function SectionAccent({ color, className = "" }) {
  return (
    <span
      className={`mt-1 block h-[2px] w-6 rounded-full ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}

function ProcessIcon({ type, size = "sm", className = "" }) {
  const style = getTypeStyle(type);

  const sizes = {
    xs: { wrapper: "h-7 w-7 rounded-[9px]", icon: 13 },
    sm: { wrapper: "h-8 w-8 rounded-[10px]", icon: 14 },
    md: { wrapper: "h-9 w-9 rounded-[12px]", icon: 16 },
    lg: { wrapper: "h-11 w-11 rounded-[14px]", icon: 20 },
  };

  const current = sizes[size] ?? sizes.sm;

  let Icon = Factory;
  if (type === "Management") Icon = Briefcase;
  if (type === "Support") Icon = ShieldCheck;

  return (
    <div
      className={`flex shrink-0 items-center justify-center ${current.wrapper} ${style.iconBg} ${className}`}
    >
      <Icon
        size={current.icon}
        strokeWidth={1.9}
        className={style.iconColor}
      />
    </div>
  );
}

function TypeBadge({ type, label, className = "" }) {
  const style = getTypeStyle(type);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-[3px] text-[9px] font-semibold leading-none ${style.badge} ${className}`}
    >
      {label || style.label}
    </span>
  );
}

function CounterBadge({ icon: Icon, value, color, bg }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-[2px] text-[9px] font-semibold leading-none"
      style={{ color, backgroundColor: bg }}
    >
      <Icon size={9.5} strokeWidth={2.3} />
      {value}
    </span>
  );
}

function HeroSection() {
  return (
    <section className={`${SURFACE_CLASS} px-5 py-3.5`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="m-0 text-[23px] font-semibold tracking-[-0.035em] text-slate-900">
            Interactions entre{" "}
            <span className="text-[#6B21D9]">processus</span>
          </h1>
          <GoldUnderline />
          <p className="mt-2 text-[12px] leading-5 text-slate-500">
            Visualisez les relations en amont et en aval entre les processus de
            l&apos;organisation.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-[11px] border border-[#A78BFA] px-3.5 text-[12px] font-semibold text-[#6B21D9] transition hover:bg-[#FAF7FF]"
        >
          <Download size={14} strokeWidth={2} />
          Exporter la cartographie
        </button>
      </div>
    </section>
  );
}

function ProcessFilters({ search, onSearchChange, activeFilter, onFilterChange }) {
  return (
    <div>
      <div className="relative">
        <Search
          size={14}
          strokeWidth={2}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher un processus..."
          className="h-9 w-full rounded-[11px] border border-[#E9E1F8] bg-[#FEFDFF] pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A78BFA] focus:ring-2 focus:ring-[#EEE6FF]"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onFilterChange(filter.value)}
              className={`rounded-full px-3 py-1.5 text-[10.5px] font-semibold transition ${
                active
                  ? "bg-gradient-to-r from-[#58148E] to-[#7C3AED] text-white shadow-[0_8px_18px_rgba(107,33,217,0.20)]"
                  : "border border-[#E7DDF8] bg-white text-[#6B21D9] hover:border-[#CEB5F8] hover:bg-[#FCFAFF]"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProcessListCard({ process, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(process.id)}
      className={`w-full rounded-[12px] border px-2.5 py-2 text-left transition ${
        selected
          ? "border-[#9B77F3] bg-[#FBF8FF] shadow-[0_10px_22px_rgba(88,20,142,0.08)]"
          : "border-[#ECE4FA] bg-white shadow-[0_6px_14px_rgba(88,20,142,0.03)] hover:border-[#D8C5FA] hover:shadow-[0_10px_20px_rgba(88,20,142,0.06)]"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <ProcessIcon type={process.type} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold leading-4 text-slate-900">
                {process.name}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {process.code}
                </span>
                <TypeBadge type={process.type} label={process.typeLabel} />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <CounterBadge
                icon={ArrowUp}
                value={process.upstream?.length ?? 0}
                color="#7C3AED"
                bg="#F5EFFF"
              />
              <CounterBadge
                icon={ArrowDown}
                value={process.downstream?.length ?? 0}
                color="#0F766E"
                bg="#EAFBF7"
              />
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
            <User size={10.5} strokeWidth={2.1} className="text-[#8B5CF6]" />
            <span className="truncate">
              {process.responsable || "Responsable non renseigné"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ProcessListPanel({
  processes,
  filteredProcesses,
  selectedId,
  search,
  setSearch,
  activeFilter,
  setActiveFilter,
  setSelectedId,
}) {
  return (
    <section className={`${SURFACE_CLASS} p-4`}>
      <ProcessFilters
        search={search}
        onSearchChange={setSearch}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <div className="mt-3 space-y-2">
        {processes.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#E9E1F8] px-4 py-8 text-center text-[12px] text-slate-400">
            Aucun processus disponible.
          </div>
        ) : filteredProcesses.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#E9E1F8] px-4 py-8 text-center text-[12px] text-slate-400">
            Aucun processus ne correspond à votre recherche.
          </div>
        ) : (
          filteredProcesses.map((process) => (
            <ProcessListCard
              key={process.id}
              process={process}
              selected={process.id === selectedId}
              onSelect={setSelectedId}
            />
          ))
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#F3EDFC] pt-2.5 text-[11px] text-slate-400">
        <span>{filteredProcesses.length} processus</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="rounded-full px-1.5 py-0.5 text-slate-300 transition hover:bg-[#F7F2FF] hover:text-[#6B21D9]"
          >
            ‹
          </button>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6B21D9] text-[10px] font-semibold text-white">
            1
          </span>
          <button
            type="button"
            className="rounded-full px-1.5 py-0.5 text-slate-300 transition hover:bg-[#F7F2FF] hover:text-[#6B21D9]"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}

function PanelTitle({ title, highlight }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-slate-900">
        <span>{title}</span>
        {highlight ? (
          <span className="text-[#6B21D9]">{highlight}</span>
        ) : null}
      </div>
      <GoldUnderline className="w-8" />
    </div>
  );
}

function InteractionNodeCard({ process, side, emptyLabel }) {
  const isEmpty = !process;
  const isDownstream = side === "downstream";
  const accent = isDownstream ? "#67D5C5" : "#B794F4";

  if (isEmpty) {
    return (
      <div className="flex h-[56px] items-center rounded-[10px] border border-dashed border-[#E7DFF5] bg-[#FEFDFF] px-3 text-[8.7px] text-slate-400">
        {emptyLabel || "Aucun processus"}
      </div>
    );
  }

  return (
    <div
      className="h-[56px] rounded-[10px] border border-[#ECE4FA] bg-white px-3 py-1.5 shadow-[0_6px_14px_rgba(88,20,142,0.035)]"
      style={{
        boxShadow: `0 6px 14px rgba(88,20,142,0.035), inset 0 0 0 1px ${accent}14`,
      }}
    >
      <div className="flex h-full items-center gap-2">
        <ProcessIcon type={process.type} size="xs" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[8.9px] font-semibold leading-3 text-slate-900">
            {process.name}
          </p>

          <div className="mt-1 flex items-center gap-1.5">
            <span className="truncate text-[6.8px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {process.code}
            </span>

            <TypeBadge
              type={process.type}
              label={process.typeLabel || getTypeStyle(process.type).label}
              className="px-1.5 py-[2px] text-[6.8px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


function EmptyNodeCard({ label }) {
  return (
    <div className="flex h-[56px] items-center rounded-[10px] border border-dashed border-[#E7DDF8] bg-[#FCFAFF] px-3 text-[8.7px] text-slate-400">
      {label}
    </div>
  );
}

function FlowArrow({ side = "upstream" }) {
  const isDownstream = side === "downstream";
  const color = isDownstream ? "#56CFC0" : "#A855F7";
  const markerId = `flow-arrow-${side}`;

  return (
    <div className="flex h-[56px] items-center justify-center">
      <svg
        width="52"
        height="20"
        viewBox="0 0 52 20"
        fill="none"
        className="h-[20px] w-[52px] overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0 0L6 3L0 6Z" fill={color} />
          </marker>
        </defs>

        <circle cx="4" cy="10" r="2.2" fill="white" stroke={color} strokeWidth="1.4" />

        <path
          d="M7 10 C16 10 18 4 30 4 H38 C44 4 45 10 49 10"
          stroke={color}
          strokeWidth="1.55"
          strokeLinecap="round"
          markerEnd={`url(#${markerId})`}
        />
      </svg>
    </div>
  );
}

function SelectedProcessCard({ process }) {
  const versionLabel =
    typeof process?.version === "string"
      ? process.version
      : process?.version?.numero || process?.version?.label || null;

  return (
    <div className="w-full max-w-[164px] rounded-[15px] border border-[#BFA4FA] bg-white px-3 py-3.5 text-center shadow-[0_10px_20px_rgba(88,20,142,0.06)]">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#F2EAFF]">
        <ProcessIcon
          type={process.type}
          size="md"
          className="h-10 w-10 rounded-full bg-transparent"
        />
      </div>

      <h3 className="mt-2.5 text-[11.5px] font-semibold leading-4 text-slate-900">
        {process.name}
      </h3>

      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1">
        <TypeBadge
          type={process.type}
          label={process.typeLabel}
          className="px-1.5 py-[2px] text-[7.5px]"
        />

        {versionLabel ? (
          <span className="rounded-full bg-[#F5F3FF] px-1.5 py-[2px] text-[7.5px] font-semibold text-[#7C3AED]">
            {versionLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1 text-[8.5px] text-slate-500">
        <User size={9} strokeWidth={2} className="text-[#8B5CF6]" />
        <span className="truncate">
          {process.responsable || "Responsable non renseigné"}
        </span>
      </div>

      <div className="mx-auto mt-2.5 h-[2px] w-7 rounded-full bg-[#F4B740]" />
    </div>
  );
}

function DesktopInteractionMap({ process }) {
  const upstream = process?.upstream ?? [];
  const downstream = process?.downstream ?? [];
  const rowCount = Math.max(upstream.length, downstream.length, 1);

  const rows = Array.from({ length: rowCount }, (_, index) => ({
    upstream: upstream[index] ?? null,
    downstream: downstream[index] ?? null,
  }));

  return (
    <div className="hidden xl:block">
      <div className="grid grid-cols-[154px_52px_148px_52px_154px] items-end justify-center gap-x-2">
        <div>
          <h3 className="text-[11px] font-semibold text-slate-900">En amont</h3>
          <SectionAccent color="#8B5CF6" />
        </div>

        <div />
        <div />
        <div />

        <div>
          <h3 className="text-[11px] font-semibold text-slate-900">En aval</h3>
          <SectionAccent color="#14B8A6" />
        </div>
      </div>

      <div
        className="mt-3 grid min-h-[320px] grid-cols-[154px_52px_148px_52px_154px] items-center justify-center gap-x-2 gap-y-1.5"
        style={{
          gridTemplateRows: `repeat(${rowCount}, minmax(56px, 1fr))`,
        }}
      >
        {rows.map((row, index) => (
          <div key={`interaction-row-${index}`} className="contents">
            <div className="self-center" style={{ gridColumn: 1, gridRow: index + 1 }}>
              {row.upstream ? (
                <InteractionNodeCard process={row.upstream} side="upstream" />
              ) : index === 0 && upstream.length === 0 ? (
                <EmptyNodeCard label="Aucun processus en amont" />
              ) : null}
            </div>

            <div className="self-center" style={{ gridColumn: 2, gridRow: index + 1 }}>
              {row.upstream ? <FlowArrow side="upstream" /> : null}
            </div>

            <div className="self-center" style={{ gridColumn: 4, gridRow: index + 1 }}>
              {row.downstream ? <FlowArrow side="downstream" /> : null}
            </div>

            <div className="self-center" style={{ gridColumn: 5, gridRow: index + 1 }}>
              {row.downstream ? (
                <InteractionNodeCard process={row.downstream} side="downstream" />
              ) : index === 0 && downstream.length === 0 ? (
                <EmptyNodeCard label="Aucun processus en aval" />
              ) : null}
            </div>
          </div>
        ))}

        <div
          className="flex items-center justify-center"
          style={{
            gridColumn: 3,
            gridRow: `1 / span ${rowCount}`,
          }}
        >
          <SelectedProcessCard process={process} />
        </div>
      </div>
    </div>
  );
}


function MobileInteractionStack({ process }) {
  return (
    <div className="space-y-4 xl:hidden">
      <div>
        <h3 className="text-[13px] font-semibold text-slate-900">En amont</h3>
        <SectionAccent color="#8B5CF6" />
        <div className="mt-2.5 space-y-2">
          {(process.upstream ?? []).length > 0 ? (
            process.upstream.map((item) => (
              <InteractionNodeCard
                key={`mobile-upstream-${item.id}`}
                process={item}
                side="upstream"
              />
            ))
          ) : (
            <InteractionNodeCard
              side="upstream"
              emptyLabel="Aucun processus en amont"
            />
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <div className="rounded-full border border-[#E6DEFA] bg-[#FBF8FF] p-1.5 text-[#7C3AED]">
          <ArrowRight size={14} strokeWidth={2.3} />
        </div>
      </div>

      <div className="flex justify-center">
        <SelectedProcessCard process={process} />
      </div>

      <div className="flex justify-center">
        <div className="rounded-full border border-[#D3F3EC] bg-[#F2FCFA] p-1.5 text-[#0F766E]">
          <ArrowRight size={14} strokeWidth={2.3} />
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold text-slate-900">En aval</h3>
        <SectionAccent color="#14B8A6" />
        <div className="mt-2.5 space-y-2">
          {(process.downstream ?? []).length > 0 ? (
            process.downstream.map((item) => (
              <InteractionNodeCard
                key={`mobile-downstream-${item.id}`}
                process={item}
                side="downstream"
              />
            ))
          ) : (
            <InteractionNodeCard
              side="downstream"
              emptyLabel="Aucun processus en aval"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3EBFF]">
        <Network size={22} strokeWidth={1.9} className="text-[#7C3AED]" />
      </div>
      <h2 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-slate-900">
        Sélectionnez un processus
      </h2>
      <p className="mt-2 max-w-md text-[12px] leading-6 text-slate-500">
        Choisissez un processus dans la liste pour afficher ses interactions
        amont et aval.
      </p>
    </div>
  );
}

function InteractionMapPanel({ selectedProcess }) {
  if (!selectedProcess) {
    return (
      <section className={`${SURFACE_CLASS} overflow-visible p-4`}>
        <EmptyState />
      </section>
    );
  }

  return (
    <section className={`${SURFACE_CLASS} overflow-visible p-4`}>
      <PanelTitle
        title="Processus sélectionné :"
        highlight={selectedProcess.name}
      />

      <div className="mt-4 min-h-[320px]">
        <DesktopInteractionMap process={selectedProcess} />
        <MobileInteractionStack process={selectedProcess} />
      </div>
    </section>
  );
}

function DetailInfoCard({ title, items, emptyLabel, accent = "purple", icon: Icon }) {
  const accentStyles = {
    purple: {
      iconBg: "bg-[#F3EBFF]",
      iconColor: "text-[#7C3AED]",
      bullet: "bg-[#7C3AED]",
    },
    gold: {
      iconBg: "bg-[#FFF7E5]",
      iconColor: "text-[#D98B00]",
      bullet: "bg-[#F4B740]",
    },
  };

  const style = accentStyles[accent] ?? accentStyles.purple;

  return (
    <section className={`${SURFACE_CLASS} p-3`}>
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-[10px] ${style.iconBg}`}
        >
          <Icon size={13} strokeWidth={2} className={style.iconColor} />
        </div>

        <div>
          <h3 className="text-[12.5px] font-semibold text-slate-900">{title}</h3>
          <GoldUnderline className="w-7" />
        </div>
      </div>

      {items.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-[10.5px] text-slate-600">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex items-start gap-2">
              <span
                className={`mt-[5px] h-1.5 w-1.5 rounded-full ${style.bullet}`}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[10.5px] text-slate-400">{emptyLabel}</p>
      )}
    </section>
  );
}

export default function InteractionMapPage() {
  const { user } = useAuth();

  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  const userName =
    `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() ||
    user?.email ||
    "Utilisateur";

  const userRole = user?.roles?.[0] ?? "";

  useEffect(() => {
    let active = true;

    async function loadInteractions() {
      try {
        const data = await getProcessInteractions();
        if (!active) return;

        const normalizedData = Array.isArray(data) ? data : [];
        setProcesses(normalizedData);

        setSelectedId((current) => {
          if (current && normalizedData.some((item) => item.id === current)) {
            return current;
          }

          return normalizedData[0]?.id ?? null;
        });
      } catch {
        if (!active) return;
        setError("Impossible de charger les interactions entre processus.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInteractions();

    return () => {
      active = false;
    };
  }, []);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredProcesses = useMemo(
    () =>
      processes.filter((process) => {
        const matchesFilter =
          activeFilter === "all" || process.type === activeFilter;

        if (!matchesFilter) return false;
        if (!normalizedSearch) return true;

        const haystack = [process.name, process.code, process.responsable]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      }),
    [processes, activeFilter, normalizedSearch],
  );

  const selectedProcess =
    processes.find((process) => process.id === selectedId) ?? null;

  const displayedInputs = selectedProcess
    ? selectedProcess.inputs?.length > 0
      ? selectedProcess.inputs
      : (selectedProcess.upstream ?? []).map((item) => `Sortie de ${item.name}`)
    : [];

  const displayedOutputs = selectedProcess
    ? selectedProcess.outputs?.length > 0
      ? selectedProcess.outputs
      : (selectedProcess.downstream ?? []).map(
          (item) => `Entrée vers ${item.name}`,
        )
    : [];

  return (
    <AppLayout pageTitle="Interactions" userName={userName} userRole={userRole}>
      <div className="mx-auto max-w-[1440px] space-y-3">
        <HeroSection />

        {loading ? (
          <section className={`${SURFACE_CLASS} px-6 py-10 text-center`}>
            <p className="text-[13px] text-slate-500">
              Chargement des interactions...
            </p>
          </section>
        ) : error ? (
          <section className="rounded-[14px] border border-red-200 bg-white px-6 py-10 text-center shadow-[0_10px_22px_rgba(88,20,142,0.045)]">
            <p className="text-[13px] font-medium text-red-600">{error}</p>
          </section>
        ) : (
          <section className="grid gap-3 xl:grid-cols-[340px_minmax(0,1fr)]">
            <ProcessListPanel
              processes={processes}
              filteredProcesses={filteredProcesses}
              selectedId={selectedId}
              search={search}
              setSearch={setSearch}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              setSelectedId={setSelectedId}
            />

            <div className="space-y-3">
              <InteractionMapPanel selectedProcess={selectedProcess} />

              <div className="grid gap-3 lg:grid-cols-2">
                <DetailInfoCard
                  title="Entrées principales"
                  icon={GitBranch}
                  items={displayedInputs}
                  emptyLabel="Aucune entrée renseignée"
                  accent="purple"
                />

                <DetailInfoCard
                  title="Sorties principales"
                  icon={FileOutput}
                  items={displayedOutputs}
                  emptyLabel="Aucune sortie renseignée"
                  accent="gold"
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
