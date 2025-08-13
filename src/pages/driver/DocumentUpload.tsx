import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import MobileLayout from '@/components/mobile/MobileLayout';
import { Camera, Upload, CheckCircle } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const DocumentUpload = () => {
  const { documentType } = useParams<{ documentType: string }>();
  const navigate = useNavigate();
  const { updateUserProfile, userProfile, currentUser } = useAuth();
  
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const documentLabels: Record<string, string> = {
    nic: 'National ID Card',
    insurance: 'Vehicle Insurance',
    license: 'Vehicle License',
    profile: 'Profile Picture'
  };

  const isProfilePicture = documentType === 'profile';

  const uploadToStorage = async (dataUrl: string): Promise<string> => {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `${documentType}_${timestamp}.jpg`;
    const storageRef = ref(storage, `documents/${currentUser?.uid}/${fileName}`);
    
    // Upload the file
    await uploadBytes(storageRef, blob);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const takePicture = async () => {
    try {
      setUploading(true);
      
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera // Force camera usage
      });

      if (image.dataUrl) {
        setUploadedFile(image.dataUrl);
        
        toast({
          title: "Success",
          description: "Photo captured successfully"
        });
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
      
      await updateUserProfile({
        documents: {
          ...userProfile?.documents,
          [fieldName]: downloadURL
        }
      });
      
      toast({
        title: "Success",
        description: "Document uploaded and saved successfully"
      });
      
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
    >
      <div className="p-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-center">
              Upload {documentLabels[documentType!]}
            </CardTitle>
            {isProfilePicture && (
              <p className="text-sm text-muted-foreground text-center">
                Profile pictures must be taken live using the camera
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFile ? (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={uploadedFile} 
                    alt="Uploaded document" 
                    className="w-full h-48 object-cover rounded-lg border border-border"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setUploadedFile(null)}
                    className="flex-1"
                  >
                    Retake
                  </Button>
                  <Button 
                    variant="hero" 
                    onClick={handleComplete}
                    className="flex-1"
                  >
                    Complete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button 
                  onClick={takePicture}
                  disabled={uploading}
                  className="w-full h-16" 
                  variant="hero"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  {uploading ? 'Taking Photo...' : 'Take Photo'}
                </Button>
                
                {!isProfilePicture && (
                  <Button 
                    onClick={uploadFromGallery}
                    disabled={uploading}
                    variant="outline"
                    className="w-full h-16"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Upload from Gallery
                  </Button>
                )}
                
                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>• Make sure the document is clearly visible</p>
                  <p>• Ensure good lighting</p>
                  <p>• Avoid glare and shadows</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default DocumentUpload;