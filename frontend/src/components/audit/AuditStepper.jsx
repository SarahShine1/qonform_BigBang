export default function AuditStepper({ sections, currentIndex, onSelect }) {
  return (
    <nav className="rounded-md border border-gray-100 bg-white px-5 py-2.5 shadow-sm">
      <ol className="flex items-center">
        {sections.map((section, index) => {
          const active = index === currentIndex;
          return (
            <li key={section.id} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => onSelect(index)}
                title={section.title}
                className={`flex h-8 w-8 items-center justify-center rounded-md border-2 bg-white text-xs font-bold transition ${
                  active
                    ? "border-[#5b1fa8] text-[#5b1fa8] shadow-sm"
                    : "border-orange-300 text-orange-600 hover:border-[#5b1fa8] hover:text-[#5b1fa8]"
                }`}
              >
                {index + 1}
              </button>
              {index < sections.length - 1 && (
                <div className="mx-2 h-px flex-1 bg-orange-200" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
