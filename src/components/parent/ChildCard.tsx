import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, School } from 'lucide-react';
import { Child } from '@/pages/parent/ParentDashboard';

interface ChildCardProps {
  child: Child;
  onClick: () => void;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onClick }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] rounded-2xl border border-border/50 bg-gradient-to-r from-card to-card/80"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-14 w-14 ring-2 ring-primary/10">
            <AvatarImage src={child.avatar} alt={child.fullName} />
            <AvatarFallback className="bg-secondary/10 text-secondary font-semibold text-lg">
              {getInitials(child.fullName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-nunito font-semibold text-lg text-foreground">
                {child.fullName}
              </h3>
              <Badge variant="secondary" className="text-xs font-medium">
                Active
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <School className="h-4 w-4" />
              <span className="font-medium">{child.schoolName}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{child.tripStartLocation.address}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChildCard;