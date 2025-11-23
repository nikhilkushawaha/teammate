import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthContext } from "@/context/auth-provider";

// Get socket URL - remove /api suffix if present, Socket.io connects to root
const getSocketURL = () => {
  const url = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  // Remove /api suffix if present
  return url.replace(/\/api\/?$/, "");
};

const SOCKET_URL = getSocketURL();

export const useSocket = (workspaceId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!workspaceId || !user) {
      return;
    }

    // Create socket connection with credentials
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      setIsConnected(true);

      // Join workspace room after connection
      socket.emit("join_workspace", workspaceId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", () => {
      setIsConnected(false);
    });

    // Handle authentication errors
    socket.on("error", () => {
      // Error handled silently for production
    });

    // Cleanup on unmount or workspace change
    return () => {
      if (socket.connected && workspaceId) {
        socket.emit("leave_workspace", workspaceId);
      }
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [workspaceId, user]);

  return {
    socket: socketRef.current,
    isConnected,
  };
};

