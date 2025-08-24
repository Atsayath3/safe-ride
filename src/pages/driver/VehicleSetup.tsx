import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import MobileLayout from '@/components/mobile/MobileLayout';

const VehicleSetup = () => {
  const navigate = useNavigate();
  const { updateUserProfile } = useAuth();
  
  const [vehicleData, setVehicleData] = useState({
    type: '' as 'van' | 'mini van' | 'school bus' | '',
    capacity: '',
    model: '',
    year: '',
    color: '',
    plateNumber: ''
  });
  const [loading, setLoading] = useState(false);

  const vehicleTypes = [
    { value: 'school bus', label: 'School Bus', capacity: '40-60' },
    { value: 'van', label: 'Van', capacity: '8-15' },
    { value: 'mini van', label: 'Mini Van', capacity: '6-8' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  const handleContinue = async () => {
    const requiredFields = ['type', 'capacity', 'model', 'year', 'color', 'plateNumber'];
    const missingFields = requiredFields.filter(field => !vehicleData[field as keyof typeof vehicleData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Error",
        description: "Please fill in all vehicle details",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const vehicleProfile = {
        ...vehicleData,
        type: vehicleData.type as 'van' | 'mini van' | 'school bus'
      };
      await updateUserProfile({ vehicle: vehicleProfile });
      navigate('/driver/welcome');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save vehicle details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout 
      title="Vehicle Details" 
      showBack={true} 
      onBack={() => navigate('/driver/city-selection')}
      theme="driver"
    >
      <div className="p-4 space-y-4">
        <Card className="border-orange-200 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
            <CardTitle className="text-center text-orange-900">Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-orange-800">Vehicle Type</Label>
              <Select value={vehicleData.type} onValueChange={(value: 'van' | 'mini van' | 'school bus') => 
                setVehicleData(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger className="border-orange-200">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} ({type.capacity} seats)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-orange-800">Seat Capacity</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="e.g., 15"
                value={vehicleData.capacity}
                onChange={(e) => setVehicleData(prev => ({ ...prev, capacity: e.target.value }))}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="text-orange-800">Vehicle Model</Label>
              <Input
                id="model"
                placeholder="e.g., Ford Transit"
                value={vehicleData.model}
                onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-orange-800">Vehicle Year</Label>
              <Select value={vehicleData.year} onValueChange={(value) => 
                setVehicleData(prev => ({ ...prev, year: value }))
              }>
                <SelectTrigger className="border-orange-200">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="text-orange-800">Vehicle Color</Label>
              <Input
                id="color"
                placeholder="e.g., Yellow"
                value={vehicleData.color}
                onChange={(e) => setVehicleData(prev => ({ ...prev, color: e.target.value }))}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plateNumber" className="text-orange-800">License Plate Number</Label>
              <Input
                id="plateNumber"
                placeholder="e.g., ABC-1234"
                value={vehicleData.plateNumber}
                onChange={(e) => setVehicleData(prev => ({ ...prev, plateNumber: e.target.value }))}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>

            <Button 
              onClick={handleContinue}
              disabled={loading}
              className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white shadow-md disabled:bg-orange-300" 
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default VehicleSetup;