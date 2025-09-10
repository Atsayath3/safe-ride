import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';
import { toast } from '@/hooks/use-toast';
import MobileLayout from '@/components/mobile/MobileLayout';
import { Camera, Upload, CheckCircle, AlertCircle, FileText, Image } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const DocumentUpload = () => {
  const { documentType } = useParams<{ documentType: string }>();
  const navigate = useNavigate();
  const { updateUserProfile, userProfile, currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  // Test Firebase Storage connection
  const testStorageConnection = async () => {
    try {
      console.log('🧪 Testing Firebase Storage connection...');
      console.log('🔥 Storage instance:', storage);
      console.log('🔗 Storage app:', storage.app);
      console.log('📁 Storage bucket:', storage.app.options.storageBucket);
      
      // Test creating a reference
      const testRef = ref(storage, 'test/connection.txt');
      console.log('✅ Storage reference created successfully:', testRef);
      console.log('📍 Full path:', testRef.fullPath);
      console.log('🪣 Bucket:', testRef.bucket);
      
      // Log the expected path for rules
      if (currentUser?.uid) {
        const expectedPath = `driver-documents/${currentUser.uid}/test-document.jpg`;
        const expectedRef = ref(storage, expectedPath);
        console.log('📋 Expected upload path for rules:', expectedPath);
        console.log('📋 Expected ref:', expectedRef.fullPath);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Storage connection test failed:', error);
      return false;
    }
  };

  // Test storage connection on component mount
  useEffect(() => {
    testStorageConnection();
  }, []);

  const documentLabels: Record<string, string> = {
    nic: 'National ID Card',
    insurance: 'Vehicle Insurance Document',
    license: 'Vehicle License Document',
    profile: 'Profile Picture'
  };

  const documentDescriptions: Record<string, string> = {
    nic: 'Take a clear photo of your National ID Card (both front and back if required)',
    insurance: 'Upload your vehicle insurance certificate or policy document',
    license: 'Upload your vehicle registration/license document',
    profile: 'Take a clear selfie for your profile picture'
  };

  const isProfilePicture = documentType === 'profile';

  const uploadToStorage = async (dataUrl: string): Promise<string> => {
    try {
      console.log('🔄 Starting upload process...');
      console.log('📁 Current user UID:', currentUser?.uid);
      console.log('📄 Document type:', documentType);
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      console.log('📦 Blob created, size:', blob.size, 'type:', blob.type);
      
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `${documentType}_${timestamp}.jpg`;
      const uploadPath = `driver-documents/${currentUser?.uid}/${fileName}`;
      console.log('📍 Upload path:', uploadPath);
      
      const storageRef = ref(storage, uploadPath);
      console.log('🔗 Storage ref created');
      
      // Upload the file
      console.log('⬆️ Starting upload...');
      await uploadBytes(storageRef, blob);
      console.log('✅ Upload successful!');
      
      // Get the download URL
      console.log('🔗 Getting download URL...');
      const downloadURL = await getDownloadURL(storageRef);
      console.log('✅ Download URL obtained:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('❌ Upload error details:', error);
      console.error('Error code:', (error as any)?.code);
      console.error('Error message:', (error as any)?.message);
      console.error('Error stack:', (error as any)?.stack);
      throw error;
    }
  };

  const takePicture = async () => {
    try {
      setUploading(true);
      
      // Try Capacitor Camera first (for mobile apps)
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });

        if (image.dataUrl) {
          setUploadedFile(image.dataUrl);
          toast({
            title: "Success",
            description: "Photo captured successfully"
          });
          return;
        }
      } catch (capacitorError) {
        // Fallback to HTML5 camera for web browsers
        console.log('Capacitor camera not available, falling back to web camera');
        await useWebCamera();
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to capture image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const useWebCamera = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: isProfilePicture ? 'user' : 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      // Create video element and canvas for capture
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      
      video.srcObject = stream;
      await video.play();
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Capture frame
      context.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      
      setUploadedFile(dataUrl);
      toast({
        title: "Success",
        description: "Photo captured successfully"
      });
      
    } catch (error: any) {
      // If camera access fails, fall back to file input
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const uploadFromGallery = async () => {
    if (isProfilePicture) {
      toast({
        title: "Camera Required",
        description: "Profile pictures must be taken with the camera",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      // Try Capacitor first for mobile
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos
        });

        if (image.dataUrl) {
          setUploadedFile(image.dataUrl);
          toast({
            title: "Success",
            description: "Photo selected successfully"
          });
          return;
        }
      } catch (capacitorError) {
        // Fallback to file input for web
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedFile(e.target?.result as string);
        toast({
          title: "Success",
          description: "File selected successfully"
        });
      };
      reader.readAsDataURL(file);
    }
    setUploading(false);
  };

  const handleComplete = async () => {
    if (!uploadedFile) {
      toast({
        title: "Error",
        description: "Please upload a document first",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      // Upload to Firebase Storage and get download URL
      const downloadURL = await uploadToStorage(uploadedFile);
      
      // Map document type to correct field name
      const documentFieldMap: Record<string, string> = {
        nic: 'nic',
        insurance: 'vehicleInsurance', 
        license: 'vehicleLicense',
        profile: 'profilePicture'
      };
      
      const fieldName = documentFieldMap[documentType!];
      
      const updatedDocuments = {
        ...userProfile?.documents,
        [fieldName]: downloadURL
      };
      
      await updateUserProfile({
        documents: updatedDocuments
      });
      
      // Check if all required documents are now uploaded
      const requiredDocuments = ['nic', 'vehicleInsurance', 'vehicleLicense', 'profilePicture'];
      const allDocumentsUploaded = requiredDocuments.every(doc => updatedDocuments[doc]);
      
      if (allDocumentsUploaded && userProfile && !userProfile.profileComplete) {
        try {
          // Mark profile as complete and notify admins
          await updateUserProfile({ profileComplete: true });
          
          // Send notification to all admins about driver verification
          await notificationService.sendDriverVerificationNotification(
            userProfile.uid,
            `${userProfile.firstName} ${userProfile.lastName}` || 'New Driver',
            userProfile.email || 'No email provided'
          );
          
          toast({
            title: "Registration Complete! 🎉",
            description: "All documents uploaded successfully. Admins have been notified for verification."
          });
        } catch (notificationError) {
          console.error('Failed to send admin notification:', notificationError);
          // Don't fail the whole process if notification fails
          toast({
            title: "Documents Uploaded",
            description: "Document uploaded successfully. Profile completed!"
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Document uploaded and saved successfully"
        });
      }
      
      navigate('/driver/welcome');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <MobileLayout 
      title={documentLabels[documentType!] || 'Upload Document'} 
      showBack={true} 
      onBack={() => navigate('/driver/welcome')}
      theme="driver"
    >
      <div className="p-6 space-y-6">
        {/* Header Card */}
        <Card className="border-orange-300 shadow-xl bg-white">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-xl">
            <div className="flex items-center justify-center mb-3">
              {isProfilePicture ? (
                <Camera className="h-8 w-8 text-white" />
              ) : (
                <FileText className="h-8 w-8 text-white" />
              )}
            </div>
            <CardTitle className="text-xl font-bold text-center">
              Upload {documentLabels[documentType!]}
            </CardTitle>
            <p className="text-sm text-orange-100 text-center mt-2">
              {documentDescriptions[documentType!]}
            </p>
          </CardHeader>
          
          {/* Requirements */}
          <CardContent className="p-6 bg-orange-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-orange-900 mb-2">Requirements:</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Clear, high-quality image</li>
                  <li>• All text must be readable</li>
                  <li>• Good lighting, no shadows</li>
                  <li>• Document should fill most of the frame</li>
                  {isProfilePicture && <li>• Must be a live photo (no existing images)</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Content */}
        <Card className="border-orange-300 shadow-xl bg-white">
          <CardContent className="p-6">
            {uploadedFile ? (
              <div className="space-y-6">
                {/* Preview */}
                <div className="relative bg-gray-50 rounded-xl p-4">
                  <img 
                    src={uploadedFile} 
                    alt="Uploaded document" 
                    className="w-full h-64 object-contain rounded-lg border-2 border-orange-200"
                  />
                  <div className="absolute top-6 right-6 bg-green-500 rounded-full p-2 shadow-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                {/* Status */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Document Ready</p>
                      <p className="text-sm text-green-700">Your document has been captured and is ready to upload</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setUploadedFile(null)}
                    className="border-2 border-orange-400 text-orange-800 hover:bg-orange-100 font-semibold py-3"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Retake
                  </Button>
                  <Button 
                    onClick={handleComplete}
                    disabled={uploading}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 shadow-lg"
                  >
                    {uploading ? 'Uploading...' : 'Complete Upload'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Camera Button */}
                <Button 
                  onClick={takePicture}
                  disabled={uploading}
                  className="w-full h-20 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold text-lg rounded-xl shadow-xl disabled:opacity-50 transition-all"
                >
                  <Camera className="mr-3 h-6 w-6" />
                  {uploading ? 'Opening Camera...' : 'Take Photo with Camera'}
                </Button>
                
                {/* Gallery Button (for non-profile documents) */}
                {!isProfilePicture && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">OR</span>
                    </div>
                  </div>
                )}
                
                {!isProfilePicture && (
                  <Button 
                    onClick={uploadFromGallery}
                    disabled={uploading}
                    variant="outline"
                    className="w-full h-16 border-2 border-orange-400 text-orange-800 hover:bg-orange-100 font-semibold rounded-xl disabled:opacity-50"
                  >
                    <Image className="mr-3 h-5 w-5" />
                    {uploading ? 'Selecting...' : 'Choose from Gallery'}
                  </Button>
                )}
                
                {/* Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-blue-900 mb-2">Photography Tips:</p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Hold your device steady</li>
                        <li>• Ensure adequate lighting</li>
                        <li>• Avoid reflections and glare</li>
                        <li>• Fill the frame with the document</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Hidden file input for fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture={isProfilePicture ? "user" : "environment"}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
    </MobileLayout>
  );
};

export default DocumentUpload;