import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    TrendingUp,
    DollarSign,
    Users,
    Car,
    MapPin,
    Calendar,
    Download,
    Filter,
    
    BarChart3,
    PieChart,
    Activity,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    AlertCircle,
    Star,
    Target,
    UserX,
    Wifi,
    Timer,
    ThumbsUp,
    Loader2,
    
} from "lucide-react";
import { useState, useMemo } from "react";
import {
   
    Line,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
    ComposedChart,
} from "recharts";

import { Progress } from "@/components/ui/progress";
import { useGetAdminAnalyticsQuery } from "@/redux/features/admin/admin.api";

const Analytics = () => {
    const [dateRange, setDateRange] = useState({
        from: "",
        to: "",
    });
    const [selectedMetric, setSelectedMetric] = useState<"all" | "revenue" | "rides" | "drivers" | "riders" | "users">("all");

    // Fetch analytics data from API
    const { data: analyticsResponse, isLoading, error, refetch } = useGetAdminAnalyticsQuery({
        params: {
            from: dateRange.from || undefined,
            to: dateRange.to || undefined,
            metric: selectedMetric === "all" ? undefined : selectedMetric,
        }
    });

    const analytics = analyticsResponse?.data;

    // Helper functions
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            COMPLETED: "#10b981",
            CANCELLED_BY_RIDER: "#ef4444",
            CANCELLED_BY_DRIVER: "#f97316",
            CANCELLED_BY_ADMIN: "#dc2626",
            CANCELLED_FOR_PENDING_TIME_OVER: "#78716c",
            REQUESTED: "#f59e0b",
            ACCEPTED: "#3b82f6",
            IN_TRANSIT: "#8b5cf6",
            GOING_TO_PICK_UP: "#06b6d4",
        };
        return colors[status] || "#6b7280";
    };

    const getVehicleColor = (type: string) => {
        const colors: Record<string, string> = {
            SEDAN: "#3b82f6",
            SUV: "#10b981",
            BIKE: "#f59e0b",
            AUTO: "#8b5cf6",
        };
        return colors[type] || "#6b7280";
    };

    const getTrendIcon = (direction?: string) => {
        if (direction === "up") return <ArrowUpRight className="w-3 h-3" />;
        if (direction === "down") return <ArrowDownRight className="w-3 h-3" />;
        return null;
    };

    const getTrendColor = (direction?: string) => {
        if (direction === "up") return "bg-green-50 text-green-700 border-green-200";
        if (direction === "down") return "bg-red-50 text-red-700 border-red-200";
        return "bg-gray-50 text-gray-700 border-gray-200";
    };

    // Process data based on metric type
    const processedData = useMemo(() => {
        if (!analytics) return null;

        const result: any = {};

        // Process Rides data
        if (selectedMetric === "rides" || selectedMetric === "all") {
            result.rides = {
                summary: analytics.summary,
                statusBreakdown: analytics.statusBreakdown?.map((item: any) => ({
                    name: item.status.replace(/_/g, ' '),
                    value: item.count,
                    percentage: item.percentage,
                    color: getStatusColor(item.status),
                })),
                hourlyDistribution: analytics.hourlyDistribution?.map((item: any) => ({
                    hour: `${item.hour}:00`,
                    count: item.count,
                })),
                dailyTrends: analytics.dailyTrends?.map((item: any) => ({
                    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    total: item.total,
                    completed: item.completed,
                    cancelled: item.cancelled,
                    completionRate: item.completionRate,
                })),
                cancellationReasons: analytics.cancellationReasons,
                averages: analytics.averages,
            };
        }

        // Process Revenue data
        if (selectedMetric === "revenue") {
            result.revenue = {
                summary: analytics.summary,
                dailyTrends: analytics.dailyTrends?.map((item: any) => ({
                    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    gross: item.gross,
                    platform: item.platform,
                    driver: item.driver,
                    rides: item.rides,
                })),
                vehicleTypes: analytics.byVehicleType?.map((item: any) => ({
                    type: item.vehicleType,
                    revenue: item.revenue,
                    rides: item.rides,
                    avgFare: item.avgFare,
                    color: getVehicleColor(item.vehicleType),
                })),
                topDrivers: analytics.topDrivers,
            };
        }

        // Process Drivers data
        if (selectedMetric === "drivers") {
            result.drivers = {
                summary: analytics.summary,
                performance: analytics.performance,
                topByRides: analytics.topByRides,
                topByRevenue: analytics.topByRevenue,
                dailyActive: analytics.dailyActiveDrivers?.map((item: any) => ({
                    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    count: item.count,
                })),
            };
        }

        // Process Riders data
        if (selectedMetric === "riders") {
            result.riders = {
                summary: analytics.summary,
                topBySpending: analytics.topBySpending,
                topByTrips: analytics.topByTrips,
                engagement: analytics.engagement,
                dailyActive: analytics.dailyActiveRiders?.map((item: any) => ({
                    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    count: item.count,
                })),
            };
        }

        // Process Users data
        if (selectedMetric === "users") {
            result.users = {
                summary: analytics.summary,
                byRole: analytics.byRole,
                growth: analytics.growth?.map((item: any) => ({
                    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    count: item.count,
                })),
            };
        }

        return result;
    }, [analytics, selectedMetric]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 text-red-700 mb-4">
                            <AlertCircle className="w-5 h-5" />
                            <div>
                                <p className="font-semibold">Failed to load analytics</p>
                                <p className="text-sm mt-1">Please try again later</p>
                            </div>
                        </div>
                        <Button onClick={() => refetch()} className="w-full" variant="outline">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Header */}
            <div className="relative backdrop-blur-sm bg-white/80 border-b border-gray-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Advanced Analytics
                            </h1>
                            <p className="text-gray-600 mt-2 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Comprehensive insights and performance metrics
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="gap-2 border-blue-200 hover:bg-blue-50">
                                <Download className="w-4 h-4" />
                                Export Report
                            </Button>
                            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg gap-2">
                                <Calendar className="w-4 h-4" />
                                Schedule Report
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters Section */}
                <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-600" />
                            Filters & Search
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="date-from">From Date</Label>
                                <Input
                                    id="date-from"
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="date-to">To Date</Label>
                                <Input
                                    id="date-to"
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="metric">Metric Type</Label>
                                <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Metrics</SelectItem>
                                        <SelectItem value="revenue">Revenue</SelectItem>
                                        <SelectItem value="rides">Rides</SelectItem>
                                        <SelectItem value="drivers">Drivers</SelectItem>
                                        <SelectItem value="riders">Riders</SelectItem>
                                        <SelectItem value="users">Users</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                            <Button
                                onClick={() => refetch()}
                                className="bg-gradient-to-r from-blue-600 to-purple-600"
                            >
                                Apply Filters
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDateRange({ from: "", to: "" });
                                    setSelectedMetric("all");
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                // ...existing code...

                {/* Conditional Rendering based on selected metric */}
                {(selectedMetric === "rides" || selectedMetric === "all") && processedData?.rides && (
                    <div className="space-y-6 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Car className="w-6 h-6 text-blue-600" />
                            Rides Analytics
                        </h2>
                        
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <Car className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <Badge variant="outline" className={getTrendColor(processedData.rides.summary.total.trendDirection)}>
                                            {getTrendIcon(processedData.rides.summary.total.trendDirection)}
                                            {Math.abs(processedData.rides.summary.total.trend)}%
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Total Rides</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.rides.summary.total.count.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500 mt-2">Previous: {processedData.rides.summary.total.previousPeriod.toLocaleString()}</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                            <Activity className="w-6 h-6 text-green-600" />
                                        </div>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            {processedData.rides.summary.completed.percentage}%
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.rides.summary.completed.count.toLocaleString()}</p>
                                    <Badge variant="outline" className={getTrendColor(processedData.rides.summary.completed.trendDirection)} size="sm">
                                        {getTrendIcon(processedData.rides.summary.completed.trendDirection)}
                                        {Math.abs(processedData.rides.summary.completed.trend)}%
                                    </Badge>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                            <AlertCircle className="w-6 h-6 text-red-600" />
                                        </div>
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                            {processedData.rides.summary.cancelled.percentage}%
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.rides.summary.cancelled.count.toLocaleString()}</p>
                                    <Badge variant="outline" className={getTrendColor(processedData.rides.summary.cancelled.trendDirection)} size="sm">
                                        {getTrendIcon(processedData.rides.summary.cancelled.trendDirection)}
                                        {Math.abs(processedData.rides.summary.cancelled.trend)}%
                                    </Badge>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                            <Zap className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                                            Live
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Ongoing</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.rides.summary.ongoing.count}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Daily Trends Chart */}
                        <Card className="border-0 shadow-xl bg-white">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                    Daily Ride Trends
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <ComposedChart data={processedData.rides.dailyTrends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="date" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                border: "none",
                                                borderRadius: "8px",
                                                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                                        <Bar dataKey="cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} name="Cancelled" />
                                        <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Status Breakdown and Hourly Distribution */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-0 shadow-xl bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <PieChart className="w-5 h-5 text-purple-600" />
                                        Status Distribution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={processedData.rides.statusBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                                outerRadius={100}
                                                dataKey="value"
                                            >
                                                {processedData.rides.statusBreakdown?.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                        Hourly Distribution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={processedData.rides.hourlyDistribution}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="hour" stroke="#6b7280" />
                                            <YAxis stroke="#6b7280" />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Cancellation Reasons */}
                        {processedData.rides.cancellationReasons && (
                            <Card className="border-0 shadow-xl bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserX className="w-5 h-5 text-red-600" />
                                        Top Cancellation Reasons
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {processedData.rides.cancellationReasons?.map((item: any, index: number) => (
                                            <div key={index} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700">{item.reason}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-gray-600">{item.count} rides</span>
                                                        <span className="text-sm font-bold text-gray-900">{item.percentage}%</span>
                                                    </div>
                                                </div>
                                                <Progress value={item.percentage} className="h-2" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Averages */}
                        {processedData.rides.averages && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-blue-100 text-sm mb-2">Average Fare</p>
                                                <p className="text-3xl font-bold">৳{processedData.rides.averages.fare.toFixed(2)}</p>
                                            </div>
                                            <DollarSign className="w-12 h-12 text-blue-200" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-purple-100 text-sm mb-2">Average Distance</p>
                                                <p className="text-3xl font-bold">{processedData.rides.averages.distance.toFixed(1)} km</p>
                                            </div>
                                            <MapPin className="w-12 h-12 text-purple-200" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-green-100 text-sm mb-2">Average Duration</p>
                                                <p className="text-3xl font-bold">{processedData.rides.averages.duration} min</p>
                                            </div>
                                            <Timer className="w-12 h-12 text-green-200" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {/* Revenue Analytics */}
                {selectedMetric === "revenue" && processedData?.revenue && (
                    <div className="space-y-6 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-green-600" />
                            Revenue Analytics
                        </h2>
                        
                        {/* Revenue KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                            <DollarSign className="w-6 h-6 text-green-600" />
                                        </div>
                                        <Badge variant="outline" className={getTrendColor(processedData.revenue.summary.total.trendDirection)}>
                                            {getTrendIcon(processedData.revenue.summary.total.trendDirection)}
                                            {Math.abs(processedData.revenue.summary.total.trend)}%
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                                    <p className="text-3xl font-bold text-gray-900">৳{processedData.revenue.summary.total.amount.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500 mt-2">Previous: ৳{processedData.revenue.summary.total.previousPeriod.toLocaleString()}</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                        <BarChart3 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Platform Share</p>
                                    <p className="text-3xl font-bold text-gray-900">৳{processedData.revenue.summary.platform.amount.toLocaleString()}</p>
                                    <Badge className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
                                        {processedData.revenue.summary.platform.percentage}%
                                    </Badge>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                                        <Users className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Driver Earnings</p>
                                    <p className="text-3xl font-bold text-gray-900">৳{processedData.revenue.summary.drivers.amount.toLocaleString()}</p>
                                    <Badge className="mt-2 bg-purple-50 text-purple-700 border-purple-200">
                                        {processedData.revenue.summary.drivers.percentage}%
                                    </Badge>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                                        <Activity className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Avg Fare</p>
                                    <p className="text-3xl font-bold text-gray-900">৳{processedData.revenue.summary.averageFare.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500 mt-2">{processedData.revenue.summary.totalRides.toLocaleString()} rides</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Daily Revenue Trends */}
                        <Card className="border-0 shadow-xl bg-white">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                    Daily Revenue Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <ComposedChart data={processedData.revenue.dailyTrends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="date" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                border: "none",
                                                borderRadius: "8px",
                                                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="platform" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Platform" />
                                        <Bar dataKey="driver" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} name="Driver" />
                                        <Line type="monotone" dataKey="gross" stroke="#8b5cf6" strokeWidth={2} name="Gross Revenue" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Vehicle Types Revenue */}
                        {processedData.revenue.vehicleTypes && (
                            <Card className="border-0 shadow-xl bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Car className="w-5 h-5 text-blue-600" />
                                        Revenue by Vehicle Type
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {processedData.revenue.vehicleTypes?.map((vehicle: any, index: number) => (
                                            <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: vehicle.color }}></div>
                                                        <span className="font-semibold text-gray-900">{vehicle.type}</span>
                                                    </div>
                                                    <span className="text-lg font-bold text-gray-900">৳{vehicle.revenue.toLocaleString()}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                                                    <div>
                                                        <span className="text-xs text-gray-500">Rides:</span> {vehicle.rides.toLocaleString()}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-gray-500">Avg Fare:</span> ৳{vehicle.avgFare.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Top Drivers by Revenue */}
                        {processedData.revenue.topDrivers && (
                            <Card className="border-0 shadow-xl bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Star className="w-5 h-5 text-yellow-600" />
                                        Top Earning Drivers
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {processedData.revenue.topDrivers?.map((driver: any, index: number) => (
                                            <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-lg hover:from-green-50 transition-all">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">Driver ID: {driver.driverId.slice(-8)}</p>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                        <span>{driver.rides} rides</span>
                                                        <span>৳{driver.avgFare.toFixed(2)} avg</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-green-600">৳{driver.totalRevenue.toLocaleString()}</p>
                                                    <p className="text-xs text-gray-500">Earned: ৳{driver.earnings.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Drivers Analytics */}
                {selectedMetric === "drivers" && processedData?.drivers && (
                    <div className="space-y-6 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            Drivers Analytics
                        </h2>

                        {/* Driver Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Total Drivers</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.drivers.summary.total}</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                            <Wifi className="w-6 h-6 text-green-600" />
                                        </div>
                                        <Badge variant="outline" className={getTrendColor(processedData.drivers.summary.active.trendDirection)}>
                                            {getTrendIcon(processedData.drivers.summary.active.trendDirection)}
                                            {Math.abs(processedData.drivers.summary.active.trend)}%
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Active Drivers</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.drivers.summary.active.count}</p>
                                    <p className="text-xs text-gray-500 mt-2">{processedData.drivers.summary.active.percentage}% of total</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <UserCheck className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <Badge variant="outline" className={getTrendColor(processedData.drivers.summary.new.trendDirection)}>
                                            {getTrendIcon(processedData.drivers.summary.new.trendDirection)}
                                            {Math.abs(processedData.drivers.summary.new.trend)}%
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">New Drivers</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.drivers.summary.new.count}</p>
                                    <p className="text-xs text-gray-500 mt-2">This period</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                                        <ThumbsUp className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Approved</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.drivers.summary.approved.count}</p>
                                    <p className="text-xs text-gray-500 mt-2">{processedData.drivers.summary.approved.percentage}% approval rate</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Daily Active Drivers Chart */}
                        {processedData.drivers.dailyActive && (
                            <Card className="border-0 shadow-xl bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        Daily Active Drivers Trend
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={processedData.drivers.dailyActive}>
                                            <defs>
                                                <linearGradient id="colorDrivers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="date" stroke="#6b7280" />
                                            <YAxis stroke="#6b7280" />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDrivers)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Top Drivers Tables */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top by Rides */}
                            {processedData.drivers.topByRides && (
                                <Card className="border-0 shadow-xl bg-white">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Car className="w-5 h-5 text-blue-600" />
                                            Top Drivers by Rides
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {processedData.drivers.topByRides.slice(0, 5).map((driver: any, index: number) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">
                                                            ID: {driver.driverId.slice(-8)}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {driver.rides} rides
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Top by Revenue */}
                            {processedData.drivers.topByRevenue && (
                                <Card className="border-0 shadow-xl bg-white">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-green-600" />
                                            Top Drivers by Revenue
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {processedData.drivers.topByRevenue.slice(0, 5).map((driver: any, index: number) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">ID: {driver.driverId.slice(-8)}</p>
                                                            <p className="text-xs text-gray-500">{driver.rides} rides</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-green-600">৳{driver.revenue.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Performance Metrics */}
                        {processedData.drivers.performance && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                    <CardContent className="p-6">
                                        <p className="text-blue-100 text-sm mb-2">Average Rides</p>
                                        <p className="text-3xl font-bold">{processedData.drivers.performance.averageRides}</p>
                                        <p className="text-blue-100 text-xs mt-2">Per driver</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                                    <CardContent className="p-6">
                                        <p className="text-green-100 text-sm mb-2">Completion Rate</p>
                                        <p className="text-3xl font-bold">{processedData.drivers.performance.averageCompletionRate}%</p>
                                        <p className="text-green-100 text-xs mt-2">Average across drivers</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                                    <CardContent className="p-6">
                                        <p className="text-purple-100 text-sm mb-2">Avg Revenue</p>
                                        <p className="text-3xl font-bold">৳{processedData.drivers.performance.averageRevenue.toFixed(2)}</p>
                                        <p className="text-purple-100 text-xs mt-2">Per driver</p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {/* Riders Analytics */}
                {selectedMetric === "riders" && processedData?.riders && (
                    <div className="space-y-6 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-6 h-6 text-purple-600" />
                            Riders Analytics
                        </h2>

                        {/* Rider Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                                        <Users className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Total Riders</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.riders.summary.total}</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                            <Activity className="w-6 h-6 text-green-600" />
                                        </div>
                                        <Badge variant="outline" className={getTrendColor(processedData.riders.summary.active.trendDirection)}>
                                            {getTrendIcon(processedData.riders.summary.active.trendDirection)}
                                            {Math.abs(processedData.riders.summary.active.trend)}%
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Active Riders</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.riders.summary.active.count}</p>
                                    <p className="text-xs text-gray-500 mt-2">{processedData.riders.summary.active.percentage}% of total</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <UserCheck className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <Badge variant="outline" className={getTrendColor(processedData.riders.summary.new.trendDirection)}>
                                            {getTrendIcon(processedData.riders.summary.new.trendDirection)}
                                            {Math.abs(processedData.riders.summary.new.trend)}%
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">New Riders</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.riders.summary.new.count}</p>
                                    <p className="text-xs text-gray-500 mt-2">This period</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Daily Active Riders */}
                        {processedData.riders.dailyActive && (
                            <Card className="border-0 shadow-xl bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-purple-600" />
                                        Daily Active Riders Trend
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={processedData.riders.dailyActive}>
                                            <defs>
                                                <linearGradient id="colorRiders" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="date" stroke="#6b7280" />
                                            <YAxis stroke="#6b7280" />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRiders)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Top Riders and Engagement */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Spenders */}
                            {processedData.riders.topBySpending && (
                                <Card className="border-0 shadow-xl bg-white">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-green-600" />
                                            Top Spenders
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {processedData.riders.topBySpending.slice(0, 5).map((rider: any, index: number) => (
                                                <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{rider.name}</p>
                                                                <p className="text-xs text-gray-500">{rider.phone}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-bold text-green-600">৳{rider.totalSpent.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <span>{rider.trips} trips</span>
                                                        <span>Avg: ৳{rider.avgSpending.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Engagement Segments */}
                            {processedData.riders.engagement && (
                                <Card className="border-0 shadow-xl bg-white">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="w-5 h-5 text-blue-600" />
                                            Rider Engagement
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {processedData.riders.engagement.map((segment: any, index: number) => (
                                                <div key={index} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-700">{segment.segment}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-600">{segment.count} riders</span>
                                                            <span className="text-sm font-bold text-gray-900">{segment.percentage}%</span>
                                                        </div>
                                                    </div>
                                                    <Progress value={segment.percentage} className="h-2" />
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* Users Analytics */}
                {selectedMetric === "users" && processedData?.users && (
                    <div className="space-y-6 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            Users Analytics
                        </h2>

                        {/* User Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Total Users</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.users.summary.total}</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                            <UserCheck className="w-6 h-6 text-green-600" />
                                        </div>
                                        <Badge variant="outline" className={getTrendColor(processedData.users.summary.new.trendDirection)}>
                                            {getTrendIcon(processedData.users.summary.new.trendDirection)}
                                            {Math.abs(processedData.users.summary.new.trend)}%
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">New Users</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.users.summary.new.count}</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                                        <ThumbsUp className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Verified</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.users.summary.verified.count}</p>
                                    <p className="text-xs text-gray-500 mt-2">{processedData.users.summary.verified.percentage}%</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl bg-white">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                                        <AlertCircle className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Unverified</p>
                                    <p className="text-3xl font-bold text-gray-900">{processedData.users.summary.unverified.count}</p>
                                    <p className="text-xs text-gray-500 mt-2">{processedData.users.summary.unverified.percentage}%</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* User Growth Chart */}
                        {processedData.users.growth && (
                            <Card className="border-0 shadow-xl bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        User Growth Trend
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={processedData.users.growth}>
                                            <defs>
                                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="date" stroke="#6b7280" />
                                            <YAxis stroke="#6b7280" />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Users by Role */}
                        {processedData.users.byRole && (
                            <Card className="border-0 shadow-xl bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <PieChart className="w-5 h-5 text-blue-600" />
                                        Users by Role
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                                            <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
                                            <p className="text-sm text-gray-600 mb-1">Admins</p>
                                            <p className="text-4xl font-bold text-gray-900">{processedData.users.byRole.admins}</p>
                                        </div>
                                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                                            <Car className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                                            <p className="text-sm text-gray-600 mb-1">Drivers</p>
                                            <p className="text-4xl font-bold text-gray-900">{processedData.users.byRole.drivers}</p>
                                        </div>
                                        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                                            <Users className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                                            <p className="text-sm text-gray-600 mb-1">Riders</p>
                                            <p className="text-4xl font-bold text-gray-900">{processedData.users.byRole.riders}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;