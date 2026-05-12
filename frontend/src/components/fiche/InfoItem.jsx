export default function InfoItem({ label, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-5 first:pl-0 last:pr-0">
      <span className="text-[9.5px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <div className="text-[12.5px] font-semibold text-slate-800">{children}</div>
    </div>
  );
}
