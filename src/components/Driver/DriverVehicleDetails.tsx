import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileContainer } from "@/components/Layout/MobileContainer";
import { ArrowLeft, Car } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const vehicleTypes = [
  { value: "school-bus", label: "School Bus" },
  { value: "van", label: "Van" },
  { value: "mini-van", label: "Mini Van" }
];

const seatCapacities = [
  "6", "8", "10", "12", "15", "20", "25", "30", "35", "40", "45", "50"
];

export const DriverVehicleDetails = () => {
  const [vehicleData, setVehicleData] = useState({
    type: "",
    seatCapacity: "",
    model: "",
    year: "",
    color: "",
    plateNumber: ""
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { phoneNumber, email, firstName, lastName, city } = location.state || {};

  const handleInputChange = (field: string, value: string) => {
    setVehicleData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = Object.values(vehicleData).every(value => value.trim() !== "");

  const handleNext = () => {
    if (isFormValid) {
      navigate("/driver/register/welcome", { 
        state: { 
          phoneNumber, 
          email, 
          firstName, 
          lastName, 
          city,
          vehicleData
        } 
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
        <h1 className="text-xl font-semibold">Vehicle Details</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Vehicle Information</h2>
            <p className="text-muted-foreground">Tell us about your vehicle</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select 
                value={vehicleData.type} 
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Seat Capacity</Label>
              <Select 
                value={vehicleData.seatCapacity} 
                onValueChange={(value) => handleInputChange("seatCapacity", value)}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select seat capacity" />
                </SelectTrigger>
                <SelectContent>
                  {seatCapacities.map((capacity) => (
                    <SelectItem key={capacity} value={capacity}>
                      {capacity} seats
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Vehicle Model</Label>
              <Input
                id="model"
                placeholder="e.g., Ford Transit"
                value={vehicleData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Vehicle Year</Label>
              <Input
                id="year"
                placeholder="e.g., 2020"
                value={vehicleData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Vehicle Color</Label>
              <Input
                id="color"
                placeholder="e.g., Yellow"
                value={vehicleData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plateNumber">License Plate Number</Label>
              <Input
                id="plateNumber"
                placeholder="e.g., ABC-1234"
                value={vehicleData.plateNumber}
                onChange={(e) => handleInputChange("plateNumber", e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg font-semibold rounded-xl mt-8"
            disabled={!isFormValid}
            onClick={handleNext}
          >
            Continue
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};