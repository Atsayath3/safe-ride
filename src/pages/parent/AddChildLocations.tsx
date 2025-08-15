import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import MobileLayout from '@/components/mobile/MobileLayout';
import GoogleMap from '@/components/GoogleMap';
import GoogleMapsKeyInput from '@/components/GoogleMapsKeyInput';

interface ChildFormData {
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  schoolName: string;
  studentId: string;
}

interface MapPoint {
  lat: number;
  lng: number;
  address: string;
}

const AddChildLocations = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [childData, setChildData] = useState<ChildFormData | null>(null);
  const [startPoint, setStartPoint] = useState<MapPoint | null>(null);
  const [endPoint, setEndPoint] = useState<MapPoint | null>(null);
  const [currentStep, setCurrentStep] = useState<'pickup' | 'school'>('pickup');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    // Get child data from session storage
    const storedData = sessionStorage.getItem('childFormData');
    if (!storedData) {
      navigate('/parent/add-child');
      return;
    }
    
    try {
      const parsedData = JSON.parse(storedData);
      setChildData(parsedData);
    } catch (error) {
      navigate('/parent/add-child');
    }

    // Get API key from localStorage
    const savedApiKey = localStorage.getItem('googleMapsApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, [navigate]);

  const handleBack = () => {
    navigate('/parent/add-child');
  };

  const handleRouteSet = (start: MapPoint, end: MapPoint) => {
    setStartPoint(start);
    setEndPoint(end);
    handleSaveChild(start, end);
  };

  const handleSaveChild = async (pickupPoint: MapPoint, schoolPoint: MapPoint) => {
    if (!childData || !currentUser) return;
    setIsLoading(true);
    try {
      // Save child data to Firestore under 'children' collection with parentId
      const completeChildData = {
        ...childData,
        pickupLocation: pickupPoint,
        schoolLocation: schoolPoint,
        parentId: currentUser.uid,
        createdAt: new Date(),
      };
      const childDocRef = await addDoc(collection(db, 'children'), completeChildData);
      // Check if parent doc exists
      const parentDocRef = doc(db, 'parents', currentUser.uid);
      const parentSnap = await getDoc(parentDocRef);
      if (parentSnap.exists()) {
        await updateDoc(parentDocRef, { children: arrayUnion(childDocRef.id) });
      } else {
        console.error('Parent document does not exist for UID:', currentUser.uid);
      }
      // Clear session storage
      sessionStorage.removeItem('childFormData');
      toast({
        title: 'Success!',
        description: 'Child has been added successfully.',
      });
      navigate('/parent/dashboard');
    } catch (error: any) {
      console.error('Failed to save child:', error);
      toast({
        title: 'Error',
        description: `Failed to save child. ${error.message || ''}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!childData) {
    return null;
  }

  if (!apiKey) {
    return (
      <MobileLayout
        title="Setup Google Maps"
        showBack={true}
        onBack={handleBack}
      >
        <div className="p-4">
          <GoogleMapsKeyInput onKeySet={setApiKey} />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title="Set Child Locations"
      showBack={true}
      onBack={handleBack}
    >
      <div className="p-4 space-y-6">
        {/* Child Info Summary */}
        <Card className="shadow-lg rounded-2xl border border-blue-100 bg-white">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
            <CardTitle className="font-nunito text-lg text-center text-blue-900">
              Setting pickup and school locations for {childData.fullName}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Map Component */}
        <Card className="shadow-lg rounded-2xl border border-blue-200 bg-white">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
            <CardTitle className="font-nunito text-lg text-blue-900">
              Set Route on Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GoogleMap
              onRouteSet={handleRouteSet}
              initialStart={startPoint || undefined}
              initialEnd={endPoint || undefined}
              apiKey={apiKey}
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="shadow-lg rounded-2xl border border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">
              <strong>Instructions:</strong> Use the map above to set both pickup and school locations. 
              You can search for locations or click directly on the map. Once both points are set, 
              the route will be automatically confirmed and saved.
            </p>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default AddChildLocations;