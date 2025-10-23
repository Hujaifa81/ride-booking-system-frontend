/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useActiveRideQuery, rideApi } from '@/redux/features/ride/ride.api';
import {
  setActiveRide,
  updateRideStatus,
  updateRideData,
  updateDriverLocation,
  setSocketConnected,
  clearActiveRide,
} from '@/redux/features/ride/ride.slice';
import { getSocket } from '@/lib/socket';
import type { RootState, AppDispatch } from '@/redux/store';
import type { Ride, RideStatus } from '@/types';

// Track globally - persists across component mounts/unmounts
let currentRideRoomId: string | null = null;
let globalSocket: any = null;
let listenersAttached = false;

// Store handler references globally so we can reuse them
let globalHandlers: {
  handleConnect: (() => void) | null;
  handleDisconnect: (() => void) | null;
  handleRideUpdate: ((payload: Partial<Ride>) => void) | null;
  handleStatusChange: ((data: { status: RideStatus; updatedBy: string; timestamp: string }) => void) | null;
  handleDriverLocationUpdate: ((data: { location: [number, number]; timestamp: string }) => void) | null;
} = {
  handleConnect: null,
  handleDisconnect: null,
  handleRideUpdate: null,
  handleStatusChange: null,
  handleDriverLocationUpdate: null,
};

export const useActiveRide = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isMounted = useRef(true);

  // Get ride state from Redux
  const { ride, isSocketConnected } = useSelector(
    (state: RootState) => state.activeRide
  );

  // Fetch active ride from API
  const { data: rideResponse, isLoading, error, refetch } = useActiveRideQuery(undefined, {
    refetchOnMountOrArgChange: 30,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Update Redux state when API data changes
  useEffect(() => {
    if (rideResponse?.data && isMounted.current) {
      dispatch(setActiveRide(rideResponse.data));
      
    } else if (!rideResponse?.data && !isLoading && !error) {
      dispatch(clearActiveRide());
      
    }
  }, [rideResponse, isLoading, error, dispatch]);

  // Setup socket listeners and join room - runs once and persists
  useEffect(() => {
    if (!ride?._id) {
      return;
    }

    // Don't connect for cancelled/completed rides
    if (ride.status.startsWith('CANCELLED') || ride.status === 'COMPLETED') {
      // Leave the room if ride is finished
      if (currentRideRoomId === ride._id && globalSocket) {
        console.log('🚪 Leaving ride room (ride finished):', ride._id);
        globalSocket?.emit('leave_ride_room', { rideId: ride._id });
        
        // Clean up listeners
        if (globalHandlers.handleConnect) globalSocket?.off('connect', globalHandlers.handleConnect);
        if (globalHandlers.handleDisconnect) globalSocket?.off('disconnect', globalHandlers.handleDisconnect);
        if (globalHandlers.handleRideUpdate) globalSocket?.off('ride_update', globalHandlers.handleRideUpdate);
        if (globalHandlers.handleStatusChange) globalSocket?.off('ride_status_change', globalHandlers.handleStatusChange);
        if (globalHandlers.handleDriverLocationUpdate) globalSocket?.off('driver_location_update', globalHandlers.handleDriverLocationUpdate);
        
        currentRideRoomId = null;
        listenersAttached = false;
        globalHandlers = {
          handleConnect: null,
          handleDisconnect: null,
          handleRideUpdate: null,
          handleStatusChange: null,
          handleDriverLocationUpdate: null,
        };
        dispatch(setSocketConnected(false));
      }
      return;
    }

    const socket = getSocket();
    globalSocket = socket;

    // Create handlers only once and store them globally
    if (!listenersAttached) {
      console.log('🎧 Setting up socket listeners (ONCE)');

      globalHandlers.handleConnect = () => {
        console.log('✅ Socket connected');
        dispatch(setSocketConnected(true));
        
        // Rejoin room on reconnection if we have an active ride
        if (currentRideRoomId) {
          console.log('🔄 Rejoining ride room after reconnection:', currentRideRoomId);
          socket.emit('join_ride_room', { rideId: currentRideRoomId });
        }
      };

      globalHandlers.handleDisconnect = () => {
        console.log('❌ Socket disconnected');
        dispatch(setSocketConnected(false));
      };

      globalHandlers.handleRideUpdate = (payload: Partial<Ride>) => {
        console.log('📡 Ride update received:', payload);

        dispatch(updateRideData(payload));

        // Invalidate cache for significant changes
        if (payload.status?.startsWith('CANCELLED') || payload.status === 'COMPLETED') {
          console.log('⚠️ Ride finished, invalidating cache');
          dispatch(rideApi.util.invalidateTags(['RIDE']));
          console.log(ride,rideResponse);
          refetch();
          
        } else {
          // Optimistic update
          dispatch(
            rideApi.util.updateQueryData('activeRide', undefined, (draft) => {
              if (draft?.data) {
                Object.assign(draft.data, payload);
              }
            })
          );
        }
      };

      globalHandlers.handleStatusChange = ({
        status,
        updatedBy,
        timestamp,
      }: {
        status: RideStatus;
        updatedBy: string;
        timestamp: string;
      }) => {
        console.log('🔄 Status change received:', {
          newStatus: status,
          timestamp,
          updatedBy
        });

        dispatch(updateRideStatus({ status, timestamp, by: updatedBy }));

        // Invalidate cache for significant changes
        if (status.startsWith('CANCELLED') || status === 'COMPLETED') {
          console.log('⚠️ Significant status change, invalidating cache');
          dispatch(rideApi.util.invalidateTags(['RIDE']));
          console.log(ride,rideResponse);
          refetch();
        } else {
          // Optimistic update
          dispatch(
            rideApi.util.updateQueryData('activeRide', undefined, (draft) => {
              if (draft?.data) {
                draft.data.status = status;
                draft.data.statusHistory = [
                  ...draft.data.statusHistory,
                  { status, timestamp, by: updatedBy },
                ];
                console.log('✅ RTK Query cache updated with new status:', status);
              }
            })
          );
        }
      };

      globalHandlers.handleDriverLocationUpdate = ({
        location,
      }: {
        location: [number, number];
        timestamp: string;
      }) => {
        console.log('📍 Driver location update:', location);
        dispatch(updateDriverLocation(location));
      };

      // Attach listeners ONCE
      socket?.on('connect', globalHandlers.handleConnect);
      socket?.on('disconnect', globalHandlers.handleDisconnect);
      socket?.on('ride_update', globalHandlers.handleRideUpdate);
      socket?.on('ride_status_change', globalHandlers.handleStatusChange);
      socket?.on('driver_location_update', globalHandlers.handleDriverLocationUpdate);

      listenersAttached = true;
      console.log('✅ Socket listeners attached globally');
    }

    // Join room only if we're not already in this room
    if (currentRideRoomId !== ride._id) {
      // Leave previous room if in a different one
      if (currentRideRoomId) {
        console.log('🚪 Switching rooms - leaving:', currentRideRoomId);
        socket?.emit('leave_ride_room', { rideId: currentRideRoomId });
      }

      // Join new room
      if (socket?.connected) {
        console.log('🚪 Joining ride room:', ride._id);
        socket.emit('join_ride_room', { rideId: ride._id });
        currentRideRoomId = ride._id;
        dispatch(setSocketConnected(true));
      } else {
        console.log('⏳ Waiting for socket connection to join room:', ride._id);
        dispatch(setSocketConnected(false));
        // Will auto-join when socket connects (handleConnect does this)
        currentRideRoomId = ride._id;
      }
    } else {
      console.log('✅ Already in ride room:', ride._id, '- staying connected');
    }

    // Cleanup - DON'T remove listeners or leave room
    return () => {
      console.log('🧹 Component unmounted - but STAYING in room:', currentRideRoomId);
      // Intentionally empty - we keep the room connection alive
    };
  }, [ride?._id, ride?.status, dispatch, refetch]);

  // Component mount tracking
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    ride,
    isLoading,
    error,
    refetch,
    isSocketConnected,
  };
};

// Export function to manually leave room and cleanup (call this on logout)
export const leaveActiveRideRoom = () => {
  if (currentRideRoomId && globalSocket) {
    console.log('🚪 Manually leaving ride room:', currentRideRoomId);
    globalSocket?.emit('leave_ride_room', { rideId: currentRideRoomId });
    
    // Remove all listeners
    if (globalHandlers.handleConnect) globalSocket?.off('connect', globalHandlers.handleConnect);
    if (globalHandlers.handleDisconnect) globalSocket?.off('disconnect', globalHandlers.handleDisconnect);
    if (globalHandlers.handleRideUpdate) globalSocket?.off('ride_update', globalHandlers.handleRideUpdate);
    if (globalHandlers.handleStatusChange) globalSocket?.off('ride_status_change', globalHandlers.handleStatusChange);
    if (globalHandlers.handleDriverLocationUpdate) globalSocket?.off('driver_location_update', globalHandlers.handleDriverLocationUpdate);
    
    currentRideRoomId = null;
    listenersAttached = false;
    globalSocket = null;
    globalHandlers = {
      handleConnect: null,
      handleDisconnect: null,
      handleRideUpdate: null,
      handleStatusChange: null,
      handleDriverLocationUpdate: null,
    };
    
    console.log('✅ Ride room cleanup completed');
  }
};