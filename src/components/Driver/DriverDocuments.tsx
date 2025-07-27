import { Button } from "@/components/ui/button";
import { MobileContainer } from "@/components/Layout/MobileContainer";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Camera, FileText, CreditCard, Shield, MessageCircle, CheckCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface DocumentUpload {
  id: string;
  name: string;
  icon: any;
  uploaded: boolean;
  url?: string;
  requiresCamera?: boolean;
}

export const DriverDocuments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { id: "nic", name: "National ID (NIC)", icon: FileText, uploaded: false },
    { id: "insurance", name: "Vehicle Insurance", icon: Shield, uploaded: false },
    { id: "license", name: "Vehicle License", icon: CreditCard, uploaded: false },
    { id: "profile", name: "Profile Picture", icon: Camera, uploaded: false, requiresCamera: true }
  ]);
  
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (documentId: string, file: File) => {
    if (!user) return;
    
    setUploading(true);
    try {
      const storageRef = ref(storage, `drivers/${user.uid}/${documentId}_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, uploaded: true, url: downloadURL }
            : doc
        )
      );
      
      if (user.phoneNumber) {
        const driverRef = doc(db, 'drivers', user.phoneNumber);
        await updateDoc(driverRef, {
          [`${documentId}Document`]: downloadURL,
          updatedAt: new Date()
        });
      }
      
      toast({
        title: "Document Uploaded",
        description: `${documents.find(d => d.id === documentId)?.name} uploaded successfully!`
      });
      
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setCurrentUpload(null);
    }
  };

  const triggerFileInput = (documentId: string, requiresCamera = false) => {
    setCurrentUpload(documentId);
    if (requiresCamera) {
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUpload) {
      handleFileUpload(currentUpload, file);
    }
  };

  const connectWhatsApp = () => {
    setWhatsappConnected(true);
    toast({
      title: "WhatsApp Connected",
      description: "You'll receive notifications via WhatsApp"
    });
  };

  const handleContinue = () => {
    navigate("/driver/approval-status");
  };

  return (
    <MobileContainer>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Upload Documents</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Document Verification</h2>
            <p className="text-muted-foreground">Upload required documents for admin review</p>
          </div>

          <div className="space-y-4">
            {documents.map((document) => {
              const IconComponent = document.icon;
              return (
                <Card key={document.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          document.uploaded 
                            ? 'bg-primary/20' 
                            : 'bg-muted/50'
                        }`}>
                          {document.uploaded ? (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          ) : (
                            <IconComponent className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{document.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {document.uploaded ? "Uploaded" : "Required"}
                          </p>
                        </div>
                      </div>
                      
                      {!document.uploaded && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => triggerFileInput(document.id, document.requiresCamera)}
                          disabled={uploading && currentUpload === document.id}
                        >
                          {uploading && currentUpload === document.id ? (
                            "Uploading..."
                          ) : document.requiresCamera ? (
                            <Camera className="w-4 h-4" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* WhatsApp Connection */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    whatsappConnected 
                      ? 'bg-primary/20' 
                      : 'bg-muted/50'
                  }`}>
                    {whatsappConnected ? (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">WhatsApp Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      {whatsappConnected ? "Connected" : "Optional"}
                    </p>
                  </div>
                </div>
                
                {!whatsappConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={connectWhatsApp}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
            <p className="text-sm text-center">
              <strong>Note:</strong> All documents will be reviewed by our admin team. 
              This process may take 24-48 hours.
            </p>
          </div>

          <Button 
            className="w-full h-12 text-lg font-semibold rounded-xl"
            onClick={handleContinue}
          >
            Submit for Review
          </Button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        className="hidden"
      />
    </MobileContainer>
  );
};
