"use client";

import { useEffect, useRef } from "react";
import { notification } from "antd";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectToken } from "@/redux/features/auth/authSlice";
import { getSocket } from "@/lib/socket";
import { playNotificationSound } from "@/utils/sound";
import { baseApi } from "@/redux/api/baseApi";
import { useRouter } from "next/navigation";

export interface RealtimeNotification {
  id?: string;
  userId?: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string | Date;
}

export const GlobalNotificationListener = () => {
  const token = useAppSelector(selectToken);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [api, contextHolder] = notification.useNotification();
  const lastSoundPlayedAt = useRef<number>(0);

  useEffect(() => {
    if (!token) return;

    // Connect / retrieve active socket
    const socket = getSocket(token);

    const handleNewNotification = () => {
      // Play sound (throttled) and invalidate cache
      const now = Date.now();
      if (now - lastSoundPlayedAt.current > 500) {
        lastSoundPlayedAt.current = now;
        playNotificationSound();
      }
      // Invalidate notification tags for Redux query
      dispatch(baseApi.util.invalidateTags(["notification"]));
      // Optionally, you could dispatch an action to add notification to state
      // but UI toast is omitted as per requirements.

    };

    socket.on("notification:new" as any, handleNewNotification);

    return () => {
      socket.off("notification:new" as any, handleNewNotification);
    };
  }, [token, dispatch, api, router]);

  return <>{contextHolder}</>;
};

export default GlobalNotificationListener;
