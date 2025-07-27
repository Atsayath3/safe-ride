import { Button } from "@/components/ui/button";
import { MobileContainer } from "@/components/Layout/MobileContainer";
import { Car, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-bus.jpg";

export const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <MobileContainer className="flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-8">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-8 fade-in">
          <Car className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-4xl font-bold text-foreground mb-4 text-center fade-in">
          Safe Ride
        </h1>
        
        <p className="text-muted-foreground text-center mb-12 px-4 fade-in">
          Secure school transportation connecting parents with verified drivers
        </p>

        {/* Features */}
        <div className="space-y-6 mb-12 w-full max-w-xs slide-up">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Verified Drivers</h3>
              <p className="text-sm text-muted-foreground">All drivers are background checked</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Safe for Kids</h3>
              <p className="text-sm text-muted-foreground">Trusted by parents nationwide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-8 space-y-4 slide-up">
        <Button 
          className="w-full h-12 text-lg font-semibold rounded-xl smooth-transition"
          variant="default"
          onClick={() => navigate("/parent/login")}
        >
          I'm a Parent
        </Button>
        
        <Button 
          className="w-full h-12 text-lg font-semibold rounded-xl smooth-transition"
          variant="secondary"
          onClick={() => navigate("/driver/auth")}
        >
          I'm a Driver
        </Button>
        
        <Button 
          className="w-full h-12 text-lg font-semibold rounded-xl smooth-transition"
          variant="outline"
          onClick={() => navigate("/admin/login")}
        >
          Admin Portal
        </Button>
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </MobileContainer>
  );
};