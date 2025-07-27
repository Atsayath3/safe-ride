import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileContainer } from "@/components/Layout/MobileContainer";
import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const DriverEmailEntry = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { phoneNumber } = location.state || {};

  const handleNext = () => {
    if (email) {
      navigate("/driver/register/name", { 
        state: { phoneNumber, email } 
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
        <h1 className="text-xl font-semibold">Email Address</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Enter Your Email</h2>
            <p className="text-muted-foreground">We'll use this for important notifications</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl text-lg"
                />
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg font-semibold rounded-xl mt-8"
            disabled={!email}
            onClick={handleNext}
          >
            Continue
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};