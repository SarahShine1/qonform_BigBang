import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(activeMonth) {
  const year = activeMonth.getFullYear();
  const month = activeMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const cells = [];

  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    cells.push({
      key: `prev-${index}`,
      day: daysInPrevMonth - index,
      inMonth: false,
      date: new Date(year, month - 1, daysInPrevMonth - index),
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      key: `current-${day}`,
      day,
      inMonth: true,
      date: new Date(year, month, day),
    });
  }

  const remainder = cells.length % 7;
  const trailingCells = remainder === 0 ? 0 : 7 - remainder;

  for (let day = 1; day <= trailingCells; day += 1) {
    cells.push({
      key: `next-${day}`,
      day,
      inMonth: false,
      date: new Date(year, month + 1, day),
    });
  }

  return cells;
}

function sameDay(left, right) {
  return (
    left.getDate() === right.getDate() &&
    left.getMonth() === right.getMonth() &&
    left.getFullYear() === right.getFullYear()
  );
}

export default function SidebarCalendar() {
  const [activeMonth, setActiveMonth] = useState(() => startOfMonth(new Date()));
  const today = useMemo(() => new Date(), []);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
      }).format(activeMonth),
    [activeMonth],
  );

  const cells = useMemo(() => buildCalendarDays(activeMonth), [activeMonth]);

  return (
    <div className="rounded-md border border-white/12 bg-[linear-gradient(180deg,rgba(107,33,217,0.18),rgba(45,11,104,0.22))] px-1.5 py-[4.5px] shadow-[0_10px_22px_rgba(17,0,45,0.2)]">
      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          className="inline-flex h-4 w-4 items-center justify-center rounded-md text-violet-100 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-2.5 w-2.5" />
        </button>

        <p className="text-[10px] font-semibold capitalize text-white">{monthLabel}</p>

        <button
          type="button"
          onClick={() => setActiveMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          className="inline-flex h-4 w-4 items-center justify-center rounded-md text-violet-100 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronRight className="h-2.5 w-2.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px text-center">
        {weekDays.map((label) => (
          <span key={label} className="pb-0.5 text-[6.5px] font-semibold uppercase tracking-[0.04em] text-violet-200">
            {label}
          </span>
        ))}

        {cells.map((cell) => {
          const isToday = sameDay(cell.date, today);
          return (
            <span
              key={cell.key}
              className={[
                "inline-flex h-4 items-center justify-center rounded-[5px] text-[7.5px] font-medium transition",
                cell.inMonth ? "text-white" : "text-violet-200/42",
                isToday
                  ? "border border-[#F4B740] bg-[#F4B740]/18 text-[#F8D47B]"
                  : "hover:bg-white/8",
              ].join(" ")}
            >
              {cell.day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
