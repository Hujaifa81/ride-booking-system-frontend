import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Ride, RideStatus } from '@/types';



interface ActiveRideState {
  ride: Ride | null;
  isSocketConnected: boolean;
}

export interface IncomingRequestsState {
  requests: Ride[];
  isLoading: boolean;
  error: string | null;
}

const initialActiveRideState: ActiveRideState = {
  ride: null,
  isSocketConnected: false,
};

const initialIncomingRequestsState: IncomingRequestsState = {
  requests: [],
  isLoading: false,
  error: null,
};

const activeRideSlice = createSlice({
  name: 'activeRide',
  initialState: initialActiveRideState,
  reducers: {
    setActiveRide: (state, action: PayloadAction<Ride | null>) => {
      state.ride = action.payload;
    },
    updateRideStatus: (
      state,
      action: PayloadAction<{ status: RideStatus; timestamp: string; by: string }>
    ) => {
      if (state.ride) {
        state.ride.status = action.payload.status;
        state.ride.statusHistory = [
          ...(state.ride.statusHistory ?? []),
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

const incomingRequestsSlice = createSlice({
  name: 'incomingRequests',
  initialState: initialIncomingRequestsState,
  reducers: {
    setIncomingRequests: (state, action: PayloadAction<Ride[]>) => {
      state.requests = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addIncomingRequest: (state, action: PayloadAction<Ride>) => {
      const exists = state.requests.some((r) => r._id === action.payload._id);
      if (!exists) {
        state.requests.unshift(action.payload);
      }
    },
    removeIncomingRequest: (state, action: PayloadAction<string>) => {
      state.requests = state.requests.filter((ride) => ride._id !== action.payload);
      
    },
    clearIncomingRequests: (state) => {
      state.requests = [];
      state.error = null;
    },
    setLoadingIncomingRequests: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setErrorIncomingRequests: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    
  },
});

// Actions
export const {
  setActiveRide,
  updateRideStatus,
  updateRideData,
  updateDriverLocation,
  setSocketConnected,
  clearActiveRide,
} = activeRideSlice.actions;

export const {
  setIncomingRequests,
  addIncomingRequest,
  removeIncomingRequest,
  clearIncomingRequests,
  setLoadingIncomingRequests,
  setErrorIncomingRequests,
} = incomingRequestsSlice.actions;

// Reducers
export const activeRideReducer = activeRideSlice.reducer;
export const incomingRequestsReducer = incomingRequestsSlice.reducer;

export default activeRideSlice.reducer;