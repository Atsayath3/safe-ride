import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/contexts/AuthContext';

const BookingDiagnosticSimple = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    setDebugLog([]);
    setResults([]);
    
    try {
      addLog('🔍 Starting diagnostic...');
      
      // Test database connection
      addLog('📊 Querying drivers collection...');
      const driversRef = collection(db, 'drivers');
      const snapshot = await getDocs(driversRef);
      
      addLog(`Found ${snapshot.size} drivers in database`);
      
      if (snapshot.empty) {
        setError('No drivers found in database. You need to create driver accounts first.');
        return;
      }

      const drivers = snapshot.docs.map(doc => {
        const data = doc.data();
        addLog(`Processing driver: ${data.firstName || 'Unknown'} (${doc.id})`);
        return {
          id: doc.id,
          ...data
        } as any;  // Use any type for simplicity in diagnostic
      });

      // Analyze each driver
      const analysis = drivers.map(driver => {
        const issues = [];
        
        // Check basic requirements
        if (driver.role !== 'driver') {
          issues.push(`Role: ${driver.role} (should be 'driver')`);
        }
        
        if (driver.status !== 'approved') {
          issues.push(`Status: ${driver.status} (should be 'approved')`);
        }
        
        if (driver.bookingOpen === false) {
          issues.push('Booking is closed');
        }
        
        if (!driver.vehicle?.capacity) {
          issues.push('No vehicle capacity set');
        }
        
        if (!driver.routes?.startPoint || !driver.routes?.endPoint) {
          issues.push('No routes configured');
        }

        return {
          driver,
          issues,
          isAvailable: issues.length === 0
        };
      });

      setResults(analysis);
      addLog(`Analysis complete: ${analysis.filter(a => a.isAvailable).length}/${analysis.length} drivers available`);
      
    } catch (error: any) {
      const errorMsg = `Diagnostic failed: ${error.message}`;
      addLog(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const availableCount = results.filter(r => r.isAvailable).length;
  const totalCount = results.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Simple Booking Diagnostic</CardTitle>
          <p className="text-sm text-gray-600">
            Debug why no drivers are available for booking
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <Button 
            onClick={runDiagnostic}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Running...' : 'Check Drivers'}
          </Button>

          {/* Error */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {results.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
                  <div className="text-sm text-blue-700">Total Drivers</div>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{availableCount}</div>
                  <div className="text-sm text-green-700">Available</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Driver Analysis:</h3>
              {results.map((result, index) => (
                <Card key={index} className={`border ${result.isAvailable ? 'border-green-200' : 'border-red-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">
                          {result.driver.firstName} {result.driver.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{result.driver.email}</p>
                      </div>
                      <Badge className={result.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {result.isAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div><span className="font-medium">Role:</span> {result.driver.role || 'not set'}</div>
                      <div><span className="font-medium">Status:</span> {result.driver.status || 'not set'}</div>
                      <div><span className="font-medium">Booking:</span> {
                        result.driver.bookingOpen === undefined ? 'not set' : 
                        result.driver.bookingOpen ? 'open' : 'closed'
                      }</div>
                      <div><span className="font-medium">Vehicle:</span> {
                        result.driver.vehicle?.capacity ? `${result.driver.vehicle.capacity} seats` : 'not set'
                      }</div>
                    </div>

                    {result.issues.length > 0 && (
                      <div className="space-y-1">
                        {result.issues.map((issue, issueIndex) => (
                          <div key={issueIndex} className="text-xs p-2 bg-red-50 text-red-700 rounded">
                            ❌ {issue}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {result.isAvailable && (
                      <div className="text-xs p-2 bg-green-50 text-green-700 rounded">
                        ✅ This driver should be available for booking
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Debug Log */}
          {debugLog.length > 0 && (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-800 mb-2">Debug Log</h4>
                <div className="max-h-32 overflow-y-auto text-xs bg-gray-50 p-2 rounded space-y-1">
                  {debugLog.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Available Drivers Warning */}
          {results.length > 0 && availableCount === 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-red-800 mb-2">🚨 No Available Drivers</h4>
                <p className="text-sm text-red-700 mb-2">
                  This is why you see "No drivers match your filters". Fix the issues above to make drivers available.
                </p>
                <div className="text-xs text-red-600">
                  <p><strong>Quick fixes:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Go to Admin Dashboard → Approve pending drivers</li>
                    <li>Ensure drivers complete vehicle setup (capacity, type)</li>
                    <li>Ensure drivers set up their routes (start/end points)</li>
                    <li>Check if drivers have closed their booking manually</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default BookingDiagnosticSimple;
