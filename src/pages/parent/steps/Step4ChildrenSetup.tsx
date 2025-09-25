import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Plus, Minus, AlertTriangle, School, User, MapPin } from 'lucide-react';
import { useOnboarding } from '@/contexts/ParentOnboardingContext';
import LocationPicker from '@/components/LocationPicker';

interface MapPoint {
  lat: number;
  lng: number;
  address: string;
}

const Step4ChildrenSetup: React.FC = () => {
  const { data, updateData, nextStep } = useOnboarding();
  const [error, setError] = useState('');
  const [activeChildMap, setActiveChildMap] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (data.numberOfChildren < 1) {
      setError('You must have at least one child');
      return;
    }

    for (let i = 0; i < data.numberOfChildren; i++) {
      const child = data.children[i];
      if (!child?.firstName?.trim()) {
        setError(`Please enter first name for child ${i + 1}`);
        return;
      }
      if (!child?.lastName?.trim()) {
        setError(`Please enter last name for child ${i + 1}`);
        return;
      }
      if (!child?.schoolLocation) {
        setError(`Please set school location for ${child.firstName} ${child.lastName}`);
        return;
      }
    }

    nextStep();
  };

  const updateNumberOfChildren = (num: number) => {
    const newNum = Math.max(1, Math.min(10, num));
    updateData({ numberOfChildren: newNum });
    
    // Adjust children array
    const currentChildren = [...data.children];
    if (newNum > currentChildren.length) {
      // Add new children
      for (let i = currentChildren.length; i < newNum; i++) {
        currentChildren.push({
          id: `child-${i + 1}`,
          firstName: '',
          lastName: '',
          schoolLocation: null,
          age: undefined,
          grade: ''
        });
      }
    } else {
      // Remove excess children
      currentChildren.splice(newNum);
    }
    
    updateData({ children: currentChildren });
  };

  const updateChild = (index: number, updates: Partial<typeof data.children[0]>) => {
    console.log(`🔥🔥 updateChild called for index ${index} with updates:`, updates);
    console.log(`🔥🔥 Current data.children length:`, data.children.length);
    console.log(`🔥🔥 Current data.children:`, data.children.map((c, i) => ({ index: i, name: `${c.firstName} ${c.lastName}`.trim(), schoolLocation: c.schoolLocation?.address || 'None' })));
    
    // Get a fresh copy of children from current data state
    const currentChildren = [...data.children];
    
    // Ensure the child exists and update it
    if (index < currentChildren.length) {
      currentChildren[index] = { ...currentChildren[index], ...updates };
      console.log(`🔥🔥 Updated child ${index}:`, currentChildren[index]);
      console.log(`🔥🔥 Final children array:`, currentChildren.map((c, i) => ({ index: i, schoolLocation: c.schoolLocation?.address || 'None' })));
      
      // Update the context with the new children array
      updateData({ children: currentChildren });
      
      // Check the data after a short delay to see if it persisted
      setTimeout(() => {
        console.log(`🔥🔥 POST-UPDATE CHECK - Context children:`, data.children.map((c, i) => ({ index: i, schoolLocation: c.schoolLocation?.address || 'None' })));
      }, 200);
    } else {
      console.error(`🔥🔥 ERROR: Trying to update child at index ${index} but only ${currentChildren.length} children exist`);
    }
  };

  const handleSchoolLocationSet = (index: number, location: MapPoint) => {
    console.log(`🔥🔥🔥 CALLBACK FIRED - Setting school location for child ${index}:`, location);
    console.log(`🔥🔥🔥 Current children array length:`, data.children.length);
    console.log(`🔥🔥🔥 Target child before update:`, data.children[index]);
    
    updateChild(index, { schoolLocation: location });
    
    console.log(`🔥🔥🔥 Called updateChild with location:`, location);
  };

  // Monitor children data changes
  React.useEffect(() => {
    console.log(`🔥 CONTEXT CHANGED - Children data:`, data.children.map((c, i) => ({ 
      index: i, 
      name: `${c.firstName} ${c.lastName}`.trim(), 
      schoolLocation: c.schoolLocation?.address || 'None' 
    })));
  }, [data.children]);

  // Initialize children array if needed
  React.useEffect(() => {
    if (data.children.length < data.numberOfChildren) {
      updateNumberOfChildren(data.numberOfChildren);
    }
  }, [data.numberOfChildren, data.children.length]);

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Children Information</h2>
        <p className="text-gray-600">
          Tell us about your children so we can provide the best transportation service
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Number of Children */}
        <div className="space-y-4">
          <Label className="text-gray-700 font-medium">How many children do you have?</Label>
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => updateNumberOfChildren(data.numberOfChildren - 1)}
              disabled={data.numberOfChildren <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-lg font-semibold">{data.numberOfChildren}</span>
              <span className="text-gray-500">child{data.numberOfChildren !== 1 ? 'ren' : ''}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => updateNumberOfChildren(data.numberOfChildren + 1)}
              disabled={data.numberOfChildren >= 10}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500">You can add up to 10 children</p>
        </div>

        {/* Children Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Children Details</h3>
          
          {Array.from({ length: data.numberOfChildren }).map((_, index) => {
            const child = data.children[index] || {
              id: `child-${index + 1}`,
              firstName: '',
              lastName: '',
              schoolLocation: null,
              age: undefined,
              grade: ''
            };

            return (
              <Card key={index} className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900">Child {index + 1}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`firstName-${index}`}>First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id={`firstName-${index}`}
                          placeholder="Child's first name"
                          value={child.firstName}
                          onChange={(e) => updateChild(index, { firstName: e.target.value })}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`lastName-${index}`}>Last Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id={`lastName-${index}`}
                          placeholder="Child's last name"
                          value={child.lastName}
                          onChange={(e) => updateChild(index, { lastName: e.target.value })}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`age-${index}`}>Age (Optional)</Label>
                      <Input
                        id={`age-${index}`}
                        type="number"
                        placeholder="Age"
                        min="3"
                        max="18"
                        value={child.age || ''}
                        onChange={(e) => updateChild(index, { age: e.target.value ? parseInt(e.target.value) : undefined })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`grade-${index}`}>Grade (Optional)</Label>
                      <Select
                        value={child.grade || ''}
                        onValueChange={(value) => updateChild(index, { grade: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nursery">Nursery</SelectItem>
                          <SelectItem value="lkg">LKG</SelectItem>
                          <SelectItem value="ukg">UKG</SelectItem>
                          <SelectItem value="grade-1">Grade 1</SelectItem>
                          <SelectItem value="grade-2">Grade 2</SelectItem>
                          <SelectItem value="grade-3">Grade 3</SelectItem>
                          <SelectItem value="grade-4">Grade 4</SelectItem>
                          <SelectItem value="grade-5">Grade 5</SelectItem>
                          <SelectItem value="grade-6">Grade 6</SelectItem>
                          <SelectItem value="grade-7">Grade 7</SelectItem>
                          <SelectItem value="grade-8">Grade 8</SelectItem>
                          <SelectItem value="grade-9">Grade 9</SelectItem>
                          <SelectItem value="grade-10">Grade 10</SelectItem>
                          <SelectItem value="grade-11">Grade 11</SelectItem>
                          <SelectItem value="grade-12">Grade 12</SelectItem>
                          <SelectItem value="grade-13">Grade 13</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* School Location */}
                  <div className="space-y-2">
                    <Label>School Location *</Label>
                    
                    {/* Debug Display */}
                    <div className="p-2 bg-gray-100 border border-gray-300 rounded text-xs">
                      <strong>Debug - Saved Location:</strong> {child.schoolLocation?.address || 'None'}
                      <br />
                      <button 
                        type="button"
                        onClick={() => {
                          console.log('🔥 TEST BUTTON CLICKED for child', index);
                          handleSchoolLocationSet(index, {
                            lat: 6.9271 + (index * 0.001),
                            lng: 79.8612 + (index * 0.001),
                            address: `Test School ${index + 1}, Colombo`
                          });
                        }}
                        className="mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded"
                      >
                        TEST: Set Dummy Location
                      </button>
                    </div>

                    {child.schoolLocation ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2">
                            <School className="w-4 h-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-900">School Selected:</p>
                              <p className="text-sm text-green-700">{child.schoolLocation.address}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveChildMap(activeChildMap === index ? null : index)}
                          >
                            {activeChildMap === index ? 'Cancel' : 'Change'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 border-dashed"
                        onClick={() => setActiveChildMap(activeChildMap === index ? null : index)}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        {activeChildMap === index ? 'Click on map to select school' : 'Set School Location'}
                      </Button>
                    )}

                    {activeChildMap === index && (
                      <div className="mt-4" key={`location-picker-${index}-${child.id || index}`}>
                        <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                          <h4 className="font-medium text-blue-900 mb-2">
                            Setting location for: {child.firstName || 'Child'} {child.lastName || `${index + 1}`}
                          </h4>
                          <LocationPicker
                            key={`child-location-${index}-${activeChildMap}-${Math.random()}`}
                            id={`child-${index}-school-location-${Date.now()}`}
                            onLocationSet={(location) => handleSchoolLocationSet(index, location)}
                            initialLocation={null} // Force fresh start
                            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}
                            placeholder={`Search for ${child.firstName || 'this child'}'s school location...`}
                          />
                          <div className="mt-3 flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setActiveChildMap(null)}
                              className="px-4 py-2"
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <School className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-blue-900">About School Locations</h3>
              <p className="text-sm text-blue-700 mt-1">
                Setting accurate school locations helps us match you with the best drivers and calculate 
                precise pickup times. You can always update these later in your profile.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
          >
            Continue to Review
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Step4ChildrenSetup;