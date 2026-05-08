import { FileText, Send, RefreshCw, BadgeCheck, Archive } from "lucide-react";

const PURPLE = "#58148E";
const BORDER = "#D1D5DB";

const PIPELINE = [
  { key: "Brouillon",   label: "BROUILLON",   Icon: FileText   },
  { key: "Soumise",     label: "SOUMISE",      Icon: Send       },
  { key: "En_revision", label: "EN RÉVISION",  Icon: RefreshCw  },
  { key: "Publiee",     label: "PUBLIÉE",      Icon: BadgeCheck },
  { key: "Archivee",    label: "ARCHIVÉE",     Icon: Archive    },
];

export default function PipelineFiche({ statut = "Brouillon" }) {
  return (
    <div className="flex items-center">
      {PIPELINE.map(({ key, label, Icon }, i) => {
        const active = key === statut;
        return (
          <div key={key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all"
                style={
                  active
                    ? { backgroundColor: PURPLE, color: "#fff" }
                    : { backgroundColor: "#F3F4F6", color: "#9CA3AF" }
                }
              >
                <Icon size={17} strokeWidth={1.8} />
              </div>
              <span
                className="text-[9.5px] font-bold tracking-wider whitespace-nowrap"
                style={{ color: active ? PURPLE : "#9CA3AF" }}
              >
                {label}
              </span>
            </div>
            {i < PIPELINE.length - 1 && (
              <div className="mx-2 h-px flex-1" style={{ backgroundColor: BORDER }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
