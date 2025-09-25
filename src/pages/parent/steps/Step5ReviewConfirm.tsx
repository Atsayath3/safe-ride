import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  AlertTriangle, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Users,
  Shield,
  FileText,
  Home,
  GraduationCap
} from 'lucide-react';
import { useOnboarding } from '@/contexts/ParentOnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const Step5ReviewConfirm: React.FC = () => {
  const { data, resetOnboarding } = useOnboarding();
  const { signup } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!data.email || !data.password) {
      setError('Missing authentication credentials. Please go back to Step 1.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Step 1: Create Firebase Auth account and get the user
      const user = await signup(data.email, data.password, 'parent');

      // Step 2: Create complete parent profile
      const parentProfile: any = {
        uid: user.uid,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        nicNumber: data.nicNumber,
        homeLocation: data.homeLocation,
        numberOfChildren: data.numberOfChildren,
        role: 'parent',
        profileComplete: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Remove any undefined fields to prevent Firestore errors
      Object.keys(parentProfile).forEach(key => {
        if (parentProfile[key] === undefined) {
          delete parentProfile[key];
        }
      });

      await setDoc(doc(db, 'parents', user.uid), parentProfile);

      // Step 3: Create children profiles
      for (const child of data.children) {
        const childName = `${child.firstName} ${child.lastName}`.trim();
        const childId = `${user.uid}_${childName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        
        const childProfile: any = {
          firstName: child.firstName,
          lastName: child.lastName,
          age: child.age,
          grade: child.grade,
          schoolLocation: child.schoolLocation,
          parentId: user.uid,
          parentName: `${data.firstName} ${data.lastName}`.trim(),
          parentPhone: data.phoneNumber,
          homeLocation: data.homeLocation,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        };

        // Remove any undefined fields
        Object.keys(childProfile).forEach(key => {
          if (childProfile[key] === undefined) {
            delete childProfile[key];
          }
        });
        
        await setDoc(doc(db, 'children', childId), childProfile);
      }

      setSuccess(true);
      setTimeout(() => {
        resetOnboarding();
        window.location.href = '/parent/dashboard';
      }, 2000);

    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SafeWeb!</h2>
        <p className="text-gray-600 mb-4">
          Your profile has been created successfully! Redirecting to your dashboard...
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent mr-2"></div>
          <span className="text-green-700">Setting up your account...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Information</h2>
        <p className="text-gray-600">
          Please review all details before creating your SafeWeb account
        </p>
      </div>

      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{data.email}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Full Name</div>
                  <div className="font-medium">{data.firstName} {data.lastName}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Phone Number</div>
                  <div className="font-medium">{data.phoneNumber}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">NIC Number</div>
                  <div className="font-medium">{data.nicNumber}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Home Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Home className="w-5 h-5 text-blue-600" />
              <span>Home Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-red-500 mt-1" />
              <div>
                <div className="font-medium">{data.homeLocation?.address}</div>
                <div className="text-sm text-gray-500">
                  Coordinates: {data.homeLocation?.lat.toFixed(6)}, {data.homeLocation?.lng.toFixed(6)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Children Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Children ({data.numberOfChildren})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.children.map((child, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{child.firstName} {child.lastName}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Age: {child.age}</span>
                        <span>Grade: {child.grade}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">Child {index + 1}</Badge>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <GraduationCap className="w-4 h-4 text-purple-500 mt-1" />
                    <div>
                      <div className="font-medium">School Location</div>
                      <div className="text-sm text-gray-600">{child.schoolLocation?.address || 'Not set'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Terms & Privacy</h3>
              <p className="text-sm text-blue-700 mt-1">
                By creating your account, you agree to our Terms of Service and Privacy Policy. 
                Your information is encrypted and stored securely. You can update your profile 
                anytime from your account settings.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Creating Your Account...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5" />
                <span>Create My SafeWeb Account</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step5ReviewConfirm;