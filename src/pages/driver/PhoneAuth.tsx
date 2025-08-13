import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import MobileLayout from '@/components/mobile/MobileLayout';
import { ConfirmationResult } from 'firebase/auth';
import { formatSriLankanPhone, formatDisplayPhone, validateSriLankanPhone, cleanPhoneInput } from '@/lib/phoneUtils';

const PhoneAuth = () => {
  const navigate = useNavigate();
  const { sendPhoneOTP, verifyOTP } = useAuth();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+94 ');
  const [displayPhone, setDisplayPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const handlePhoneChange = (value: string) => {
    const formatted = formatDisplayPhone(value);
    setPhoneNumber(formatted);
    setDisplayPhone(formatted);
  };

  const handleSendOTP = async () => {
    const cleanPhone = formatSriLankanPhone(phoneNumber);
    
    if (!validateSriLankanPhone(cleanPhone)) {
      toast({
        title: "Error",
        description: "Please enter a valid Sri Lankan mobile number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await sendPhoneOTP(cleanPhone);
      setConfirmationResult(result);
      setDisplayPhone(cleanPhone);
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: "Please check your SMS for the verification code"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || !confirmationResult) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(confirmationResult, otp);
      // Check if user exists in database and redirect accordingly
      navigate('/driver/profile-setup');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid OTP",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout 
      title="Driver Registration" 
      showBack={true} 
      onBack={() => navigate('/')}
    >
      <div className="p-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-center">
              {step === 'phone' ? 'Enter Your Phone Number' : 'Verify OTP'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'phone' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+94 77 123 4567"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="text-center text-lg"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Enter your Sri Lankan mobile number
                  </p>
                </div>
                
                <Button 
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full"
                  variant="hero"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    OTP sent to {displayPhone || phoneNumber}
                  </p>
                </div>
                
                <Button 
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full"
                  variant="hero"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={() => setStep('phone')}
                  className="w-full"
                >
                  Change Phone Number
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default PhoneAuth;