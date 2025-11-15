import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Car,
  TrendingUp,
  DollarSign,
  MapPin,
  Clock,
  Activity,
  UserCheck,
  UserX,
  AlertCircle,
  ChevronRight,
  Zap,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useGetAdminDashboardSummaryQuery } from "@/redux/features/admin/admin.api";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // Date range state
  const [dateRange, setDateRange] = useState<{
    from?: string;
    to?: string;
  }>({});

  const { data: summaryData, isLoading: summaryDataLoading, refetch } = useGetAdminDashboardSummaryQuery({
    params: dateRange,
  });

  const summary = summaryData?.data;
  

  const recentActivity = [
    { id: 1, type: "ride", message: "New ride completed", time: "2 mins ago", status: "success" },
    { id: 2, type: "user", message: "New driver registered", time: "15 mins ago", status: "info" },
    { id: 3, type: "alert", message: "Payment issue reported", time: "1 hour ago", status: "warning" },
    { id: 4, type: "ride", message: "Ride cancelled by user", time: "2 hours ago", status: "error" },
    { id: 5, type: "user", message: "New rider signed up", time: "3 hours ago", status: "info" },
  ];

  const topDrivers = [
    { id: 1, name: "Driver #1234", rides: 234, rating: 4.9, earnings: 12450 },
    { id: 2, name: "Driver #5678", rides: 198, rating: 4.8, earnings: 10230 },
    { id: 3, name: "Driver #9012", rides: 187, rating: 4.9, earnings: 9870 },
    { id: 4, name: "Driver #3456", rides: 165, rating: 4.7, earnings: 8920 },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "ride":
        return <Car className="w-4 h-4" />;
      case "user":
        return <Users className="w-4 h-4" />;
      case "alert":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-700 border-green-200";
      case "info":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTrendIcon = (direction?: string) => {
    if (direction === "up") {
      return <ArrowUpRight className="w-3 h-3" />;
    } else if (direction === "down") {
      return <ArrowDownRight className="w-3 h-3" />;
    }
    return null;
  };

  const getTrendColor = (direction?: string) => {
    if (direction === "up") return "text-green-600";
    if (direction === "down") return "text-red-600";
    return "text-gray-600";
  };

  const handleDateFilter = () => {
    refetch();
  };

  const clearFilters = () => {
    setDateRange({});
  };

  if (summaryDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <div className="relative backdrop-blur-sm bg-white/80 border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {summary?.period && (
                <p className="text-sm text-gray-500 mt-1">
                  Data Period: {summary.period.duration} ({new Date(summary.period.from).toLocaleDateString()} - {new Date(summary.period.to).toLocaleDateString()})
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 px-4 py-2">
                <Activity className="w-4 h-4 mr-2" />
                System Online
              </Badge>
              <Button 
                variant="outline"
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="from-date" className="text-sm font-medium text-gray-700">
                  From Date
                </Label>
                <Input
                  id="from-date"
                  type="date"
                  value={dateRange.from || ""}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="to-date" className="text-sm font-medium text-gray-700">
                  To Date
                </Label>
                <Input
                  id="to-date"
                  type="date"
                  value={dateRange.to || ""}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleDateFilter} className="flex-1">
                  Apply Filter
                </Button>
                <Button onClick={clearFilters} variant="outline">
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  {summary?.users?.trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full ${getTrendColor(summary.users.trendDirection)}`}>
                      {getTrendIcon(summary.users.trendDirection)}
                      <span>{Math.abs(summary.users.trend).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <p className="text-white/80 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold">{summary?.users?.total?.toLocaleString() || 0}</p>
                {summary?.users?.new !== undefined && (
                  <p className="text-xs text-white/70 mt-2">+{summary.users.new} new this period</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Rides */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Car className="w-6 h-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0 animate-pulse">
                    <Zap className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                </div>
                <p className="text-white/80 text-sm mb-1">Active Rides</p>
                <p className="text-3xl font-bold">{summary?.rides?.active?.toLocaleString() || 0}</p>
                <p className="text-xs text-white/70 mt-2">{summary?.rides?.total?.toLocaleString() || 0} total rides</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  {summary?.revenue?.trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full ${getTrendColor(summary.revenue.trendDirection)}`}>
                      {getTrendIcon(summary.revenue.trendDirection)}
                      <span>{Math.abs(summary.revenue.trend).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <p className="text-white/80 text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-bold">৳{summary?.revenue?.total?.toLocaleString() || 0}</p>
                <div className="flex gap-3 mt-2 text-xs text-white/70">
                  <span>Platform: ৳{summary?.revenue?.platform?.toLocaleString() || 0}</span>
                  <span>Drivers: ৳{summary?.revenue?.drivers?.toLocaleString() || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Drivers */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div className="text-sm bg-white/20 px-2 py-1 rounded-full">
                    {summary?.drivers?.activePercentage || 0}%
                  </div>
                </div>
                <p className="text-white/80 text-sm mb-1">Active Drivers</p>
                <p className="text-3xl font-bold">{summary?.drivers?.active?.toLocaleString() || 0}</p>
                <p className="text-xs text-white/70 mt-2">
                  {summary?.drivers?.active || 0}/{summary?.drivers?.total || 0} drivers online
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">{summary?.drivers?.total?.toLocaleString() || 0}</p>
                  {summary?.drivers?.new !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">+{summary.drivers.new} new</p>
                  )}
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Riders</p>
                  <p className="text-2xl font-bold text-gray-900">{summary?.riders?.total?.toLocaleString() || 0}</p>
                  {summary?.riders?.new !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">+{summary.riders.new} new</p>
                  )}
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Rides</p>
                  <p className="text-2xl font-bold text-gray-900">{summary?.rides?.completed?.count?.toLocaleString() || 0}</p>
                  {summary?.rides?.completed?.trend !== undefined && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${getTrendColor(summary.rides.completed.trendDirection)}`}>
                      {getTrendIcon(summary.rides.completed.trendDirection)}
                      {Math.abs(summary.rides.completed.trend).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cancelled Rides</p>
                  <p className="text-2xl font-bold text-gray-900">{summary?.rides?.cancelled?.count?.toLocaleString() || 0}</p>
                  {summary?.rides?.cancelled?.rate !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">{summary.rides.cancelled.rate}% cancel rate</p>
                  )}
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-0 shadow-xl bg-white">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getActivityColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Drivers */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Top Drivers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {topDrivers.map((driver, index) => (
                  <div
                    key={driver.id}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-xl hover:from-blue-50 transition-colors duration-200 cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{driver.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{driver.rides} rides</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-gray-600">{driver.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">৳{driver.earnings.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 border-dashed hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                onClick={() => navigate("/admin/user-management")}
              >
                View All Drivers
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Card
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer group"
            onClick={() => navigate("/admin/user-management")}
          >
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold">Manage Users</p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer group"
            onClick={() => navigate("/admin/ride-management")}
          >
            <CardContent className="p-6 text-center">
              <Car className="w-8 h-8 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold">Manage Rides</p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-500 to-purple-600 text-white cursor-pointer group"
            onClick={() => navigate("/admin/vehicle-management")}
          >
            <CardContent className="p-6 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold">Manage Vehicles</p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-500 to-orange-600 text-white cursor-pointer group"
            onClick={() => navigate("/admin/analytics")}
          >
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold">View Analytics</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;