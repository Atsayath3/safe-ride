import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileContainer } from "@/components/Layout/MobileContainer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  LogOut,
  Eye,
  FileText,
  Download
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

interface Driver {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  city: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  licenseNumber: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  nicDocument?: string;
  insuranceDocument?: string;
  licenseDocument?: string;
  profileDocument?: string;
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    // Check admin authentication
    const adminAuth = localStorage.getItem("adminAuth");
    if (!adminAuth) {
      navigate("/admin/login");
      return;
    }

    // Listen to all drivers
    const driversQuery = query(collection(db, 'drivers'));
    const unsubscribe = onSnapshot(driversQuery, (snapshot) => {
      const driversData: Driver[] = [];
      snapshot.forEach((doc) => {
        driversData.push({ id: doc.id, ...doc.data() } as Driver);
      });
      
      setDrivers(driversData);
      
      // Calculate stats
      const newStats = {
        total: driversData.length,
        pending: driversData.filter(d => d.approvalStatus === 'pending').length,
        approved: driversData.filter(d => d.approvalStatus === 'approved').length,
        rejected: driversData.filter(d => d.approvalStatus === 'rejected').length
      };
      setStats(newStats);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleApprove = async (driver: Driver) => {
    try {
      await updateDoc(doc(db, 'drivers', driver.phoneNumber), {
        approvalStatus: 'approved',
        updatedAt: new Date()
      });
      
      toast({
        title: "Driver Approved",
        description: `${driver.fullName} has been approved`
      });
      
      setSelectedDriver(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve driver",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (driver: Driver, reason: string) => {
    try {
      await updateDoc(doc(db, 'drivers', driver.phoneNumber), {
        approvalStatus: 'rejected',
        rejectionReason: reason,
        updatedAt: new Date()
      });
      
      toast({
        title: "Driver Rejected",
        description: `${driver.fullName} has been rejected`
      });
      
      setSelectedDriver(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject driver",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    navigate("/admin/login");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-primary/20 text-primary">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (selectedDriver) {
    return (
      <MobileContainer>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <Button variant="ghost" onClick={() => setSelectedDriver(null)}>
            ← Back
          </Button>
          <h1 className="text-xl font-semibold">Driver Review</h1>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 px-6 py-8 overflow-y-auto">
          <div className="space-y-6">
            <div className="text-center">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarImage src={selectedDriver.profileDocument} />
                <AvatarFallback>{selectedDriver.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold">{selectedDriver.fullName}</h2>
              <p className="text-muted-foreground">{selectedDriver.phoneNumber}</p>
              {getStatusBadge(selectedDriver.approvalStatus)}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{selectedDriver.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City:</span>
                  <span>{selectedDriver.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License:</span>
                  <span>{selectedDriver.licenseNumber}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{selectedDriver.vehicleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Make:</span>
                  <span>{selectedDriver.vehicleMake}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span>{selectedDriver.vehicleModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year:</span>
                  <span>{selectedDriver.vehicleYear}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "National ID", url: selectedDriver.nicDocument },
                  { name: "Insurance", url: selectedDriver.insuranceDocument },
                  { name: "Vehicle License", url: selectedDriver.licenseDocument },
                  { name: "Profile Picture", url: selectedDriver.profileDocument }
                ].map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <span>{doc.name}</span>
                    </div>
                    {doc.url ? (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => window.open(doc.url, '_blank')}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.url!;
                          link.download = `${selectedDriver.fullName}_${doc.name}`;
                          link.click();
                        }}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="secondary">Not uploaded</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {selectedDriver.approvalStatus === 'pending' && (
              <div className="space-y-3">
                <Button 
                  className="w-full h-12 text-lg font-semibold"
                  onClick={() => handleApprove(selectedDriver)}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Approve Driver
                </Button>
                <Button 
                  variant="destructive"
                  className="w-full h-12 text-lg font-semibold"
                  onClick={() => handleReject(selectedDriver, "Documents require review")}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject Application
                </Button>
              </div>
            )}
          </div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Drivers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 text-secondary mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </CardContent>
            </Card>
          </div>

          {/* Driver List */}
          <Card>
            <CardHeader>
              <CardTitle>Driver Applications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {drivers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No driver applications yet
                </div>
              ) : (
                drivers.map((driver) => (
                  <div 
                    key={driver.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/50"
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={driver.profileDocument} />
                        <AvatarFallback>{driver.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{driver.fullName}</h3>
                        <p className="text-sm text-muted-foreground">{driver.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(driver.approvalStatus)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {driver.createdAt?.toDate?.()?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileContainer>
  );
};