import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

export interface DriverFilterOptions {
  gender?: 'male' | 'female' | 'other' | null;
  vehicleType?: 'van' | 'mini van' | 'school bus' | null;
}

interface DriverFilterProps {
  filters: DriverFilterOptions;
  onFiltersChange: (filters: DriverFilterOptions) => void;
  onClearFilters: () => void;
  className?: string;
}

const DriverFilter: React.FC<DriverFilterProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = ''
}) => {
  const handleFilterChange = (key: keyof DriverFilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === filters[key] ? null : value
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== null && value !== undefined).length;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  console.log('🎯 DriverFilter rendering with filters:', filters);
  
  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Drivers
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Gender Filter */}
        <div>
          <h4 className="text-sm font-medium text-blue-900 mb-2">Gender</h4>
          <div className="flex flex-wrap gap-2">
            {['male', 'female', 'other'].map((gender) => {
              console.log('🚹 Rendering gender button:', gender, 'selected:', filters.gender === gender);
              return (
                <Button
                  key={gender}
                  variant={filters.gender === gender ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    console.log('🚹 Gender button clicked:', gender);
                    handleFilterChange('gender', gender);
                  }}
                  className={filters.gender === gender ? 
                    "bg-blue-600 text-white" : 
                    "border-blue-300 text-blue-700 hover:bg-blue-100"
                  }
                >
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Vehicle Type Filter */}
        <div>
          <h4 className="text-sm font-medium text-blue-900 mb-2">Vehicle Type</h4>
          <div className="flex flex-wrap gap-2">
            {['van', 'mini van', 'school bus'].map((type) => (
              <Button
                key={type}
                variant={filters.vehicleType === type ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('vehicleType', type)}
                className={filters.vehicleType === type ? 
                  "bg-blue-600 text-white" : 
                  "border-blue-300 text-blue-700 hover:bg-blue-100"
                }
              >
                {type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverFilter;
