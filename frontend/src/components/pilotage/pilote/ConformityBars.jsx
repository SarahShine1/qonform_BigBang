import { ShieldCheck, MoreVertical } from "lucide-react";

const BAR_H   = 18;
const GAP     = 10;
const LABEL_W = 140;
const PCT_W   = 36;
const BAR_MAX = 200;
const PAD     = { top: 8, right: 16, bottom: 8, left: 16 };

function barColor(taux) {
  if (taux >= 80) return "#10b981";
  if (taux >= 60) return "#f59e0b";
  return "#ef4444";
}

function textColor(taux) {
  if (taux >= 80) return "text-emerald-700";
  if (taux >= 60) return "text-amber-600";
  return "text-red-600";
}

export default function ConformityBars({ data = [] }) {
  const items = data.slice(0, 15);
  const rowH  = BAR_H + GAP;
  const svgH  = PAD.top + items.length * rowH + PAD.bottom;
  const svgW  = PAD.left + LABEL_W + BAR_MAX + PCT_W + PAD.right;

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-700" />
          <h2 className="text-sm font-bold text-gray-950">Taux de conformité par processus</h2>
        </div>
        <MoreVertical className="h-4 w-4 text-slate-400" />
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[100px] items-center justify-center text-xs text-slate-400">
          Aucune donnée disponible
        </div>
      ) : (
        <div className="overflow-x-auto px-2 py-3">
          <svg width={svgW} height={svgH} style={{ display: "block" }}>
            {items.map((d, i) => {
              const y    = PAD.top + i * rowH;
              const barY = y + (BAR_H - 10) / 2;
              const fill = d.taux != null ? barColor(d.taux) : "#e2e8f0";
              const barW = d.taux != null ? (d.taux / 100) * BAR_MAX : 0;
              const xBar = PAD.left + LABEL_W + 8;

              return (
                <g key={d.id_processus}>
                  {/* Processus label */}
                  <text
                    x={PAD.left + LABEL_W}
                    y={y + BAR_H / 2 + 4}
                    textAnchor="end"
                    fontSize={10.5}
                    fill="#475569"
                    fontWeight="500"
                  >
                    {(d.nom || "").length > 22
                      ? (d.nom || "").slice(0, 21) + "…"
                      : d.nom}
                  </text>

                  {/* Background track */}
                  <rect
                    x={xBar}
                    y={barY}
                    width={BAR_MAX}
                    height={10}
                    rx={5}
                    fill="#f1f5f9"
                  />

                  {/* Filled bar */}
                  {barW > 0 && (
                    <rect
                      x={xBar}
                      y={barY}
                      width={barW}
                      height={10}
                      rx={5}
                      fill={fill}
                      className="transition-all duration-300"
                    />
                  )}

                  {/* Percentage label */}
                  <text
                    x={xBar + BAR_MAX + 8}
                    y={y + BAR_H / 2 + 4}
                    fontSize={10.5}
                    fontWeight="700"
                    fill={d.taux != null ? fill : "#94a3b8"}
                  >
                    {d.taux != null ? `${d.taux}%` : "—"}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="mt-1 flex items-center gap-4 px-4 pb-1">
            {[
              { label: "≥ 80% — Conforme",      color: "#10b981" },
              { label: "60–79% — Partiel",       color: "#f59e0b" },
              { label: "< 60% — Non conforme",   color: "#ef4444" },
              { label: "Non audité",              color: "#e2e8f0", border: true },
            ].map((leg) => (
              <div key={leg.label} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-6 rounded-full"
                  style={{
                    backgroundColor: leg.color,
                    border: leg.border ? "1px solid #cbd5e1" : undefined,
                  }}
                />
                <span className="text-[10px] text-slate-500">{leg.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
