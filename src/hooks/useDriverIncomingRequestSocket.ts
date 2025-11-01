import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import type { Ride } from "@/types";

type UseRideSocketOpts = {
  enabled?: boolean;
  onNewRide?: (payload: Ride) => void;
};

export const useDriverIncomingRequestSocket = ({ enabled=true, onNewRide }: UseRideSocketOpts) => {
  useEffect(() => {
    console.log("useRideSocket - enabled:", enabled);
    if (!enabled) return;
    const socket = getSocket();

    const handleNewRide = (payload: Ride) => onNewRide?.(payload);
    socket.on("new_ride_request", handleNewRide);

    return () => {
      socket.off("new_ride_request", handleNewRide);
    };
  }, [enabled, onNewRide]);
};