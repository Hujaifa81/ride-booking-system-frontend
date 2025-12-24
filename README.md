# 🚗 Ride Booking Frontend

[🌐 Live Application](https://ride-booking-frontend-eta.vercel.app) | [📡 Backend API](https://ride-booking-system-backend-production.up.railway.app)

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [User Roles & Capabilities](#-user-roles--capabilities)
- [Tech Stack](#️-tech-stack)
- [Architecture & Design Patterns](#️-architecture--design-patterns)
- [Core Features Deep Dive](#-core-features-deep-dive)
- [Real-Time Features](#-real-time-features)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [State Management](#-state-management)
- [UI Components](#-ui-components)
- [Performance Optimizations](#-performance-optimizations)
- [Security Features](#-security-features)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Browser Support](#-browser-support)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📋 Project Overview

A modern, responsive, and production-ready React TypeScript frontend for a comprehensive ride-hailing platform. Built with cutting-edge technologies including React 19, TypeScript 5, Redux Toolkit, Socket.IO, and Vite, this application delivers a seamless user experience for riders, drivers, and administrators.

The application features **real-time ride tracking**, **interactive maps with Leaflet**, **dynamic fare calculation**, **role-based dashboards**, **Socket.IO live updates**, **comprehensive analytics**, and a beautiful dark/light theme system powered by Tailwind CSS v4 and shadcn/ui components.

### 🎯 Why This Project Stands Out
- **100% TypeScript**: Full type safety across the entire application
- **Real-Time Everything**: Socket.IO integration for instant updates
- **Production-Ready**: Enterprise-grade architecture with best practices
- **Modern Stack**: Latest React 19, Vite 7, Tailwind CSS 4
- **Responsive Design**: Mobile-first approach with beautiful UI
- **Role-Based Access**: Separate dashboards for Rider, Driver, and Admin
- **Interactive Maps**: Real-time location tracking with Leaflet/React-Leaflet
- **State Persistence**: Redux Toolkit with RTK Query for efficient data management

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication**: Secure token-based auth with automatic token refresh
- **Google OAuth 2.0 Integration**: One-click social login
- **Role-Based Access Control (RBAC)**: Three distinct user roles with protected routes
- **Secure Session Management**: Persistent authentication with automatic logout
- **Password Reset Flow**: Complete password recovery system with OTP verification
- **Form Validation**: Client-side validation using React Hook Form + Zod schemas

### 🗺️ Interactive Map Features (Leaflet + React-Leaflet)
- **Real-Time Location Tracking**: Live driver location updates on map
- **Interactive Route Visualization**: Polyline rendering for pickup-to-dropoff routes
- **Custom Map Markers**: Color-coded markers for pickup (green), dropoff (red), and driver (orange)
- **Click-to-Select Locations**: Interactive map selection for pickup/dropoff points
- **Geocoding Integration**: Automatic address suggestions using OpenStreetMap Nominatim API
- **Reverse Geocoding**: Convert coordinates to human-readable addresses
- **Route Calculation**: Distance and estimated time calculation for ride requests
- **Draggable Map Interface**: Smooth pan and zoom interactions
- **Mobile-Optimized Maps**: Touch-friendly controls for mobile devices

### 🚗 Rider Features
- **Instant Ride Booking**: Request rides with pickup/dropoff selection
- **Real-Time Fare Estimation**: See approximate fare before confirming ride
- **Live Ride Tracking**: Track driver location and ride status in real-time
- **Ride Status Updates**: Instant notifications on ride status changes
- **Driver Information Display**: View driver name, rating, vehicle details, and contact
- **Ride History**: Complete ride history with filters and search
- **Driver Rating System**: Rate drivers after ride completion
- **Active Ride Management**: Cancel rides, view ETAs, and track progress
- **Ride Statistics Dashboard**: View total rides, spending, and ride metrics
- **Become a Driver**: In-app driver registration flow

### 🚕 Driver Features
- **Driver Dashboard**: Comprehensive metrics including earnings, ratings, and ride stats
- **Incoming Ride Requests**: Real-time notifications for new ride requests
- **Accept/Reject Rides**: 5-minute window to accept or reject incoming requests
- **Active Ride Management**: Step-by-step ride status updates (Going to Pickup → Arrived → In Transit → Completed)
- **Real-Time Location Updates**: Automatic location broadcasting to riders
- **Availability Toggle**: Online/Offline status management
- **Vehicle Management**: Register and manage multiple vehicles
- **Earnings Analytics**: Detailed earnings breakdown with charts and graphs
- **Peak Hours Analysis**: Identify best earning times with visual graphs
- **Top Routes Display**: See highest-earning pickup-dropoff routes
- **Ride History**: Complete ride history with earnings details
- **Driver Rating Display**: View current rating and rating history
- **Location Modal**: Update driver location manually if needed

### 📊 Admin Features
- **Comprehensive Dashboard**: Real-time platform metrics and KPIs
- **Advanced Analytics**: 
  - Ride trends analysis (daily, weekly, monthly)
  - Revenue trends with visual charts (Line, Bar, Area, Pie)
  - Top drivers leaderboard
  - Top riders leaderboard
  - Cancellation breakdown by type
  - Conversion funnel analysis
  - Vehicle type distribution
  - Status-wise ride breakdown
- **Interactive Charts**: Powered by Recharts with responsive design
- **Date Range Filtering**: Analyze metrics for specific time periods
- **Metric Selection**: Filter by revenue, rides, drivers, riders, or users
- **Export Reports**: Download reports in PDF, CSV, and Excel formats (future)
- **User Management**: View and manage all users (planned feature)
- **Ride Management**: Monitor all rides and intervene if needed (planned)
- **Vehicle Management**: Approve/reject vehicle registrations (planned)

### 🎨 UI/UX Features
- **Modern Design System**: Built with shadcn/ui + Radix UI primitives
- **Dark/Light Theme**: System-aware theme with manual toggle
- **Responsive Layout**: Mobile-first design that works on all devices
- **Smooth Animations**: Framer Motion for delightful micro-interactions
- **Toast Notifications**: Non-intrusive notifications using Sonner
- **Loading States**: Skeleton loaders and spinners for better UX
- **Form Validation**: Real-time validation with helpful error messages
- **Accessible Components**: ARIA-compliant, keyboard navigation support
- **Progress Indicators**: Visual progress bars for ongoing processes
- **Badge System**: Color-coded badges for ride status, driver status, etc.
- **Dropdown Menus**: Accessible dropdowns for navigation and actions
- **Modal Dialogs**: Confirmation dialogs for critical actions
- **Tabs Navigation**: Organized content with tabbed interfaces

### ⚡ Performance Features
- **Code Splitting**: Automatic route-based code splitting with React Router
- **Lazy Loading**: Dynamic imports for heavy components (Leaflet maps)
- **Optimized Bundle**: Vite's lightning-fast build with tree-shaking
- **RTK Query Caching**: Intelligent data caching and invalidation
- **Memoization**: React.memo, useMemo, and useCallback for expensive operations
- **Debounced Search**: Optimized search with input debouncing
- **Image Optimization**: Lazy loading and optimized assets
- **Prefetching**: Automatic data prefetching for better UX

---

## 👥 User Roles & Capabilities

### 🟢 Rider (Passenger)
**Dashboard Access**: `/rider/*`

**Capabilities**:
- ✅ Book instant rides with interactive map selection
- ✅ View real-time fare estimates before booking
- ✅ Track active ride with live driver location
- ✅ Receive instant notifications on ride status changes
- ✅ View complete ride history with search and filters
- ✅ Rate and review drivers after ride completion
- ✅ Manage personal profile and preferences
- ✅ Apply to become a driver
- ✅ Cancel rides (within policy limits)
- ✅ View ride statistics and spending history

**Restrictions**:
- ❌ Cannot accept ride requests
- ❌ Cannot access driver or admin features
- ❌ Maximum 3 cancellations per day (enforced by backend)

---

### 🔵 Driver
**Dashboard Access**: `/driver/*`

**Capabilities**:
- ✅ Toggle availability status (Online/Offline)
- ✅ Receive real-time ride request notifications
- ✅ Accept or reject incoming ride requests (5-minute window)
- ✅ Update ride status through lifecycle (7 status stages)
- ✅ View detailed earnings analytics with charts
- ✅ Identify peak earning hours and top routes
- ✅ Manage vehicle registrations
- ✅ Update real-time location for riders
- ✅ View comprehensive dashboard with key metrics
- ✅ Access ride history with earnings breakdown
- ✅ View current rating and performance metrics
- ✅ Contact riders via phone (displayed during ride)

**Restrictions**:
- ❌ Cannot book rides as a rider
- ❌ Cannot access admin analytics
- ❌ Must maintain minimum rating to stay active
- ❌ Maximum 3 cancellations per day (enforced by backend)

---

### 🔴 Admin
**Dashboard Access**: `/admin/*`

**Capabilities**:
- ✅ View real-time platform-wide dashboard metrics
- ✅ Access comprehensive analytics with interactive charts
- ✅ Filter analytics by date range and metric type
- ✅ Monitor ride trends (daily, weekly, monthly)
- ✅ Track revenue trends with visual graphs
- ✅ View top-performing drivers and riders
- ✅ Analyze cancellation breakdown by type
- ✅ Visualize conversion funnel
- ✅ Export reports (PDF, CSV, Excel) - *coming soon*
- ✅ Manage users, drivers, and vehicles - *planned*
- ✅ Intervene in rides if needed - *planned*
- ✅ Approve/reject driver applications - *planned*

**Full System Access**:
- ✅ View all rides across platform
- ✅ Monitor all users and drivers
- ✅ Access all analytics and reports
- ✅ System configuration and monitoring

---

## 🛠️ Tech Stack

### **Core Framework & Language**
- **React 19.1.1** - Latest React with concurrent features
- **TypeScript 5.8.3** - Full type safety and IntelliSense
- **Vite 7.1.2** - Next-generation frontend tooling with HMR

### **State Management & Data Fetching**
- **Redux Toolkit 2.9.0** - Simplified Redux with modern patterns
- **RTK Query** - Powerful data fetching and caching
- **React Redux 9.2.0** - Official React bindings for Redux

### **Routing & Navigation**
- **React Router 7.9.1** - Declarative routing for React
- **Type-Safe Routes** - Custom HOC for protected routes with role-based access

### **UI Framework & Styling**
- **Tailwind CSS 4.1.13** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible component library
- **Radix UI Primitives** - Unstyled, accessible component primitives
  - `@radix-ui/react-accordion`, `alert-dialog`, `avatar`, `dialog`
  - `dropdown-menu`, `label`, `navigation-menu`, `popover`
  - `progress`, `select`, `separator`, `tabs`, `tooltip`
- **next-themes 0.4.6** - Perfect dark mode in 2 lines of code
- **class-variance-authority 0.7.1** - CVA for component variants
- **tailwind-merge 3.3.1** - Merge Tailwind classes without conflicts
- **Framer Motion 12.23.16** - Production-ready animation library

### **Maps & Geolocation**
- **Leaflet 1.9.4** - Leading open-source JavaScript library for maps
- **React-Leaflet 5.0.0** - React components for Leaflet maps
- **OpenStreetMap** - Free, editable world map data
- **Nominatim API** - Geocoding and reverse geocoding service

### **Real-Time Communication**
- **Socket.IO Client 4.8.1** - Real-time bidirectional event-based communication
- **Custom Socket Management** - Singleton pattern for global socket instance
- **Automatic Reconnection** - Built-in reconnection logic with exponential backoff

### **Form Handling & Validation**
- **React Hook Form 7.63.0** - Performant, flexible forms with easy validation
- **Zod 4.1.11** - TypeScript-first schema validation
- **@hookform/resolvers 5.2.2** - Validation resolvers for React Hook Form

### **HTTP Client**
- **Axios 1.12.2** - Promise-based HTTP client
- **Custom Axios Instance** - Configured with interceptors and auth handling
- **RTK Query Axios Base Query** - Axios integration with RTK Query

### **UI Components & Utilities**
- **Lucide React 0.544.0** - Beautiful & consistent icon set
- **Sonner 2.0.7** - Opinionated toast component for React
- **Recharts 2.15.4** - Composable charting library built on React
- **react-intersection-observer 9.16.0** - React wrapper for IntersectionObserver API
- **jsPDF 3.0.3** - Client-side JavaScript PDF generation

### **Development Tools**
- **ESLint 9.33.0** - Pluggable JavaScript linter
- **TypeScript ESLint 8.39.1** - TypeScript-specific linting rules
- **@vitejs/plugin-react 5.0.0** - React plugin for Vite
- **@tailwindcss/vite 4.1.13** - Tailwind CSS plugin for Vite

### **Build & Deployment**
- **Vercel** - Zero-config deployment platform
- **Environment Variables** - Secure configuration management
- **SPA Routing** - Configured for single-page application

---

## 🏗️ Architecture & Design Patterns

### **Component Architecture**
```
src/
├── components/
│   ├── layout/          # Layout wrappers (CommonLayout, DashboardLayout)
│   ├── modules/         # Feature-specific components
│   │   ├── admin/       # Admin-only components (Analytics, Dashboard)
│   │   ├── auth/        # Authentication forms (SignIn, SignUp)
│   │   ├── driver/      # Driver-specific components (DriverDashboard, etc.)
│   │   ├── home/        # Landing page sections (Hero, Stats, Services)
│   │   └── rider/       # Rider components (RideRequest, RideTracking)
│   ├── shared/          # Reusable components across roles
│   │   ├── AppSidebar   # Dynamic sidebar with role-based items
│   │   ├── Navbar       # Application header
│   │   ├── Footer       # Application footer
│   │   ├── RideMap      # Shared map component for ride visualization
│   │   └── Profile      # User profile display
│   └── ui/              # shadcn/ui primitives (button, card, input, etc.)
```

### **Design Patterns Implemented**

#### 1. **Higher-Order Component (HOC) Pattern**
- **`withAuth` HOC**: Wraps routes to enforce authentication and role-based access
- Automatically redirects unauthenticated users to `/sign-in`
- Validates user roles and restricts access to authorized routes
```typescript
Component: withAuth(DashboardLayout, role.driver as TRole)
```

#### 2. **Custom Hooks Pattern**
- **`useActiveRide`**: Manages active ride state with Socket.IO integration
- **`useTheme`**: Handles dark/light theme switching
- **`useMobile`**: Detects mobile breakpoints for responsive behavior
- **`useDriverIncomingRequestSocket`**: Manages driver incoming ride notifications
- **`useGlobalDriverSocket`**: Global socket connection for drivers

#### 3. **Singleton Pattern**
- **Socket.IO Instance**: Single global socket connection with `initSocket()`
- Prevents multiple socket connections
- Provides `getSocket()` for access across components
- Implements automatic reconnection and error handling

#### 4. **Redux Toolkit Slice Pattern**
- **Feature-based slices**: Separate slices for ride, auth, driver, admin, user, vehicle
- **RTK Query API endpoints**: Co-located with feature slices
- **Optimistic Updates**: Immediate UI updates with background sync
- **Automatic Cache Invalidation**: Tags system for efficient data refetching

#### 5. **Container/Presenter Pattern**
- **Pages** (containers): Handle data fetching and business logic
- **Components** (presenters): Pure presentation with props
- Clear separation of concerns

#### 6. **Factory Pattern**
- **Route Generation**: `generateRoutes()` dynamically creates routes from sidebar config
- **Icon Factory**: Centralized icon imports and management
- **Status Badge Factory**: Dynamic badge colors based on status

#### 7. **Observer Pattern**
- **Socket.IO Events**: Event-driven architecture for real-time updates
- **Redux Subscriptions**: Components subscribe to state changes
- **RTK Query Cache Observers**: Automatic UI updates on cache changes

#### 8. **Composition Pattern**
- **Radix UI Primitives**: Composable, unstyled components
- **Layout Composition**: Nested layouts for different user roles
- **Form Composition**: Reusable form fields with validation

---

## 🔥 Core Features Deep Dive

### 1. **Real-Time Ride Request & Tracking**

**Technology**: Socket.IO Client, Redux Toolkit, React-Leaflet

**Flow**:
1. **Rider Side**:
   - Select pickup/dropoff on interactive map
   - Get real-time fare estimate from backend
   - Confirm ride request → Backend finds nearest driver
   - Socket emits `ride_request_created` event
   - UI updates to "Searching for driver..." state
   - When driver assigned → Receive `ride_accepted` event
   - Track driver location updates via `driver_location_update` event
   - View ride status changes via `ride_status_change` event

2. **Driver Side**:
   - Listen for `new_ride_request` event
   - Display incoming request with rider details
   - Accept or reject within 5 minutes
   - If accepted → Emit `ride_accepted` to rider
   - Update status through lifecycle: `GOING_TO_PICK_UP` → `DRIVER_ARRIVED` → `IN_TRANSIT` → `REACHED_DESTINATION` → `COMPLETED`
   - Each status change broadcasts to rider

**Key Code**:
```typescript
// Socket connection with auto-reconnect
const socket = initSocket();
socket.on('new_ride_request', (ride) => {
  dispatch(addIncomingRequest(ride));
  toast.info('New ride request received!');
});

// Real-time driver location updates
socket.on('driver_location_update', (data) => {
  dispatch(updateDriverLocation(data.location));
});
```

---

### 2. **Interactive Map with Leaflet**

**Technology**: Leaflet, React-Leaflet, OpenStreetMap, Nominatim API

**Features**:
- **Click-to-Select Locations**: Click anywhere on map to set pickup/dropoff
- **Autocomplete Search**: Type address → Get suggestions from Nominatim
- **Custom Markers**: Color-coded markers (green=pickup, red=dropoff, orange=driver)
- **Route Visualization**: Polyline rendering for ride route
- **Live Driver Tracking**: Driver marker updates in real-time
- **Mobile-Optimized**: Touch gestures for pan/zoom

**Key Implementation**:
```tsx
<MapContainer center={center} zoom={13}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <Marker position={pickupCoords} icon={pickupIcon}>
    <Popup>Pickup Location</Popup>
  </Marker>
  <Marker position={dropCoords} icon={dropIcon}>
    <Popup>Drop-off Location</Popup>
  </Marker>
  {shouldShowDriverMarker && (
    <Marker position={driverCoords} icon={driverIcon}>
      <Popup>Your Driver</Popup>
    </Marker>
  )}
  <Polyline positions={routeCoordinates} color="#3b82f6" />
</MapContainer>
```

---

### 3. **Redux Toolkit + RTK Query State Management**

**Architecture**:
- **Centralized Store**: Single source of truth for app state
- **Feature Slices**: Modular state management by feature
- **RTK Query**: Automatic caching, refetching, and invalidation
- **Optimistic Updates**: Instant UI updates with background sync

**API Structure**:
```typescript
// baseApi.ts - Central API configuration
export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['RIDER', 'DRIVER', 'ADMIN', 'USER', 'RIDE', 'VEHICLE'],
  endpoints: () => ({}),
});

// Feature API - ride.api.ts
export const rideApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    requestRide: builder.mutation({
      query: (rideData) => ({
        url: '/ride/create',
        method: 'POST',
        data: rideData,
      }),
      invalidatesTags: ['RIDE', 'ACTIVE_RIDE'],
    }),
    activeRide: builder.query({
      query: () => ({ url: '/ride/active-ride', method: 'GET' }),
      providesTags: ['ACTIVE_RIDE'],
    }),
  }),
});
```

**Benefits**:
- ✅ **Automatic Caching**: Reduces unnecessary API calls
- ✅ **Cache Invalidation**: Smart refetching on mutations
- ✅ **Loading/Error States**: Built-in state management
- ✅ **Optimistic Updates**: Instant UI feedback
- ✅ **TypeScript Support**: Full type safety

---

### 4. **Advanced Analytics Dashboard (Admin)**

**Technology**: Recharts, Redux Toolkit, TypeScript

**Visualizations**:
- **Line Charts**: Revenue trends over time
- **Bar Charts**: Ride volume by date
- **Area Charts**: Cumulative metrics
- **Pie Charts**: Status distribution, vehicle type breakdown
- **Composed Charts**: Multi-metric comparison

**Features**:
- **Date Range Filtering**: Analyze specific time periods
- **Metric Selection**: Filter by revenue, rides, drivers, riders
- **Responsive Design**: Charts adapt to screen size
- **Interactive Tooltips**: Hover for detailed data
- **Color-Coded Status**: Visual status differentiation
- **Export Functionality**: Download reports (planned)

**Sample Chart**:
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={revenueData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
  </LineChart>
</ResponsiveContainer>
```

---

### 5. **Dark/Light Theme System**

**Technology**: next-themes, Tailwind CSS, React Context

**Implementation**:
- **System Preference Detection**: Automatically matches OS theme
- **Manual Toggle**: User can override system preference
- **Persistent Storage**: Theme choice saved to localStorage
- **Smooth Transitions**: CSS transitions for theme changes
- **Tailwind Dark Mode**: Using `dark:` variant classes

**Usage**:
```tsx
// ThemeProvider wraps app
<ThemeProvider defaultTheme="system">
  <App />
</ThemeProvider>

// Theme toggle component
const { theme, setTheme } = useTheme();
<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```

---

## ⚡ Real-Time Features

### **Socket.IO Integration**

**Events Listened By Riders**:
- `ride_accepted` - Driver accepted the ride
- `ride_status_change` - Ride status updated
- `driver_location_update` - Driver moved
- `ride_cancelled` - Ride cancelled by driver/system

**Events Listened By Drivers**:
- `new_ride_request` - New ride request assigned
- `ride_cancelled` - Rider cancelled the ride
- `driver_timeout` - Failed to respond in time

**Socket Management**:
```typescript
// Initialize global socket connection
export const initSocket = (): Socket => {
  if (socket?.connected) return socket;
  
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
    withCredentials: true,
  });
  
  return socket;
};

// Custom hook for active ride socket
export const useActiveRide = () => {
  const socket = getSocket();
  
  useEffect(() => {
    socket.on('ride_status_change', (data) => {
      dispatch(updateRideStatus(data.status));
    });
    
    return () => {
      socket.off('ride_status_change');
    };
  }, []);
};
```

---

## 🚀 Getting Started

### **Prerequisites**
- **Node.js**: 18.x or higher
- **npm** or **yarn** or **pnpm**
- **Backend API**: Ensure backend is running

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ride-booking-frontend.git
   cd ride-booking-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # Backend API URL
   VITE_BASE_URL=http://localhost:5000/api/v1
   
   # Socket.IO Server URL
   VITE_SOCKET_URL=http://localhost:5000
   ```

   **For Production**:
   ```env
   VITE_BASE_URL=https://your-backend-api.com/api/v1
   VITE_SOCKET_URL=https://your-backend-api.com
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Application will be available at `http://localhost:5173`

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

### **Available Scripts**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on source code |

---

## 📁 Project Structure

```
ride-booking-frontend/
├── public/                         # Static assets
├── src/
│   ├── assets/                     # Images, icons, fonts
│   │   └── icons/
│   │       └── Logo.tsx
│   ├── components/
│   │   ├── layout/                 # Layout wrappers
│   │   │   ├── CommonLayout.tsx    # Landing page layout
│   │   │   └── DashboardLayout.tsx # Authenticated user layout
│   │   ├── modules/                # Feature modules
│   │   │   ├── admin/              # Admin components
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   └── Analytics.tsx   # Comprehensive analytics
│   │   │   ├── auth/               # Auth forms
│   │   │   │   ├── SigninForm.tsx
│   │   │   │   └── SignUpForm.tsx
│   │   │   ├── driver/             # Driver components
│   │   │   │   ├── DriverDashboard.tsx
│   │   │   │   ├── DriverLocationModal.tsx
│   │   │   │   ├── EarningsAnalytics.tsx
│   │   │   │   └── IncomingRequests.tsx
│   │   │   ├── home/               # Landing sections
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   ├── Stats.tsx
│   │   │   │   ├── Services.tsx
│   │   │   │   ├── Promotions.tsx
│   │   │   │   └── CallToAction.tsx
│   │   │   └── rider/              # Rider components
│   │   │       ├── RideRequest.tsx
│   │   │       ├── RideTracking.tsx
│   │   │       └── RiderDashboard.tsx
│   │   ├── shared/                 # Reusable components
│   │   │   ├── AppSidebar.tsx      # Role-based sidebar
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ModeToggler.tsx     # Theme toggle
│   │   │   ├── Profile.tsx
│   │   │   ├── RideHistory.tsx
│   │   │   └── RideMap.tsx         # Shared map component
│   │   └── ui/                     # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── ... (30+ components)
│   ├── config/
│   │   └── index.ts                # App configuration
│   ├── constants/
│   │   ├── role.ts                 # User roles
│   │   └── status.ts               # Ride/Driver statuses
│   ├── context/
│   │   └── theme.context.ts        # Theme context
│   ├── hooks/                      # Custom React hooks
│   │   ├── useActiveRide.ts        # Active ride + socket
│   │   ├── useDriverIncomingRequestSocket.ts
│   │   ├── useGlobalDriverSocket.ts
│   │   ├── useTheme.ts
│   │   └── use-mobile.ts
│   ├── lib/
│   │   ├── axios.ts                # Axios instance
│   │   ├── socket.ts               # Socket.IO setup
│   │   └── utils.ts                # Helper functions
│   ├── pages/                      # Route pages
│   │   ├── Homepage.tsx
│   │   ├── Signin.tsx
│   │   ├── SignUp.tsx
│   │   ├── RiderDashboard.tsx
│   │   ├── DriverDashboardPage.tsx
│   │   ├── AdminDashboardPage.tsx
│   │   └── ... (more pages)
│   ├── providers/
│   │   └── theme.provider.tsx      # Theme provider
│   ├── redux/                      # Redux + RTK Query
│   │   ├── store.ts                # Redux store
│   │   ├── hook.ts                 # Typed hooks
│   │   ├── baseApi.ts              # RTK Query base
│   │   ├── axiosBaseQuery.ts       # Axios integration
│   │   └── features/
│   │       ├── admin/
│   │       ├── auth/
│   │       ├── driver/
│   │       ├── ride/
│   │       ├── user/
│   │       └── vehicle/
│   ├── routes/
│   │   ├── index.tsx               # Route configuration
│   │   ├── riderSidebarItems.ts   # Rider nav items
│   │   ├── driverSidebarItems.ts  # Driver nav items
│   │   └── adminSidebarItems.ts   # Admin nav items
│   ├── types/                      # TypeScript types
│   │   ├── index.ts
│   │   ├── auth.type.ts
│   │   ├── driver.type.ts
│   │   ├── ride.type.ts
│   │   ├── user.type.ts
│   │   └── vehicle.type.ts
│   ├── utils/                      # Utility functions
│   │   ├── generateRoutes.ts       # Dynamic route generation
│   │   ├── getSidebarItems.ts      # Sidebar logic
│   │   ├── reverseGeocode.ts       # Coordinates → Address
│   │   ├── status.tsx              # Status helpers
│   │   └── withAuth.tsx            # Auth HOC
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # App entry point
│   ├── App.css                     # Global styles
│   └── index.css                   # Tailwind directives
├── components.json                 # shadcn/ui config
├── eslint.config.js                # ESLint configuration
├── index.html                      # HTML entry point
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite configuration
├── vercel.json                     # Vercel deployment config
└── README.md                       # You are here!
```

---

## 📊 State Management

### **Redux Store Architecture**

```typescript
// store.ts
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,  // RTK Query
    activeRide: activeRideReducer,           // Active ride state
    incomingRequests: incomingRequestsReducer, // Driver requests
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
```

### **RTK Query API Slices**

Each feature has its own API slice:
- **authApi**: Login, register, logout, userInfo
- **rideApi**: Request ride, active ride, cancel, fare estimate, history
- **driverApi**: Driver profile, status, location, earnings, ratings
- **userApi**: User management
- **vehicleApi**: Vehicle registration, management
- **adminApi**: Analytics, dashboard metrics, reports

### **Cache Management**

RTK Query automatically:
- ✅ Caches API responses
- ✅ Deduplicates requests
- ✅ Invalidates on mutations
- ✅ Refetches when needed
- ✅ Provides loading/error states

---

## 🎨 UI Components

### **shadcn/ui Component Library**

This project uses **shadcn/ui** - a collection of beautifully designed, accessible, and customizable components built with Radix UI and Tailwind CSS.

**Available Components** (30+):
- Accordion, Alert Dialog, Avatar, Badge, Breadcrumb
- Button, Card, Chart, Dropdown Menu, Form
- Input, Label, Navigation Menu, Popover, Progress
- Select, Separator, Sheet, Sidebar, Skeleton
- Sonner (Toast), Tabs, Tooltip

### **Customization**

All components are fully customizable using:
- **Tailwind CSS**: Utility classes
- **CVA (Class Variance Authority)**: Component variants
- **CSS Variables**: Theme colors
- **Dark Mode**: Built-in support

---

## ⚡ Performance Optimizations

- ✅ **Vite Build Tool**: Lightning-fast HMR and optimized builds
- ✅ **Code Splitting**: Route-based automatic splitting
- ✅ **Lazy Loading**: Dynamic imports for heavy components
- ✅ **RTK Query Caching**: Intelligent data caching
- ✅ **React.memo**: Memoized components
- ✅ **useMemo & useCallback**: Memoized values/functions
- ✅ **Debounced Search**: Optimized autocomplete
- ✅ **Tree Shaking**: Unused code elimination
- ✅ **Minification**: Compressed production builds

---

## 🔒 Security Features

- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **CORS Protection**: Restricted origin access
- ✅ **Input Validation**: Zod schema validation
- ✅ **Protected Routes**: Role-based access control
- ✅ **Secure WebSocket**: Socket.IO with credentials
- ✅ **Environment Variables**: Sensitive config not exposed
- ✅ **XSS Prevention**: React's built-in protection
- ✅ **HTTPS Enforced**: Production on HTTPS

---

## 🚀 Deployment

### **Vercel Deployment (Recommended)**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Environment Variables**
   
   Add to Vercel dashboard:
   - `VITE_BASE_URL`: Your backend API URL
   - `VITE_SOCKET_URL`: Your Socket.IO server URL

---

## 🌍 Environment Variables

Create `.env` file in root:

```env
# Required: Backend API base URL
VITE_BASE_URL=http://localhost:5000/api/v1

# Required: Socket.IO server URL
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🌐 Browser Support

- ✅ Chrome (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Edge (latest 2 versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🔮 Future Enhancements

- [ ] **Push Notifications**: Firebase Cloud Messaging
- [ ] **Payment Integration**: Stripe/Razorpay
- [ ] **Multi-Language Support**: i18n internationalization
- [ ] **Progressive Web App**: Offline support
- [ ] **Voice Commands**: Voice-based booking
- [ ] **Ride Sharing**: Carpooling feature
- [ ] **In-App Chat**: Rider-Driver messaging
- [ ] **Unit Tests**: Jest + React Testing Library
- [ ] **E2E Tests**: Playwright/Cypress

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with TypeScript
4. Test your changes
5. Commit with conventional commits
6. Push and open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@Hujaifa81](https://github.com/Hujaifa81)
- LinkedIn: [Md Abu Hujaifa](https://www.linkedin.com/in/md-abu-hujaifa)

---

## 🙏 Acknowledgments

- React Team, Vercel, shadcn, Radix UI, Redux Team, Leaflet, Socket.IO, Tailwind CSS, OpenStreetMap

---

<div align="center">

**⭐ If you find this project helpful, please give it a star!**

**Built with ❤️ using React, TypeScript, and Tailwind CSS**

</div>
