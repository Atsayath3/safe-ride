import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AnimatedBackground from "@/components/AnimatedBackground";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/auth/Welcome";
import DriverLogin from "./pages/driver/DriverLogin";
import ProfileSetup from "./pages/driver/ProfileSetup";
import CitySelection from "./pages/driver/CitySelection";
import VehicleSetup from "./pages/driver/VehicleSetup";
import DriverWelcome from "./pages/driver/Welcome";
import DocumentUpload from "./pages/driver/DocumentUpload";
import DriverDashboard from "./pages/driver/Dashboard";
import RouteSetup from "./pages/driver/RouteSetup";
import DriverProfile from "./pages/driver/Profile";
import DriverRides from "./pages/driver/Rides";
import DriverRequests from "./pages/driver/Requests";
import BookingManagement from "./pages/driver/BookingManagement";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ParentLogin from "./pages/parent/ParentLogin";
import ParentDashboard from "./pages/parent/ParentDashboard";
import AddChild from "./pages/parent/AddChild";
import AddChildLocations from "./pages/parent/AddChildLocations";
import EditChild from "./pages/parent/EditChild";
import ParentProfileSetup from "./pages/parent/ParentProfileSetup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AnimatedBackground />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/landing" element={<Index />} />
            
            {/* Driver Routes */}
            <Route path="/driver/login" element={<DriverLogin />} />
            <Route path="/driver/profile-setup" element={<ProfileSetup />} />
            <Route path="/driver/city-selection" element={<CitySelection />} />
            <Route path="/driver/vehicle-setup" element={<VehicleSetup />} />
            <Route path="/driver/welcome" element={<DriverWelcome />} />
            <Route path="/driver/upload/:documentType" element={<DocumentUpload />} />
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            <Route path="/driver/routes" element={<RouteSetup />} />
            <Route path="/driver/profile" element={<DriverProfile />} />
            <Route path="/driver/rides" element={<DriverRides />} />
            <Route path="/driver/requests" element={<DriverRequests />} />
            <Route path="/driver/bookings" element={<BookingManagement />} />
            
            {/* Parent Routes */}
            <Route path="/parent/login" element={<ParentLogin />} />
            <Route path="/parent/profile-setup" element={<ParentProfileSetup />} />
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/parent/add-child" element={<AddChild />} />
            <Route path="/parent/add-child/locations" element={<AddChildLocations />} />
            <Route path="/parent/edit-child/:childId" element={<EditChild />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;