/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSend, FiMessageSquare, FiCheck, FiShield } from "react-icons/fi";
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
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser, selectToken } from "@/redux/features/auth/authSlice";
import { getFromCookies } from "@/utils/cookies-storage";
import { resolveMediaUrl } from "@/utils/media";

const formatTime = (isoString?: string) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

export default function MessagePage() {
  const router = useRouter();
  const token = useAppSelector(selectToken);
  const currentUser = useAppSelector(selectCurrentUser);
  const activeToken = token || getFromCookies("token");
  const isAdmin = currentUser?.role?.toLowerCase() === "superadmin";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!activeToken) {
      router.push("/login");
      return;
    }

    if (isAdmin) {
      router.push("/admin-messages");
      return;
    }

    let active = true;
    setLoading(true);

    const init = async () => {
      try {
        getSocket(activeToken);

        const res = await startChat(undefined, activeToken);
        if (!active) return;

        if (res.onlineUserIds) {
          setOnlineUserIds(new Set(res.onlineUserIds.map(String)));
        }

        if (isAdmin && res.ok && res.conversations) {
          setConversations(res.conversations);
          if (res.conversations.length > 0) {
            setSelectedConversation(res.conversations[0]);
          }
        } else if (!isAdmin && res.ok && res.conversation) {
          setSelectedConversation(res.conversation);
        } else if (!res.ok) {
          setErrorMsg(res.message || "Failed to connect to chat");
        }
      } catch (err: any) {
        if (active) setErrorMsg(err.message || "Error loading chat");
      } finally {
        if (active) setLoading(false);
      }
    };

    void init();

    return () => {
      active = false;
    };
  }, [activeToken, isAdmin, router]);

  // Load message history when selected conversation changes
  useEffect(() => {
    if (!selectedConversation || !activeToken) return;

    let active = true;

    const loadHistory = async () => {
      try {
        await joinChatRoom(selectedConversation.id, activeToken);
        const res = await getChatHistory(selectedConversation.id, activeToken);
        if (active && res.ok && res.messages) {
          setMessages(res.messages);
          setTimeout(() => scrollToBottom("auto"), 50);
        }
      } catch (err) {
        console.error("Failed to load conversation history:", err);
      }
    };

    void loadHistory();

    return () => {
      active = false;
    };
  }, [selectedConversation, activeToken]);

  // Realtime message listener & Presence listener
  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);

    const handleNewMessage = (msg: ChatMessage) => {
      if (selectedConversation && msg.roomId === selectedConversation.id) {
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

      if (isAdmin) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === msg.roomId) {
              return {
                ...c,
                lastMessage: {
                  message: msg.message,
                  senderId: msg.sender.id,
                  sentAt: msg.sentAt || msg.createdAt,
                },
              };
            }
            return c;
          }),
        );
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

    const handleNewNotification = (data: any) => {
      if (data?.type === "chat_message") {
        startChat(undefined, token).then((res) => {
          if (isAdmin && res.ok && res.conversations) {
            setConversations(res.conversations);
          } else if (!isAdmin && res.ok && res.conversation) {
            // Usually the customer only has one conversation.
            // Just updating the selectedConversation's lastMessage is sufficient,
            // but fetching it again keeps it perfectly in sync.
          }
        });
      }
    };

    socket.on("chat:message", handleNewMessage);
    socket.on("presence:initial" as any, handlePresenceInitial);
    socket.on("presence:update" as any, handlePresenceUpdate);
    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("chat:message", handleNewMessage);
      socket.off("presence:initial" as any, handlePresenceInitial);
      socket.off("presence:update" as any, handlePresenceUpdate);
      socket.off("notification:new", handleNewNotification);
    };
  }, [selectedConversation, token, isAdmin]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedConversation || sending) return;

    setSending(true);
    setInputText("");

    const clientMsgId = `client-${Date.now()}`;

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      roomId: selectedConversation.id,
      messageId: `temp-${Date.now()}`,
      clientMessageId: clientMsgId,
      message: text,
      sender: {
        id: currentUser?.id || (currentUser as any)?._id || "",
        email: currentUser?.email || "",
        name: currentUser?.name || (isAdmin ? "Admin" : "Me"),
        avatarUrl: currentUser?.avatar,
      },
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom("smooth"), 30);

    await sendChatMessage(selectedConversation.id, text, clientMsgId, token || undefined);

    setSending(false);
  };

  const partner = selectedConversation?.partner;
  const partnerAvatar = partner?.avatar ? resolveMediaUrl(partner.avatar) : null;
  const rawPartnerName = partner?.name;
  const partnerName =
    rawPartnerName && !rawPartnerName.includes("@")
      ? rawPartnerName
      : isAdmin
        ? "Customer"
        : "Super Admin Support";

  const isPartnerOnline = Boolean(
    partner?.id && onlineUserIds.has(String(partner.id))
  );

  return (
    <div className="container mx-auto max-w-6xl px-2 sm:px-4 py-2 sm:py-6">
      <div className="flex h-[calc(100dvh-120px)] sm:h-[calc(100vh-140px)] min-h-[420px] overflow-hidden rounded-2xl border border-[#E8E0D4] bg-white shadow-xl flex-col md:flex-row">
        {/* Admin Sidebar if admin */}
        {isAdmin && (
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#E8E0D4] bg-[#FBF8F4] flex flex-col min-h-0 shrink-0">
            <div className="p-4 border-b border-[#E8E0D4] shrink-0">
              <h2 className="font-semibold text-base text-[#1A1A1A] flex items-center gap-2">
                <FiMessageSquare className="text-[#C1892F]" /> Support Chats
              </h2>
              <p className="text-xs text-[#8A8174] mt-0.5">{conversations.length} active conversations</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 overscroll-contain touch-pan-y custom-scrollbar">
              {conversations.length === 0 ? (
                <p className="p-6 text-center text-xs text-[#8A8174]">No chats yet.</p>
              ) : (
                conversations.map((c) => {
                  const isSelected = selectedConversation?.id === c.id;
                  const p = c.partner;
                  const pAvatar = p?.avatar ? resolveMediaUrl(p.avatar) : null;
                  const pDisplayName = p?.name && !p.name.includes("@") ? p.name : "Customer";
                  const isUserOnline = Boolean(p?.id && onlineUserIds.has(String(p.id)));
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConversation(c)}
                      className={`w-full p-3 text-left flex items-start gap-3 rounded-xl transition-all border ${
                        isSelected
                          ? "bg-white border-[#E8E0D4] shadow-sm font-medium"
                          : "border-transparent hover:bg-[#F6F3EE]"
                      }`}
                    >
                      <div className="relative shrink-0">
                        {pAvatar ? (
                          <img
                            src={pAvatar}
                            alt={pDisplayName}
                            className={`h-10 w-10 rounded-full object-cover transition-all ${isUserOnline
                                ? "border-2 border-emerald-500 ring-2 ring-emerald-400/30"
                                : "border border-[#E8E0D4]"
                              }`}
                          />
                        ) : (
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-xs transition-all ${isUserOnline
                                ? "bg-emerald-600 text-white ring-2 ring-emerald-400/30"
                                : "bg-[#E8E0D4] text-[#5C564C]"
                              }`}
                          >
                            {pDisplayName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${isUserOnline ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-neutral-300"
                            }`}
                          title={isUserOnline ? "Online" : "Offline"}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-[#1A1A1A] truncate">{pDisplayName}</p>
                          {c.lastMessage?.sentAt && (
                            <span className="text-[10px] text-[#8A8174]">{formatTime(c.lastMessage.sentAt)}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8A8174] truncate mt-0.5">
                          {c.lastMessage?.message || "Start conversation..."}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Live Chat Panel */}
        <div className="flex-1 min-w-0 min-h-0 h-full flex flex-col bg-white overflow-hidden">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between border-b border-[#E8E0D4] bg-[#FBF8F4] px-4 sm:px-6 py-3.5 sm:py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {partnerAvatar ? (
                  <img
                    src={partnerAvatar}
                    alt={partnerName}
                    className={`h-10 w-10 rounded-full object-cover transition-all ${isPartnerOnline
                        ? "border-2 border-emerald-500 ring-2 ring-emerald-400/30"
                        : "border border-[#E8E0D4]"
                      }`}
                  />
                ) : (
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm transition-all ${isPartnerOnline
                        ? "bg-emerald-600 text-white ring-2 ring-emerald-400/30"
                        : "bg-[#C1892F] text-white"
                      }`}
                  >
                    {partnerName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isPartnerOnline ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-neutral-300"
                    }`}
                  title={isPartnerOnline ? "Active now" : "Offline"}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-[#1A1A1A] truncate">{partnerName}</h3>
                  {!isAdmin && (
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
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#FCFAF7] overscroll-contain touch-pan-y custom-scrollbar">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Spin />
              </div>
            ) : errorMsg ? (
              <div className="flex h-full items-center justify-center text-red-500 text-sm">{errorMsg}</div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-[#8A8174] p-6 text-center">
                <FiMessageSquare size={36} className="mb-2 text-[#C1892F]" />
                <p className="text-sm font-medium text-[#1A1A1A]">Direct Support Conversation</p>
                <p className="text-xs text-[#8A8174] mt-1">Send a message below to chat directly with Support.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender.id === currentUser?.id || msg.sender.id === (currentUser as any)?._id;
                return (
                  <div key={msg.messageId || idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isMe
                          ? "rounded-br-none bg-[#C1892F] text-white"
                          : "rounded-bl-none border border-[#E8E0D4] bg-white text-[#1A1A1A]"
                        }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? "text-white/80" : "text-[#8A8174]"
                          }`}
                      >
                        <span>{formatTime(msg.sentAt || msg.createdAt)}</span>
                        {isMe && <FiCheck size={12} />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {selectedConversation && (
            <form onSubmit={handleSend} className="shrink-0 border-t border-[#E8E0D4] bg-white p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-xl border border-[#E8E0D4] bg-[#FBF8F4] px-4 py-2.5 sm:py-3 text-sm text-[#1A1A1A] placeholder-[#8A8174] focus:border-[#C1892F] focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="inline-flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-xl bg-[#C1892F] text-white hover:bg-[#AD7A28] disabled:opacity-40 shrink-0"
              >
                {sending ? <Spin size="small" /> : <FiSend size={18} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
