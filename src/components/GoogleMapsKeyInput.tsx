import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface GoogleMapsKeyInputProps {
  onKeySet: (apiKey: string) => void;
}

const GoogleMapsKeyInput: React.FC<GoogleMapsKeyInputProps> = ({ onKeySet }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('google_maps_api_key', apiKey.trim());
      onKeySet(apiKey.trim());
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Google Maps API Key Required</CardTitle>
        <p className="text-sm text-muted-foreground">
          To use Google Maps for route setting, please enter your Google Maps API key below.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Google Maps API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Google Maps API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your API key will be stored locally in your browser for this session.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button type="submit" className="w-full">
              Set API Key
            </Button>
            
            <div className="text-center">
              <a
                href="https://console.cloud.google.com/google/maps-apis"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                Get your Google Maps API key
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>
        </form>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Make sure your API key has the Maps JavaScript API and Geocoding API enabled.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleMapsKeyInput;