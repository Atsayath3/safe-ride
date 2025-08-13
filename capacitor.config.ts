import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d2cbf1f4a5ea46ec82a6f7561481453a',
  appName: 'Safe Ride',
  webDir: 'dist',
  server: {
    url: 'https://d2cbf1f4-a5ea-46ec-82a6-f7561481453a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;