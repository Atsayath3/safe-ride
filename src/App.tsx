import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ParentAuth from "./pages/ParentAuth";
import ParentSignupPage from "./pages/ParentSignupPage";
import DriverAuth from "./pages/DriverAuth";
import DriverOTP from "./pages/DriverOTP";
import DriverEmailPage from "./pages/DriverEmailPage";
import DriverNamePage from "./pages/DriverNamePage";
import DriverTermsPage from "./pages/DriverTermsPage";
import DriverCityPage from "./pages/DriverCityPage";
import DriverVehiclePage from "./pages/DriverVehiclePage";
import DriverWelcomePage from "./pages/DriverWelcomePage";
import DriverDocumentsPage from "./pages/DriverDocumentsPage";
import DriverApprovalPage from "./pages/DriverApprovalPage";
import AdminLoginPage from "./pages/AdminLogin";
import AdminDashboardPage from "./pages/AdminDashboard";
import DriverRouteSettingPage from "./pages/DriverRouteSettingPage";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/parent/login" element={<ParentAuth />} />
            <Route path="/parent/signup" element={<ParentSignupPage />} />
            <Route path="/driver/auth" element={<DriverAuth />} />
            <Route path="/driver/verify-otp" element={<DriverOTP />} />
            <Route path="/driver/register/email" element={<DriverEmailPage />} />
            <Route path="/driver/register/name" element={<DriverNamePage />} />
            <Route path="/driver/register/terms" element={<DriverTermsPage />} />
            <Route path="/driver/register/city" element={<DriverCityPage />} />
            <Route path="/driver/register/vehicle" element={<DriverVehiclePage />} />
            <Route path="/driver/register/welcome" element={<DriverWelcomePage />} />
            <Route path="/driver/documents" element={<DriverDocumentsPage />} />
            <Route path="/driver/approval-status" element={<DriverApprovalPage />} />
            <Route path="/driver/set-route" element={<DriverRouteSettingPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
