/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetEarningsAnalyticsQuery,
  useGetPeakEarningHoursQuery,
  useGetTopRoutesQuery,
} from "@/redux/features/driver/driver.api";

const EarningsAnalytics = () => {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");

  // API Queries
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useGetEarningsAnalyticsQuery({ params: { filter: timeframe } });

  const {
    data: peakEarningHourData,
    isLoading: peakEarningHourLoading,
  } = useGetPeakEarningHoursQuery(undefined);

  const {
    data: topRoutesData,
    isLoading: topRoutesLoading,
  } = useGetTopRoutesQuery(undefined);

  // Extract data
  const analytics = analyticsData?.data;
  const peakEarningHours = peakEarningHourData?.data;
  const topRoutes = topRoutesData?.data;
  console.log(analytics);
  console.log(peakEarningHours);
  console.log(topRoutes)
  // Format period label
  const getPeriodLabel = () => {
    switch (timeframe) {
      case "daily":
        return "Day";
      case "weekly":
        return "Week";
      case "monthly":
        return "Month";
      case "yearly":
        return "Year";
      default:
        return "Period";
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (!analytics?.summary) {
      return {
        totalEarnings: "0.00",
        avgEarnings: "0.00",
        maxEarnings: "0.00",
        minEarnings: "0.00",
        totalTrips: 0,
        earningsChange: 0,
        earningsTrend: "neutral",
        ridesChange: 0,
        ridesTrend: "neutral",
      };
    }

    return {
      totalEarnings: analytics.summary.currentEarnings.toFixed(2),
      avgEarnings:
        timeframe === "daily"
          ? analytics.summary.averagePerDay?.toFixed(2) || "0.00"
          : timeframe === "weekly"
          ? analytics.summary.averagePerWeek?.toFixed(2) || "0.00"
          : timeframe === "monthly"
          ? analytics.summary.averagePerMonth?.toFixed(2) || "0.00"
          : analytics.summary.averagePerYear?.toFixed(2) || "0.00",
      maxEarnings: analytics.summary.highestDayEarning?.toFixed(2) || analytics.summary.highestWeekEarning?.toFixed(2) || analytics.summary.highestMonthEarning?.toFixed(2) || analytics.summary.highestYearEarning?.toFixed(2) || "0.00",
      minEarnings: analytics.summary.lowestDayEarning?.toFixed(2) || analytics.summary.lowestWeekEarning?.toFixed(2) || analytics.summary.lowestMonthEarning?.toFixed(2) || analytics.summary.lowestYearEarning?.toFixed(2) || "0.00",
      totalTrips: analytics.summary.totalTrips || 0,
      earningsChange: analytics.summary.earningsChange || 0,
      earningsTrend: analytics.summary.earningsTrend || "neutral",
      ridesChange: analytics.summary.ridesChange || 0,
      ridesTrend: analytics.summary.ridesTrend || "neutral",
    };
  }, [analytics, timeframe]);

  // Format chart data
  const chartData = useMemo(() => {
    if (!analytics?.details) return [];
    return analytics.details.map((item: any) => ({
      period: item.period,
      earnings: item.totalEarnings,
      trips: item.rideCount,
    }));
  }, [analytics]);

  // Format hourly data
  const hourlyData = useMemo(() => {
    if (!peakEarningHours?.hourlyBreakdown) return [];
    return peakEarningHours.hourlyBreakdown.map((item: any) => ({
      hour: item.hour,
      earnings: item.totalEarnings,
      rides: item.rideCount,
      avgEarning: item.averageEarning,
    }));
  }, [peakEarningHours]);

  // Format top routes data
  const formattedTopRoutes = useMemo(() => {
    if (!topRoutes?.topRoutes) return [];
    return topRoutes.topRoutes.slice(0, 5).map((route: any) => ({
      rank: route.rank,
      route: `${route.pickupLocation.area} → ${route.dropOffLocation.area}`,
      trips: route.rideCount,
      earnings: route.totalEarnings,
      avgEarning: route.averageEarning,
      avgDistance: route.averageDistance,
    }));
  }, [topRoutes]);

  // Loading state
  if (analyticsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (analyticsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Failed to load analytics</p>
                <p className="text-sm mt-1">Please try again later</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Earnings Analytics</h1>
            <p className="text-gray-600 mt-1">
              {analytics?.periodLabel || "Track your income, trips, and performance metrics"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              className="gap-2 border-gray-300 text-gray-900 hover:bg-blue-50"
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4" />
              Download Report
            </Button>
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {/* Total Earnings */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Total Earnings
              </span>
              <Badge
                className={`${
                  stats.earningsTrend === "up"
                    ? "bg-emerald-100 text-emerald-700"
                    : stats.earningsTrend === "down"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                } border-0`}
              >
                {stats.earningsTrend === "up" ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : stats.earningsTrend === "down" ? (
                  <TrendingDown className="w-3 h-3 mr-1" />
                ) : null}
                {stats.earningsChange > 0 ? "+" : ""}
                {stats.earningsChange.toFixed(1)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">${stats.totalEarnings}</div>
            <p className="text-sm text-gray-600 mt-2">{analytics?.periodLabel || "Current period"}</p>
            <div className="mt-4 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
          </CardContent>
        </Card>

        {/* Average Per Period */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-emerald-50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Average per {getPeriodLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">${stats.avgEarnings}</div>
            <p className="text-sm text-gray-600 mt-2">From {stats.totalTrips} total trips</p>
            <div className="mt-4 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
          </CardContent>
        </Card>

        {/* Per Trip Average */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-amber-50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center justify-between">
              <span>Per Trip Average</span>
              <Badge
                className={`${
                  stats.ridesTrend === "up"
                    ? "bg-emerald-100 text-emerald-700"
                    : stats.ridesTrend === "down"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                } border-0`}
              >
                {stats.ridesChange > 0 ? "+" : ""}
                {stats.ridesChange.toFixed(1)}% trips
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ${analytics?.summary?.averagePerTrip?.toFixed(2) || "0.00"}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Range: ${stats.minEarnings} - ${stats.maxEarnings}
            </p>
            <div className="mt-4 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Earnings Trend Chart */}
        <Card className="xl:col-span-2 border-0 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Earnings Trend</CardTitle>
                <CardDescription>
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} earnings overview
                </CardDescription>
              </div>
              <Select value={timeframe} onValueChange={(val: any) => setTimeframe(val)}>
                <SelectTrigger className="w-32 border-gray-300 bg-gray-50">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value: any) => `$${value.toFixed(2)}`}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEarnings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Peak Hours Summary */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-gray-200">
            <CardTitle>Peak Performance</CardTitle>
            <CardDescription>Your best earning times</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {peakEarningHourLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : peakEarningHours ? (
              <div className="space-y-4">
                {/* Peak Hour */}
                <div className="p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">Peak Earning Hour</span>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">
                      💰 Highest
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {peakEarningHours.peakHour?.hour}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    ${peakEarningHours.peakHour?.totalEarnings.toFixed(2)} •{" "}
                    {peakEarningHours.peakHour?.rideCount} rides
                  </div>
                </div>

                {/* Busiest Hour */}
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">Busiest Hour</span>
                    <Badge className="bg-purple-100 text-purple-700 border-0">🚗 Most Rides</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {peakEarningHours.busiestHour?.hour}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {peakEarningHours.busiestHour?.rideCount} rides •{" "}
                    ${peakEarningHours.busiestHour?.totalEarnings.toFixed(2)}
                  </div>
                </div>

                {/* Highest Average */}
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">Best Average</span>
                    <Badge className="bg-amber-100 text-amber-700 border-0">⭐ Top Rate</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {peakEarningHours.highestAverageHour?.hour}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    ${peakEarningHours.highestAverageHour?.averageEarning.toFixed(2)}/ride •{" "}
                    {peakEarningHours.highestAverageHour?.rideCount} rides
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No peak hours data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Breakdown and Top Routes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Peak Hours Chart */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-gray-200">
            <CardTitle>Hourly Earnings Breakdown</CardTitle>
            <CardDescription>Earnings by hour of day</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {peakEarningHourLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="hour"
                    stroke="#6b7280"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    style={{ fontSize: "11px" }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === "earnings") return [`$${value.toFixed(2)}`, "Earnings"];
                      if (name === "rides") return [value, "Rides"];
                      if (name === "avgEarning") return [`$${value.toFixed(2)}`, "Avg/Ride"];
                      return value;
                    }}
                  />
                  <Bar dataKey="earnings" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No hourly data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Routes */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-gray-200">
            <CardTitle>Top Earning Routes</CardTitle>
            <CardDescription>Your most profitable routes</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {topRoutesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : formattedTopRoutes.length > 0 ? (
              <div className="space-y-4">
                {formattedTopRoutes.map((route: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700 border-0 flex-shrink-0">
                          #{route.rank}
                        </Badge>
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {route.route}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <span>🚗 {route.trips} trips</span>
                        {/* <span>📏 {route.avgDistance?.toFixed(1) || 0} km</span> */}
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="text-lg font-bold text-gray-900">
                        ${route.earnings.toFixed(2)}
                      </div>
                      <div className="text-xs text-emerald-600 font-semibold">
                        ${route.avgEarning.toFixed(2)}/trip
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No routes data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trips Comparison Chart */}
      <Card className="border-0 shadow-sm bg-white mb-6">
        <CardHeader className="pb-3 border-b border-gray-200">
          <CardTitle>Earnings & Trips Comparison</CardTitle>
          <CardDescription>Side-by-side comparison of earnings and trip volume</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" stroke="#6b7280" style={{ fontSize: "12px" }} />
                <YAxis yAxisId="left" stroke="#6b7280" style={{ fontSize: "12px" }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === "Earnings ($)") return `$${value.toFixed(2)}`;
                    return value;
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="earnings"
                  fill="#3b82f6"
                  name="Earnings ($)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="trips"
                  fill="#10b981"
                  name="Trips"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No comparison data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="pb-3 border-b border-gray-200">
          <CardTitle>Summary Statistics</CardTitle>
          <CardDescription>Key metrics for this period</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Highest {getPeriodLabel()} Earnings</p>
              <p className="text-2xl font-bold text-gray-900">${stats.maxEarnings}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Lowest {getPeriodLabel()} Earnings</p>
              <p className="text-2xl font-bold text-gray-900">${stats.minEarnings}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTrips}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Avg Per Trip</p>
              <p className="text-2xl font-bold text-gray-900">
                ${analytics?.summary?.averagePerTrip?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EarningsAnalytics;