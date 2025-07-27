import { Button } from "@/components/ui/button";
import { MobileContainer } from "@/components/Layout/MobileContainer";
import { CheckCircle, Upload, Camera, MessageCircle, FileText, CreditCard, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { createDriverProfile } from "@/services/authService";
import { toast } from "@/hooks/use-toast";

export const DriverWelcome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { phoneNumber, email, firstName, lastName, city, vehicleData } = location.state || {};

  const handleCompleteRegistration = async () => {
    try {
      const driverData = {
        phoneNumber,
        email,
        firstName,
        lastName,
        city,
        vehicleType: vehicleData.type,
        seatCapacity: parseInt(vehicleData.seatCapacity),
        vehicleModel: vehicleData.model,
        vehicleYear: vehicleData.year,
        vehicleColor: vehicleData.color,
        vehiclePlate: vehicleData.plateNumber
      };

      await createDriverProfile(driverData);
      
      toast({
        title: "Registration Successful!",
        description: "Your profile has been created. Please upload your documents."
      });

      navigate("/driver/documents");
    } catch (error) {
      console.error("Error creating driver profile:", error);
      toast({
        title: "Error",
        description: "Failed to complete registration. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <MobileContainer>
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Welcome to Safe Ride!</h1>
            <h2 className="text-xl font-semibold mb-2">{firstName} {lastName}</h2>
            <p className="text-muted-foreground">Your driver profile has been created successfully</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold mb-4">Next Steps:</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-destructive" />
                </div>
                <span className="text-sm">Upload NIC (National ID)</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-destructive" />
                </div>
                <span className="text-sm">Upload Vehicle Insurance</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-destructive" />
                </div>
                <span className="text-sm">Upload Vehicle License</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-destructive" />
                </div>
                <span className="text-sm">Take Profile Picture</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm">Connect WhatsApp (Optional)</span>
              </div>
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
            <p className="text-sm text-center">
              <strong>Important:</strong> Your documents will be reviewed by our admin team. 
              You can explore the app while waiting for approval.
            </p>
          </div>

          <Button 
            className="w-full h-12 text-lg font-semibold rounded-xl"
            onClick={handleCompleteRegistration}
          >
            Continue to Documents
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};