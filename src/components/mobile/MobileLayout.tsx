import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu } from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  onMenu?: () => void;
  className?: string;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  showBack = false,
  onBack,
  showMenu = false,
  onMenu,
  className = ""
}) => {
  return (
    <div className={`min-h-screen bg-background flex flex-col max-w-md mx-auto ${className}`}>
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between min-h-[60px]">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2 h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-semibold text-foreground truncate">
              {title}
            </h1>
          )}
        </div>
        
        {showMenu && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenu}
            className="p-2 h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default MobileLayout;