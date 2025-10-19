import type { RideStatus } from "@/types";
import { AlertCircle, Car, CheckCircle, Clock, MapPin, Navigation, Loader2, X } from "lucide-react";

export const getStatusColor = (status: RideStatus | 'searching'): string => {
  switch (status) {
    case 'REQUESTED': return 'bg-blue-500';
    case 'searching': return 'bg-yellow-500';
    case 'PENDING': return 'bg-orange-500';
    case 'ACCEPTED': return 'bg-green-500';
    case 'GOING_TO_PICK_UP': return 'bg-green-500';
    case 'DRIVER_ARRIVED': return 'bg-green-600';
    case 'IN_TRANSIT': return 'bg-purple-500';
    case 'REACHED_DESTINATION': return 'bg-purple-600';
    case 'COMPLETED': return 'bg-green-700';
    case 'CANCELLED_BY_RIDER': return 'bg-red-500';
    case 'CANCELLED_BY_DRIVER': return 'bg-red-500';
    case 'CANCELLED_BY_ADMIN': return 'bg-red-600';
    case 'CANCELLED_FOR_PENDING_TIME_OVER': return 'bg-red-700';
    default: return 'bg-gray-500';
  }
};

export const getStatusText = (status: RideStatus | 'searching'): string => {
  switch (status) {
    case 'REQUESTED': return 'Searching for Driver';
    case 'searching': return 'Searching for Driver';
    case 'PENDING': return 'Searching for Driver';
    case 'ACCEPTED': return 'Driver Assigned';
    case 'GOING_TO_PICK_UP': return 'Driver on the Way';
    case 'DRIVER_ARRIVED': return 'Driver Arrived';
    case 'IN_TRANSIT': return 'Trip in Progress';
    case 'REACHED_DESTINATION': return 'Reached Destination';
    case 'COMPLETED': return 'Trip Completed';
    case 'CANCELLED_BY_RIDER': return 'Cancelled by You';
    case 'CANCELLED_BY_DRIVER': return 'Cancelled by Driver';
    case 'CANCELLED_BY_ADMIN': return 'Cancelled by Admin';
    case 'CANCELLED_FOR_PENDING_TIME_OVER': return 'Cancelled - Timeout';
    default: return 'Unknown Status';
  }
};

export const getStatusIcon = (status: RideStatus | 'searching') => {
  switch (status) {
    case 'REQUESTED': return <CheckCircle className="w-4 h-4" />;
    case 'searching': return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'PENDING': return <AlertCircle className="w-4 h-4" />;
    case 'ACCEPTED': return <CheckCircle className="w-4 h-4" />;
    case 'GOING_TO_PICK_UP': return <Car className="w-4 h-4" />;
    case 'DRIVER_ARRIVED': return <MapPin className="w-4 h-4" />;
    case 'IN_TRANSIT': return <Navigation className="w-4 h-4" />;
    case 'REACHED_DESTINATION': return <MapPin className="w-4 h-4" />;
    case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
    case 'CANCELLED_BY_RIDER':
    case 'CANCELLED_BY_DRIVER':
    case 'CANCELLED_BY_ADMIN':
    case 'CANCELLED_FOR_PENDING_TIME_OVER':
      return <X className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};