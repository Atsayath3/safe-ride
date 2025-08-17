import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  onMenu?: () => void;
  className?: string;
  theme?: 'parent' | 'driver' | 'admin' | 'default';
  rightContent?: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  showBack = false,
  onBack,
  showMenu = false,
  onMenu,
  className = "",
  theme = 'default',
  rightContent
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Default behavior: go back in browser history
      window.history.length > 1 ? navigate(-1) : navigate('/');
    }
  };

  // Add keyboard support for back navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showBack) {
        event.preventDefault();
        handleBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showBack, onBack]);
  const getThemeClasses = () => {
    switch (theme) {
      case 'parent':
        return {
          background: 'bg-gradient-to-b from-blue-50 to-blue-100',
          header: 'bg-white border-blue-200',
          title: 'text-blue-900',
          headerButton: 'text-blue-700 hover:bg-blue-50 hover:text-blue-900'
        };
      case 'driver':
        return {
          background: 'bg-gradient-to-b from-orange-50 to-orange-100',
          header: 'bg-white border-orange-200',
          title: 'text-orange-900',
          headerButton: 'text-orange-700 hover:bg-orange-50 hover:text-orange-900'
        };
      case 'admin':
        return {
          background: 'bg-gradient-to-b from-red-50 to-red-100',
          header: 'bg-white border-red-200',
          title: 'text-red-900',
          headerButton: 'text-red-700 hover:bg-red-50 hover:text-red-900'
        };
      default:
        return {
          background: 'bg-background',
          header: 'bg-card border-border',
          title: 'text-foreground',
          headerButton: 'text-foreground hover:bg-accent'
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <>
      {/* Full viewport background with theme */}
      <div className={`fixed inset-0 ${themeClasses.background} -z-10`}></div>
      
      <div className={`min-h-screen flex flex-col max-w-md mx-auto relative ${className} border-x border-gray-200/30 shadow-2xl ${themeClasses.background}`}>
        {/* Header */}
        <header className={`${themeClasses.header} border-b px-4 py-3 flex items-center justify-between min-h-[60px] shadow-sm`}>
          <div className="flex items-center gap-3">
            {showBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className={`p-2 h-10 w-10 ${themeClasses.headerButton} transition-transform hover:scale-110 active:scale-95`}
                aria-label="Go back"
                title="Go back (ESC)"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {title && (
              <h1 className={`text-lg font-semibold ${themeClasses.title} truncate`}>
                {title}
              </h1>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {rightContent}
            {showMenu && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenu}
                className={`p-2 h-10 w-10 ${themeClasses.headerButton}`}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto relative">
          {children}
        </main>
      </div>
    </>
  );
};

export default MobileLayout;