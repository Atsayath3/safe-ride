import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileContainer } from "@/components/Layout/MobileContainer";
import { ArrowLeft, MapPin, Plus, X, Navigation } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface RouteStop {
  id: string;
  name: string;
  address: string;
}

export const DriverRouteSetting = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [routeName, setRouteName] = useState("");
  const [stops, setStops] = useState<RouteStop[]>([
    { id: "1", name: "", address: "" }
  ]);
  const [saving, setSaving] = useState(false);

  const addStop = () => {
    const newStop: RouteStop = {
      id: Date.now().toString(),
      name: "",
      address: ""
    };
    setStops([...stops, newStop]);
  };

  const removeStop = (id: string) => {
    if (stops.length > 1) {
      setStops(stops.filter(stop => stop.id !== id));
    }
  };

  const updateStop = (id: string, field: 'name' | 'address', value: string) => {
    setStops(stops.map(stop => 
      stop.id === id ? { ...stop, [field]: value } : stop
    ));
  };

  const handleSaveRoute = async () => {
    if (!user?.phoneNumber) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    if (!routeName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a route name",
        variant: "destructive"
      });
      return;
    }

    const validStops = stops.filter(stop => stop.name.trim() && stop.address.trim());
    if (validStops.length < 2) {
      toast({
        title: "Error",
        description: "Please add at least 2 stops with names and addresses",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const driverRef = doc(db, 'drivers', user.phoneNumber);
      await updateDoc(driverRef, {
        routeName: routeName.trim(),
        routeStops: validStops,
        routeUpdatedAt: new Date()
      });

      toast({
        title: "Route Saved",
        description: "Your route has been saved successfully"
      });

      navigate(-1);
    } catch (error) {
      console.error("Error saving route:", error);
      toast({
        title: "Error",
        description: "Failed to save route. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileContainer>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Set Your Route</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Navigation className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Create Your Route</h2>
            <p className="text-muted-foreground">
              Set up your daily route to help parents find rides along your path
            </p>
          </div>

          {/* Route Name */}
          <Card>
            <CardHeader>
              <CardTitle>Route Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="routeName">Route Name</Label>
                <Input
                  id="routeName"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="e.g., Home to School via City Center"
                />
              </div>
            </CardContent>
          </Card>

          {/* Route Stops */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Route Stops</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addStop}
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Stop
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stops.map((stop, index) => (
                <div key={stop.id} className="space-y-3 p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">{index + 1}</span>
                      </div>
                      <span className="font-medium">Stop {index + 1}</span>
                    </div>
                    {stops.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeStop(stop.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`stop-name-${stop.id}`}>Stop Name</Label>
                      <Input
                        id={`stop-name-${stop.id}`}
                        value={stop.name}
                        onChange={(e) => updateStop(stop.id, 'name', e.target.value)}
                        placeholder="e.g., City Mall, School Gate"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`stop-address-${stop.id}`}>Address</Label>
                      <Input
                        id={`stop-address-${stop.id}`}
                        value={stop.address}
                        onChange={(e) => updateStop(stop.id, 'address', e.target.value)}
                        placeholder="Enter full address"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Route Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Route Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stops.filter(stop => stop.name.trim()).map((stop, index) => (
                  <div key={stop.id} className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium">{stop.name}</p>
                      {stop.address && (
                        <p className="text-sm text-muted-foreground">{stop.address}</p>
                      )}
                    </div>
                  </div>
                ))}
                {stops.filter(stop => stop.name.trim()).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Add stops to see route preview
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
            <p className="text-sm text-center">
              <strong>Tip:</strong> Add detailed stops along your route to help parents 
              find convenient pickup/drop-off points.
            </p>
          </div>

          <Button 
            className="w-full h-12 text-lg font-semibold rounded-xl"
            onClick={handleSaveRoute}
            disabled={saving}
          >
            {saving ? "Saving Route..." : "Save Route"}
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};