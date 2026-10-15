/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FiMessageSquare,
  FiSend,
  FiCheck,
  FiSearch,
  FiRefreshCw,
  FiMenu,
  FiX,
} from "react-icons/fi";
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

function AdminMessagesContent() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");

  const token = useAppSelector(selectToken);
  const currentUser = useAppSelector(selectCurrentUser);
  const activeToken = token || getFromCookies("token");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load conversations list or start with initialUserId
  useEffect(() => {
    if (!activeToken) return;

    let active = true;
    setLoadingList(true);

    const init = async () => {
      try {
        getSocket(activeToken);

        let directConv: Conversation | null = null;
        if (initialUserId) {
          const res = await startChat(initialUserId, activeToken);
          if (res.ok && res.conversation) {
            directConv = res.conversation;
          }
          if (res.onlineUserIds) {
            setOnlineUserIds(new Set(res.onlineUserIds.map(String)));
          }
        }

        const listRes = await startChat(undefined, activeToken);
        if (!active) return;

        if (listRes.onlineUserIds) {
          setOnlineUserIds(new Set(listRes.onlineUserIds.map(String)));
        }

        if (listRes.ok && listRes.conversations) {
          let allConvs = listRes.conversations;
          if (directConv && !allConvs.some((c) => c.id === directConv?.id)) {
            allConvs = [directConv, ...allConvs];
          }
          setConversations(allConvs);

          if (directConv) {
            setSelectedConversation(directConv);
          } else if (allConvs.length > 0) {
            setSelectedConversation((prev) => prev ?? allConvs[0]);
          }
        }
      } catch (err) {
        console.error("Failed to initialize admin messages:", err);
      } finally {
        if (active) setLoadingList(false);
      }
    };

    void init();

    return () => {
      active = false;
    };
  }, [activeToken, initialUserId]);

  // Load message history when selected conversation changes
  useEffect(() => {
    if (!selectedConversation || !activeToken) return;

    let active = true;
    setLoadingChat(true);

    const loadHistory = async () => {
      try {
        await joinChatRoom(selectedConversation.id, activeToken);
        const res = await getChatHistory(selectedConversation.id, activeToken);
        if (active && res.ok && res.messages) {
          setMessages(res.messages);
          setTimeout(() => scrollToBottom("auto"), 50);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        if (active) setLoadingChat(false);
      }
    };

    void loadHistory();

    return () => {
      active = false;
    };
  }, [selectedConversation, activeToken]);

  // Realtime message listener & Presence listener
  useEffect(() => {
    if (!activeToken) return;

    const socket = getSocket(activeToken);

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

      // Update last message in conversation list and move to top
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.roomId);
        if (idx === -1) return prev;

        const isFromMe = msg.sender.id === (currentUser?.id || (currentUser as any)?._id);
        const isCurrentlySelected = selectedConversation?.id === msg.roomId;

        const updatedConv = {
          ...prev[idx],
          lastMessage: {
            message: msg.message,
            senderId: msg.sender.id,
            sentAt: msg.sentAt || msg.createdAt,
          },
          hasUnread: (!isFromMe && !isCurrentlySelected) ? true : prev[idx].hasUnread,
        };

        const updated = [...prev];
        updated.splice(idx, 1);
        updated.unshift(updatedConv);
        return updated;
      });
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
        startChat(undefined, activeToken).then((res) => {
          if (res.ok && res.conversations) {
            setConversations(res.conversations);
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
  }, [selectedConversation, activeToken, currentUser]);

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
        name: currentUser?.name || "Support Admin",
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

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = c.partner?.name?.toLowerCase().includes(q);
    const msgMatch = c.lastMessage?.message?.toLowerCase().includes(q);
    return !q || nameMatch || msgMatch;
  });

  const partner = selectedConversation?.partner;
  const partnerAvatar = partner?.avatar ? resolveMediaUrl(partner.avatar) : null;
  const rawName = partner?.name;
  const partnerName = rawName && !rawName.includes("@") ? rawName : "Customer";
  const isPartnerOnline = Boolean(
    partner?.id && onlineUserIds.has(String(partner.id))
  );

  return (
    <div className="w-full h-full">
      {/* Main Dual-Panel Chat Card */}
      <div className="relative flex h-[calc(100dvh-120px)] md:h-[calc(100vh-140px)] min-h-[420px] md:min-h-[580px] overflow-hidden rounded-2xl border border-[#E8E0D4] bg-white shadow-sm flex-col md:flex-row">

        {/* Mobile Backdrop for Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Left Panel: Conversations List (Slide-in drawer on mobile, side panel on md+) */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-[#FBF8F4] border-r border-[#E8E0D4] flex flex-col shadow-2xl transition-transform duration-300 md:static md:z-auto md:w-80 lg:w-96 md:max-w-none md:shadow-none md:translate-x-0 min-h-0 h-full ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}
        >
          {/* Header & Search */}
          <div className="shrink-0 p-4 border-b border-[#E8E0D4] bg-[#FAF7F2]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5C564C]">
                Conversations
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (activeToken) {
                      setLoadingList(true);
                      startChat(undefined, activeToken).then((res) => {
                        setLoadingList(false);
                        if (res.ok && res.conversations) setConversations(res.conversations);
                        if (res.onlineUserIds) setOnlineUserIds(new Set(res.onlineUserIds.map(String)));
                      });
                    }
                  }}
                  className="text-[#8A8174] hover:text-[#C1892F] transition-colors p-1"
                  title="Refresh conversations"
                >
                  <FiRefreshCw size={14} className={loadingList ? "animate-spin" : ""} />
                </button>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="md:hidden text-[#8A8174] hover:text-[#1A1A1A] p-1 ml-1"
                  aria-label="Close conversations list"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8174]" size={14} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#E8E0D4] bg-white pl-8 pr-3 py-2 text-xs text-[#1A1A1A] placeholder-[#8A8174] focus:border-[#C1892F] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 overscroll-contain touch-pan-y custom-scrollbar">
            {loadingList ? (
              <div className="flex h-40 items-center justify-center">
                <Spin />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8A8174]">
                <FiMessageSquare size={28} className="mx-auto mb-2 text-[#C1892F]/50" />
                <p className="font-medium text-[#1A1A1A]">
                  {searchQuery ? "No matching conversations" : "No active chats"}
                </p>
                <p className="mt-1">When users message support, they will appear here.</p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedConversation?.id === c.id;
                const p = c.partner;
                const pAvatar = p?.avatar ? resolveMediaUrl(p.avatar) : null;
                const pDisplayName = p?.name && !p.name.includes("@") ? p.name : "Customer";
                const isUserOnline = Boolean(p?.id && onlineUserIds.has(String(p.id)));

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedConversation(c);
                      setMobileSidebarOpen(false);
                      setConversations((prev) =>
                        prev.map((conv) => (conv.id === c.id ? { ...conv, hasUnread: false } : conv))
                      );
                    }}
                    className={`w-full p-3.5 text-left flex items-start gap-3 rounded-xl transition-all border ${
                      isSelected
                        ? "bg-white border-[#E8E0D4] shadow-sm font-medium"
                        : c.hasUnread
                        ? "bg-[#FDF9F1] border-[#C1892F]/30 shadow-sm"
                        : "border-transparent hover:bg-[#F6F3EE]"
                    }`}
                  >
                    <div className="relative shrink-0">
                      {pAvatar ? (
                        <img
                          src={pAvatar}
                          alt={pDisplayName}
                          className={`h-11 w-11 rounded-full object-cover transition-all ${isUserOnline
                              ? "border-2 border-emerald-500 ring-2 ring-emerald-400/30 shadow-sm"
                              : "border border-[#E8E0D4]"
                            }`}
                        />
                      ) : (
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full font-semibold text-xs transition-all ${isUserOnline
                              ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30"
                              : "bg-[#E8E0D4] text-[#5C564C]"
                            }`}
                        >
                          {pDisplayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isUserOnline
                            ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                            : "bg-neutral-300"
                          }`}
                        title={isUserOnline ? "Online" : "Offline"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${c.hasUnread ? "font-bold text-[#C1892F]" : "font-semibold text-[#1A1A1A]"}`}>
                          {pDisplayName}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {c.hasUnread && (
                            <span className="h-2 w-2 rounded-full bg-[#C1892F] animate-pulse"></span>
                          )}
                          {c.lastMessage?.sentAt && (
                            <span className={`text-[10px] whitespace-nowrap ${c.hasUnread ? "text-[#C1892F] font-semibold" : "text-[#8A8174]"}`}>
                              {formatTime(c.lastMessage.sentAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={`text-[11px] truncate mt-1 ${c.hasUnread ? "text-[#1A1A1A] font-medium" : "text-[#8A8174]"}`}>
                        {c.lastMessage?.message || "Start messaging..."}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Chat Area */}
        <div className="flex-1 flex flex-col bg-white min-w-0 min-h-0 h-full overflow-hidden">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between border-b border-[#E8E0D4] bg-[#FBF8F4] px-4 sm:px-6 py-3 sm:py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              {selectedConversation ? (
                <>
                  <div className="relative shrink-0">
                    {partnerAvatar ? (
                      <img
                        src={partnerAvatar}
                        alt={partnerName}
                        className={`h-9 sm:h-10 w-9 sm:w-10 rounded-full object-cover transition-all ${isPartnerOnline
                            ? "border-2 border-emerald-500 ring-2 ring-emerald-400/30"
                            : "border border-[#E8E0D4]"
                          }`}
                      />
                    ) : (
                      <div
                        className={`flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-full font-semibold text-xs transition-all ${isPartnerOnline
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
                    <h4 className="text-sm font-semibold text-[#1A1A1A] truncate">{partnerName}</h4>
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
                </>
              ) : (
                <span className="text-sm text-[#8A8174]">Select a conversation</span>
              )}
            </div>

            {/* Mobile Conversations Menu Button (Only Icon) */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E0D4] bg-white text-[#5C564C] shadow-sm hover:bg-[#F6F3EE] hover:text-[#1A1A1A] transition-colors shrink-0"
              aria-label="Open conversations list"
              title="Conversations"
            >
              <FiMenu size={18} className="text-[#C1892F]" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#FCFAF7] overscroll-contain touch-pan-y custom-scrollbar">
            {loadingChat ? (
              <div className="flex h-full items-center justify-center">
                <Spin />
              </div>
            ) : !selectedConversation ? (
              <div className="flex h-full flex-col items-center justify-center text-[#8A8174] p-6 text-center">
                <FiMessageSquare size={36} className="mb-2 text-[#C1892F]" />
                <p className="text-sm font-medium text-[#1A1A1A]">Select a Conversation</p>
                <p className="text-xs text-[#8A8174] mt-1 max-w-sm">
                  Choose a user from the left to view and respond to their messages in real-time.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-[#8A8174] p-6 text-center">
                <p className="text-sm font-medium text-[#1A1A1A]">No messages yet</p>
                <p className="text-xs text-[#8A8174] mt-1">
                  Type a message below to start direct support with {partnerName}.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe =
                  msg.sender.id === currentUser?.id || msg.sender.id === (currentUser as any)?._id;
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
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
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
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          {selectedConversation && (
            <form
              onSubmit={handleSend}
              className="shrink-0 border-t border-[#E8E0D4] bg-white p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder={`Reply to ${partnerName}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loadingChat}
                className="flex-1 rounded-xl border border-[#E8E0D4] bg-[#FBF8F4] px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-[#1A1A1A] placeholder-[#8A8174] focus:border-[#C1892F] focus:bg-white focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending || loadingChat}
                className="inline-flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-xl bg-[#C1892F] text-white shadow-sm hover:bg-[#AD7A28] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                aria-label="Send Message"
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

export default function AdminMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Spin size="large" />
        </div>
      }
    >
      <AdminMessagesContent />
    </Suspense>
  );
}
