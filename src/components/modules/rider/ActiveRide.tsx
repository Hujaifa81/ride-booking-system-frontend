"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle, 
  Navigation, 
  Car, 
  User, 
  Star,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icons
const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Backend statuses only
type RideStatus = 
  | 'requested' 
  | 'accepted' 
  | 'driver_arriving' 
  | 'driver_arrived' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'pending';

interface Driver {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  rating: number;
  vehicleInfo: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  location: [number, number]; // [lng, lat]
  eta: number; // minutes
}

interface RideData {
  id: string;
  status: RideStatus;
  pickupLocation: {
    address: string;
    coordinates: [number, number]; // [lng, lat]
  };
  dropOffLocation: {
    address: string;
    coordinates: [number, number]; // [lng, lat]
  };
  distance: number;
  estimatedDuration: number;
  estimatedFare: number;
  createdAt: string;
  driver?: Driver;
  route?: [number, number][];
}

const ActiveRide: React.FC = () => {
  const [rideData, setRideData] = useState<RideData>({
    id: "ride_123456",
    status: "requested",
    pickupLocation: {
      address: "Dhaka University, Dhaka 1000, Bangladesh",
      coordinates: [90.4125, 23.8103]
    },
    dropOffLocation: {
      address: "Bashundhara City Mall, Dhaka 1229, Bangladesh",
      coordinates: [90.4203, 23.7808]
    },
    distance: 5.2,
    estimatedDuration: 15,
    estimatedFare: 128,
    createdAt: new Date().toISOString(),
    route: [
      [90.4125, 23.8103],
      [90.4150, 23.8050],
      [90.4180, 23.8000],
      [90.4203, 23.7808]
    ]
  });

  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutes in seconds
  const [driverSearchTime, setDriverSearchTime] = useState<number>(120); // 2 minutes per driver
  const [currentDriverAttempt, setCurrentDriverAttempt] = useState<number>(1);
  
  // UI state to track if we're in searching mode
  const isSearchingForDriver = rideData.status === 'requested';

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          setRideData(prevRide => ({ ...prevRide, status: 'cancelled' }));
          toast.error("Ride request timed out and has been cancelled");
          return 0;
        }
        return prev - 1;
      });

      // Simulate driver search timeout only when status is 'requested'
      if (rideData.status === 'requested') {
        setDriverSearchTime(prev => {
          if (prev <= 0) {
            setCurrentDriverAttempt(prevAttempt => prevAttempt + 1);
            return 120; // Reset to 2 minutes for next driver
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rideData.status]);

  // Simulate status changes
  useEffect(() => {
    const statusTimeout = setTimeout(() => {
      if (rideData.status === 'requested' && currentDriverAttempt <= 3) {
        // Simulate driver acceptance after some time
        if (Math.random() > 0.3) { // 70% chance of acceptance
          const mockDriver: Driver = {
            id: "driver_789",
            name: "Ahmed Hassan",
            phone: "+8801XXXXXXXX",
            avatar: "",
            rating: 4.8,
            vehicleInfo: {
              make: "Toyota",
              model: "Corolla",
              color: "White",
              plateNumber: "DHK-1234"
            },
            location: [90.4100, 23.8150],
            eta: 5
          };
          setRideData(prev => ({ 
            ...prev, 
            status: 'accepted', 
            driver: mockDriver 
          }));
          toast.success("Driver found! Ahmed is coming to pick you up.");
        }
      } else if (rideData.status === 'requested' && currentDriverAttempt > 3) {
        setRideData(prev => ({ ...prev, status: 'pending' }));
        toast.warning("No drivers available. Your request is pending...");
      }
    }, 3000);

    return () => clearTimeout(statusTimeout);
  }, [rideData.status, currentDriverAttempt]);

  const getStatusColor = (status: RideStatus | 'searching'): string => {
    switch (status) {
      case 'requested': return 'bg-blue-500';
      case 'searching': return 'bg-yellow-500';
      case 'accepted': return 'bg-green-500';
      case 'driver_arriving': return 'bg-green-500';
      case 'driver_arrived': return 'bg-green-600';
      case 'in_progress': return 'bg-purple-500';
      case 'completed': return 'bg-green-700';
      case 'cancelled': return 'bg-red-500';
      case 'pending': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: RideStatus | 'searching'): string => {
    switch (status) {
      case 'requested': return 'Ride Requested';
      case 'searching': return 'Searching for Driver';
      case 'accepted': return 'Driver Assigned';
      case 'driver_arriving': return 'Driver on the Way';
      case 'driver_arrived': return 'Driver Arrived';
      case 'in_progress': return 'Trip in Progress';
      case 'completed': return 'Trip Completed';
      case 'cancelled': return 'Trip Cancelled';
      case 'pending': return 'Request Pending';
      default: return 'Unknown Status';
    }
  };

  const getStatusIcon = (status: RideStatus | 'searching') => {
    switch (status) {
      case 'requested': return <CheckCircle className="w-4 h-4" />; // Changed to checkmark since it's completed
      case 'searching': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'driver_arriving': return <Car className="w-4 h-4" />;
      case 'driver_arrived': return <MapPin className="w-4 h-4" />;
      case 'in_progress': return <Navigation className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCancelRide = () => {
    setRideData(prev => ({ ...prev, status: 'cancelled' }));
    toast.success("Ride cancelled successfully");
  };

  const handleCallDriver = () => {
    if (rideData.driver) {
      toast.info(`Calling ${rideData.driver.name}...`);
    }
  };

  const handleMessageDriver = () => {
    if (rideData.driver) {
      toast.info(`Opening chat with ${rideData.driver.name}...`);
    }
  };

  // Get display status for UI (shows 'searching' when status is 'requested')
  const getDisplayStatus = () => {
    return isSearchingForDriver ? 'searching' : rideData.status;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Ride</h1>
            <p className="text-gray-600">Ride ID: {rideData.id}</p>
          </div>
          <Badge 
            className={`${getStatusColor(getDisplayStatus())} text-white px-3 py-1 flex items-center gap-2`}
          >
            {getStatusIcon(getDisplayStatus())}
            {getStatusText(getDisplayStatus())}
          </Badge>
        </div>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ride Progress</h3>
              {(rideData.status === 'requested' || rideData.status === 'pending') && (
                <div className="text-sm text-gray-600">
                  Time remaining: <span className="font-mono font-bold text-red-600">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isSearchingForDriver && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Contacting driver #{currentDriverAttempt}</span>
                  <span>{formatTime(driverSearchTime)}</span>
                </div>
                <Progress value={(120 - driverSearchTime) / 120 * 100} className="h-2" />
              </div>
            )}
            
            <div className="space-y-4">
              {/* Timeline steps */}
              {[
                { key: 'requested', label: 'Ride Requested' },
                { key: 'searching', label: 'Searching for Driver' },
                { key: 'accepted', label: 'Driver Assigned' },
                { key: 'driver_arriving', label: 'Driver on the Way' },
                { key: 'in_progress', label: 'Trip in Progress' },
                { key: 'completed', label: 'Trip Completed' }
              ].map((step, index) => {
                let isActive = false;
                let isCompleted = false;
                
                if (step.key === 'requested') {
                  // Always completed since we're past the request stage
                  isCompleted = true;
                } else if (step.key === 'searching') {
                  // Active if status is still 'requested', completed if we have a driver
                  isActive = rideData.status === 'requested' || rideData.status === 'pending';
                  isCompleted = rideData.status !== 'requested' && rideData.status !== 'cancelled' && rideData.status !== 'pending';
                } else {
                  // For other steps, check against actual backend status
                  const stepIndex = ['accepted', 'driver_arriving', 'in_progress', 'completed'].indexOf(step.key);
                  const currentIndex = ['accepted', 'driver_arriving', 'in_progress', 'completed'].indexOf(rideData.status);
                  
                  isActive = rideData.status === step.key;
                  isCompleted = currentIndex > stepIndex;
                }
                
                return (
                  <div key={step.key} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? getStatusColor(step.key as RideStatus | 'searching') + ' text-white' : 
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {getStatusIcon(step.key as RideStatus | 'searching')}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                        {step.label}
                      </p>
                      {isActive && step.key === 'searching' && (
                        <p className="text-sm text-gray-500">
                          Attempting to contact driver #{currentDriverAttempt}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Driver Information */}
        {rideData.driver && rideData.status !== 'cancelled' && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Your Driver</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={rideData.driver.avatar} />
                  <AvatarFallback>
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{rideData.driver.name}</h4>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">{rideData.driver.rating}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {rideData.driver.vehicleInfo.color} {rideData.driver.vehicleInfo.make} {rideData.driver.vehicleInfo.model}
                  </p>
                  <p className="text-sm font-mono text-gray-800">
                    {rideData.driver.vehicleInfo.plateNumber}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={handleCallDriver}>
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleMessageDriver}>
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {(rideData.status === 'accepted' || rideData.status === 'driver_arriving') && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Driver will arrive in approximately {rideData.driver.eta} minutes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Trip Details */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Trip Details</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Pickup</p>
                  <p className="font-medium">{rideData.pickupLocation.address}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Drop-off</p>
                  <p className="font-medium">{rideData.dropOffLocation.address}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="font-semibold">{rideData.distance} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">{rideData.estimatedDuration} min</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fare</p>
                  <p className="font-semibold">৳{rideData.estimatedFare}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardContent className="p-0">
            <div className="h-[400px] w-full rounded-lg overflow-hidden">
              <MapContainer
                center={[rideData.pickupLocation.coordinates[1], rideData.pickupLocation.coordinates[0]]}
                zoom={13}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <TileLayer 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Route */}
                {rideData.route && (
                  <Polyline 
                    positions={rideData.route.map(coord => [coord[1], coord[0]])}
                    color="blue" 
                    weight={4}
                    opacity={0.7}
                  />
                )}
                
                {/* Pickup marker */}
                <Marker 
                  position={[rideData.pickupLocation.coordinates[1], rideData.pickupLocation.coordinates[0]]} 
                  icon={pickupIcon}
                >
                  <Popup>Pickup Location</Popup>
                </Marker>
                
                {/* Drop-off marker */}
                <Marker 
                  position={[rideData.dropOffLocation.coordinates[1], rideData.dropOffLocation.coordinates[0]]} 
                  icon={dropIcon}
                >
                  <Popup>Drop-off Location</Popup>
                </Marker>
                
                {/* Driver marker */}
                {rideData.driver && (
                  <Marker 
                    position={[rideData.driver.location[1], rideData.driver.location[0]]} 
                    icon={driverIcon}
                  >
                    <Popup>
                      {rideData.driver.name}<br/>
                      {rideData.driver.vehicleInfo.plateNumber}
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {(rideData.status === 'requested' || rideData.status === 'pending') && (
          <Card>
            <CardContent className="pt-6">
              <Button 
                variant="destructive" 
                onClick={handleCancelRide}
                className="w-full"
                size="lg"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Ride
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Emergency Contact */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Emergency Support</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Need help? Call our 24/7 support: +880-1XXXXXXX
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActiveRide;