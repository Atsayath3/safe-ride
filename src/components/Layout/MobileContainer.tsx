import { ReactNode } from "react";

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
}

export const MobileContainer = ({ children, className = "" }: MobileContainerProps) => {
  return (
    <div className={`mobile-container ${className}`}>
      {children}
    </div>
  );
};