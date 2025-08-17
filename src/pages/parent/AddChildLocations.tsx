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
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';

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
  const [apiKey, setApiKey] = useState<string>(GOOGLE_MAPS_API_KEY);

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
  }, [navigate]);

  const handleBack = () => {
    navigate('/parent/add-child');
  };

  const handleRouteSet = (start: MapPoint, end: MapPoint) => {
    setStartPoint(start);
    setEndPoint(end);
    handleSaveChild(start, end);
  };

  const handleStartPointSet = (point: MapPoint) => {
    console.log('Parent received start point:', point);
    setStartPoint(point);
  };

  const handleEndPointSet = (point: MapPoint) => {
    console.log('Parent received end point:', point);
    setEndPoint(point);
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

  return (
    <MobileLayout
      title="Set Child Locations"
      showBack={true}
      onBack={handleBack}
      theme="parent"
    >
      <div className="p-6 space-y-8">
        {/* Map Component */}
        <Card className="shadow-xl rounded-3xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <CardTitle className="font-bold text-lg">
                Interactive Route Map
              </CardTitle>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              Click or search to set pickup and school locations
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4">
              <GoogleMap
                onRouteSet={handleRouteSet}
                onStartPointSet={handleStartPointSet}
                onEndPointSet={handleEndPointSet}
                initialStart={startPoint || undefined}
                initialEnd={endPoint || undefined}
                apiKey={apiKey}
              />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Instructions */}
        <Card className="shadow-xl rounded-3xl border-0 bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 text-lg mb-2">How to Set Locations</h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p><span className="font-semibold">Search:</span> Use the search bar to find specific addresses in Sri Lanka</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p><span className="font-semibold">Click:</span> Tap directly on the map to set pickup and school locations</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p><span className="font-semibold">Auto-save:</span> Route will be confirmed and saved automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default AddChildLocations;