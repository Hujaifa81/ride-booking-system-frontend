import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { getSocket } from "@/lib/socket";
import { addIncomingRequest, removeIncomingRequest, setActiveRide } from "@/redux/features/ride/ride.slice";
import type { Ride } from "@/types";

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
  const subscribedToRideUpdate = useRef(false);

  useEffect(() => {
    const socket = getSocket();

    if (!enabled) {
      if (currentRoomId.current) {
        socket.emit("leave_ride_room", { rideId: currentRoomId.current });
        console.log("leaving room (disabled)", currentRoomId.current);
        currentRoomId.current = null;
      }
      if (subscribedToRideUpdate.current) {
        socket.off("ride_updated");
        subscribedToRideUpdate.current = false;
      }
      socket.off("new_ride_request");
      return;
    }

    const handleNewRide = (payload: Ride) => {
      console.log("new_ride_request received", payload);
      dispatch(addIncomingRequest(payload));
      onNewRide?.(payload);
    };

     const handleRideCancelledBeforeDriverAcceptance = (payload: { rideId: string }) => {
      console.log("ride_cancelled_before_acceptance received", payload);
      dispatch(removeIncomingRequest(payload.rideId));
      rideCancelledBeforeDriverAcceptance?.(payload);
    };
    socket.off("ride_cancelled");
    socket.on("ride_cancelled", handleRideCancelledBeforeDriverAcceptance);


    const handleRideUpdate = (payload: Ride) => {
      console.log("ride_updated received", payload);
      
      const isCancelled = !!payload.status && payload.status.toUpperCase().includes("CANCELLED");
      const isCompleted = payload.status === "COMPLETED";

      if (isCancelled || isCompleted) {
        // Leave room on cancel/complete
        if (currentRoomId.current) {
          socket.emit("leave_ride_room", { rideId: currentRoomId.current });
          console.log(`leaving room (${payload.status})`, currentRoomId.current);
          currentRoomId.current = null;
        }
        if (subscribedToRideUpdate.current) {
          socket.off("ride_updated");
          subscribedToRideUpdate.current = false;
        }
      }

      dispatch(setActiveRide(payload));
      onActiveRideUpdate?.(payload);
    };

    socket.off("new_ride_request");
    socket.on("new_ride_request", handleNewRide);

    const isCancelled = !!activeRide?.status && activeRide.status.toUpperCase().includes("CANCELLED");
    const isCompleted = activeRide?.status === "COMPLETED";
    const canJoin = !!activeRide && !!activeRide._id && !isCancelled && !isCompleted;

    if (canJoin) {
      const nextRoomId = activeRide._id;

      if (currentRoomId.current && currentRoomId.current !== nextRoomId) {
        socket.emit("leave_ride_room", { rideId: currentRoomId.current });
        console.log("leaving room (ride changed)", currentRoomId.current);
        currentRoomId.current = null;
      }

      if (currentRoomId.current !== nextRoomId) {
        socket.emit("join_ride_room", { rideId: nextRoomId });
        console.log("joining room", nextRoomId);
        currentRoomId.current = nextRoomId;

        if (subscribedToRideUpdate.current) {
          socket.off("ride_update");
          subscribedToRideUpdate.current = false;
        }
        socket.on("ride_update", handleRideUpdate);
        subscribedToRideUpdate.current = true;
      }
    } else {
      if (currentRoomId.current) {
        socket.emit("leave_ride_room", { rideId: currentRoomId.current });
        console.log("leaving room (no active ride)", currentRoomId.current);
        currentRoomId.current = null;
      }
      if (subscribedToRideUpdate.current) {
        socket.off("ride_update");
        subscribedToRideUpdate.current = false;
      }
    }

    return () => {
      // socket.off("new_ride_request", handleNewRide);
      
      if (subscribedToRideUpdate.current) {
        socket.off("ride_update", handleRideUpdate);
        subscribedToRideUpdate.current = false;
      }
      if (currentRoomId.current) {
        socket.emit("leave_ride_room", { rideId: currentRoomId.current });
        console.log("leaving room (cleanup)", currentRoomId.current);
        currentRoomId.current = null;
      }
    };
  }, [enabled, activeRide?._id, activeRide?.status, onNewRide, onActiveRideUpdate, dispatch, rideCancelledBeforeDriverAcceptance]);
};