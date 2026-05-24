import { Bot, Loader2, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { askAssistant } from "../../api/assistant.api";
import { useAuth } from "../../hooks/useAuth";
import AssistantMessage from "../assistant/AssistantMessage";
import AssistantQuickActions from "../assistant/AssistantQuickActions";
import { TOPBAR_HEIGHT } from "./layout.constants";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Bonjour, je peux vous aider a comprendre un terme, trouver un responsable, expliquer un champ de fiche ou identifier un article ISO.",
  sources: [],
  quick_links: [],
};

function extractSelectedIds(pathname) {
  const processMatch = pathname.match(/\/gestion-processus\/dossier\/(\d+)/);
  const ficheMatch = pathname.match(/\/gestion-processus\/fiches\/(\d+)\/modifier/);

  return {
    selected_process_id: processMatch ? Number(processMatch[1]) : null,
    selected_fiche_id: ficheMatch ? Number(ficheMatch[1]) : null,
  };
}

export default function AssistantPanel({ open, onClose, pageTitle }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const messagesViewportRef = useRef(null);
  const inputRef = useRef(null);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const contextPayload = useMemo(() => {
    const selectedIds = extractSelectedIds(location.pathname);

    return {
      current_path: location.pathname,
      page_title: pageTitle || null,
      selected_process_id: selectedIds.selected_process_id,
      selected_fiche_id: selectedIds.selected_fiche_id,
      user_roles: user?.roles || [],
    };
  }, [location.pathname, pageTitle, user?.roles]);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollTop = viewport.scrollHeight;
  }, [loading, messages]);

  if (!open) {
    return null;
  }

  async function submitQuestion(questionText) {
    const trimmedQuestion = questionText.trim();
    if (!trimmedQuestion || loading) {
      return;
    }

    setMessages((current) => [...current, { role: "user", content: trimmedQuestion }]);
    setDraft("");
    setLoading(true);

    try {
      const response = await askAssistant({
        question: trimmedQuestion,
        context: contextPayload,
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response?.answer || "Je n'ai pas trouve de reponse exploitable.",
          sources: Array.isArray(response?.sources) ? response.sources : [],
          quick_links: Array.isArray(response?.quick_links) ? response.quick_links : [],
          intent: response?.intent || "fallback",
        },
      ]);
    } catch (error) {
      const content =
        error?.response?.status === 403
          ? "Vous n'avez pas acces a cette information."
          : "Impossible de contacter l'assistant.";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content,
          sources: [],
          quick_links: [],
          intent: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitQuestion(draft);
  }

  function handleQuickAction(action) {
    if (!action) {
      return;
    }

    if (action.mode === "send") {
      submitQuestion(action.value);
      return;
    }

    setDraft(action.value);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      const length = action.value.length;
      inputRef.current?.setSelectionRange?.(length, length);
    });
  }

  function handleQuickLinkClick(link) {
    if (!link?.path) {
      return;
    }

    navigate(link.path);
    onClose?.();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitQuestion(draft);
    }
  }

  return (
    <div
      className="fixed right-4 z-40 flex w-[min(432px,calc(100vw-20px))] flex-col overflow-hidden rounded-[18px] border border-[#E9E1F8] bg-white shadow-[0_24px_60px_rgba(49,16,92,0.18)]"
      style={{
        top: TOPBAR_HEIGHT + 14,
        maxHeight: `calc(100vh - ${TOPBAR_HEIGHT + 28}px)`,
      }}
      role="dialog"
      aria-modal="false"
      aria-label="Assistant Qonform"
    >
      <div className="border-b border-[#EEE7FA] bg-[linear-gradient(135deg,#FCFAFF_0%,#FFFFFF_100%)] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F3E8FF] text-[#58148E]">
              <Bot className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-slate-900">Assistant Qonform</p>
              <div className="mt-1 h-[3px] w-16 rounded-full bg-[#F4B740]" />
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Posez une question sur les processus, fiches, roles ou termes qualite.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Fermer l'assistant Qonform"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="border-b border-[#EEE7FA] bg-white px-4 py-3">
        <AssistantQuickActions onAction={handleQuickAction} />
      </div>

      <div ref={messagesViewportRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#FFFEFF] px-4 py-4">
        {messages.map((message, index) => (
          <AssistantMessage
            key={`${message.role}-${index}-${message.content.slice(0, 24)}`}
            message={message}
            onQuickLinkClick={handleQuickLinkClick}
          />
        ))}

        {loading ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-[14px] border border-[#E9E1F8] bg-[#FCFAFF] px-3 py-2 text-[12px] text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-[#58148E]" />
              Recherche en cours...
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[#EEE7FA] bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question..."
            disabled={loading}
            className="min-h-[76px] flex-1 resize-none rounded-[14px] border border-[#E4D8F6] bg-[#FCFAFF] px-3 py-2 text-[12px] text-slate-700 outline-none transition focus:border-[#58148E] disabled:cursor-not-allowed disabled:bg-slate-50"
          />

          <button
            type="submit"
            disabled={!draft.trim() || loading}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#58148E] text-white transition hover:bg-[#4A1278] disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Envoyer la question"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

