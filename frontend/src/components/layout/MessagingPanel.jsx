import { Loader2, Send, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { messagingApi } from "../../api/messages.api";
import { formatRoleLabels } from "../../utils/roles";

const stampFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatStamp(value) {
  if (!value) return "";

  try {
    return stampFormatter.format(new Date(value));
  } catch {
    return "";
  }
}

function getFullName(person) {
  return `${person?.prenom || ""} ${person?.nom || ""}`.trim() || person?.email || "Utilisateur";
}

function getPreview(conversation) {
  const content = conversation?.last_message?.content || "Aucun message";
  return content.length > 58 ? `${content.slice(0, 58)}...` : content;
}

export default function MessagingPanel({ open, onClose, onInboxChange }) {
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const activeConversationIdRef = useRef(activeConversationId);
  const selectedRecipientIdRef = useRef(selectedRecipientId);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) || null;
  const selectedRecipient =
    contacts.find((contact) => contact.id_user === Number(selectedRecipientId)) ||
    activeConversation?.counterpart ||
    null;

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    selectedRecipientIdRef.current = selectedRecipientId;
  }, [selectedRecipientId]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadInbox() {
      setLoadingInbox(true);
      setError("");

      try {
        const [contactsData, conversationsData] = await Promise.all([
          messagingApi.getContacts(),
          messagingApi.getConversations(),
        ]);

        if (cancelled) return;

        setContacts(contactsData);
        setConversations(conversationsData);

        const currentConversation =
          conversationsData.find(
            (conversation) => conversation.id === activeConversationIdRef.current
          ) ||
          conversationsData[0] ||
          null;

        setActiveConversationId(currentConversation?.id ?? null);

        if (currentConversation?.counterpart?.id_user) {
          setSelectedRecipientId(String(currentConversation.counterpart.id_user));
        } else if (
          selectedRecipientIdRef.current &&
          contactsData.some(
            (contact) => contact.id_user === Number(selectedRecipientIdRef.current)
          )
        ) {
          setSelectedRecipientId(selectedRecipientIdRef.current);
        } else {
          setSelectedRecipientId(contactsData[0] ? String(contactsData[0].id_user) : "");
        }

        if (!currentConversation) {
          setMessages([]);
        }

        await onInboxChange?.();
      } catch {
        if (!cancelled) {
          setError("Impossible de charger la messagerie pour le moment.");
        }
      } finally {
        if (!cancelled) {
          setLoadingInbox(false);
        }
      }
    }

    loadInbox();

    return () => {
      cancelled = true;
    };
  }, [onInboxChange, open]);

  useEffect(() => {
    if (!open) return;
    if (!activeConversationId) return;

    let cancelled = false;

    async function loadMessages() {
      setLoadingMessages(true);
      setError("");

      try {
        const data = await messagingApi.getMessages(activeConversationId);
        if (cancelled) return;

        setMessages(data);
        await onInboxChange?.();
      } catch {
        if (!cancelled) {
          setError("Impossible de charger les messages.");
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, onInboxChange, open]);

  function handleRecipientChange(event) {
    const nextRecipientId = event.target.value;
    setSelectedRecipientId(nextRecipientId);

    const existingConversation = conversations.find(
      (conversation) => String(conversation.counterpart.id_user) === nextRecipientId
    );

    setActiveConversationId(existingConversation?.id ?? null);
    if (!existingConversation) {
      setMessages([]);
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    const trimmedDraft = draft.trim();
    if (!trimmedDraft || !selectedRecipientId) return;

    setSending(true);
    setError("");

    try {
      const response = await messagingApi.sendMessage({
        recipient_id: Number(selectedRecipientId),
        content: trimmedDraft,
      });

      setDraft("");
      setActiveConversationId(response.conversation.id);
      setSelectedRecipientId(String(response.conversation.counterpart.id_user));
      setMessages((currentMessages) =>
        activeConversationId === response.conversation.id
          ? [...currentMessages, response.message]
          : [response.message]
      );
      setContacts((currentContacts) =>
        currentContacts.map((contact) =>
          contact.id_user === response.conversation.counterpart.id_user
            ? { ...contact, conversation_id: response.conversation.id, has_conversation: true }
            : contact
        )
      );
      setConversations((currentConversations) => {
        const nextConversations = [
          response.conversation,
          ...currentConversations.filter((conversation) => conversation.id !== response.conversation.id),
        ];

        return nextConversations.sort(
          (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
        );
      });

      await onInboxChange?.();
    } catch (sendError) {
      setError(
        sendError?.response?.data?.detail ||
          sendError?.response?.data?.non_field_errors?.[0] ||
          "Envoi impossible pour le moment."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex h-[min(560px,calc(100vh-96px))] w-[min(460px,calc(100vw-20px))] flex-col overflow-hidden rounded-[22px_22px_10px_10px] border border-[#DCCBFA] bg-white shadow-[0_30px_80px_rgba(49,16,92,0.24)] dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-[#7B2CBF]/10 bg-[linear-gradient(135deg,#6D28D9_0%,#58148E_55%,#3B0A7A_100%)] px-4 py-3 text-white">
        <div>
          <p className="text-[13px] font-semibold">Messagerie</p>
          <p className="text-[11px] text-violet-100/90">
            Echanges rapides entre auditeur et utilisateurs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.7)]" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[148px_minmax(0,1fr)] sm:grid-cols-[160px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-r border-[#EEE7FA] bg-[#FCFAFF] p-2.5 dark:border-slate-700 dark:bg-slate-950/70">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
            Destinataire
          </label>
          <select
            value={selectedRecipientId}
            onChange={handleRecipientChange}
            className="mb-3 w-full rounded-[10px] border border-[#E4D8F6] bg-white px-2.5 py-2 text-[11px] text-slate-700 outline-none transition focus:border-[#58148E] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Choisir un contact</option>
            {contacts.map((contact) => (
              <option key={contact.id_user} value={contact.id_user}>
                {getFullName(contact)}
              </option>
            ))}
          </select>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
            Conversations
          </p>

          <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
            {loadingInbox ? (
              <div className="flex items-center gap-2 rounded-[12px] border border-dashed border-[#DCCBFA] px-3 py-4 text-[12px] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[#DCCBFA] px-3 py-4 text-[12px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Aucun echange pour l&apos;instant.
              </div>
            ) : (
              conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      setActiveConversationId(conversation.id);
                      setSelectedRecipientId(String(conversation.counterpart.id_user));
                    }}
                    className={[
                      "w-full rounded-[14px] border px-3 py-2 text-left transition",
                      isActive
                        ? "border-[#CFA8FF] bg-white shadow-[0_10px_18px_rgba(88,20,142,0.08)] dark:border-violet-500/60 dark:bg-slate-900"
                        : "border-transparent bg-white/70 hover:border-[#E4D8F6] hover:bg-white dark:bg-slate-900/60 dark:hover:border-slate-700",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-slate-900 dark:text-slate-100">
                          {getFullName(conversation.counterpart)}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500 dark:text-slate-400">
                          {getPreview(conversation)}
                        </p>
                      </div>

                      {conversation.unread_count > 0 ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#58148E] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {conversation.unread_count}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-[10px] uppercase tracking-[0.08em] text-slate-400">
                      {formatStamp(conversation.last_message?.created_at || conversation.updated_at)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-[linear-gradient(180deg,#FFFFFF_0%,#FCFAFF_100%)] dark:bg-slate-900">
          <div className="border-b border-[#EEE7FA] px-4 py-3 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3E8FF] text-[#58148E] dark:bg-slate-800 dark:text-slate-200">
                <UserRound className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                  {selectedRecipient ? getFullName(selectedRecipient) : "Aucun contact selectionne"}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {formatRoleLabels(selectedRecipient?.roles || []).join(", ") || "Selectionnez un interlocuteur pour commencer"}
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {loadingMessages ? (
              <div className="flex h-full items-center justify-center text-[12px] text-slate-500 dark:text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement des messages...
              </div>
            ) : activeConversationId && messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={[
                      "flex",
                      message.is_mine ? "justify-end" : "justify-start",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "max-w-[78%] rounded-[16px] px-3 py-2 shadow-sm",
                        message.is_mine
                          ? "bg-[#58148E] text-white"
                          : "border border-[#E9E1F8] bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
                      ].join(" ")}
                    >
                      <p className="text-[12px] leading-5">{message.content}</p>
                      <p
                        className={[
                          "mt-1 text-[10px]",
                          message.is_mine ? "text-violet-100" : "text-slate-400 dark:text-slate-500",
                        ].join(" ")}
                      >
                        {formatStamp(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-sm text-center">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                    {selectedRecipient ? "Demarrer la conversation" : "Aucun contact disponible"}
                  </p>
                  <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                    {selectedRecipient
                      ? "Envoyez un premier message depuis le champ ci-dessous."
                      : "La liste des interlocuteurs autorises apparaitra ici."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-[#EEE7FA] bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            {error ? (
              <div className="mb-2 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="flex items-end gap-2">
              <textarea
                rows={3}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ecrivez votre message..."
                disabled={!selectedRecipientId || sending}
                className="min-h-[88px] flex-1 resize-none rounded-[14px] border border-[#E4D8F6] bg-white px-3 py-2 text-[12px] text-slate-700 outline-none transition focus:border-[#58148E] disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-950"
              />

              <button
                type="submit"
                disabled={!selectedRecipientId || !draft.trim() || sending}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#58148E] text-white transition hover:bg-[#4A1278] disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                title="Envoyer le message"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
