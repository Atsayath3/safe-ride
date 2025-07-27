import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileContainer } from "@/components/Layout/MobileContainer";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyCode } from "@/services/authService";
import { toast } from "@/hooks/use-toast";

export const OTPVerification = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { phoneNumber, confirmationResult, isExisting } = location.state || {};

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const isOtpComplete = otp.every(digit => digit !== "");

  const handleVerifyOTP = async () => {
    if (!isOtpComplete) return;
    
    setLoading(true);
    try {
      // Skip OTP verification for now
      console.log("Skipping OTP verification for development");
      
      if (isExisting) {
        // Driver exists, navigate to dashboard/profile
        navigate("/driver/dashboard");
      } else {
        // New driver, start registration process
        navigate("/driver/register/email", { state: { phoneNumber } });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileContainer>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <Button variant="ghost" size="icon" className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Verify Number</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Enter Verification Code</h2>
            <p className="text-muted-foreground">
              We've sent a 6-digit code to<br />
              <span className="font-semibold text-foreground">{phoneNumber || "+1 (555) 000-0000"}</span>
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-12 h-12 text-center text-lg font-semibold rounded-xl"
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-muted-foreground mb-2">Didn't receive the code?</p>
              <Button variant="link" className="text-primary p-0 h-auto font-semibold">
                Resend Code
              </Button>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg font-semibold rounded-xl mt-8"
            disabled={!isOtpComplete || loading}
            onClick={handleVerifyOTP}
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};