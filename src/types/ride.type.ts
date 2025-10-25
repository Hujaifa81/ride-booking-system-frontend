import type { Driver } from "./driver.type";
import type { User } from "./user.type";
import type { Vehicle } from "./vehicle.type";

export interface IFareResponse {
  approximateFare: number;
}

export interface IFareRequest {
    pickupLocation: string;
    dropoffLocation: string;
}

export interface ITotalRidesCount {
  totalRides: number;
  cancelledRides: number;
}

export interface Ride {
  _id: string;
  pickupLocation: {
    type: "Point";
    coordinates: [number, number];
  };
  dropOffLocation: {
    type: "Point";
    coordinates: [number, number];
  };
  approxFare: number;
  user: User;
  driver?: Driver;
  vehicle?: Vehicle;
  status: RideStatus;
  statusHistory: StatusHistory[];
  rejectedDrivers: string[];
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
  pickupAddress?: string;
  dropOffAddress?: string;
  estimatedDuration?: number;
  distance?: number;
  route?: [number, number][];
  canceledReason?: string;
}

export interface StatusHistory {
  status: RideStatus;
  timestamp: string;
  by: string;
}

export type RideStatus =
  | 'REQUESTED'
  | 'PENDING'
  | 'ACCEPTED'
  | 'GOING_TO_PICK_UP'
  | 'DRIVER_ARRIVED'
  | 'IN_TRANSIT'
  | 'REACHED_DESTINATION'
  | 'COMPLETED'
  | 'CANCELLED_BY_RIDER'
  | 'CANCELLED_BY_DRIVER'
  | 'CANCELLED_BY_ADMIN'
  | 'CANCELLED_FOR_PENDING_TIME_OVER';

