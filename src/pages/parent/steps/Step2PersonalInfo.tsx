import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Phone, CreditCard, AlertTriangle } from 'lucide-react';
import { useOnboarding } from '@/contexts/ParentOnboardingContext';

const Step2PersonalInfo: React.FC = () => {
  const { data, updateData, nextStep } = useOnboarding();
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!data.firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    if (!data.lastName.trim()) {
      setError('Please enter your last name');
      return;
    }
    if (!data.phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }
    if (!data.nicNumber.trim()) {
      setError('Please enter your NIC number');
      return;
    }

    // Phone number validation (Sri Lankan format)
    const phoneRegex = /^(?:\+94|0)?[1-9]\d{8}$/;
    if (!phoneRegex.test(data.phoneNumber.replace(/\s/g, ''))) {
      setError('Please enter a valid Sri Lankan phone number');
      return;
    }

    // NIC validation (basic format check)
    const nicRegex = /^(?:\d{9}[vVxX]|\d{12})$/;
    if (!nicRegex.test(data.nicNumber)) {
      setError('Please enter a valid NIC number (9 digits + V/X or 12 digits)');
      return;
    }

    nextStep();
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX XXX XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    updateData({ phoneNumber: formatted });
  };

  const handleNicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    updateData({ nicNumber: value });
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">
          Help us get to know you better with some basic information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="firstName"
                type="text"
                placeholder="Enter your first name"
                value={data.firstName}
                onChange={(e) => updateData({ firstName: e.target.value })}
                className="pl-10 h-12 border-gray-300 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="lastName"
                type="text"
                placeholder="Enter your last name"
                value={data.lastName}
                onChange={(e) => updateData({ lastName: e.target.value })}
                className="pl-10 h-12 border-gray-300 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-gray-700 font-medium">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="077 123 4567"
              value={data.phoneNumber}
              onChange={handlePhoneChange}
              className="pl-10 h-12 border-gray-300 focus:border-blue-500"
              maxLength={12}
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            This will be used for important ride updates and notifications
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nicNumber" className="text-gray-700 font-medium">NIC Number</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="nicNumber"
              type="text"
              placeholder="123456789V or 200012345678"
              value={data.nicNumber}
              onChange={handleNicChange}
              className="pl-10 h-12 border-gray-300 focus:border-blue-500"
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            For security and verification purposes. Your information is kept secure.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Why do we need this information?</h3>
              <p className="text-sm text-blue-700 mt-1">
                Your personal details help us verify your identity and ensure the safety of all users. 
                Phone number is used for ride notifications, and NIC helps with security verification.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
          >
            Continue to Home Location
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Step2PersonalInfo;