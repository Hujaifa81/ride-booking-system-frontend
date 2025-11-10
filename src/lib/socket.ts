import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let isInitialized = false;

export const initSocket = (): Socket => {
  if (socket?.connected) {
    console.log("✅ Socket already connected");
    return socket;
  }

  if (isInitialized && socket) {
    console.log("✅ Socket already initialized");
    return socket;
  }

  isInitialized = true;
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

  console.log("🔌 Initializing global socket...");

  socket = io(SOCKET_URL, { 
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("✅ Global socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Global socket disconnected:", reason);
    if (reason === "io server disconnect") {
      setTimeout(() => {
        if (socket && !socket.connected) {
          console.log("🔄 Attempting to reconnect...");
          socket.connect();
        }
      }, 1000);
    }
  });

  socket.on("connect_error", (err) => {
    console.error("⚠️ Global socket error:", err.message);
  });

  return socket; // ✅ Always returns Socket, never null
};

export const getSocket = (): Socket => {
  if (!socket) {
    return initSocket(); // ✅ Guaranteed to return Socket
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
    isInitialized = false;
  }
};

export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};