import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, MoreVertical } from "lucide-react";

const STATUT_COLORS = {
  Brouillon:     "#94a3b8",
  Soumise:       "#3b82f6",
  En_revision:   "#f59e0b",
  Publiee:       "#10b981",
  Archivee:      "#ef4444",
  "Sans version": "#e2e8f0",
};

const STATUT_LABELS = {
  Brouillon:     "Brouillon",
  Soumise:       "Soumise",
  En_revision:   "En révision",
  Publiee:       "Publiée",
  Archivee:      "Archivée",
  "Sans version": "Sans version",
};

const CX = 80, CY = 80, R_OUT = 62, R_IN = 38;

function polarXY(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function slicePath(startDeg, endDeg) {
  const [ox1, oy1] = polarXY(CX, CY, R_OUT, startDeg);
  const [ox2, oy2] = polarXY(CX, CY, R_OUT, endDeg);
  const [ix1, iy1] = polarXY(CX, CY, R_IN, endDeg);
  const [ix2, iy2] = polarXY(CX, CY, R_IN, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${ox1} ${oy1} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${R_IN} ${R_IN} 0 ${large} 0 ${ix2} ${iy2} Z`;
}

// Map chart statut keys → URL filter values
const STATUT_TO_FILTER = {
  Brouillon:      "Brouillon",
  Soumise:        "Soumise",
  En_revision:    "En_revision",
  Publiee:        "Publiee",
  Archivee:       "Archivee",
  "Sans version": "_none",
};

export default function StatutDonut({ data = [] }) {
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  const handleClick = (statut) => {
    const filterVal = STATUT_TO_FILTER[statut];
    if (filterVal) {
      navigate(`/cartographie/processus?statut=${filterVal}`);
    }
  };

  const total = data.reduce((s, d) => s + d.count, 0);

  // Compute slice angles
  const slices = [];
  let cursor = 0;
  for (const d of data) {
    const deg = (d.count / total) * 360;
    slices.push({ ...d, startDeg: cursor, endDeg: cursor + deg });
    cursor += deg;
  }

  const hoveredSlice = slices.find((s) => s.statut === hovered);

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-violet-700" />
          <h2 className="text-sm font-bold text-gray-950">État des fiches</h2>
        </div>
        <MoreVertical className="h-4 w-4 text-slate-400" />
      </div>

      {total === 0 ? (
        <div className="flex min-h-[160px] items-center justify-center text-xs text-slate-400">
          Aucune version disponible
        </div>
      ) : (
        <div className="flex items-center gap-6 px-5 py-4">
          {/* SVG donut */}
          <div className="relative shrink-0">
            <svg width={160} height={160} viewBox="0 0 160 160">
              {slices.map((s) => {
                const isHovered = s.statut === hovered;
                const gap = 1.5;
                const start = s.startDeg + (slices.length > 1 ? gap / 2 : 0);
                const end   = s.endDeg   - (slices.length > 1 ? gap / 2 : 0);
                if (end <= start) return null;
                return (
                  <path
                    key={s.statut}
                    d={slicePath(start, end)}
                    fill={STATUT_COLORS[s.statut] || "#cbd5e1"}
                    opacity={hovered && !isHovered ? 0.35 : 1}
                    className="cursor-pointer transition-opacity duration-150"
                    onMouseEnter={() => setHovered(s.statut)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleClick(s.statut)}
                  />
                );
              })}
              {/* Center label */}
              <text x={CX} y={CY - 6} textAnchor="middle" className="fill-gray-800 font-bold text-[15px]">
                {hoveredSlice ? hoveredSlice.count : total}
              </text>
              <text x={CX} y={CY + 10} textAnchor="middle" className="fill-slate-400 text-[9px]">
                {hoveredSlice ? STATUT_LABELS[hoveredSlice.statut] : "processus"}
              </text>
            </svg>
          </div>

          {/* Legend + tooltip */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              {slices.map((s) => {
                const pct = Math.round((s.count / total) * 100);
                const isHov = s.statut === hovered;
                return (
                  <div
                    key={s.statut}
                    className="cursor-pointer"
                    onMouseEnter={() => setHovered(s.statut)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleClick(s.statut)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: STATUT_COLORS[s.statut] || "#cbd5e1" }}
                      />
                      <span className={`flex-1 text-[12px] ${isHov ? "font-semibold text-gray-900" : "text-slate-600"}`}>
                        {STATUT_LABELS[s.statut] || s.statut}
                      </span>
                      <span className={`text-[12px] font-bold ${isHov ? "text-gray-900" : "text-slate-500"}`}>
                        {pct}%
                      </span>
                    </div>

                    {/* Hover: processus list */}
                    {isHov && s.processus?.length > 0 && (
                      <div className="ml-4 mt-1 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                        {s.processus.map((nom, i) => (
                          <p key={i} className="truncate text-[10.5px] text-slate-500 leading-5">
                            · {nom}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
