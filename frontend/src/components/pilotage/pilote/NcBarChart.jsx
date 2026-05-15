import { AlertTriangle, MoreVertical } from "lucide-react";

const PURPLE = "#6d28d9";
const BAR_COLOR = "#7c3aed";
const BAR_HOVER = "#5b21b6";
const CHART_H = 160;
const CHART_PADDING = { top: 16, right: 12, bottom: 40, left: 32 };

export default function NcBarChart({ data = [] }) {
  // Limit to 12 processus max for readability
  const items = data.slice(0, 12);
  const maxNC = Math.max(...items.map((d) => d.nbNC), 1);

  const innerW = Math.max(items.length * 52, 300);
  const totalW = innerW + CHART_PADDING.left + CHART_PADDING.right;
  const totalH = CHART_H + CHART_PADDING.top + CHART_PADDING.bottom;

  const barWidth = 28;
  const barGap   = 52;

  // Y axis ticks (0, max/2, max)
  const yTicks = [0, Math.ceil(maxNC / 2), maxNC];

  const xOf  = (i) => CHART_PADDING.left + i * barGap + (barGap - barWidth) / 2;
  const yOf  = (v) => CHART_PADDING.top + CHART_H - (v / maxNC) * CHART_H;
  const hOf  = (v) => (v / maxNC) * CHART_H;

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-violet-700" />
          <h2 className="text-sm font-bold text-gray-950">Non-conformités par processus</h2>
        </div>
        <MoreVertical className="h-4 w-4 text-slate-400" />
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[120px] items-center justify-center text-xs text-slate-400">
          Aucune donnée NC disponible
        </div>
      ) : (
        <div className="overflow-x-auto px-2 pb-3 pt-2">
          <svg width={totalW} height={totalH} style={{ display: "block" }}>

            {/* Y grid lines + labels */}
            {yTicks.map((tick) => {
              const y = yOf(tick);
              return (
                <g key={tick}>
                  <line
                    x1={CHART_PADDING.left}
                    x2={totalW - CHART_PADDING.right}
                    y1={y}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth={1}
                  />
                  <text
                    x={CHART_PADDING.left - 6}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={9}
                    fill="#94a3b8"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {items.map((d, i) => {
              const x = xOf(i);
              const h = hOf(d.nbNC);
              const y = yOf(d.nbNC);
              const isEmpty = d.nbNC === 0;

              return (
                <g key={d.id_processus}>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={isEmpty ? yOf(0) - 2 : y}
                    width={barWidth}
                    height={isEmpty ? 2 : h}
                    rx={4}
                    fill={isEmpty ? "#e2e8f0" : BAR_COLOR}
                    className="transition-colors duration-100"
                    style={{ cursor: "default" }}
                    onMouseEnter={(e) => { if (!isEmpty) e.currentTarget.setAttribute("fill", BAR_HOVER); }}
                    onMouseLeave={(e) => { if (!isEmpty) e.currentTarget.setAttribute("fill", BAR_COLOR); }}
                  />

                  {/* Value label */}
                  {d.nbNC > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 4}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight="600"
                      fill={PURPLE}
                    >
                      {d.nbNC}
                    </text>
                  )}

                  {/* X label — processus code */}
                  <text
                    x={x + barWidth / 2}
                    y={CHART_PADDING.top + CHART_H + 14}
                    textAnchor="middle"
                    fontSize={8.5}
                    fill="#64748b"
                  >
                    {(d.code || d.nom || "").slice(0, 10)}
                  </text>
                  {/* Full name on second line */}
                  <text
                    x={x + barWidth / 2}
                    y={CHART_PADDING.top + CHART_H + 25}
                    textAnchor="middle"
                    fontSize={7.5}
                    fill="#94a3b8"
                  >
                    {(d.nom || "").slice(0, 12)}
                  </text>
                </g>
              );
            })}

            {/* X axis baseline */}
            <line
              x1={CHART_PADDING.left}
              x2={totalW - CHART_PADDING.right}
              y1={CHART_PADDING.top + CHART_H}
              y2={CHART_PADDING.top + CHART_H}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          </svg>
        </div>
      )}
    </section>
  );
}
