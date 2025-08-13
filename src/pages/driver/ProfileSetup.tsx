import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import MobileLayout from '@/components/mobile/MobileLayout';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { updateUserProfile, currentUser } = useAuth();
  
  const [step, setStep] = useState<'name' | 'terms'>('name');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);


  const handleNameNext = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your first and last name",
        variant: "destructive"
      });
      return;
    }
    setStep('terms');
  };

  const handleComplete = async () => {
    if (!acceptedTerms) {
      toast({
        title: "Error",
        description: "Please accept the terms and conditions",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({
        ...formData,
        email: currentUser?.email ?? '',
        role: 'driver',
        status: 'pending'
      });
      
      navigate('/driver/city-selection');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {

      case 'name':
        return (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-center">Your Name</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              
              <Button onClick={handleNameNext} className="w-full" variant="hero">
                Continue
              </Button>
            </CardContent>
          </Card>
        );

      case 'terms':
        return (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-center">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-48 overflow-y-auto bg-muted p-4 rounded-md text-sm">
                <h4 className="font-semibold mb-2">Driver Agreement</h4>
                <p className="mb-2">
                  By becoming a driver on Safe Ride, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Provide safe and reliable transportation</li>
                  <li>Maintain your vehicle in good condition</li>
                  <li>Keep all required documents valid</li>
                  <li>Follow all traffic laws and regulations</li>
                  <li>Be punctual and professional</li>
                  <li>Complete background verification</li>
                </ul>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the terms and conditions
                </Label>
              </div>
              
              <Button 
                onClick={handleComplete}
                disabled={!acceptedTerms || loading}
                className="w-full" 
                variant="hero"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <MobileLayout 
      title="Profile Setup" 
      showBack={step !== 'name'} 
      onBack={() => {
        if (step === 'terms') setStep('name');
      }}
    >
      <div className="p-4">
        {/* Progress indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            {['name', 'terms'].map((s, index, arr) => {
              const currentIndex = arr.indexOf(step);
              const isActive = step === s;
              const isCompleted = currentIndex > index;
              return (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full ${isActive ? 'bg-primary' : isCompleted ? 'bg-primary/50' : 'bg-muted'}`}
                />
              );
            })}
          </div>
        </div>
        
        {renderStep()}
      </div>
    </MobileLayout>
  );
};

export default ProfileSetup;