import { Button } from "@/components/ui/button";
import { MobileContainer } from "@/components/Layout/MobileContainer";
import { Clock, CheckCircle, XCircle, MapPin, Route } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export const DriverApprovalStatus = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!user?.phoneNumber) return;

    const driverRef = doc(db, 'drivers', user.phoneNumber);
    const unsubscribe = onSnapshot(driverRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setApprovalStatus(data.approvalStatus || 'pending');
        setRejectionReason(data.rejectionReason || '');
      }
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusConfig = () => {
    switch (approvalStatus) {
      case 'approved':
        return {
          icon: CheckCircle,
          title: 'Account Approved!',
          subtitle: 'You can now start accepting rides',
          color: 'text-primary',
          bgColor: 'bg-primary/20'
        };
      case 'rejected':
        return {
          icon: XCircle,
          title: 'Documents Rejected',
          subtitle: rejectionReason || 'Please contact admin for details',
          color: 'text-destructive',
          bgColor: 'bg-destructive/20'
        };
      default:
        return {
          icon: Clock,
          title: 'Under Review',
          subtitle: 'Your documents are being verified',
          color: 'text-secondary',
          bgColor: 'bg-secondary/20'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <MobileContainer>
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-full ${statusConfig.bgColor} flex items-center justify-center mx-auto mb-6`}>
              <StatusIcon className={`w-12 h-12 ${statusConfig.color}`} />
            </div>
            <h1 className="text-3xl font-bold mb-2">{statusConfig.title}</h1>
            <p className="text-muted-foreground">{statusConfig.subtitle}</p>
          </div>

          {approvalStatus === 'pending' && (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                While you wait, you can explore the app and set your route preferences.
              </p>
              <Button 
                variant="outline" 
                className="w-full mb-3"
                onClick={() => navigate('/driver/set-route')}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Set Your Route
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/driver/explore')}
              >
                <Route className="w-4 h-4 mr-2" />
                Explore App
              </Button>
            </div>
          )}

          {approvalStatus === 'approved' && (
            <Button 
              className="w-full h-12 text-lg font-semibold rounded-xl"
              onClick={() => navigate('/driver/dashboard')}
            >
              Go to Dashboard
            </Button>
          )}

          {approvalStatus === 'rejected' && (
            <div className="space-y-3">
              <Button 
                className="w-full h-12 text-lg font-semibold rounded-xl"
                onClick={() => navigate('/driver/documents')}
              >
                Re-upload Documents
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate('/contact-admin')}
              >
                Contact Admin
              </Button>
            </div>
          )}
        </div>
      </div>
    </MobileContainer>
  );
};