/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiSend, FiX, FiCheck, FiShield } from "react-icons/fi";
import { Spin } from "antd";
import {
  ChatMessage,
  Conversation,
  getChatHistory,
  getSocket,
  joinChatRoom,
  sendChatMessage,
  startChat,
} from "@/lib/socket";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser, selectToken } from "@/redux/features/auth/authSlice";
import { getFromCookies } from "@/utils/cookies-storage";
import { resolveMediaUrl } from "@/utils/media";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  targetUserId?: string; // Optional for admin opening a specific user
  customTitle?: string;
}

const formatTime = (isoString?: string) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const formatDateDivider = (isoString?: string) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};

const ChatDrawer: React.FC<ChatDrawerProps> = ({
  open,
  onClose,
  targetUserId,
  customTitle,
}) => {
  const router = useRouter();
  const token = useAppSelector(selectToken);
  const currentUser = useAppSelector(selectCurrentUser);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!open) return;
    const activeToken = token || getFromCookies("token");
    if (!activeToken) {
      onClose();
      router.push("/login");
      return;
    }

    let active = true;
    setLoading(true);
    setErrorMsg(null);

    const initChat = async () => {
      try {
        getSocket(activeToken);

        // Start / resume conversation
        const res = await startChat(targetUserId, activeToken);
        if (!active) return;

        if (res.onlineUserIds) {
          setOnlineUserIds(new Set(res.onlineUserIds.map(String)));
        }

        if (!res.ok || !res.conversation) {
          setErrorMsg(res.message || "Unable to start conversation. Please try again.");
          setLoading(false);
          return;
        }

        const conv = res.conversation;
        setConversation(conv);

        // Join room
        await joinChatRoom(conv.id, activeToken);

        // Fetch history
        const historyRes = await getChatHistory(conv.id, activeToken);
        if (!active) return;

        if (historyRes.ok && historyRes.messages) {
          setMessages(historyRes.messages);
          setTimeout(() => scrollToBottom("auto"), 50);
        }
      } catch (err: any) {
        if (active) setErrorMsg(err.message || "Failed to connect to chat");
      } finally {
        if (active) setLoading(false);
      }
    };

    void initChat();

    return () => {
      active = false;
    };
  }, [open, token, targetUserId, onClose, router]);

  const conversationRef = useRef<Conversation | null>(null);
  conversationRef.current = conversation;

  // Listen for realtime incoming messages & presence
  useEffect(() => {
    if (!open) return;
    const activeToken = token || getFromCookies("token");
    if (!activeToken) return;

    const socket = getSocket(activeToken);

    const handleNewMessage = (msg: ChatMessage) => {
      const currentConv = conversationRef.current;
      if (currentConv && msg.roomId === currentConv.id) {
        setMessages((prev) => {
          const existsIdx = prev.findIndex(
            (m) =>
              (msg.clientMessageId && m.clientMessageId === msg.clientMessageId) ||
              m.messageId === msg.messageId,
          );
          if (existsIdx !== -1) {
            const updated = [...prev];
            updated[existsIdx] = msg;
            return updated;
          }
          return [...prev, msg];
        });
        setTimeout(() => scrollToBottom("smooth"), 30);
      }
    };

    const handlePresenceInitial = (data: { onlineUserIds: string[] }) => {
      if (data?.onlineUserIds) {
        setOnlineUserIds(new Set(data.onlineUserIds.map(String)));
      }
    };

    const handlePresenceUpdate = (data: { userId: string; isOnline: boolean }) => {
      if (!data?.userId) return;
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (data.isOnline) {
          next.add(String(data.userId));
        } else {
          next.delete(String(data.userId));
        }
        return next;
      });
    };

    socket.on("chat:message", handleNewMessage);
    socket.on("presence:initial" as any, handlePresenceInitial);
    socket.on("presence:update" as any, handlePresenceUpdate);

    return () => {
      socket.off("chat:message", handleNewMessage);
      socket.off("presence:initial" as any, handlePresenceInitial);
      socket.off("presence:update" as any, handlePresenceUpdate);
    };
  }, [open, token]);

  // Focus input when opened
  useEffect(() => {
    if (open && !loading) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !conversation || sending) return;

    const activeToken = token || getFromCookies("token");
    setSending(true);
    setInputText("");

    const clientMsgId = `client-${Date.now()}`;

    // 1. Optimistic instant message render
    const optimisticMsg: ChatMessage = {
      roomId: conversation.id,
      messageId: `temp-${Date.now()}`,
      clientMessageId: clientMsgId,
      message: text,
      sender: {
        id: currentUser?.id || (currentUser as any)?._id || "",
        email: currentUser?.email || "",
        name: currentUser?.name || "Me",
        avatarUrl: currentUser?.avatar,
      },
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom("smooth"), 30);

    // 2. Send via socket
    const res = await sendChatMessage(conversation.id, text, clientMsgId, activeToken || undefined);

    setSending(false);
    if (!res.ok) {
      setErrorMsg(res.message || "Failed to send message");
    }
  };

  if (!open) return null;

  const partner = conversation?.partner;
  const isPartnerAdmin = partner?.role?.toLowerCase() === "superadmin";
  const partnerAvatar = partner?.avatar ? resolveMediaUrl(partner.avatar) : null;
  const rawName = customTitle || partner?.name;
  const partnerName =
    rawName && !rawName.includes("@")
      ? rawName
      : isPartnerAdmin
        ? "Support Admin"
        : "Customer Support";

  const isPartnerOnline = Boolean(
    partner?.id && onlineUserIds.has(String(partner.id))
  );

  return (
    <div className="fixed inset-0 z-[99999] flex justify-end pointer-events-none">
      {/* Backdrop (invisible click-away without blur) */}
      <div
        className="absolute inset-0 bg-transparent pointer-events-auto"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col bg-white shadow-2xl border-l border-[#E8E0D4] animate-in slide-in-from-right duration-300 pointer-events-auto overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-[#E8E0D4] bg-[#FBF8F4] px-4 sm:px-5 py-3.5 sm:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {partnerAvatar ? (
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  className={`h-10 w-10 rounded-full object-cover transition-all ${
                    isPartnerOnline
                      ? "border-2 border-emerald-500 ring-2 ring-emerald-400/30"
                      : "border border-[#E8E0D4]"
                  }`}
                />
              ) : (
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm transition-all ${
                    isPartnerOnline
                      ? "bg-emerald-600 text-white ring-2 ring-emerald-400/30"
                      : "bg-[#C1892F] text-white"
                  }`}
                >
                  {partnerName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                  isPartnerOnline ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-neutral-300"
                }`}
                title={isPartnerOnline ? "Active now" : "Offline"}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-[#1A1A1A] truncate">{partnerName}</h3>
                {isPartnerAdmin && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-[#C1892F]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#C1892F] shrink-0">
                    <FiShield size={10} /> Support
                  </span>
                )}
              </div>
              <p className="text-xs truncate">
                {isPartnerOnline ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active now
                  </span>
                ) : (
                  <span className="text-[#8A8174]">Offline</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-[#8A8174] hover:bg-[#F6F3EE] hover:text-[#1A1A1A] transition-colors"
            aria-label="Close Chat"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-[#FCFAF7] overscroll-contain touch-pan-y custom-scrollbar">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-[#8A8174]">
              <Spin />
              <p className="text-xs">Connecting to support channel...</p>
            </div>
          ) : errorMsg ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
              <p className="font-medium">Connection Notice</p>
              <p className="mt-1 text-xs">{errorMsg}</p>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setLoading(true);
                  const activeToken = token || getFromCookies("token");
                  startChat(targetUserId, activeToken || undefined).then((res) => {
                    setLoading(false);
                    if (res.ok && res.conversation) setConversation(res.conversation);
                  });
                }}
                className="mt-3 inline-block rounded-lg bg-[#C1892F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#AD7A28]"
              >
                Retry
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-[#8A8174] p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6F3EE] text-[#C1892F] mb-3">
                <FiSend size={24} />
              </div>
              <h4 className="text-sm font-semibold text-[#1A1A1A]">Welcome to Support!</h4>
              <p className="mt-1 text-xs max-w-xs text-[#8A8174]">
                Send a message below to start chatting directly with our support team.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender.id === currentUser?.id || msg.sender.id === (currentUser as any)?._id;
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showDate =
                !prevMsg ||
                new Date(msg.createdAt).toDateString() !==
                new Date(prevMsg.createdAt).toDateString();

              return (
                <React.Fragment key={msg.messageId || idx}>
                  {showDate && (
                    <div className="my-3 flex items-center justify-center">
                      <span className="rounded-full bg-[#EFE9E0] px-3 py-0.5 text-[11px] font-medium text-[#8A8174]">
                        {formatDateDivider(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"
                      }`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all ${isMe
                          ? "rounded-br-none bg-[#C1892F] text-white"
                          : "rounded-bl-none border border-[#E8E0D4] bg-white text-[#1A1A1A]"
                        }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? "text-white/80" : "text-[#8A8174]"
                          }`}
                      >
                        <span>{formatTime(msg.sentAt || msg.createdAt)}</span>
                        {isMe && <FiCheck size={12} className="opacity-80" />}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="shrink-0 border-t border-[#E8E0D4] bg-white p-3 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading || !!errorMsg}
            className="flex-1 rounded-xl border border-[#E8E0D4] bg-[#FBF8F4] px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-[#8A8174] focus:border-[#C1892F] focus:bg-white focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending || loading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#C1892F] text-white shadow-sm hover:bg-[#AD7A28] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
            aria-label="Send Message"
          >
            {sending ? <Spin size="small" /> : <FiSend size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatDrawer;
