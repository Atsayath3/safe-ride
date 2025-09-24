# Emergency Contact System - 5km Radius Search

## Overview
The emergency contact system now provides real nearby services within a 5km radius using Google Places API, organized by categories:
- 🛡️ Police Stations
- ❤️ Hospitals 
- 🔧 Vehicle Repair
- ⚡ Tyre Repair

## Features
- **Location-based Search**: Uses GPS to find actual nearby services within 5km
- **Distance Display**: Shows exact distance to each service
- **Category Organization**: Services grouped by type with intuitive icons
- **Fallback System**: Regional services if API fails or no nearby services found
- **One-touch Calling**: Direct phone calls to emergency services

## Setup Instructions

### 1. Configure Google Maps API Key
Make sure your `.env` file contains:
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCA4f6-PLWdvqPe0neE2f0T-JxTnpGUtsA
```

### 2. Start the Proxy Server (Recommended)
To avoid CORS issues with Google Places API:

**Option A: Use the batch file**
```bash
# Double-click start-proxy.bat
# OR run from command line:
start-proxy.bat
```

**Option B: Manual setup**
```bash
# Install dependencies
npm install express cors node-fetch@2.6.7

# Start proxy server
node proxy-server.js
```

The proxy server will run on `http://localhost:3001`

### 3. Start Your Main Application
```bash
npm run dev
```

## How It Works

### Location Detection
1. Uses browser geolocation API to get current GPS coordinates
2. Requests location permission from user
3. Falls back to Colombo center if location access denied

### Service Search
1. **Primary Method**: Google Places API through local proxy server
   - Searches within 5km radius
   - Gets real business information including phone numbers
   - Sorts results by distance

2. **Fallback Method**: Public CORS proxy if local proxy unavailable

3. **Emergency Fallback**: Regional hardcoded services if APIs fail

### Category System
- **Police**: Searches for "police station"
- **Hospital**: Searches for "hospital" 
- **Vehicle Repair**: Searches for "auto repair mechanic"
- **Tyre Repair**: Searches for "tire repair shop"

## API Usage

### Local Proxy Endpoints
- `GET /api/places/nearby?location=lat,lng&radius=5000&keyword=hospital&key=API_KEY`
- `GET /api/places/details?place_id=PLACE_ID&fields=formatted_phone_number&key=API_KEY`

### Distance Calculation
Uses Haversine formula to calculate accurate distances:
- Results under 1km shown in meters (e.g., "250m away")
- Results over 1km shown in kilometers (e.g., "2.3km away")
- Emergency services show "Mobile Service - Comes to you"

## Troubleshooting

### No Services Found
- Check internet connection
- Verify Google Maps API key is valid
- Ensure location permissions are granted
- Try different location or restart proxy server

### CORS Errors
- Make sure proxy server is running on port 3001
- Check Windows Firewall isn't blocking the proxy
- Verify proxy-server.js is in the correct directory

### Location Issues
- Enable location services in browser
- Allow location permission when prompted
- Check GPS is working on device
- Try refreshing the page

## Production Deployment

For production, implement the proxy functionality in your backend server instead of running a separate Node.js proxy. This ensures:
- Better security
- No CORS issues
- API key protection
- Better performance

Example backend integration:
```javascript
// In your existing backend (Firebase Functions, Express, etc.)
app.get('/api/emergency-services', async (req, res) => {
  const { lat, lng, category } = req.query;
  // Implement Google Places search server-side
});
```

## API Rate Limits

Google Places API has usage limits:
- Nearby Search: $32 per 1000 requests
- Place Details: $17 per 1000 requests
- Consider caching results for better cost efficiency

## Emergency Numbers (Fallback)
- Police: 119
- Ambulance: 1990
- Fire Brigade: 110
- Tourist Hotline: 1912