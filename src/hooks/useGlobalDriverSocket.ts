/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { initSocket } from "@/lib/socket";
import { useDispatch } from "react-redux";
import {
  addIncomingRequest,
  removeIncomingRequest,
  setActiveRide,
  clearActiveRide,
  clearIncomingRequests,
} from "@/redux/features/ride/ride.slice";
import { rideApi } from "@/redux/features/ride/ride.api";
import type { Ride } from "@/types";
import { useGetDriverProfileQuery } from "@/redux/features/driver/driver.api";
import { DriverStatus } from "@/constants/status";
import { toast } from "sonner";

let globalDriverListenersRegistered = false;
let registeredHandlers: { [key: string]: (...args: any[]) => void } = {};

/**
 * ✅ Register driver socket listeners ONCE globally
 * Stays alive across ALL driver page navigations
 * Properly cleans up when driver leaves dashboard or goes OFFLINE
 */
export const useGlobalDriverSocket = () => {
  const dispatch = useDispatch();
  const { data: profileData } = useGetDriverProfileQuery(undefined, { skip: false });
  const status = profileData?.data?.status;

  useEffect(() => {
    const socket = initSocket();

    // ✅ If driver is OFFLINE, disconnect socket
    if (status === DriverStatus.OFFLINE) {
      console.log("🔴 [SOCKET] Driver is OFFLINE - disconnecting socket");
      if (socket.connected) {
        socket.disconnect();
        console.log("🔴 [SOCKET] Socket disconnected because driver is OFFLINE");
      }
      globalDriverListenersRegistered = false;
      registeredHandlers = {};
      return;
    }

    // ✅ If driver is ONLINE/AVAILABLE, ensure socket is connected and listeners are registered
    if (status === DriverStatus.AVAILABLE || status === DriverStatus.ON_TRIP) {
      console.log("🟢 [SOCKET] Driver is ONLINE (status:", status, ") - connecting socket");
      
      if (!socket.connected) {
        socket.connect();
        console.log("🟢 [SOCKET] Socket connecting...");
      }

      if (globalDriverListenersRegistered) {
        console.log("✅ Global driver listeners already registered");
        return;
      }

      globalDriverListenersRegistered = true;
      console.log("📡 Registering GLOBAL driver socket listeners...");

      // ✅ NEW RIDE REQUEST
      const handleNewRideRequest = (payload: Ride) => {
        console.log("🎯 GLOBAL: new_ride_request received:", payload._id);
        dispatch(addIncomingRequest(payload));
        dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES"]));
        toast.success("New ride request received!");
      };
      socket.on("new_ride_request", handleNewRideRequest);
      registeredHandlers["new_ride_request"] = handleNewRideRequest;

      // ✅ RIDE CANCELLED BEFORE ACCEPTANCE
      const handleRideCancelledBeforeAcceptance = (payload: { rideId: string }) => {
        console.log("🚫 GLOBAL: ride_cancelled_before_acceptance:", payload.rideId);
        dispatch(removeIncomingRequest(payload.rideId));
        dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES"]));
      };
      socket.on("ride_cancelled_before_acceptance", handleRideCancelledBeforeAcceptance);
      registeredHandlers["ride_cancelled_before_acceptance"] = handleRideCancelledBeforeAcceptance;

      // ✅ RIDE CANCELLED
      const handleRideCancelled = (payload: { rideId: string }) => {
        console.log("🚫 GLOBAL: ride_cancelled:", payload.rideId);
        dispatch(removeIncomingRequest(payload.rideId));
        dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES"]));
      };
      socket.on("ride_cancelled", handleRideCancelled);
      registeredHandlers["ride_cancelled"] = handleRideCancelled;

      // ✅ RIDE STATUS UPDATED
      const handleRideUpdate = (payload: Ride) => {
        console.log("🔄 GLOBAL: ride_update received:", payload._id, "Status:", payload.status);

        const isCancelled = payload.status?.toUpperCase().includes("CANCELLED");
        const isCompleted = payload.status === "COMPLETED";

        if (isCompleted) {
          console.log("✅ GLOBAL: Ride completed - clearing everything and leaving room");
          // ✅ Leave ride room when completed
          socket.emit("leave_ride_room", { rideId: payload._id });
          console.log("🚪 GLOBAL: Emitted leave_ride_room for completed ride:", payload._id);

          dispatch(clearActiveRide());
          dispatch(clearIncomingRequests());
          dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES", "ACTIVE_RIDE", "RIDE_STATS"]));
        } else if (isCancelled) {
          console.log("❌ GLOBAL: Ride cancelled - clearing everything and leaving room");
          // ✅ Leave ride room when cancelled
          socket.emit("leave_ride_room", { rideId: payload._id });
          console.log("🚪 GLOBAL: Emitted leave_ride_room for cancelled ride:", payload._id);

          dispatch(clearActiveRide());
          dispatch(clearIncomingRequests());
          dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES", "ACTIVE_RIDE"]));
        } else {
          console.log("🔄 GLOBAL: Ride in progress - updating Redux");
          dispatch(setActiveRide(payload));
          dispatch(rideApi.util.invalidateTags(["ACTIVE_RIDE"]));
        }
      };
      socket.on("ride_update", handleRideUpdate);
      registeredHandlers["ride_update"] = handleRideUpdate;

      // ✅ CONNECTION EVENTS
      const handleConnect = () => {
        console.log("✅ GLOBAL: Socket connected");
        dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES", "ACTIVE_RIDE"]));
      };
      socket.on("connect", handleConnect);
      registeredHandlers["connect"] = handleConnect;

      const handleDisconnect = () => {
        console.log("❌ GLOBAL: Socket disconnected (will auto-reconnect)");
      };
      socket.on("disconnect", handleDisconnect);
      registeredHandlers["disconnect"] = handleDisconnect;

      const handleError = (err: any) => {
        console.error("⚠️ GLOBAL: Socket error:", err);
      };
      socket.on("error", handleError);
      registeredHandlers["error"] = handleError;

      // ✅ CLEANUP: Remove all listeners properly
      return () => {
        console.log("🧹 Cleaning up GLOBAL driver socket listeners...");

        socket.off("new_ride_request", registeredHandlers["new_ride_request"] as any);
        socket.off("ride_cancelled_before_acceptance", registeredHandlers["ride_cancelled_before_acceptance"] as any);
        socket.off("ride_cancelled", registeredHandlers["ride_cancelled"] as any);
        socket.off("ride_update", registeredHandlers["ride_update"] as any);
        socket.off("connect", registeredHandlers["connect"] as any);
        socket.off("disconnect", registeredHandlers["disconnect"] as any);
        socket.off("error", registeredHandlers["error"] as any);

        globalDriverListenersRegistered = false;
        registeredHandlers = {};

        console.log("✅ All GLOBAL driver socket listeners removed");
      };
    }
  }, [dispatch, status]);
};