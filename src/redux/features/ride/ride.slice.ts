import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Ride, RideStatus } from '@/types';

interface ActiveRideState {
  ride: Ride | null;
  isSocketConnected: boolean;
}

const initialState: ActiveRideState = {
  ride: null,
  isSocketConnected: false,
};

const activeRideSlice = createSlice({
  name: 'activeRide',
  initialState,
  reducers: {
    setActiveRide: (state, action: PayloadAction<Ride | null>) => {
      state.ride = action.payload;
    },
    updateRideStatus: (state, action: PayloadAction<{ status: RideStatus; timestamp: string; by: string }>) => {
      if (state.ride) {
        state.ride.status = action.payload.status;
        state.ride.statusHistory = [
          ...state.ride.statusHistory,
          {
            status: action.payload.status,
            timestamp: action.payload.timestamp,
            by: action.payload.by,
          },
        ];
      }
    },
    updateRideData: (state, action: PayloadAction<Partial<Ride>>) => {
      if (state.ride) {
        state.ride = { ...state.ride, ...action.payload };
      }
    },
    updateDriverLocation: (state, action: PayloadAction<[number, number]>) => {
      if (state.ride?.driver) {
        state.ride.driver.location = {
          type: 'Point',
          coordinates: action.payload,
        };
      }
    },
    setSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.isSocketConnected = action.payload;
    },
    clearActiveRide: (state) => {
      state.ride = null;
      state.isSocketConnected = false;
    },
  },
});

export const {
  setActiveRide,
  updateRideStatus,
  updateRideData,
  updateDriverLocation,
  setSocketConnected,
  clearActiveRide,
} = activeRideSlice.actions;

export default activeRideSlice.reducer;