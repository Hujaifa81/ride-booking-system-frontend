import { useMemo, useState } from "react";
import {
  Car,
  MapPin,
  DollarSign,
  Timer,
  Star,
  Navigation,
  Phone,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetDriverProfileQuery, useUpdateDriverStatusMutation } from "@/redux/features/driver/driver.api";
import { DriverStatus } from "@/constants/status";
import { toast } from "sonner";

type RideRequest = {
  id: string;
  pickup: string;
  dropoff: string;
  distanceKm: number;
  etaMin: number;
  fare: number;
};

type ActiveRide = {
  id: string;
  pickup: string;
  dropoff: string;
  stage: "en_route_pickup" | "with_passenger";
  distanceKm: number;
  etaMin: number;
  fare: number;
};

const DriverDashboard = () => {
  const {
    data: driverProfile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useGetDriverProfileQuery(undefined);

  const [updateStatus, { isLoading: isUpdating }] = useUpdateDriverStatusMutation();

  const status = (driverProfile as any)?.data?.status;
  const isAvailable = status === DriverStatus.AVAILABLE;
  const isOnTrip = status === DriverStatus.ON_TRIP;
  const isOffline = status === DriverStatus.OFFLINE || !status;

  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [incoming, setIncoming] = useState<RideRequest[]>([
    {
      id: "RQ-28421",
      pickup: "221B Baker Street, Marylebone",
      dropoff: "Heathrow Airport T3",
      distanceKm: 24.2,
      etaMin: 6,
      fare: 42.5,
    },
    {
      id: "RQ-28422",
      pickup: "10 Downing Street",
      dropoff: "King's Cross Station",
      distanceKm: 5.7,
      etaMin: 4,
      fare: 12.2,
    },
    {
      id: "RQ-28423",
      pickup: "Canary Wharf",
      dropoff: "Greenwich Park",
      distanceKm: 8.9,
      etaMin: 8,
      fare: 18.4,
    },
  ]);

  const [metrics, setMetrics] = useState({
    earningsToday: 126.75,
    tripsToday: 9,
    onlineMins: 312, // 5h12m
    rating: 4.92,
    acceptanceRate: 96,
    weeklyEarnings: [85, 120, 140, 90, 160, 200, 126],
  });

  const onlineH = Math.floor(metrics.onlineMins / 60);
  const onlineM = metrics.onlineMins % 60;

  const toggleAvailability = async () => {
    if (isOnTrip) return;
    const next = isAvailable ? DriverStatus.OFFLINE : DriverStatus.AVAILABLE;
    try {
      await updateStatus({ status: next }).unwrap();
      refetchProfile();
    } catch(err) {
      toast.error(err?.data?.message);
    }
  };

  const acceptRequest = async (req: RideRequest) => {
    try {
      await updateStatus({ status: DriverStatus.ON_TRIP }).unwrap();
      setActiveRide({
        id: req.id,
        pickup: req.pickup,
        dropoff: req.dropoff,
        stage: "en_route_pickup",
        distanceKm: req.distanceKm,
        etaMin: req.etaMin,
        fare: req.fare,
      });
      setIncoming((prev) => prev.filter((r) => r.id !== req.id));
      refetchProfile();
    } catch {
      alert("Failed to accept ride");
    }
  };

  const finishRide = async (fare: number) => {
    try {
      await updateStatus({ status: DriverStatus.AVAILABLE }).unwrap();
      setActiveRide(null);
      setMetrics((m) => ({
        ...m,
        tripsToday: m.tripsToday + 1,
        earningsToday: m.earningsToday + (fare || 0),
      }));
      refetchProfile();
    } catch {
      alert("Failed to complete ride");
    }
  };

  const declineRequest = (id: string) => {
    setIncoming((prev) => prev.filter((r) => r.id !== id));
    setMetrics((m) => ({ ...m, acceptanceRate: Math.max(70, m.acceptanceRate - 1) }));
  };

  const progressBar = (value: number, color = "bg-emerald-500") => (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );

  const sparkline = useMemo(() => {
    const data = metrics.weeklyEarnings;
    const w = 200;
    const h = 40;
    const max = Math.max(...data, 1);
    const stepX = w / (data.length - 1 || 1);
    const pts = data.map((v, i) => {
      const x = i * stepX;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x},${y}`;
    });
    return { w, h, pts: pts.join(" ") };
  }, [metrics.weeklyEarnings]);

  const statusBadge = () => {
    const cls =
      isAvailable
        ? "border-emerald-200 text-emerald-700 bg-emerald-50"
        : isOnTrip
        ? "border-sky-200 text-sky-700 bg-sky-50"
        : "border-slate-200 text-slate-600";
    const dot =
      isAvailable ? "bg-emerald-500" : isOnTrip ? "bg-sky-500" : "bg-slate-300";
    const label = isAvailable ? "Online" : isOnTrip ? "On Trip" : "Offline";
    return (
      <Badge variant="outline" className={cls}>
        <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
        {label}
      </Badge>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Driver Dashboard</h1>
          <p className="text-sm text-slate-500">Monitor rides, earnings, and performance</p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge()}
          <Button
            variant={isAvailable ? "outline" : isOnTrip ? "secondary" : "default"}
            onClick={toggleAvailability}
            disabled={isUpdating || isOnTrip || isProfileLoading}
            title={isOnTrip ? "You are on a trip" : undefined}
          >
            {isUpdating
              ? "Updating..."
              : isAvailable
              ? "Go Offline"
              : isOnTrip
              ? "On Trip"
              : "Go Online"}
          </Button>
          <Button variant="outline" onClick={() => refetchProfile()} disabled={isProfileLoading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Profile load/error states (light-touch) */}
      {isProfileError && (
        <div className="mb-4 text-sm text-rose-600">
          Failed to load profile. Try Refresh.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Earnings Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              {isProfileLoading ? "—" : `$${metrics.earningsToday.toFixed(2)}`}
            </div>
            <div className="mt-3">{progressBar((metrics.earningsToday / 200) * 100)}</div>
            <div className="text-xs text-slate-500 mt-1">Target: $200</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Timer className="w-4 h-4 text-sky-600" />
              Online Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              {onlineH}h {onlineM}m
            </div>
            <div className="mt-3">{progressBar((metrics.onlineMins / (8 * 60)) * 100, "bg-sky-500")}</div>
            <div className="text-xs text-slate-500 mt-1">Goal: 8h</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Car className="w-4 h-4 text-indigo-600" />
              Trips Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{metrics.tripsToday}</div>
            <div className="mt-3">{progressBar((metrics.tripsToday / 20) * 100, "bg-indigo-500")}</div>
            <div className="text-xs text-slate-500 mt-1">Target: 20 trips</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Rating & Acceptance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <div className="text-2xl font-semibold text-slate-900">{metrics.rating.toFixed(2)}</div>
              <div className="text-xs text-slate-500">/ 5.0</div>
              <div className="ml-auto text-sm text-slate-700">{metrics.acceptanceRate}%</div>
            </div>
            <div className="mt-3">{progressBar(metrics.acceptanceRate, "bg-amber-500")}</div>
            <div className="text-xs text-slate-500 mt-1">Acceptance Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Active Ride / Availability */}
        <Card className="xl:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Ride</CardTitle>
                <CardDescription>
                  {activeRide
                    ? `Ride ${activeRide.id}`
                    : isAvailable
                    ? "You are available for new requests"
                    : "Go online to receive requests"}
                </CardDescription>
              </div>
              {activeRide && (
                <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">
                  {activeRide.stage === "en_route_pickup" ? "Going to pickup" : "In transit"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeRide ? (
              <>
                <div className="rounded-lg border bg-slate-50 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-800">{activeRide.pickup}</span>
                      </div>
                      <div className="h-4 w-0.5 bg-slate-300 ml-2 my-2 rounded-full" />
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-600" />
                        <span className="font-medium text-slate-800">{activeRide.dropoff}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-500" />
                          ETA {activeRide.etaMin}m
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-slate-500" />
                          {activeRide.distanceKm.toFixed(1)} km
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-slate-500" />${activeRide.fare.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <Button
                        variant="default"
                        className="w-full sm:w-48"
                        onClick={() => window.open("https://www.google.com/maps", "_blank")}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Start Navigation
                      </Button>
                      <div className="flex gap-2">
                        {activeRide.stage === "en_route_pickup" ? (
                          <Button
                            className="flex-1"
                            onClick={() =>
                              setActiveRide((r) =>
                                r ? { ...r, stage: "with_passenger", etaMin: Math.max(3, r.etaMin - 2) } : r
                              )
                            }
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Picked Up
                          </Button>
                        ) : (
                          <Button
                            className="flex-1"
                            onClick={() => finishRide(activeRide.fare)}
                            disabled={isUpdating}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Complete
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => finishRide(0)}
                          disabled={isUpdating}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                      <Button variant="outline" className="w-full sm:w-48" onClick={() => alert("Calling passenger...")}>
                        <Phone className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border bg-white p-6 text-center">
                <div className="text-slate-600">
                  {isAvailable ? "No active rides. Waiting for the next request..." : "You are offline."}
                </div>
                {isAvailable && incoming.length > 0 && (
                  <div className="text-xs text-slate-500 mt-1">You’ll be notified when a new request arrives.</div>
                )}
                {isOffline && (
                  <Button className="mt-4" onClick={toggleAvailability} disabled={isUpdating || isProfileLoading}>
                    Go Online
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earnings trend */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Earnings Trend</CardTitle>
            <CardDescription>This week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold text-slate-900">
                  ${metrics.weeklyEarnings.reduce((a, b) => a + b, 0).toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">Week total</div>
              </div>
              <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">
                +8.4% vs last week
              </Badge>
            </div>
            <div className="mt-4 rounded-lg border bg-gradient-to-b from-slate-50 to-white p-3">
              <svg width={sparkline.w} height={sparkline.h}>
                <polyline
                  fill="none"
                  stroke="rgb(16, 185, 129)"
                  strokeWidth="2"
                  points={sparkline.pts}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
              <div className="mt-2 grid grid-cols-7 text-[11px] text-slate-500">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="text-center">
                    {d}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMetrics((m) => ({ ...m, weeklyEarnings: m.weeklyEarnings.map((v) => v + 10) }))}
              >
                Boost
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setMetrics((m) => ({
                    ...m,
                    weeklyEarnings: [85, 120, 140, 90, 160, 200, 126],
                  }))
                }
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        {/* Incoming Requests */}
        <Card className="xl:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Incoming Requests</CardTitle>
            <CardDescription>Accept or decline new ride requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {incoming.length === 0 ? (
              <div className="text-sm text-slate-600 border rounded-lg p-6 text-center">No pending requests</div>
            ) : (
              incoming.map((req) => (
                <div
                  key={req.id}
                  className="rounded-lg border p-3 sm:p-4 bg-white hover:bg-slate-50/60 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-slate-500">{req.id}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-800">{req.pickup}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-rose-600" />
                        <span className="font-medium text-slate-800">{req.dropoff}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-500" />
                          ETA {req.etaMin}m
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-slate-500" />
                          {req.distanceKm.toFixed(1)} km
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-slate-500" />${req.fare.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button className="flex-1 sm:flex-none" onClick={() => acceptRequest(req)} disabled={isUpdating || isOnTrip}>
                        Accept
                      </Button>
                      <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => declineRequest(req.id)} disabled={isUpdating}>
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest completed trips and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {[
                { id: "TR-8172", text: "Trip completed • 6.2 km • $12.80", ts: "Just now" },
                { id: "TR-8169", text: "Rider rated you 5.0 ★", ts: "18m ago" },
                { id: "TR-8163", text: "Trip completed • 12.4 km • $21.50", ts: "1h ago" },
                { id: "SYS-PR", text: "Payout request initiated", ts: "2h ago" },
              ].map((a) => (
                <li key={a.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                  <div>
                    <div className="text-sm text-slate-800">{a.text}</div>
                    <div className="text-xs text-slate-500">{a.ts}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverDashboard;