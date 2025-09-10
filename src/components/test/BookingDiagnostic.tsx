import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookingService } from '@/services/bookingService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/contexts/AuthContext';

interface DriverDiagnostic {
  driver: UserProfile;
  issues: string[];
  status: 'available' | 'filtered_out';
  details: {
    role: string;
    status: string;
    bookingOpen: boolean | undefined;
    hasVehicle: boolean;
    vehicleCapacity: number | string | undefined;
    hasRoutes: boolean;
    availability?: any;
  };
}

const BookingDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState<DriverDiagnostic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [childLocation, setChildLocation] = useState({
    pickup: { lat: 6.9271, lng: 79.8612 }, // Default Colombo location
    school: { lat: 6.9319, lng: 79.8478 }
  });

  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    setError(null);
    setDebugLog([]);
    addDebugLog('🔗 Testing database connection...');
    
    try {
      // Test basic database access
      const testRef = collection(db, 'drivers');
      addDebugLog('✅ Database reference created');
      
      const snapshot = await getDocs(testRef);
      addDebugLog(`✅ Database query successful - found ${snapshot.size} documents`);
      
      if (snapshot.empty) {
        addDebugLog('ℹ️ No drivers found in database');
        setError('No drivers found in database. Create some driver accounts first.');
      } else {
        addDebugLog('✅ Database connection working properly');
        // Proceed with full diagnostic
        await runDiagnostic();
        return;
      }
    } catch (error: any) {
      addDebugLog(`❌ Database connection failed: ${error.message}`);
      setError(`Database connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
    setLoading(true);
    setError(null);
    setDebugLog([]);
    addDebugLog('🔍 Starting booking diagnostic...');
    
    try {
      addDebugLog('📊 Querying drivers collection...');
      
      // Get ALL drivers from database (not filtered)
      const driversRef = collection(db, 'drivers');
      const allDriversSnapshot = await getDocs(driversRef);
      
      addDebugLog(`📊 Found ${allDriversSnapshot.size} total drivers in database`);

      if (allDriversSnapshot.empty) {
        addDebugLog('❌ No drivers found in database!');
        setError('No drivers found in the database. You need to create driver accounts first.');
        return;
      }

      const allDrivers = allDriversSnapshot.docs.map(doc => {
        const data = doc.data();
        addDebugLog(`👤 Processing driver: ${data.firstName || 'Unknown'} ${data.lastName || ''} (${doc.id})`);
        return {
          ...data,
          uid: doc.id,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
        };
      }) as UserProfile[];

      addDebugLog(`✅ Processed ${allDrivers.length} driver records`);

      const diagnosticsResults: DriverDiagnostic[] = [];

      for (const driver of allDrivers) {
        addDebugLog(`🔍 Analyzing driver: ${driver.firstName} ${driver.lastName}`);
        const issues: string[] = [];
        let status: 'available' | 'filtered_out' = 'available';

        // Check role
        addDebugLog(`  Role check: ${driver.role}`);
        if (driver.role !== 'driver') {
          issues.push(`Role is '${driver.role}', not 'driver'`);
          status = 'filtered_out';
        }

        // Check approval status
        addDebugLog(`  Status check: ${driver.status}`);
        if (driver.status !== 'approved') {
          issues.push(`Status is '${driver.status}', not 'approved'`);
          status = 'filtered_out';
        }

        // Check booking open status
        addDebugLog(`  Booking status: ${driver.bookingOpen}`);
        if (driver.bookingOpen === false) {
          issues.push('Booking is closed');
          status = 'filtered_out';
        }

        // Check vehicle capacity
        const hasVehicle = !!(driver.vehicle?.capacity);
        addDebugLog(`  Vehicle check: ${hasVehicle ? `${driver.vehicle.capacity} capacity` : 'no vehicle'}`);
        let availability = null;
        if (hasVehicle) {
          try {
            availability = await BookingService.getDriverAvailability(driver.uid);
            addDebugLog(`  Availability: ${availability.availableSeats}/${availability.totalSeats} seats`);
            if (availability.availableSeats <= 0) {
              issues.push(`No available seats (${availability.availableSeats}/${availability.totalSeats})`);
              status = 'filtered_out';
            }
          } catch (error) {
            addDebugLog(`  Availability error: ${error}`);
            issues.push('Error checking availability');
            status = 'filtered_out';
          }
        } else {
          issues.push('No vehicle capacity set');
        }

        // Check routes
        const hasRoutes = !!(driver.routes?.startPoint && driver.routes?.endPoint);
        addDebugLog(`  Routes check: ${hasRoutes ? 'configured' : 'not configured'}`);
        if (hasRoutes && childLocation) {
          try {
            const routeCompatible = BookingService.isRouteCompatible(
              childLocation,
              { startPoint: driver.routes.startPoint, endPoint: driver.routes.endPoint }
            );
            addDebugLog(`  Route compatibility: ${routeCompatible}`);
            if (!routeCompatible) {
              issues.push('Route not compatible with test location');
              status = 'filtered_out';
            }
          } catch (error) {
            addDebugLog(`  Route compatibility error: ${error}`);
            issues.push('Error checking route compatibility');
            status = 'filtered_out';
          }
        } else if (!hasRoutes) {
          issues.push('No routes configured');
        }

        if (issues.length === 0) {
          issues.push('No issues found - should be available');
        }

        diagnosticsResults.push({
          driver,
          issues,
          status,
          details: {
            role: driver.role || 'not set',
            status: driver.status || 'not set',
            bookingOpen: driver.bookingOpen,
            hasVehicle,
            vehicleCapacity: driver.vehicle?.capacity,
            hasRoutes,
            availability
          }
        });
      }

      setDiagnostics(diagnosticsResults);
      
      const availableCount = diagnosticsResults.filter(d => d.status === 'available').length;
      addDebugLog(`✅ Diagnostic complete: ${availableCount}/${diagnosticsResults.length} drivers available`);
      
    } catch (error: any) {
      addDebugLog(`❌ Diagnostic failed: ${error.message}`);
      setError(`Diagnostic failed: ${error.message}`);
      console.error('❌ Diagnostic failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'filtered_out': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const availableDrivers = diagnostics.filter(d => d.status === 'available');
  const filteredOutDrivers = diagnostics.filter(d => d.status === 'filtered_out');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Booking System Diagnostic</CardTitle>
          <p className="text-sm text-gray-600">
            Debug why "No drivers match your filters" appears
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostic}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Running Diagnostic...' : 'Run Diagnostic'}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-red-800 mb-2">🚨 Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Debug Log */}
          {debugLog.length > 0 && (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-800 mb-2">🔍 Debug Log</h4>
                <div className="max-h-40 overflow-y-auto text-xs bg-gray-50 p-2 rounded">
                  {debugLog.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {diagnostics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <Card className="border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{diagnostics.length}</div>
                  <div className="text-sm text-blue-700">Total Drivers</div>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{availableDrivers.length}</div>
                  <div className="text-sm text-green-700">Available</div>
                </CardContent>
              </Card>
              <Card className="border-red-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{filteredOutDrivers.length}</div>
                  <div className="text-sm text-red-700">Filtered Out</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results */}
          {diagnostics.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Driver Analysis:</h3>
              
              {diagnostics.map((diagnostic, index) => (
                <Card key={index} className={`border ${diagnostic.status === 'available' ? 'border-green-200' : 'border-red-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">
                          {diagnostic.driver.firstName} {diagnostic.driver.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{diagnostic.driver.email}</p>
                      </div>
                      <Badge className={getStatusColor(diagnostic.status)}>
                        {diagnostic.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                      <div>
                        <span className="font-medium">Role:</span> {diagnostic.details.role}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {diagnostic.details.status}
                      </div>
                      <div>
                        <span className="font-medium">Booking:</span> {
                          diagnostic.details.bookingOpen === undefined ? 'not set' : 
                          diagnostic.details.bookingOpen ? 'open' : 'closed'
                        }
                      </div>
                      <div>
                        <span className="font-medium">Vehicle:</span> {
                          diagnostic.details.hasVehicle ? `${diagnostic.details.vehicleCapacity} seats` : 'not set'
                        }
                      </div>
                    </div>

                    {diagnostic.details.availability && (
                      <div className="text-xs mb-3 p-2 bg-gray-50 rounded">
                        <span className="font-medium">Availability:</span> {diagnostic.details.availability.availableSeats}/{diagnostic.details.availability.totalSeats} seats available
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      {diagnostic.issues.map((issue, issueIndex) => (
                        <div key={issueIndex} className={`text-xs p-2 rounded ${
                          diagnostic.status === 'available' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {diagnostic.status === 'available' ? '✅' : '❌'} {issue}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {diagnostics.length > 0 && availableDrivers.length === 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-red-800 mb-2">🚨 No Available Drivers Found</h4>
                <p className="text-sm text-red-700">
                  This explains why you see "No drivers match your filters". 
                  Check the issues above to see what needs to be fixed for each driver.
                </p>
              </CardContent>
            </Card>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default BookingDiagnostic;
