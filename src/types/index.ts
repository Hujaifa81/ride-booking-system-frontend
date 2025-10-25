import type { ComponentType } from "react";


export type { ISendOtp, IVerifyOtp, ILogin, IResetPasswordRequest } from "./auth.type";
export type {IFareResponse,IFareRequest,ITotalRidesCount} from "./ride.type";
export type { User } from "./user.type";
export type { Driver } from "./driver.type";
export type { Vehicle } from "./vehicle.type";
export type { Ride, RideStatus, StatusHistory } from "./ride.type";




export interface IResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export interface ISidebarItem {
  title: string;
  items: {
    title: string;
    url: string;
    component?: ComponentType;
  }[];
}

export type TRole = "RIDER" | "DRIVER" | "ADMIN";