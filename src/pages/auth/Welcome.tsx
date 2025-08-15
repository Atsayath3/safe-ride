import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Users, Car, Shield } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-2 py-8">
      <div className="w-full max-w-md mx-auto rounded-2xl shadow-xl bg-background/95 border border-border/60 p-0 overflow-hidden">
  {/* Header with Logo */}
  <div className="text-center pt-12 pb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center overflow-hidden bg-white">
          <img src="/logo.png" alt="Safe Ride Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Safe Ride</h1>
        <p className="text-muted-foreground">Secure school transportation</p>
      </div>

  {/* Main Content */}
  <div className="flex-1 px-4 space-y-6">
        {/* Features */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Verified Drivers</h3>
                <p className="text-sm text-muted-foreground">Background checked and approved</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Fixed Routes</h3>
                <p className="text-sm text-muted-foreground">Regular school transportation</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Parent Peace of Mind</h3>
                <p className="text-sm text-muted-foreground">Track and manage rides</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-8">
          <Button 
            onClick={() => navigate('/parent/login')}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground border-none hover:bg-primary/90 shadow-sm"
            variant="default"
          >
            I'm a Parent
          </Button>
          
          <Button 
            onClick={() => navigate('/driver/login')}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground border-none hover:bg-primary/90 shadow-sm"
            variant="default"
          >
            I'm a Driver
          </Button>
          
          <Button 
            onClick={() => navigate('/admin/login')}
            className="w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
            variant="default"
          >
            Admin Access
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Safe • Reliable • Trusted
        </p>
      </div>
      </div>
    </div>
  );
};

export default Welcome;