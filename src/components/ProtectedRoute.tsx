import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'parent' | 'driver' | 'admin';
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  redirectTo 
}) => {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!currentUser) {
      // Not logged in - redirect to appropriate login page
      const loginRoute = requiredRole === 'admin' ? '/admin/login' : 
                        requiredRole === 'driver' ? '/driver/login' : '/parent/login';
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page",
        variant: "destructive",
      });
      navigate(loginRoute);
      return;
    }

    if (!userProfile) {
      // User logged in but no profile loaded yet
      return;
    }

    if (userProfile.role !== requiredRole) {
      // Wrong role - redirect to correct dashboard or login
      const correctRoute = userProfile.role === 'admin' ? '/admin/dashboard' : 
                          userProfile.role === 'driver' ? '/driver/dashboard' : '/parent/dashboard';
      
      toast({
        title: "Access Denied",
        description: `You don't have permission to access this page. Redirecting to your ${userProfile.role} dashboard.`,
        variant: "destructive",
      });
      
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate(correctRoute);
      }
      return;
    }
  }, [currentUser, userProfile, loading, requiredRole, redirectTo, navigate]);

  // Show loading or nothing while checking auth
  if (loading || !currentUser || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show content only if user has correct role
  if (userProfile.role === requiredRole) {
    return <>{children}</>;
  }

  // Don't render anything while redirecting
  return null;
};

export default ProtectedRoute;
