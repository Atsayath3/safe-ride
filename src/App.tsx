import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AnimatedBackground from "@/components/AnimatedBackground";
import ProtectedRoute from "@/components/ProtectedRoute";

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
import DatabaseStatus from "./components/DatabaseStatus";
import StorageRulesTester from "./components/test/StorageRulesTester";
import BookingDiagnosticSimple from "./components/test/BookingDiagnosticSimple";
import QuickDriverFixer from "./components/test/QuickDriverFixer";
import BookingFlowDebugger from "./components/test/BookingFlowDebugger";

const queryClient = new QueryClient();

const App = () => {
  return (
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
            
            {/* Development Tools - Only available in development */}
            <Route path="/dev/cleanup" element={<DatabaseStatus />} />
            
            {/* Driver Routes */}
            <Route path="/driver/login" element={<DriverLogin />} />
            <Route path="/driver/profile-setup" element={
              <ProtectedRoute requiredRole="driver">
                <ProfileSetup />
              </ProtectedRoute>
            } />
            <Route path="/driver/city-selection" element={
              <ProtectedRoute requiredRole="driver">
                <CitySelection />
              </ProtectedRoute>
            } />
            <Route path="/driver/vehicle-setup" element={
              <ProtectedRoute requiredRole="driver">
                <VehicleSetup />
              </ProtectedRoute>
            } />
            <Route path="/driver/route-setup" element={
              <ProtectedRoute requiredRole="driver">
                <RouteSetup />
              </ProtectedRoute>
            } />
            <Route path="/driver/welcome" element={
              <ProtectedRoute requiredRole="driver">
                <DriverWelcome />
              </ProtectedRoute>
            } />
            <Route path="/driver/upload/:documentType" element={
              <ProtectedRoute requiredRole="driver">
                <DocumentUpload />
              </ProtectedRoute>
            } />
            <Route path="/driver/dashboard" element={
              <ProtectedRoute requiredRole="driver">
                <DriverDashboard />
              </ProtectedRoute>
            } />
            <Route path="/driver/routes" element={
              <ProtectedRoute requiredRole="driver">
                <RouteSetup />
              </ProtectedRoute>
            } />
            <Route path="/driver/profile" element={
              <ProtectedRoute requiredRole="driver">
                <DriverProfile />
              </ProtectedRoute>
            } />
            <Route path="/driver/rides" element={
              <ProtectedRoute requiredRole="driver">
                <DriverRides />
              </ProtectedRoute>
            } />
            <Route path="/driver/requests" element={
              <ProtectedRoute requiredRole="driver">
                <DriverRequests />
              </ProtectedRoute>
            } />
            <Route path="/driver/bookings" element={
              <ProtectedRoute requiredRole="driver">
                <BookingManagement />
              </ProtectedRoute>
            } />
            
            {/* Parent Routes */}
            <Route path="/parent/login" element={<ParentLogin />} />
            <Route path="/parent/profile-setup" element={
              <ProtectedRoute requiredRole="parent">
                <ParentProfileSetup />
              </ProtectedRoute>
            } />
            <Route path="/parent/dashboard" element={
              <ProtectedRoute requiredRole="parent">
                <ParentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/parent/add-child" element={
              <ProtectedRoute requiredRole="parent">
                <AddChild />
              </ProtectedRoute>
            } />
            <Route path="/parent/add-child/locations" element={
              <ProtectedRoute requiredRole="parent">
                <AddChildLocations />
              </ProtectedRoute>
            } />
            <Route path="/parent/edit-child/:childId" element={
              <ProtectedRoute requiredRole="parent">
                <EditChild />
              </ProtectedRoute>
            } />
            
            {/* Testing Routes */}
            <Route path="/test/storage-rules" element={<StorageRulesTester />} />
            <Route path="/test/booking-diagnostic" element={<BookingDiagnosticSimple />} />
            <Route path="/test/fix-drivers" element={<QuickDriverFixer />} />
            <Route path="/test/booking-flow" element={<BookingFlowDebugger />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;