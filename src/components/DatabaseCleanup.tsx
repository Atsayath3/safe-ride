import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { clearAllCollections, clearSpecificCollection } from '@/utils/databaseCleanup';
import { toast } from '@/hooks/use-toast';

const DatabaseCleanup = () => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleClearAll = async () => {
    if (confirmText !== 'DELETE ALL') {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE ALL' to confirm",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await clearAllCollections();
      toast({
        title: "Database Cleared",
        description: "All user collections have been deleted successfully"
      });
      setConfirmText('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCollection = async (collectionName: string) => {
    setLoading(true);
    try {
      await clearSpecificCollection(collectionName);
      toast({
        title: "Collection Cleared",
        description: `${collectionName} collection has been deleted`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to clear ${collectionName}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Cleanup Tools</h1>
          <p className="text-gray-600">Development environment only</p>
        </div>

        {/* Warning Alert */}
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>WARNING:</strong> These actions will permanently delete data from your Firebase database. 
            This tool is only available in development mode and should never be used in production.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clear All Collections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Clear All User Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                This will delete all documents from:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                <li>drivers collection</li>
                <li>parents collection</li>
                <li>admins collection</li>
                <li>users collection (if exists)</li>
              </ul>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Type "DELETE ALL" to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Type DELETE ALL"
                />
              </div>
              
              <Button
                onClick={handleClearAll}
                disabled={loading || confirmText !== 'DELETE ALL'}
                variant="destructive"
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Collections
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Clear Individual Collections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Clear Individual Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Clear specific collections individually:
              </p>
              
              {['drivers', 'parents', 'admins', 'children', 'bookings'].map((collection) => (
                <Button
                  key={collection}
                  onClick={() => handleClearCollection(collection)}
                  disabled={loading}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear {collection} collection
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>After Cleanup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <p><strong>Step 1:</strong> Clear Firebase Authentication users manually in Firebase Console</p>
              <p><strong>Step 2:</strong> Use the cleanup tools above to clear Firestore collections</p>
              <p><strong>Step 3:</strong> Create fresh accounts using the signup forms:</p>
              <ul className="list-disc list-inside ml-4">
                <li>Go to <code>/parent/login</code> and click "Sign Up" for parent accounts</li>
                <li>Go to <code>/driver/login</code> and click "Sign Up" for driver accounts</li>
                <li>Go to <code>/admin/login</code> for admin login (create admin manually)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseCleanup;
