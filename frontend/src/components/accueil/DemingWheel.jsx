import {
  BarChart3,
  ClipboardCheck,
  Cog,
  RotateCw,
  Search,
} from "lucide-react";
import { pdcaSteps } from "../../data/accueilData";

const stepIcons = {
  planifier: ClipboardCheck,
  realiser: Cog,
  verifier: Search,
  agir: BarChart3,
};

const stepStyles = {
  planifier: {
    gradient: "from-[#2D0B68] to-[#4B14A8]",
    label: "left-[30px] top-[34px] text-left items-start",
  },
  realiser: {
    gradient: "from-[#8B5CF6] to-[#6B21D9]",
    label: "right-[30px] top-[34px] text-right items-end",
  },
  verifier: {
    gradient: "from-[#7C3AED] to-[#5B21B6]",
    label: "right-[30px] bottom-[34px] text-right items-end",
  },
  agir: {
    gradient: "from-[#4B14A8] to-[#2D0B68]",
    label: "left-[30px] bottom-[34px] text-left items-start",
  },
};

const stepNumbers = {
  planifier: "01",
  realiser: "02",
  verifier: "03",
  agir: "04",
};

function StepCopy({ step }) {
  return (
    <article className="rounded-[10px] border border-[#E9E1F8] bg-[#FCFAFF] px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#6B21D9]" />
        <h3 className="text-[12px] font-semibold text-[#3B0A7A]">
          {step.title}
        </h3>
      </div>

      <div className="ml-3.5 mt-1 h-[2px] w-5 rounded-full bg-[#F4B740]" />

      <p className="mt-1 max-w-[230px] text-[10px] leading-[1.4] text-slate-600">
        {step.description}
      </p>
    </article>
  );
}

function WheelQuarter({ step }) {
  const Icon = stepIcons[step.key];
  const style = stepStyles[step.key];

  return (
    <div
      className={`absolute flex h-1/2 w-1/2 flex-col justify-center bg-gradient-to-br ${style.gradient} ${
        step.key === "planifier"
          ? "left-0 top-0 items-center rounded-tl-full"
          : step.key === "realiser"
          ? "right-0 top-0 items-center rounded-tr-full"
          : step.key === "verifier"
          ? "right-0 bottom-0 items-center rounded-br-full"
          : "left-0 bottom-0 items-center rounded-bl-full"
      }`}
    >
      <div className={`absolute flex flex-col gap-1 text-white ${style.label}`}>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-bold text-white/70">
            {stepNumbers[step.key]}
          </span>
          <Icon className="h-3.5 w-3.5 text-[#F4B740]" strokeWidth={1.8} />
        </div>
        <span className="text-[9.5px] font-semibold leading-none">
          {step.shortTitle}
        </span>
      </div>
    </div>
  );
}

export default function DemingWheel() {
  const [planifier, realiser, verifier, agir] = pdcaSteps;

  return (
    <section className="h-full min-h-0 overflow-hidden rounded-[14px] border border-[#E9E1F8] bg-white p-3 shadow-[0_8px_18px_rgba(48,16,103,0.06)] lg:p-4">
      <div className="grid h-full min-h-0 items-center gap-3 lg:grid-cols-[minmax(0,0.9fr)_210px_minmax(0,0.9fr)]">
        <div className="grid gap-2">
          <StepCopy step={planifier} />
          <StepCopy step={agir} />
        </div>

        <div className="relative mx-auto flex h-[210px] w-[210px] items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#F3ECFF]" />

          <div className="absolute inset-[8px] overflow-hidden rounded-full shadow-[0_14px_30px_rgba(68,26,136,0.16)]">
            {pdcaSteps.map((step) => (
              <WheelQuarter key={step.key} step={step} />
            ))}

            <div className="absolute left-1/2 top-0 z-10 h-full w-[5px] -translate-x-1/2 bg-white" />
            <div className="absolute left-0 top-1/2 z-10 h-[5px] w-full -translate-y-1/2 bg-white" />
          </div>

          <div className="absolute inset-[64px] z-20 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-[0_10px_24px_rgba(53,22,110,0.14)]">
            <RotateCw className="mb-1 h-3.5 w-3.5 text-[#6B21D9]" />
            <span className="px-2 text-[8px] font-bold leading-[11px] text-[#3B0A7A]">
              Amélioration
              <br />
              continue
            </span>
            <span className="mt-1 h-[2px] w-5 rounded-full bg-[#F4B740]" />
          </div>

          <div className="pointer-events-none absolute -inset-[4px] rounded-full border border-[#D8C9F8]" />
        </div>

        <div className="grid gap-2">
          <StepCopy step={realiser} />
          <StepCopy step={verifier} />
        </div>
      </div>
    </section>
  );
}