import type { Vehicle } from "./vehicle.type";

export interface Driver {
  _id: string;
  user: string;
  licenseNumber: string;
  rating: number;
  status: string;
  approved: boolean;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  activeRide: string;
  earnings: number;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  vehicles?: Vehicle[]
}


