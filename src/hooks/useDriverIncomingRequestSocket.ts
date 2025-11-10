/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSocket } from "@/lib/socket";
import {
  addIncomingRequest,
  removeIncomingRequest,
  setActiveRide,
  clearActiveRide,
  clearIncomingRequests,
} from "@/redux/features/ride/ride.slice";
import type { Ride } from "@/types";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { rideApi } from "@/redux/features/ride/ride.api";

interface UseDriverIncomingRequestSocketReturn {
  incomingRides: Ride[];
  activeRide: Ride | null;
  isConnected: boolean;
  isLoading: boolean;
}

let globalListenersRegistered = false;

/**
 * ✅ Custom hook for managing incoming ride requests and socket events
 * No callbacks needed - just call it and use the returned state!
 */
export const useDriverIncomingRequestSocket = (enabled: boolean = true): UseDriverIncomingRequestSocketReturn => {
  const dispatch = useDispatch();

  // ✅ Get Redux state
  const incomingRequestsRedux = useSelector((state: any) => state.incomingRequests);
  const activeRideRedux = useSelector((state: any) => state.activeRide);

  // ✅ Track socket connection
  const socketRef = useRef<any>(null);
  const currentRoomId = useRef<string | null>(null);
  const hasJoinedRoom = useRef(false);

  // ✅ Register global socket listeners ONCE
  useEffect(() => {
    if (globalListenersRegistered) {
      console.log("✅ Global socket listeners already registered");
      return;
    }

    const socket = getSocket();
    if (!socket) {
      console.warn("⚠️ Socket not available");
      return;
    }

    socketRef.current = socket;
    globalListenersRegistered = true;
    console.log("📡 Registering global socket listeners...");

    // ✅ NEW RIDE REQUEST
    socket.on("new_ride_request", (payload: Ride) => {
      console.log("🎯 new_ride_request received:", payload._id);
      dispatch(addIncomingRequest(payload));
      // ✅ Invalidate RTK Query cache to sync with backend
      dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES"]));
    });

    // ✅ RIDE CANCELLED BEFORE ACCEPTANCE
    socket.on("ride_cancelled_before_acceptance", (payload: { rideId: string }) => {
      console.log("🚫 Ride cancelled before driver acceptance:", payload.rideId);
      dispatch(removeIncomingRequest(payload.rideId));
      dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES"]));
    });

    // ✅ RIDE CANCELLED (old event name)
    socket.on("ride_cancelled", (payload: { rideId: string }) => {
      console.log("🚫 ride_cancelled received:", payload.rideId);
      dispatch(removeIncomingRequest(payload.rideId));
      dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES"]));
    });

    // ✅ RIDE STATUS UPDATED - MOST IMPORTANT
    socket.on("ride_update", (payload: Ride) => {
      console.log("🔄 ride_update received - Status:", payload.status, "Ride:", payload._id);

      const isCancelled = payload.status?.toUpperCase().includes("CANCELLED");
      const isCompleted = payload.status === "COMPLETED";

      // ✅ RIDE COMPLETED - Clear EVERYTHING
      if (isCompleted) {
        console.log("✅✅✅ RIDE COMPLETED - CLEARING ALL ✅✅✅");
        dispatch(clearActiveRide());
        dispatch(clearIncomingRequests());
        dispatch(
          rideApi.util.invalidateTags(["INCOMING_RIDES", "ACTIVE_RIDE", "RIDE", "RIDE_STATS"])
        );

        if (currentRoomId.current) {
          socket.emit("leave_ride_room", { rideId: currentRoomId.current });
          console.log("🚪 Left ride room after completion:", currentRoomId.current);
          currentRoomId.current = null;
          hasJoinedRoom.current = false;
        }
      }
      // ✅ RIDE CANCELLED - Clear active ride and incoming
      else if (isCancelled) {
        console.log("❌ RIDE CANCELLED - CLEARING ALL ❌");
        dispatch(clearActiveRide());
        dispatch(clearIncomingRequests());
        dispatch(
          rideApi.util.invalidateTags(["INCOMING_RIDES", "ACTIVE_RIDE", "RIDE"])
        );

        if (currentRoomId.current) {
          socket.emit("leave_ride_room", { rideId: currentRoomId.current });
          console.log("🚪 Left ride room after cancellation:", currentRoomId.current);
          currentRoomId.current = null;
          hasJoinedRoom.current = false;
        }
      }
      // ✅ IN PROGRESS RIDE - Update active ride only
      else {
        console.log("🔄 Ride in progress - updating status:", payload.status);
        dispatch(setActiveRide(payload));
      }
    });

    // ✅ CONNECTION EVENTS
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES", "ACTIVE_RIDE"]));
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      currentRoomId.current = null;
      hasJoinedRoom.current = false;
    });

    console.log("✅ Global socket listeners registered successfully");

    return () => {
      console.log("🧹 Component unmounted but keeping socket listeners alive");
    };
  }, [dispatch]);

  // ✅ Handle room joins/leaves based on active ride state
  useEffect(() => {
    const socket = socketRef.current || getSocket();
    if (!socket) return;

    if (!enabled) {
      console.log("🔌 Socket disabled, leaving room...");
      if (currentRoomId.current) {
        socket.emit("leave_ride_room", { rideId: currentRoomId.current });
        console.log("🚪 Left room (disabled):", currentRoomId.current);
        currentRoomId.current = null;
        hasJoinedRoom.current = false;
      }
      return;
    }

    const activeRide = activeRideRedux?.ride;
    const isCancelled = activeRide?.status?.toUpperCase().includes("CANCELLED");
    const isCompleted = activeRide?.status === "COMPLETED";
    const canJoin = !!activeRide && !!activeRide._id && !isCancelled && !isCompleted;

    if (canJoin && !hasJoinedRoom.current) {
      const nextRoomId = activeRide._id;

      if (currentRoomId.current && currentRoomId.current !== nextRoomId) {
        socket.emit("leave_ride_room", { rideId: currentRoomId.current });
        console.log("🚪 Left old room (switching rides):", currentRoomId.current);
      }

      socket.emit("join_ride_room", { rideId: nextRoomId });
      console.log("🚪 Joined ride room:", nextRoomId);
      currentRoomId.current = nextRoomId;
      hasJoinedRoom.current = true;
    } else if (!canJoin && hasJoinedRoom.current && currentRoomId.current) {
      socket.emit("leave_ride_room", { rideId: currentRoomId.current });
      console.log("🚪 Left ride room (cancelled/completed):", currentRoomId.current);
      currentRoomId.current = null;
      hasJoinedRoom.current = false;
    }
  }, [enabled, activeRideRedux?.ride?._id, activeRideRedux?.ride?.status]);

  return {
    incomingRides: incomingRequestsRedux?.requests || [],
    activeRide: activeRideRedux?.ride || null,
    isConnected: socketRef.current?.connected || false,
    isLoading: incomingRequestsRedux?.isLoading || false,
  };
};