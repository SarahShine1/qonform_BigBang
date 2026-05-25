import AssistantSources from "./AssistantSources";

export default function AssistantMessage({ message, onQuickLinkClick }) {
  const isUser = message?.role === "user";
  const quickLinks = Array.isArray(message?.quick_links) ? message.quick_links : [];

  return (
    <div className={["flex", isUser ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "max-w-[85%] rounded-[14px] px-3 py-2.5 text-[12px] leading-5 shadow-sm",
          isUser
            ? "bg-[#6B21D9] text-white"
            : "border border-[#E9E1F8] bg-[#FCFAFF] text-slate-700",
        ].join(" ")}
      >
        <p>{message?.content}</p>

        {!isUser ? <AssistantSources sources={message?.sources} /> : null}

        {!isUser && quickLinks.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <button
                key={`${link.label}-${link.path}`}
                type="button"
                onClick={() => onQuickLinkClick?.(link)}
                className="inline-flex items-center rounded-full border border-[#DECDF7] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#58148E] transition hover:bg-[#F8F2FF]"
              >
                {link.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

