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
    >
      <div className="p-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-center">Choose Your City</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Select the city where you'll provide transportation services
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city">Select City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose your city" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {cities.map((city) => (
                    <SelectItem key={city} value={city} className="hover:bg-accent">
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleContinue}
              disabled={!selectedCity || loading}
              className="w-full mt-6" 
              variant="hero"
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