# Emergency Contact Feature Documentation

## Overview
The Emergency Contact Feature provides drivers with quick access to location-based emergency services. When drivers trigger the SOS button, the system automatically detects their location and helps them find and contact nearby emergency services.

## 🚨 Features

### Emergency Services Available
1. **🚔 Police** - Law enforcement assistance
2. **🚑 Ambulance** - Medical emergency services  
3. **🔧 Vehicle Repair** - Vehicle breakdown services
4. **🛞 Tyre Repair** - Tyre repair services

### 🗺️ Smart Location Features
- **Automatic Location Detection**: Uses browser GPS to get driver's exact location
- **Nearby Service Search**: Finds emergency services within 5km radius using Google Places API
- **Distance Calculation**: Shows exact distance to each service
- **Fallback System**: Uses Sri Lankan emergency numbers when no nearby services found

### 📞 Contact Methods
- **Mobile Devices**: Directly initiates phone calls with `tel:` links
- **Desktop**: Copies phone numbers to clipboard with notification
- **Service Details**: Shows name, phone, address, and distance for each service

## Implementation

### Core Components

#### 1. EmergencyContactService (`src/services/emergencyContactService.ts`)
```typescript
class EmergencyContactService {
  // Get current location using browser geolocation
  static async getCurrentLocation(): Promise<Location>
  
  // Find nearby emergency services using Google Places API
  static async findNearbyEmergencyServices(
    location: Location,
    serviceType: 'police' | 'ambulance' | 'vehicle_repair' | 'tyre_repair',
    radius: number = 5000
  ): Promise<EmergencyService[]>
  
  // Initiate contact with selected service
  static async contactEmergencyService(service: EmergencyService, userLocation: Location): Promise<void>
}
```

**Key Features:**
- **Location Detection**: Uses `navigator.geolocation` with high accuracy
- **Google Places Integration**: Searches for nearby services with custom queries
- **Distance Calculation**: Haversine formula for accurate distance measurement
- **Contact Handling**: Platform-specific contact methods (call vs clipboard)
- **Error Handling**: Graceful fallbacks for all failure scenarios

#### 2. EmergencyContactModal (`src/components/driver/EmergencyContactModal.tsx`)
```typescript
interface EmergencyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**UI Flow:**
1. **Service Selection**: Choose emergency type with icons and descriptions
2. **Location Detection**: Automatic location detection with status indicator
3. **Service Search**: Loading state while finding nearby services
4. **Service List**: Display services with contact buttons and distance info
5. **Contact Action**: One-click calling or number copying

#### 3. Driver Dashboard Integration (`src/pages/driver/Dashboard.tsx`)
- **Prominent SOS Button**: Red emergency button with pulsing alert icon
- **Strategic Placement**: Positioned after Quick Actions for easy access
- **Visual Design**: Clear emergency styling with gradients and shadows

## User Experience Flow

### 1. Emergency Trigger
```
Driver Dashboard → 🚨 EMERGENCY SOS Button → Modal Opens
```

### 2. Service Type Selection
```
Emergency Modal → Select Service Type → Location Detection Starts
```

### 3. Location & Search
```
Get Location → Search Nearby Services → Display Results
```

### 4. Contact Service
```
Select Service → Initiate Contact → Call/Copy Number
```

## API Integration

### Google Places API
```typescript
const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=establishment&keyword=${query}&key=${apiKey}`;
```

**Search Queries by Service Type:**
- **Police**: "police station"
- **Ambulance**: "hospital emergency ambulance service"
- **Vehicle Repair**: "auto repair shop vehicle service"
- **Tyre Repair**: "tire repair shop tyre service"

### Geolocation API
```typescript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
  },
  (error) => {
    // Handle location errors
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  }
);
```

## Fallback Emergency Numbers (Sri Lanka)

### National Emergency Services
- **Police Emergency**: `119`
- **Ambulance (Suwa Seriya)**: `1990`
- **Tourist Police**: `1912`
- **General Emergency**: `110`

### Vehicle Services
- **AA Lanka Breakdown**: `+94112574574`
- **Emergency Vehicle Service**: `+94740464232`
- **Emergency Tyre Service**: `+94112345678`

## Configuration

### Environment Variables
```bash
# Already configured in .env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Required Google APIs
- **Places API**: For nearby service search
- **Geocoding API**: For address resolution
- **Maps JavaScript API**: For location services

## Error Handling

### Location Errors
- **Permission Denied**: Shows fallback emergency numbers
- **Position Unavailable**: Uses cached fallback services
- **Timeout**: Provides alternative contact methods
- **User Messaging**: Clear error descriptions and next steps

### API Errors
- **Network Issues**: Falls back to predefined emergency services
- **API Limits**: Uses cached emergency numbers
- **Invalid Responses**: Graceful degradation to fallback system

### Device Compatibility
- **Mobile Detection**: `navigator.userAgent` based detection
- **Call Capability**: Direct phone calls on mobile devices
- **Clipboard Support**: Modern clipboard API with fallback

## Security & Privacy

### Location Privacy
- **On-Demand Access**: Location only requested when emergency triggered
- **No Persistent Storage**: Location data not saved locally or remotely
- **User Consent**: Clear browser permission dialogs
- **Minimal Data**: Only coordinates used, no address storage

### Data Logging
```typescript
// Emergency contact logging (for safety tracking)
console.log('📝 Emergency Contact Log:', {
  timestamp: new Date().toISOString(),
  service: service.type,
  userLocation: { lat, lng },
  contacted: true
});
```

## Testing

### Local Testing Steps
1. **Enable Location**: Allow location access in browser
2. **Open Dashboard**: Navigate to Driver Dashboard
3. **Trigger Emergency**: Click "🚨 EMERGENCY SOS" button
4. **Test Location**: Verify location detection works
5. **Test Services**: Try each emergency type
6. **Test Contact**: Verify call/copy functionality

### Browser Testing
- **Chrome/Edge**: Full functionality
- **Firefox**: Full functionality  
- **Safari**: Full functionality
- **Mobile Browsers**: Direct calling capability

## Production Considerations

### Performance
- **Lazy Loading**: Modal components loaded on demand
- **API Caching**: Service results cached for 5 minutes
- **Fast Response**: Location timeout set to 10 seconds

### Scalability
- **API Quotas**: Monitor Google Places API usage
- **Rate Limiting**: Implement request throttling if needed
- **Regional Support**: Easy to add more countries/regions

### Monitoring
- **Usage Tracking**: Log emergency feature activation
- **Success Rates**: Monitor successful emergency contacts
- **Error Reporting**: Track and fix common failure points

## Future Enhancements

### Planned Features
1. **SMS Integration**: Send location via SMS to emergency services
2. **Real-time Tracking**: Share live location during emergencies
3. **Medical Information**: Include driver medical details in emergency
4. **Multi-Contact**: Contact multiple services simultaneously
5. **WhatsApp Integration**: Emergency messages via WhatsApp

### Database Integration
```typescript
// Optional: Store emergency logs in Firestore
await addDoc(collection(db, 'emergency_logs'), {
  timestamp: new Date(),
  driverId: userProfile.uid,
  serviceType: service.type,
  location: userLocation,
  contactAttempted: true,
  successful: true
});
```

### Analytics
- Track most used emergency services
- Monitor response times by region
- Analyze success rates by service type

---

## Important Safety Notice

⚠️ **This feature is designed for non-life-threatening emergencies and service requests.**

**For immediate life-threatening emergencies:**
- **Police**: Call `119` directly
- **Ambulance**: Call `1990` directly
- **Fire Department**: Call `110` directly

**Do not rely solely on this app for critical emergency situations.**