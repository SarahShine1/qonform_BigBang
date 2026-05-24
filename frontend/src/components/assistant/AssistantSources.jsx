export default function AssistantSources({ sources = [] }) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return null;
  }

  const labels = sources
    .map((source) => source?.label)
    .filter(Boolean);

  if (labels.length === 0) {
    return null;
  }

  return (
    <p className="mt-2 text-[10px] leading-4 text-slate-500">
      Source{labels.length > 1 ? "s" : ""} : {labels.join(", ")}
    </p>
  );
}

