import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MobileContainer } from "@/components/Layout/MobileContainer";
import { ArrowLeft, MapPin } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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

export const DriverCitySelection = () => {
  const [selectedCity, setSelectedCity] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { phoneNumber, email, firstName, lastName } = location.state || {};

  const handleNext = () => {
    if (selectedCity) {
      navigate("/driver/register/vehicle", { 
        state: { phoneNumber, email, firstName, lastName, city: selectedCity } 
      });
    }
  };

  return (
    <MobileContainer>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Select City</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Choose Your City</h2>
            <p className="text-muted-foreground">Select the city where you'll be providing transportation services</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-12 rounded-xl text-lg">
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg font-semibold rounded-xl mt-8"
            disabled={!selectedCity}
            onClick={handleNext}
          >
            Continue
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};