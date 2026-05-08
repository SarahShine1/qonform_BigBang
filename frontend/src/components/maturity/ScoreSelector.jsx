import { maturityScoreOptions } from "../../data/maturityData";

export default function ScoreSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {maturityScoreOptions.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "rounded-[9px] border px-2 py-1.5 text-[10px] font-semibold transition",
              isActive ? "text-white shadow-sm" : "border-[#E5E7EB] bg-white text-slate-500 hover:border-slate-300",
            ].join(" ")}
            style={
              isActive
                ? {
                    borderColor: option.color,
                    backgroundColor: option.color,
                  }
                : undefined
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
