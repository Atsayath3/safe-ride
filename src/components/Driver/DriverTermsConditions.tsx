import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MobileContainer } from "@/components/Layout/MobileContainer";
import { ArrowLeft, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const DriverTermsConditions = () => {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { phoneNumber, email, firstName, lastName } = location.state || {};

  const handleNext = () => {
    if (agreed) {
      navigate("/driver/register/city", { 
        state: { phoneNumber, email, firstName, lastName } 
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
        <h1 className="text-xl font-semibold">Terms & Conditions</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Driver Agreement</h2>
            <p className="text-muted-foreground">Please read and agree to our terms to continue</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 max-h-80 overflow-y-auto">
            <h3 className="font-semibold mb-4">Safe Ride Driver Terms & Conditions</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>By becoming a driver with Safe Ride, you agree to:</p>
              
              <div className="space-y-2">
                <p><strong>1. Safety Requirements:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Maintain a valid driver's license and vehicle registration</li>
                  <li>Ensure your vehicle is in safe operating condition</li>
                  <li>Follow all traffic laws and regulations</li>
                  <li>Prioritize student safety at all times</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p><strong>2. Documentation:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Provide accurate and up-to-date documentation</li>
                  <li>Submit to background checks and verification</li>
                  <li>Maintain valid insurance coverage</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p><strong>3. Service Standards:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Arrive punctually for scheduled pickups</li>
                  <li>Maintain professional conduct with students and parents</li>
                  <li>Keep your vehicle clean and suitable for students</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p><strong>4. Platform Usage:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Use the platform responsibly and honestly</li>
                  <li>Report any issues or incidents immediately</li>
                  <li>Comply with all platform policies and guidelines</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="terms"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <Label 
              htmlFor="terms" 
              className="text-sm leading-relaxed cursor-pointer"
            >
              I have read and agree to the Safe Ride Driver Terms & Conditions, Privacy Policy, and understand my responsibilities as a driver.
            </Label>
          </div>

          <Button 
            className="w-full h-12 text-lg font-semibold rounded-xl mt-8"
            disabled={!agreed}
            onClick={handleNext}
          >
            Accept & Continue
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};