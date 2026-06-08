import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RealtimeNotifications } from "@/components/RealtimeNotifications";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CustomerDashboard from "./pages/CustomerDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import AdminDashboard from "./pages/AdminDashboard";
// Customer sub-pages
import MyBookings from "./pages/customer/MyBookings";
import Wallet from "./pages/customer/Wallet";
import MyVehicles from "./pages/customer/MyVehicles";
import CustomerProfile from "./pages/customer/Profile";
// Driver sub-pages
import JobRequests from "./pages/driver/JobRequests";
import MyJobs from "./pages/driver/MyJobs";
import Earnings from "./pages/driver/Earnings";
import DriverProfile from "./pages/driver/DriverProfile";
// Admin sub-pages
import AdminRides from "./pages/admin/AdminRides";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RealtimeNotifications />
          <div className="w-full h-screen overflow-hidden">
            <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />

              {/* Customer Routes */}
              <Route path="/customer" element={<ProtectedRoute allowedRole="customer"><CustomerDashboard /></ProtectedRoute>} />
              <Route path="/customer/rides" element={<ProtectedRoute allowedRole="customer"><MyBookings /></ProtectedRoute>} />
              <Route path="/customer/wallet" element={<ProtectedRoute allowedRole="customer"><Wallet /></ProtectedRoute>} />
              <Route path="/customer/vehicles" element={<ProtectedRoute allowedRole="customer"><MyVehicles /></ProtectedRoute>} />
              <Route path="/customer/profile" element={<ProtectedRoute allowedRole="customer"><CustomerProfile /></ProtectedRoute>} />

              {/* Driver Routes */}
              <Route path="/driver" element={<ProtectedRoute allowedRole="driver"><DriverDashboard /></ProtectedRoute>} />
              <Route path="/driver/requests" element={<ProtectedRoute allowedRole="driver"><JobRequests /></ProtectedRoute>} />
              <Route path="/driver/rides" element={<ProtectedRoute allowedRole="driver"><MyJobs /></ProtectedRoute>} />
              <Route path="/driver/earnings" element={<ProtectedRoute allowedRole="driver"><Earnings /></ProtectedRoute>} />
              <Route path="/driver/profile" element={<ProtectedRoute allowedRole="driver"><DriverProfile /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/rides" element={<ProtectedRoute allowedRole="admin"><AdminRides /></ProtectedRoute>} />
              <Route path="/admin/drivers" element={<ProtectedRoute allowedRole="admin"><AdminDrivers /></ProtectedRoute>} />
              <Route path="/admin/customers" element={<ProtectedRoute allowedRole="admin"><AdminCustomers /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute allowedRole="admin"><AdminAnalytics /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin"><AdminSettings /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

