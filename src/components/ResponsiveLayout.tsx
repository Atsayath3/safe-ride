import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu, Bell, User, Home, Calendar, Settings, Car, Users, DollarSign, Star, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  onMenu?: () => void;
  className?: string;
  theme?: 'parent' | 'driver' | 'admin' | 'default';
  rightContent?: React.ReactNode;
  userProfile?: any;
  onLogout?: () => void;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  active?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  title,
  showBack = false,
  onBack,
  showMenu = false,
  onMenu,
  className = "",
  theme = 'default',
  rightContent,
  userProfile,
  onLogout,
  currentTab,
  onTabChange
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation items based on theme
  const getNavigationItems = (): NavItem[] => {
    const basePath = theme === 'parent' ? '/parent' : theme === 'driver' ? '/driver' : '/admin';
    
    switch (theme) {
      case 'parent':
        return [
          {
            icon: <Home className="w-5 h-5" />,
            label: 'Dashboard',
            path: 'home',
            active: currentTab === 'home'
          },
          {
            icon: <Car className="w-5 h-5" />,
            label: 'Rides',
            path: 'rides',
            active: currentTab === 'rides'
          },
          {
            icon: <Users className="w-5 h-5" />,
            label: 'Sibling Groups',
            path: 'siblings',
            active: currentTab === 'siblings'
          },
          {
            icon: <DollarSign className="w-5 h-5" />,
            label: 'Budget Tracking',
            path: 'budget',
            active: currentTab === 'budget'
          },
          {
            icon: <Star className="w-5 h-5" />,
            label: 'Trusted Drivers',
            path: 'drivers',
            active: currentTab === 'drivers'
          },
          {
            icon: <User className="w-5 h-5" />,
            label: 'Profile',
            path: 'profile',
            active: currentTab === 'profile'
          }
        ];
      case 'driver':
        return [
          {
            icon: <Home className="w-5 h-5" />,
            label: 'Dashboard',
            path: '/driver/dashboard',
            active: location.pathname === '/driver/dashboard'
          },
          {
            icon: <Calendar className="w-5 h-5" />,
            label: 'Rides',
            path: '/driver/rides',
            active: location.pathname.includes('/rides')
          },
          {
            icon: <Bell className="w-5 h-5" />,
            label: 'Requests',
            path: '/driver/requests',
            active: location.pathname.includes('/requests')
          },
          {
            icon: <Users className="w-5 h-5" />,
            label: 'Bookings',
            path: '/driver/booking-management',
            active: location.pathname.includes('/booking')
          },
          {
            icon: <User className="w-5 h-5" />,
            label: 'Profile',
            path: '/driver/profile',
            active: location.pathname.includes('/profile')
          }
        ];
      default:
        return [];
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.length > 1 ? navigate(-1) : navigate('/');
    }
  };

  const getThemeColors = () => {
    switch (theme) {
      case 'parent':
        return {
          primary: 'bg-blue-600',
          secondary: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200'
        };
      case 'driver':
        return {
          primary: 'bg-green-600',
          secondary: 'bg-green-50',
          text: 'text-green-600',
          border: 'border-green-200'
        };
      case 'admin':
        return {
          primary: 'bg-purple-600',
          secondary: 'bg-purple-50',
          text: 'text-purple-600',
          border: 'border-purple-200'
        };
      default:
        return {
          primary: 'bg-gray-600',
          secondary: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200'
        };
    }
  };

  const themeColors = getThemeColors();
  const navigationItems = getNavigationItems();

  // Mobile Layout (existing)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <header className={`${themeColors.primary} text-white p-4 sticky top-0 z-40 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-white hover:bg-white/20 p-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              {showMenu && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMenu}
                  className="text-white hover:bg-white/20 p-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              {title && (
                <h1 className="text-lg font-semibold truncate">
                  {title}
                </h1>
              )}
            </div>
            
            {rightContent && (
              <div className="flex items-center gap-2">
                {rightContent}
              </div>
            )}
          </div>
        </header>

        {/* Mobile Content */}
        <main className={`flex-1 ${className}`}>
          {children}
        </main>
      </div>
    );
  }

  // Desktop Layout (new professional design)
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Desktop Sidebar */}
      <aside className={`w-64 bg-white shadow-lg border-r ${themeColors.border} flex flex-col`}>
        {/* Sidebar Header */}
        <div className={`${themeColors.primary} text-white p-6`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SafeRide</h1>
              <p className="text-sm opacity-90 capitalize">{theme} Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {/* Main Navigation */}
            {navigationItems.slice(0, 2).map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => {
                    if (theme === 'parent' && onTabChange) {
                      onTabChange(item.path);
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    item.active
                      ? `${themeColors.secondary} ${themeColors.text} border ${themeColors.border}`
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
            
            {/* Personalization Section - Only for Parent */}
            {theme === 'parent' && navigationItems.length > 3 && (
              <>
                <li className="pt-4 pb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">
                    Personalization
                  </h3>
                </li>
                {navigationItems.slice(2, -1).map((item, index) => (
                  <li key={`personalization-${index}`}>
                    <button
                      onClick={() => {
                        if (theme === 'parent' && onTabChange) {
                          onTabChange(item.path);
                        } else {
                          navigate(item.path);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        item.active
                          ? `${themeColors.secondary} ${themeColors.text} border ${themeColors.border}`
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                ))}
                
                <li className="pt-4 pb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">
                    Account
                  </h3>
                </li>
                {/* Profile Section */}
                <li>
                  <button
                    onClick={() => {
                      if (theme === 'parent' && onTabChange) {
                        onTabChange(navigationItems[navigationItems.length - 1].path);
                      } else {
                        navigate(navigationItems[navigationItems.length - 1].path);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      navigationItems[navigationItems.length - 1].active
                        ? `${themeColors.secondary} ${themeColors.text} border ${themeColors.border}`
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {navigationItems[navigationItems.length - 1].icon}
                    <span className="font-medium">{navigationItems[navigationItems.length - 1].label}</span>
                  </button>
                </li>
              </>
            )}
            
            {/* Other themes - show all items normally */}
            {theme !== 'parent' && navigationItems.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => {
                    if (theme === 'parent' && onTabChange) {
                      onTabChange(item.path);
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    item.active
                      ? `${themeColors.secondary} ${themeColors.text} border ${themeColors.border}`
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile Section */}
        {userProfile && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Avatar className="w-10 h-10">
                <AvatarFallback className={`${themeColors.primary} text-white`}>
                  {userProfile.firstName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {userProfile.firstName} {userProfile.lastName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {userProfile.email}
                </p>
              </div>
            </div>
            {onLogout && (
              <Button
                onClick={onLogout}
                variant="outline"
                className="w-full mt-3 border-gray-800 text-gray-800 hover:bg-gray-100 hover:border-gray-900 font-medium"
              >
                Logout
              </Button>
            )}
          </div>
        )}
      </aside>

      {/* Desktop Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Desktop Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              {title && (
                <h1 className="text-2xl font-bold text-gray-900">
                  {title}
                </h1>
              )}
            </div>
            
            {rightContent && (
              <div className="flex items-center gap-4">
                {rightContent}
              </div>
            )}
          </div>
        </header>

        {/* Desktop Content */}
        <main className={`flex-1 p-6 overflow-auto ${className}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveLayout;
