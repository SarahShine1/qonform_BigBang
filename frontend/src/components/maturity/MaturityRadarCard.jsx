import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export default function MaturityRadarCard({ data }) {
  return (
    <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-4 shadow-[0_10px_22px_rgba(45,11,104,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Radar maturite
      </p>
      <div className="mt-3 h-[250px] rounded-[12px] border border-[#F3ECFF] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF9FF_100%)] px-2 py-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="70%">
            <PolarGrid stroke="#E9E1F8" />
            <PolarAngleAxis
              dataKey="article"
              tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
            />
            <Radar
              dataKey="score"
              stroke="#6B21D9"
              fill="#6B21D9"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
