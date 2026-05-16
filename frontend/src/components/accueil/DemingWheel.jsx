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

const quarterStyles = {
  planifier: {
    gradient: "from-[#2D0B68] to-[#4B14A8]",
    position: "left-0 top-0 rounded-tl-full",
  },
  realiser: {
    gradient: "from-[#8B5CF6] to-[#6B21D9]",
    position: "right-0 top-0 rounded-tr-full",
  },
  verifier: {
    gradient: "from-[#7C3AED] to-[#5B21B6]",
    position: "right-0 bottom-0 rounded-br-full",
  },
  agir: {
    gradient: "from-[#4B14A8] to-[#2D0B68]",
    position: "left-0 bottom-0 rounded-bl-full",
  },
};

const labelPositions = {
  planifier: "left-[18%] top-[18%] items-start text-left",
  realiser: "right-[18%] top-[18%] items-end text-right",
  verifier: "right-[18%] bottom-[18%] items-end text-right",
  agir: "left-[18%] bottom-[18%] items-start text-left",
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

      <p className="mt-1 max-w-[260px] text-[10.5px] leading-[1.4] text-slate-600">
        {step.description}
      </p>
    </article>
  );
}

function WheelColorQuarter({ step }) {
  const style = quarterStyles[step.key];

  return (
    <div
      className={`absolute h-1/2 w-1/2 bg-gradient-to-br ${style.gradient} ${style.position}`}
    />
  );
}

function WheelLabel({ step }) {
  const Icon = stepIcons[step.key];

  return (
    <div
      className={`absolute z-0 flex max-w-[78px] flex-col gap-1 text-white ${labelPositions[step.key]}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] font-bold text-white/75">
          {stepNumbers[step.key]}
        </span>
        <Icon className="h-4 w-4 text-[#F4B740]" strokeWidth={1.9} />
      </div>

      <span className="text-[10px] font-semibold leading-none">
        {step.shortTitle}
      </span>
    </div>
  );
}

export default function DemingWheel() {
  const [planifier, realiser, verifier, agir] = pdcaSteps;

  return (
    <section className="overflow-visible rounded-[14px] border border-[#E9E1F8] bg-white p-4 shadow-[0_8px_18px_rgba(48,16,103,0.06)]">
      <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(230px,270px)_minmax(0,1fr)]">
        <div className="grid gap-2">
          <StepCopy step={planifier} />
          <StepCopy step={agir} />
        </div>

        <div className="relative mx-auto aspect-square w-[clamp(230px,18vw,270px)]">
          <div className="absolute inset-0 rounded-full bg-[#F3ECFF]" />

          {/* Background wheel only. This layer can hide overflow. */}
          <div className="absolute inset-[8px] overflow-hidden rounded-full shadow-[0_14px_30px_rgba(68,26,136,0.16)]">
            {pdcaSteps.map((step) => (
              <WheelColorQuarter key={step.key} step={step} />
            ))}

            <div className="absolute left-1/2 top-0 z-0 h-full w-[5px] -translate-x-1/2 bg-white" />
            <div className="absolute left-0 top-1/2 z-0 h-[5px] w-full -translate-y-1/2 bg-white" />
          </div>

          {/* Labels layer. This is outside overflow-hidden, so it will not be cut. */}
          <div className="absolute inset-[8px] z-0 rounded-full">
            {pdcaSteps.map((step) => (
              <WheelLabel key={step.key} step={step} />
            ))}
          </div>

          <div className="absolute inset-[31%] z-0 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-[0_10px_24px_rgba(53,22,110,0.14)]">
            <RotateCw className="mb-1 h-3.5 w-3.5 text-[#6B21D9]" />
            <span className="px-2 text-[8px] font-bold leading-[1.2] text-[#3B0A7A]">
              Amélioration
              <br />
              continue
            </span>
            <span className="mt-1 h-[2px] w-5 rounded-full bg-[#F4B740]" />
          </div>

          <div className="pointer-events-none absolute -inset-[5px] rounded-full border border-[#D8C9F8]" />
        </div>

        <div className="grid gap-2">
          <StepCopy step={realiser} />
          <StepCopy step={verifier} />
        </div>
      </div>
    </section>
  );
}