import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { createTestUsers, loginAsTestUser } from '@/utils/createTestUsers';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const StorageRulesTester = () => {
  const { currentUser, logout } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testUsers = [
    { email: 'driver1@test.com', role: 'driver' },
    { email: 'driver2@test.com', role: 'driver' },
    { email: 'parent1@test.com', role: 'parent' }
  ];

  const createTestFile = () => {
    // Create a small test file
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText('TEST', 35, 55);
    }
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
    });
  };

  const testStorageUpload = async (userId: string, targetUserId: string, fileName: string) => {
    try {
      const testFile = await createTestFile();
      const uploadPath = `driver-documents/${targetUserId}/${fileName}`;
      const storageRef = ref(storage, uploadPath);
      
      await uploadBytes(storageRef, testFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      return {
        success: true,
        path: uploadPath,
        url: downloadURL
      };
    } catch (error: any) {
      return {
        success: false,
        path: `driver-documents/${targetUserId}/${fileName}`,
        error: error.code || error.message
      };
    }
  };

  const runMultiUserTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: any[] = [];

    try {
      // First create test users
      await createTestUsers();

      for (const testUser of testUsers) {
        console.log(`\n🧪 Testing as: ${testUser.email}`);
        
        // Login as test user
        await loginAsTestUser(testUser.email);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for auth state

        // Test 1: Upload to own folder (should succeed)
        const ownTest = await testStorageUpload(
          testUser.email,
          testUser.email.replace('@test.com', '').replace('.', ''),
          `own-document-${Date.now()}.jpg`
        );
        results.push({
          user: testUser.email,
          testType: 'Own Folder',
          expected: 'ALLOW',
          ...ownTest
        });

        // Test 2: Upload to another user's folder (should fail)
        const otherUserTarget = testUsers.find(u => u.email !== testUser.email);
        if (otherUserTarget) {
          const otherTest = await testStorageUpload(
            testUser.email,
            otherUserTarget.email.replace('@test.com', '').replace('.', ''),
            `unauthorized-document-${Date.now()}.jpg`
          );
          results.push({
            user: testUser.email,
            testType: 'Other User Folder',
            expected: 'DENY',
            ...otherTest
          });
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTestResults(results);
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Firebase Storage Rules Multi-User Tester</CardTitle>
          <p className="text-sm text-gray-600">
            Test storage rules with multiple users to ensure security
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex gap-2">
            <Button 
              onClick={runMultiUserTest}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? 'Running Tests...' : 'Run Multi-User Test'}
            </Button>
            
            <Button 
              onClick={() => createTestUsers()}
              variant="outline"
            >
              Create Test Users Only
            </Button>
          </div>

          {currentUser && (
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-sm">
                <strong>Current User:</strong> {currentUser.email} 
                <Badge className="ml-2">{currentUser.uid}</Badge>
              </p>
            </div>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Test Results:</h3>
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded border ${
                    result.success 
                      ? (result.expected === 'ALLOW' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')
                      : (result.expected === 'DENY' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <strong>{result.user}</strong> → {result.testType}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={result.expected === 'ALLOW' ? 'default' : 'destructive'}>
                        Expected: {result.expected}
                      </Badge>
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        Result: {result.success ? 'ALLOW' : 'DENY'}
                      </Badge>
                      <Badge variant={
                        (result.success && result.expected === 'ALLOW') || 
                        (!result.success && result.expected === 'DENY') 
                          ? 'default' : 'destructive'
                      }>
                        {(result.success && result.expected === 'ALLOW') || 
                         (!result.success && result.expected === 'DENY') 
                          ? '✅ CORRECT' : '❌ WRONG'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Path: {result.path}
                  </div>
                  {result.error && (
                    <div className="text-sm text-red-600 mt-1">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Test Users:</strong></p>
            {testUsers.map(user => (
              <p key={user.email}>• {user.email} ({user.role})</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageRulesTester;
