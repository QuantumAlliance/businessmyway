/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiMessageSquare, FiSend, FiX, FiCheck, FiUser, FiSearch } from "react-icons/fi";
import { Spin } from "antd";
import {
  ChatMessage,
  Conversation,
  getChatHistory,
  getSocket,
  joinChatRoom,
  leaveChatRoom,
  sendChatMessage,
  startChat,
} from "@/lib/socket";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser, selectToken } from "@/redux/features/auth/authSlice";
import { getFromCookies } from "@/utils/cookies-storage";
import { resolveMediaUrl } from "@/utils/media";

interface AdminChatModalProps {
  open: boolean;
  onClose: () => void;
  initialUserId?: string; // If opened from Admin Users list
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

const AdminChatModal: React.FC<AdminChatModalProps> = ({
  open,
  onClose,
  initialUserId,
}) => {
  const token = useAppSelector(selectToken);
  const currentUser = useAppSelector(selectCurrentUser);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load conversations list or start with initialUserId
  useEffect(() => {
    if (!open || !token) return;

    let active = true;
    setLoadingList(true);

    const initAdminChat = async () => {
      try {
        const socket = getSocket(token);
        if (socket.connected) setConnected(true);
        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));

        if (initialUserId) {
          // Open direct conversation with target user
          const res = await startChat(initialUserId, token);
          if (active && res.ok && res.conversation) {
            setSelectedConversation(res.conversation);
          }
        }

        // Also fetch all conversations for the admin
        const listRes = await startChat(undefined, token);
        if (active && listRes.ok && listRes.conversations) {
          const convList = listRes.conversations;
          setConversations(convList);
          if (!initialUserId && convList.length > 0) {
            setSelectedConversation((prev) => prev ?? convList[0]);
          }
        }
      } catch (err) {
        console.error("Admin chat init error:", err);
      } finally {
        if (active) setLoadingList(false);
      }
    };

    void initAdminChat();

    return () => {
      active = false;
    };
  }, [open, token, initialUserId]);

  // Load message history when selected conversation changes
  useEffect(() => {
    if (!open || !selectedConversation || !token) return;

    let active = true;
    setLoadingChat(true);

    const loadHistory = async () => {
      try {
        await joinChatRoom(selectedConversation.id, token);
        const res = await getChatHistory(selectedConversation.id, token);
        if (active && res.ok && res.messages) {
          setMessages(res.messages);
          setTimeout(() => scrollToBottom("auto"), 50);
        }
      } catch (err) {
        console.error("Failed to load conversation history:", err);
      } finally {
        if (active) setLoadingChat(false);
      }
    };

    void loadHistory();

    return () => {
      active = false;
    };
  }, [open, selectedConversation, token]);

  // Realtime message listener
  useEffect(() => {
    if (!open || !token) return;

    const socket = getSocket(token);

    const handleNewMessage = (msg: ChatMessage) => {
      // Update active chat if currently viewing this room
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

      // Update conversations list preview
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
    };

    socket.on("chat:message", handleNewMessage);

    return () => {
      socket.off("chat:message", handleNewMessage);
    };
  }, [open, selectedConversation, token]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedConversation || sending) return;

    const activeToken = token || getFromCookies("token");
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
        name: currentUser?.name || "Admin",
        avatarUrl: currentUser?.avatar,
      },
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom("smooth"), 30);

    await sendChatMessage(selectedConversation.id, text, clientMsgId, activeToken || undefined);

    setSending(false);
  };

  if (!open) return null;

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.partner?.name?.toLowerCase().includes(q) ||
      c.partner?.email?.toLowerCase().includes(q) ||
      c.lastMessage?.message?.toLowerCase().includes(q)
    );
  });

  const partner = selectedConversation?.partner;
  const partnerAvatar = partner?.avatar ? resolveMediaUrl(partner.avatar) : null;
  const partnerName = partner?.name && !partner.name.includes("@") ? partner.name : "Customer";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 flex h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#E8E0D4] flex-col md:flex-row">
        {/* Sidebar: Conversations List */}
        <div className="w-full md:w-80 border-r border-[#E8E0D4] bg-[#FBF8F4] flex flex-col min-h-0">
          {/* Sidebar Header */}
          <div className="shrink-0 p-4 border-b border-[#E8E0D4]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                <FiMessageSquare className="text-[#C1892F]" /> Support Chats
              </h3>
              <span className="text-xs text-[#8A8174]">
                {conversations.length} {conversations.length === 1 ? "chat" : "chats"}
              </span>
            </div>
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8174]" size={14} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#E8E0D4] bg-white pl-8 pr-3 py-1.5 text-xs text-[#1A1A1A] focus:border-[#C1892F] focus:outline-none"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 overscroll-contain touch-pan-y custom-scrollbar">
            {loadingList ? (
              <div className="flex h-32 items-center justify-center">
                <Spin />
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="p-6 text-center text-xs text-[#8A8174]">
                {searchQuery ? "No matching conversations" : "No active chats yet."}
              </p>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedConversation?.id === c.id;
                const p = c.partner;
                const pAvatar = p?.avatar ? resolveMediaUrl(p.avatar) : null;
                const pDisplayName = p?.name && !p.name.includes("@") ? p.name : "Customer";
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
                    {pAvatar ? (
                      <img
                        src={pAvatar}
                        alt={pDisplayName}
                        className="h-10 w-10 rounded-full object-cover border border-[#E8E0D4]"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8E0D4] text-[#5C564C] font-semibold text-xs">
                        {pDisplayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                          {pDisplayName}
                        </p>
                        {c.lastMessage?.sentAt && (
                          <span className="text-[10px] text-[#8A8174] whitespace-nowrap">
                            {formatTime(c.lastMessage.sentAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8A8174] truncate mt-0.5">
                        {c.lastMessage?.message || "Start messaging..."}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white min-w-0 min-h-0 overflow-hidden">
          {/* Chat Header */}
          <div className="shrink-0 flex items-center justify-between border-b border-[#E8E0D4] bg-[#FBF8F4] px-5 py-3.5">
            <div className="flex items-center gap-3">
              {selectedConversation ? (
                <>
                  {partnerAvatar ? (
                    <img
                      src={partnerAvatar}
                      alt={partnerName}
                      className="h-9 w-9 rounded-full object-cover border border-[#E8E0D4]"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C1892F] text-white font-semibold text-xs">
                      {partnerName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-[#1A1A1A]">{partnerName}</h4>
                  </div>
                </>
              ) : (
                <span className="text-sm text-[#8A8174]">Select a conversation</span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#8A8174] hover:bg-[#F6F3EE] hover:text-[#1A1A1A] transition-colors shrink-0"
              aria-label="Close modal"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-[#FCFAF7] overscroll-contain touch-pan-y custom-scrollbar">
            {loadingChat ? (
              <div className="flex h-full items-center justify-center">
                <Spin />
              </div>
            ) : !selectedConversation ? (
              <div className="flex h-full flex-col items-center justify-center text-[#8A8174] p-6 text-center">
                <FiMessageSquare size={32} className="mb-2 text-[#C1892F]" />
                <p className="text-sm">Select a user conversation from the left to start chatting.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-[#8A8174] p-6 text-center">
                <p className="text-sm font-medium text-[#1A1A1A]">No messages yet</p>
                <p className="text-xs text-[#8A8174] mt-1">Send a message to start direct support with {partnerName}.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender.id === currentUser?.id || msg.sender.id === (currentUser as any)?._id;
                return (
                  <div
                    key={msg.messageId || idx}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        isMe
                          ? "rounded-br-none bg-[#2E2D2A] text-white"
                          : "rounded-bl-none border border-[#E2DFD8] bg-[#EFECE6] text-[#1A1A1A]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                          isMe ? "text-white/70" : "text-[#7A746B]"
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

          {/* Input Bar */}
          {selectedConversation && (
            <form onSubmit={handleSend} className="border-t border-[#E8E0D4] bg-white p-3 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder={`Reply to ${partnerName}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loadingChat}
                className="flex-1 rounded-xl border border-[#E8E0D4] bg-[#FBF8F4] px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-[#8A8174] focus:border-[#C1892F] focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending || loadingChat}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#C1892F] text-white hover:bg-[#AD7A28] disabled:opacity-40"
              >
                {sending ? <Spin size="small" /> : <FiSend size={16} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatModal;
