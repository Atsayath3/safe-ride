import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookingService } from '@/services/bookingService';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const BookingFlowDebugger = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [testChild, setTestChild] = useState({
    id: 'test-child-123',
    fullName: 'Test Child',
    tripStartLocation: { lat: 6.9271, lng: 79.8612, address: 'Colombo Fort' },
    schoolLocation: { lat: 6.9319, lng: 79.8478, address: 'University of Colombo' }
  });

  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFullBookingFlow = async () => {
    setLoading(true);
    setDebugLog([]);
    
    try {
      addLog('🧪 Testing complete booking flow...');
      
      // Step 1: Test user authentication
      addLog('\n1️⃣ Testing authentication...');
      if (!currentUser) {
        addLog('❌ No authenticated user found');
        return;
      }
      addLog(`✅ User authenticated: ${currentUser.email}`);
      
      // Step 2: Test children query
      addLog('\n2️⃣ Testing children data...');
      const childrenRef = collection(db, 'children');
      const childrenQuery = query(childrenRef, where('parentId', '==', currentUser.uid));
      const childrenSnapshot = await getDocs(childrenQuery);
      addLog(`📊 Found ${childrenSnapshot.size} children for parent`);
      
      if (childrenSnapshot.empty) {
        addLog('⚠️ No children found - this might be the issue');
        addLog('💡 Create a child first before trying to book');
      }
      
      // Step 3: Test driver availability service
      addLog('\n3️⃣ Testing driver availability service...');
      const childLocation = {
        pickup: testChild.tripStartLocation,
        school: testChild.schoolLocation
      };
      
      let availableDrivers: any[] = [];
      try {
        availableDrivers = await BookingService.getAvailableDrivers(childLocation);
        addLog(`✅ BookingService.getAvailableDrivers returned ${availableDrivers.length} drivers`);
        
        if (availableDrivers.length === 0) {
          addLog('❌ No drivers returned from BookingService');
          
          // Test without location filter
          addLog('🔄 Testing without location filter...');
          const driversWithoutLocation = await BookingService.getAvailableDrivers();
          addLog(`📊 Without location filter: ${driversWithoutLocation.length} drivers`);
        } else {
          // Test each driver's availability
          for (const driver of availableDrivers) {
            addLog(`\n🚗 Testing driver: ${driver.firstName} ${driver.lastName}`);
            try {
              const availability = await BookingService.getDriverAvailability(driver.uid);
              addLog(`  📊 Availability: ${availability.availableSeats}/${availability.totalSeats} seats`);
              addLog(`  📍 Status: ${driver.status}`);
              addLog(`  🔓 Booking Open: ${driver.bookingOpen}`);
              addLog(`  🚐 Vehicle: ${driver.vehicle?.type || 'not set'} (${driver.vehicle?.capacity || 'no capacity'} seats)`);
              addLog(`  🗺️ Routes: ${driver.routes?.startPoint ? 'configured' : 'not configured'}`);
            } catch (availError: any) {
              addLog(`  ❌ Error getting availability: ${availError.message}`);
            }
          }
        }
      } catch (driverError: any) {
        addLog(`❌ Error in getAvailableDrivers: ${driverError.message}`);
      }
      
      // Step 4: Test direct driver query
      addLog('\n4️⃣ Testing direct driver database query...');
      const driversRef = collection(db, 'drivers');
      const approvedDriversQuery = query(
        driversRef, 
        where('role', '==', 'driver'),
        where('status', '==', 'approved')
      );
      const approvedSnapshot = await getDocs(approvedDriversQuery);
      addLog(`📊 Direct query found ${approvedSnapshot.size} approved drivers`);
      
      approvedSnapshot.docs.forEach(doc => {
        const driver = doc.data();
        addLog(`  👤 ${driver.firstName} ${driver.lastName}: status=${driver.status}, bookingOpen=${driver.bookingOpen}`);
      });
      
      // Step 5: Test booking creation (dry run)
      addLog('\n5️⃣ Testing booking creation logic...');
      if (availableDrivers && availableDrivers.length > 0) {
        const testDriver = availableDrivers[0];
        addLog(`🧪 Would create booking with driver: ${testDriver.firstName}`);
        
        const testBookingRequest = {
          parentId: currentUser.uid,
          driverId: testDriver.uid,
          childId: testChild.id,
          pickupLocation: testChild.tripStartLocation,
          dropoffLocation: testChild.schoolLocation,
          rideDate: new Date(),
          notes: 'Test booking'
        };
        
        addLog(`📋 Test booking request prepared: ${JSON.stringify(testBookingRequest, null, 2)}`);
        addLog(`💡 All components ready for booking creation`);
      } else {
        addLog(`❌ Cannot test booking creation - no available drivers`);
      }
      
      addLog('\n🎯 Booking flow test complete!');
      
    } catch (error: any) {
      addLog(`❌ Test failed: ${error.message}`);
      console.error('Booking flow test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testQuickDriverFix = async () => {
    setLoading(true);
    setDebugLog([]);
    
    try {
      addLog('🔧 Running quick driver fix...');
      
      const driversRef = collection(db, 'drivers');
      const allDriversSnapshot = await getDocs(driversRef);
      
      addLog(`Found ${allDriversSnapshot.size} drivers to check`);
      
      if (allDriversSnapshot.empty) {
        addLog('❌ No drivers found in database at all!');
        addLog('💡 You need to create driver accounts first');
        return;
      }
      
      const issues = [];
      allDriversSnapshot.docs.forEach(doc => {
        const driver = doc.data();
        const driverIssues = [];
        
        if (driver.role !== 'driver') driverIssues.push(`role: ${driver.role}`);
        if (driver.status !== 'approved') driverIssues.push(`status: ${driver.status}`);
        if (driver.bookingOpen === false) driverIssues.push('booking closed');
        if (!driver.vehicle?.capacity) driverIssues.push('no vehicle capacity');
        if (!driver.routes?.startPoint) driverIssues.push('no routes');
        
        if (driverIssues.length > 0) {
          issues.push(`${driver.firstName}: ${driverIssues.join(', ')}`);
        }
        
        addLog(`👤 ${driver.firstName}: ${driverIssues.length === 0 ? '✅ OK' : '❌ ' + driverIssues.join(', ')}`);
      });
      
      if (issues.length === 0) {
        addLog('✅ All drivers are properly configured!');
      } else {
        addLog(`\n🔧 Issues found with ${issues.length} drivers:`);
        issues.forEach(issue => addLog(`  - ${issue}`));
        addLog('\n💡 Use the Quick Driver Fixer tool to automatically fix these issues');
      }
      
    } catch (error: any) {
      addLog(`❌ Driver check failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Booking Flow Debugger</CardTitle>
          <p className="text-sm text-gray-600">
            Comprehensive debugging tool to identify booking issues
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex gap-2">
            <Button 
              onClick={testFullBookingFlow}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Testing...' : '🧪 Test Full Booking Flow'}
            </Button>
            
            <Button 
              onClick={testQuickDriverFix}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Checking...' : '🔧 Check Driver Issues'}
            </Button>
          </div>

          {/* Current User Info */}
          {currentUser && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-blue-900">Current User</h4>
                    <p className="text-sm text-blue-700">{currentUser.email}</p>
                    <p className="text-xs text-blue-600">UID: {currentUser.uid}</p>
                  </div>
                  <Badge className="bg-blue-600 text-white">Authenticated</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Child Info */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-green-900">Test Child Location</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Pickup:</strong> {testChild.tripStartLocation.address}</p>
                <p><strong>School:</strong> {testChild.schoolLocation.address}</p>
                <p className="text-xs">Lat/Lng: {testChild.tripStartLocation.lat}, {testChild.tripStartLocation.lng}</p>
              </div>
            </CardContent>
          </Card>

          {/* Debug Log */}
          {debugLog.length > 0 && (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-800 mb-2">Debug Log:</h4>
                <div className="max-h-96 overflow-y-auto text-xs bg-gray-50 p-3 rounded space-y-1 font-mono">
                  {debugLog.map((log, index) => (
                    <div key={index} className={
                      log.includes('❌') ? 'text-red-600' :
                      log.includes('✅') ? 'text-green-600' :
                      log.includes('⚠️') ? 'text-yellow-600' :
                      log.includes('💡') ? 'text-blue-600' :
                      log.includes('🧪') || log.includes('🔧') ? 'text-purple-600' :
                      'text-gray-700'
                    }>
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-yellow-800 mb-2">What this tool checks:</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>✅ User authentication status</p>
                <p>✅ Children data availability</p>
                <p>✅ Driver availability service</p>
                <p>✅ Direct database queries</p>
                <p>✅ Booking creation readiness</p>
                <p>✅ Driver configuration issues</p>
              </div>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  );
};

export default BookingFlowDebugger;
