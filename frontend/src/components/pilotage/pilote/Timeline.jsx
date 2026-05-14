import { Activity, MoreVertical } from "lucide-react";
import TimelineItem from "./TimelineItem";

function EmptyState({ message }) {
  return (
    <div className="flex min-h-[80px] items-center justify-center text-xs text-slate-400 px-4 py-6">
      {message}
    </div>
  );
}

export default function Timeline({ events }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-violet-700" />
          <h2 className="text-sm font-bold text-gray-950">Activité récente</h2>
        </div>
        <MoreVertical className="h-4 w-4 text-slate-400" />
      </div>
      <div className="divide-y divide-gray-50 overflow-y-auto" style={{ maxHeight: 340 }}>
        {events.length === 0 ? (
          <EmptyState message="Aucune activité récente." />
        ) : (
          events.map((ev, i) => <TimelineItem key={i} event={ev} />)
        )}
      </div>
    </section>
  );
}
