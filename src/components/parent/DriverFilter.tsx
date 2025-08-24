import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

export interface DriverFilterOptions {
  gender?: 'male' | 'female' | 'other' | null;
  routeQuality?: 'excellent' | 'good' | 'fair' | null;
  minAvailableSeats?: number | null;
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
            {['male', 'female', 'other'].map((gender) => (
              <Button
                key={gender}
                variant={filters.gender === gender ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('gender', gender)}
                className={filters.gender === gender ? 
                  "bg-blue-600 text-white" : 
                  "border-blue-300 text-blue-700 hover:bg-blue-100"
                }
              >
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Route Quality Filter */}
        <div>
          <h4 className="text-sm font-medium text-blue-900 mb-2">Route Quality</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'excellent', label: 'Excellent', color: 'bg-green-600' },
              { value: 'good', label: 'Good', color: 'bg-blue-600' },
              { value: 'fair', label: 'Fair', color: 'bg-yellow-600' }
            ].map((quality) => (
              <Button
                key={quality.value}
                variant={filters.routeQuality === quality.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('routeQuality', quality.value)}
                className={filters.routeQuality === quality.value ? 
                  `${quality.color} text-white` : 
                  "border-blue-300 text-blue-700 hover:bg-blue-100"
                }
              >
                {quality.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Only drivers with good routes are shown
          </p>
        </div>

        {/* Available Seats Filter */}
        <div>
          <h4 className="text-sm font-medium text-blue-900 mb-2">Minimum Available Seats</h4>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((seats) => (
              <Button
                key={seats}
                variant={filters.minAvailableSeats === seats ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('minAvailableSeats', seats)}
                className={filters.minAvailableSeats === seats ? 
                  "bg-blue-600 text-white" : 
                  "border-blue-300 text-blue-700 hover:bg-blue-100"
                }
              >
                {seats}+ seats
              </Button>
            ))}
          </div>
        </div>

        {/* Vehicle Type Filter */}
        <div>
          <h4 className="text-sm font-medium text-blue-900 mb-2">Vehicle Type</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'van', label: 'Van' },
              { value: 'mini van', label: 'Mini Van' },
              { value: 'school bus', label: 'School Bus' }
            ].map((vehicle) => (
              <Button
                key={vehicle.value}
                variant={filters.vehicleType === vehicle.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('vehicleType', vehicle.value)}
                className={filters.vehicleType === vehicle.value ? 
                  "bg-blue-600 text-white" : 
                  "border-blue-300 text-blue-700 hover:bg-blue-100"
                }
              >
                {vehicle.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverFilter;
