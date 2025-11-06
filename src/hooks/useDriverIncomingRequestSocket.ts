import { getSocket } from "@/lib/socket";
import { addIncomingRequest, removeIncomingRequest, setActiveRide } from "@/redux/features/ride/ride.slice";
import type { Ride } from "@/types";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

export const useDriverIncomingRequestSocket = ({
  enabled = true,
  onNewRide,
  activeRide,
  onActiveRideUpdate,
  rideCancelledBeforeDriverAcceptance,
}: {
  enabled?: boolean;
  onNewRide?: (payload: Ride) => void;
  activeRide?: Ride | null;
  onActiveRideUpdate?: (payload: Ride) => void;
  rideCancelledBeforeDriverAcceptance?: (payload: { rideId: string }) => void;
}) => {
  const dispatch = useDispatch();
  const currentRoomId = useRef<string | null>(null);
  const subscribedToNewRide = useRef(false);
  const subscribedToRideCancelled = useRef(false);
  const subscribedToRideUpdate = useRef(false);
  const hasJoinedRoom = useRef(false); // ✅ NEW: Track if already joined

  useEffect(() => {
    const socket = getSocket();

    if (!enabled) {
      console.log("🔌 Socket disabled, cleaning up...");
      if (currentRoomId.current) {
        socket.emit("leave_ride_room", { rideId: currentRoomId.current });
        currentRoomId.current = null;
        hasJoinedRoom.current = false; // ✅ Reset flag
      }
      if (subscribedToRideUpdate.current) {
        socket.off("ride_update");
        subscribedToRideUpdate.current = false;
      }
      if (subscribedToRideCancelled.current) {
        socket.off("ride_cancelled");
        subscribedToRideCancelled.current = false;
      }
      if (subscribedToNewRide.current) {
        socket.off("new_ride_request");
        subscribedToNewRide.current = false;
      }
      return;
    }

    // ✅ FIXED: Only join room once, don't join on every prop change
    const isCancelled = activeRide?.status?.toUpperCase().includes("CANCELLED");
    const isCompleted = activeRide?.status === "COMPLETED";
    const canJoin = !!activeRide && !!activeRide._id && !isCancelled && !isCompleted;

    if (canJoin && !hasJoinedRoom.current) {
      // ✅ Only join if NOT already joined
      const nextRoomId = activeRide._id;

      if (currentRoomId.current && currentRoomId.current !== nextRoomId) {
        socket.emit("leave_ride_room", { rideId: currentRoomId.current });
        console.log("🚪 leaving old room", currentRoomId.current);
      }

      socket.emit("join_ride_room", { rideId: nextRoomId });
      console.log("🚪 joining ride room", nextRoomId);
      currentRoomId.current = nextRoomId;
      hasJoinedRoom.current = true; // ✅ Set flag after joining
    } else if (canJoin && hasJoinedRoom.current) {
      // ✅ Already joined, don't join again
      console.log("📡 Already joined room", currentRoomId.current);
    } else if (!canJoin && hasJoinedRoom.current) {
      // ✅ Ride cancelled/completed, leave room and reset flag
      if (currentRoomId.current) {
        socket.emit("leave_ride_room", { rideId: currentRoomId.current });
        console.log("🚪 leaving room (ride ended)", currentRoomId.current);
        currentRoomId.current = null;
        hasJoinedRoom.current = false; // ✅ Reset flag
      }
    }

    // Subscribe to new_ride_request (once)
    if (!subscribedToNewRide.current) {
      socket.off("new_ride_request");
      socket.on("new_ride_request", (payload: Ride) => {
        console.log("✅ new_ride_request received", payload);
        dispatch(addIncomingRequest(payload));
        onNewRide?.(payload);
      });
      subscribedToNewRide.current = true;
      console.log("📌 Subscribed to new_ride_request");
    }

    // Subscribe to ride_cancelled (once)
    if (!subscribedToRideCancelled.current) {
      socket.off("ride_cancelled");
      socket.on("ride_cancelled", (payload: { rideId: string }) => {
        console.log("🚫 ride_cancelled received", payload);
        dispatch(removeIncomingRequest(payload.rideId));
        rideCancelledBeforeDriverAcceptance?.(payload);
      });
      subscribedToRideCancelled.current = true;
      console.log("📌 Subscribed to ride_cancelled");
    }

    // Subscribe to ride_update (once)
    if (!subscribedToRideUpdate.current) {
      socket.off("ride_update");
      socket.on("ride_update", (payload: Ride) => {
        console.log("📡 ride_update received", payload);
        
        const isCancelledUpdate = !!payload.status && payload.status.toUpperCase().includes("CANCELLED");
        const isCompletedUpdate = payload.status === "COMPLETED";

        if (isCancelledUpdate || isCompletedUpdate) {
          if (currentRoomId.current) {
            socket.emit("leave_ride_room", { rideId: currentRoomId.current });
            console.log(`🚪 leaving room (${payload.status})`, currentRoomId.current);
            currentRoomId.current = null;
            hasJoinedRoom.current = false; 
          }
        }

        dispatch(setActiveRide(payload));
        onActiveRideUpdate?.(payload);
      });
      subscribedToRideUpdate.current = true;
      console.log("📌 Subscribed to ride_update");
    }

    return () => {
      // Keep listeners alive for this component lifecycle
    };
  }, [enabled, activeRide?._id, activeRide?.status, onNewRide, onActiveRideUpdate, dispatch, rideCancelledBeforeDriverAcceptance]);
};