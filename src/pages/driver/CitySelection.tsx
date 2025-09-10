import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import MobileLayout from '@/components/mobile/MobileLayout';

const cities = [
  "Ahangama", "Akkaraipattu", "Ampara", "Anuradhapura", "Badulla",
  "Balangoda", "Bandarawela", "Batticaloa", "Beruwala", "Chilaw",
  "Colombo", "Dambulla", "Dehiwala", "Embilipitiya", "Eravur",
  "Fort", "Galle", "Gampaha", "Hambantota", "Hatton",
  "Homagama", "Jaffna", "Kalutara", "Kandy", "Kelaniya",
  "Kilinochchi", "Kiribathgoda", "Kotikawatta", "Kurunegala", "Mannar",
  "Matara", "Mawanella", "Mirissa", "Monaragala", "Moratuwa",
  "Negombo", "Nuwara Eliya", "Panadura", "Peliyagoda", "Point Pedro",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Sanasa", "Talawakele",
  "Tissamaharama", "Trincomalee", "Vavuniya", "Wattala", "Wellawaya",
  "Weligama", "Wennappuwa"
];

const CitySelection = () => {
  const navigate = useNavigate();
  const { updateUserProfile } = useAuth();
  
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedCity) {
      toast({
        title: "Error",
        description: "Please select a city",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({ city: selectedCity });
      navigate('/driver/vehicle-setup');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save city",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout 
      title="Select City" 
      showBack={true} 
      onBack={() => navigate('/driver/profile-setup')}
      theme="driver"
    >
      <div className="p-4">
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="text-center">Choose Your City</CardTitle>
            <p className="text-sm text-orange-100 text-center">
              Select the city where you'll provide transportation services
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-orange-800 font-medium">Select City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full border-orange-200 focus:border-orange-400 focus:ring-orange-200">
                  <SelectValue placeholder="Choose your city" />
                </SelectTrigger>
                <SelectContent 
                  className="bg-white border-orange-200 z-50 max-h-60 overflow-y-auto shadow-lg"
                  style={{ backgroundColor: 'white' }}
                >
                  {cities.map((city) => (
                    <SelectItem 
                      key={city} 
                      value={city} 
                      className="text-gray-900 hover:bg-orange-50 focus:bg-orange-100 hover:text-gray-900 focus:text-gray-900 cursor-pointer data-[highlighted]:bg-orange-100 data-[highlighted]:text-gray-900"
                      style={{ 
                        color: '#111827',
                        backgroundColor: 'white'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff7ed';
                        e.currentTarget.style.color = '#111827';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = '#111827';
                      }}
                    >
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleContinue}
              disabled={!selectedCity || loading}
              className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white disabled:bg-orange-300"
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default CitySelection;