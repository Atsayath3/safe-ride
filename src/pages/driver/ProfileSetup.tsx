import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    lastName: '',
    username: '',
    gender: '' as 'male' | 'female' | 'other' | ''
  });
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);


  const handleNameNext = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.username.trim() || !formData.gender) {
      toast({
        title: "Error",
        description: "Please enter your first name, last name, username, and select your gender",
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
      const profileData = {
        ...formData,
        gender: formData.gender as 'male' | 'female' | 'other',
        email: currentUser?.email ?? '',
        role: 'driver' as const,
        status: 'pending' as const
      };
      await updateUserProfile(profileData);
      
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
          <Card className="border-orange-200 shadow-lg bg-white">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
              <CardTitle className="text-center text-orange-900">Your Name</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-orange-800">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-orange-800">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-orange-800">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="border-orange-200 focus:border-orange-400"
                />
                <p className="text-xs text-orange-600">Choose a unique username for your account</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-orange-800">Gender</Label>
                <Select value={formData.gender} onValueChange={(value: 'male' | 'female' | 'other') => 
                  setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger className="border-orange-200 focus:border-orange-400">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleNameNext} className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-md">
                Continue
              </Button>
            </CardContent>
          </Card>
        );

      case 'terms':
        return (
          <Card className="border-orange-200 shadow-lg bg-white">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
              <CardTitle className="text-center text-orange-900">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-48 overflow-y-auto bg-orange-50 p-4 rounded-md text-sm border border-orange-200">
                <h4 className="font-semibold mb-2 text-orange-900">Driver Agreement</h4>
                <p className="mb-2 text-orange-800">
                  By becoming a driver on Safe Ride, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-orange-700">
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
                  className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                />
                <Label htmlFor="terms" className="text-sm text-orange-800">
                  I agree to the terms and conditions
                </Label>
              </div>
              
              <Button 
                onClick={handleComplete}
                disabled={!acceptedTerms || loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-md disabled:bg-orange-300" 
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
      theme="driver"
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