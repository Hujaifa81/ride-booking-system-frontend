import type { User } from "./user.type";

export interface Vehicle {
  _id: string;
  user: User;
  licensePlate: string;
  model: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}