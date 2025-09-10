import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

const QuickDriverFixer = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const fixAllDrivers = async () => {
    setLoading(true);
    setResults([]);
    const logs: string[] = [];

    try {
      logs.push('🔍 Finding all drivers...');
      
      // Get all drivers
      const driversRef = collection(db, 'drivers');
      const snapshot = await getDocs(driversRef);
      
      logs.push(`Found ${snapshot.size} drivers`);
      setResults([...logs]);

      if (snapshot.empty) {
        logs.push('❌ No drivers found in database');
        setResults([...logs]);
        return;
      }

      // Fix each driver
      for (const driverDoc of snapshot.docs) {
        const driver = driverDoc.data();
        const driverId = driverDoc.id;
        
        logs.push(`\n🔧 Fixing driver: ${driver.firstName} ${driver.lastName} (${driver.email})`);
        setResults([...logs]);

        const updates: any = {};

        // 1. Approve driver if not approved
        if (driver.status !== 'approved') {
          updates.status = 'approved';
          logs.push(`  ✅ Setting status to 'approved' (was: ${driver.status})`);
        }

        // 2. Set role to 'driver' if not set
        if (driver.role !== 'driver') {
          updates.role = 'driver';
          logs.push(`  ✅ Setting role to 'driver' (was: ${driver.role})`);
        }

        // 3. Open booking if closed
        if (driver.bookingOpen === false) {
          updates.bookingOpen = true;
          logs.push(`  ✅ Opening bookings (was closed)`);
        } else if (driver.bookingOpen === undefined) {
          updates.bookingOpen = true;
          logs.push(`  ✅ Setting bookingOpen to true (was not set)`);
        }

        // 4. Add vehicle if missing
        if (!driver.vehicle || !driver.vehicle.capacity) {
          updates.vehicle = {
            type: 'van',
            model: 'Test Vehicle',
            year: '2020',
            plateNumber: 'TEST-123',
            capacity: '7',
            ...driver.vehicle // Keep existing vehicle data if any
          };
          logs.push(`  ✅ Adding vehicle with 7-seat capacity`);
        }

        // 5. Add routes if missing
        if (!driver.routes || !driver.routes.startPoint || !driver.routes.endPoint) {
          updates.routes = {
            startPoint: {
              lat: 6.9271,
              lng: 79.8612,
              address: 'Colombo Fort Railway Station, Colombo'
            },
            endPoint: {
              lat: 6.9319,
              lng: 79.8478,
              address: 'University of Colombo, Colombo'
            },
            ...driver.routes // Keep existing routes if any
          };
          logs.push(`  ✅ Adding default route (Colombo Fort → University of Colombo)`);
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'drivers', driverId), {
            ...updates,
            updatedAt: new Date()
          });
          logs.push(`  🎉 Driver ${driver.firstName} fixed and ready for booking!`);
        } else {
          logs.push(`  ✅ Driver ${driver.firstName} already configured correctly`);
        }

        setResults([...logs]);
      }

      logs.push(`\n🎉 All drivers fixed! Try booking a ride now.`);
      setResults([...logs]);

      toast({
        title: "Success!",
        description: `Fixed ${snapshot.size} drivers - they should now be available for booking`,
      });

    } catch (error: any) {
      logs.push(`❌ Error: ${error.message}`);
      setResults([...logs]);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Quick Driver Fixer</CardTitle>
          <p className="text-sm text-gray-600">
            Automatically fix all driver issues to make them available for booking
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <Button 
            onClick={fixAllDrivers}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? 'Fixing Drivers...' : '🔧 Fix All Drivers'}
          </Button>

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            <p><strong>This tool will:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>✅ Approve all pending drivers</li>
              <li>✅ Set role to 'driver'</li>
              <li>✅ Open bookings for all drivers</li>
              <li>✅ Add default vehicle (7-seat van) if missing</li>
              <li>✅ Add default route (Colombo area) if missing</li>
            </ul>
          </div>

          {/* Results Log */}
          {results.length > 0 && (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-800 mb-2">Fix Log:</h4>
                <div className="max-h-96 overflow-y-auto text-xs bg-gray-50 p-3 rounded space-y-1 font-mono">
                  {results.map((log, index) => (
                    <div key={index} className={
                      log.includes('❌') ? 'text-red-600' :
                      log.includes('🎉') ? 'text-green-600 font-bold' :
                      log.includes('✅') ? 'text-green-600' :
                      'text-gray-700'
                    }>
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default QuickDriverFixer;
