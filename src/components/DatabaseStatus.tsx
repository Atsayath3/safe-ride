import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Database, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { clearAllCollections } from '@/utils/databaseCleanup';
import { printCleanupInstructions, getFirebaseConsoleUrls } from '@/utils/authCleanup';
import { toast } from '@/hooks/use-toast';

const DatabaseStatus = () => {
  const [status, setStatus] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const collections = ['drivers', 'parents', 'admins', 'users', 'children', 'bookings', 'rides', 'driver location', 'driverLocations', 'driverLocation'];
      const newStatus: Record<string, number> = {};

      for (const collectionName of collections) {
        try {
          const snapshot = await getDocs(query(collection(db, collectionName), limit(1000)));
          newStatus[collectionName] = snapshot.size;
        } catch (error) {
          console.log(`Collection ${collectionName} doesn't exist or is empty`);
          newStatus[collectionName] = 0;
        }
      }

      setStatus(newStatus);
      console.log('📊 Database Status:', newStatus);
    } catch (error) {
      console.error('Error checking database status:', error);
      toast({
        title: "Error",
        description: "Failed to check database status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('⚠️ This will delete ALL user data! Are you sure?')) {
      return;
    }

    setCleaning(true);
    try {
      await clearAllCollections();
      toast({
        title: "Database Cleaned",
        description: "All collections have been cleared successfully"
      });
      
      // Print auth cleanup instructions
      printCleanupInstructions();
      
      // Refresh status after cleanup
      await checkStatus();
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to clean database. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setCleaning(false);
    }
  };

  const handleOpenFirebaseConsole = () => {
    const urls = getFirebaseConsoleUrls();
    window.open(urls.authentication, '_blank');
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const totalDocs = Object.values(status).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Management</h1>
          <p className="text-gray-600">Development tools for managing Firebase collections</p>
        </div>

        {/* Warning Card */}
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Development Environment Only</h3>
                <p className="text-sm text-red-700">
                  This tool permanently deletes all user data. Use only in development!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="mb-6 shadow-lg border-gray-200">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Database className="h-6 w-6 text-blue-600" />
              Database Status
              <Badge variant={totalDocs > 0 ? "default" : "secondary"} className="ml-auto">
                {totalDocs} total documents
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Summary */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Current Database Contents:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                {Object.entries(status).map(([collection, count]) => (
                  <div key={collection}>
                    • <strong>{collection}:</strong> {count} {count === 1 ? 'document' : 'documents'}
                  </div>
                ))}
              </div>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(status).map(([collection, count]) => (
                <div key={collection} className="flex justify-between items-center p-4 bg-white border rounded-lg shadow-sm">
                  <span className="font-semibold text-gray-900 capitalize text-lg">{collection}</span>
                  <Badge variant={count > 0 ? "default" : "outline"} className="text-sm px-3 py-1">
                    {count} docs
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={checkStatus} 
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Checking...' : 'Refresh Status'}
            </Button>

            <Button 
              onClick={handleCleanup}
              disabled={cleaning || totalDocs === 0}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className={`h-4 w-4 ${cleaning ? 'animate-pulse' : ''}`} />
              {cleaning ? 'Cleaning...' : 'Clean All Collections'}
            </Button>
          </div>

          {/* Firebase Auth Cleanup Section */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <h3 className="font-semibold text-yellow-900">
                  Step 2: Clean Firebase Authentication Users
                </h3>
                <p className="text-sm text-yellow-800">
                  After cleaning the database, you must also delete Firebase Auth users manually
                </p>
                <Button 
                  onClick={handleOpenFirebaseConsole}
                  variant="outline"
                  className="flex items-center gap-2 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Firebase Console
                </Button>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p><strong>Instructions:</strong></p>
                  <p>1. Click button above → Go to Authentication → Users</p>
                  <p>2. Select all users → Click delete button</p>
                  <p>3. Confirm deletion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {totalDocs === 0 && (
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              <span className="text-sm font-medium">✅ Database is clean and ready for fresh users!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseStatus;
