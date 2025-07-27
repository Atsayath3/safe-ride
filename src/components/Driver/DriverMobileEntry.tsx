import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileContainer } from "@/components/Layout/MobileContainer";
import { ArrowLeft, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendVerificationCode, checkDriverExists, cleanupRecaptcha } from "@/services/authService";
import { toast } from "@/hooks/use-toast";

export const DriverMobileEntry = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Clean up reCAPTCHA on component unmount and test Firebase connection
  useEffect(() => {
    // Test Firebase connection
    const testFirebaseConnection = async () => {
      try {
        const testDoc = await checkDriverExists("test-connection");
        console.log('Firebase connection test successful');
      } catch (error) {
        console.error('Firebase connection test failed:', error);
      }
    };
    
    testFirebaseConnection();
    
    return () => {
      cleanupRecaptcha();
    };
  }, []);

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters for validation
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid Sri Lankan number
    // Sri Lankan mobile numbers are 9 digits (without country code)
    // Or 11 digits with country code (94xxxxxxxxx)
    if (cleaned.length === 9 || (cleaned.length === 11 && cleaned.startsWith('94'))) {
      return true;
    }
    
    // Also accept if it starts with +94 and has correct length
    if (phone.startsWith('+94') && cleaned.length === 11) {
      return true;
    }
    
    return false;
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      return;
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Sri Lankan phone number (e.g., +94771234567 or 0771234567)",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log('Checking if driver exists...');
      // Check if driver already exists
      const driverExists = await checkDriverExists(phoneNumber);
      console.log('Driver exists:', driverExists);
      
      // Skip OTP verification for now - comment out verification code sending
      // console.log('Sending verification code...');
      // const confirmationResult = await sendVerificationCode(phoneNumber);
      // console.log('Verification code sent, navigating to OTP page');
      
      // Skip directly to next step based on driver existence
      if (driverExists) {
        // Driver exists, navigate to dashboard/profile
        navigate("/driver/documents", { state: { phoneNumber } });
      } else {
        // New driver, start registration process
        navigate("/driver/register/email", { state: { phoneNumber } });
      }
    } catch (error: any) {
      console.error("Error in handleSendCode:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to check driver status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileContainer>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Driver Registration</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Enter Your Mobile Number</h2>
            <p className="text-muted-foreground">We'll send you a verification code to get started</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+94771234567 or 0771234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10 h-12 rounded-xl text-lg"
                  autoComplete="tel"
                />
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg font-semibold rounded-xl mt-8"
            disabled={!phoneNumber || loading}
            onClick={handleSendCode}
          >
            {loading ? "Sending..." : "Send Verification Code"}
          </Button>

          {/* Hidden recaptcha container */}
          <div id="recaptcha-container"></div>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to our{" "}
              <Button variant="link" className="text-primary p-0 h-auto text-sm">
                Terms of Service
              </Button>{" "}
              and{" "}
              <Button variant="link" className="text-primary p-0 h-auto text-sm">
                Privacy Policy
              </Button>
            </p>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};