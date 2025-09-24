export interface Location {import { toast } from '@/hooks/use-toast';import { toast } from '@/hooks/use-toast';

  lat: number;

  lng: number;

}

export interface Location {export interface Location {

export interface EmergencyService {

  id: string;  lat: number;  lat: number;

  name: string;

  phone: string;  lng: number;  lng: number;

  address: string;

  distance?: number;  address?: string;  address?: string;

  rating?: number;

}}}



export class EmergencyContactService {

  

  // Get current locationexport interface EmergencyService {export interface EmergencyService {

  static async getCurrentLocation(): Promise<Location> {

    return new Promise((resolve, reject) => {  id: string;  id: string;

      if (!navigator.geolocation) {

        reject(new Error('Geolocation not supported'));  name: string;  name: string;

        return;

      }  phone: string;  phone: string;



      navigator.geolocation.getCurrentPosition(  address: string;  address: string;

        (position) => {

          resolve({  location: Location;  location: Location;

            lat: position.coords.latitude,

            lng: position.coords.longitude  distance?: number;  distance?: number;

          });

        },  rating?: number;  rating?: number;

        (error) => {

          reject(new Error('Unable to get location'));  isOpen?: boolean;  isOpen?: boolean;

        },

        { enableHighAccuracy: true, timeout: 10000 }  type: string;  type: string;

      );

    });}}

  }



  // Find nearby emergency services

  static async findNearbyEmergencyServices(location: Location): Promise<EmergencyService[]> {export class EmergencyContactService {export class EmergencyContactService {

    // Return fallback services for now

    return [  private static readonly GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;  private static readonly GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      {

        id: '1',

        name: 'Police Emergency',

        phone: '119',  // Get current location of the user  // Get current location of the user

        address: 'National Emergency Service',

        distance: 500  static async getCurrentLocation(): Promise<Location> {  static async getCurrentLocation(): Promise<Location> {

      },

      {    return new Promise((resolve, reject) => {    return new Promise((resolve, reject) => {

        id: '2', 

        name: 'Suwa Seriya Ambulance',      if (!navigator.geolocation) {      if (!navigator.geolocation) {

        phone: '1990',

        address: 'National Ambulance Service',        reject(new Error('Geolocation is not supported by this browser'));        reject(new Error('Geolocation is not supported by this browser'));

        distance: 800

      },        return;        return;

      {

        id: '3',      }      }

        name: 'Fire & Rescue',

        phone: '110', 

        address: 'Fire Department',

        distance: 1200      navigator.geolocation.getCurrentPosition(      navigator.geolocation.getCurrentPosition(

      }

    ];        (position) => {        (position) => {

  }

          resolve({          resolve({

  // Contact emergency service

  static contactEmergencyService(service: EmergencyService): void {            lat: position.coords.latitude,            lat: position.coords.latitude,

    window.open(`tel:${service.phone}`, '_self');

  }            lng: position.coords.longitude            lng: position.coords.longitude

}
          });          });

        },        },

        (error) => {        (error) => {

          console.error('Error getting location:', error);          console.error('Error getting location:', error);

          reject(new Error('Unable to get current location'));          reject(new Error('Unable to get current location'));

        },        },

        {        {

          enableHighAccuracy: true,          enableHighAccuracy: true,

          timeout: 10000,          timeout: 10000,

          maximumAge: 60000          maximumAge: 60000

        }        }

      );      );

    });    });

  }  }



  // Search for nearby emergency services using Google Places API  // Search for nearby emergency services using Google Places API

  static async findNearbyEmergencyServices(location: Location, radius: number = 5000): Promise<EmergencyService[]> {  static async findNearbyEmergencyServices(location: Location, radius: number = 5000): Promise<EmergencyService[]> {

    if (!this.GOOGLE_PLACES_API_KEY) {    if (!this.GOOGLE_PLACES_API_KEY) {

      console.warn('Google Places API key not configured, using fallback services');      console.warn('Google Places API key not configured');

      return this.getFallbackEmergencyServices();      return this.getFallbackEmergencyServices();

    }    }



    try {    try {

      const services: EmergencyService[] = [];      const services: EmergencyService[] = [];

            

      // Search for different types of emergency services      // Search for different types of emergency services

      const serviceTypes = [      const serviceTypes = [

        { type: 'police', keyword: 'police station' },        { type: 'police', keyword: 'police station' },

        { type: 'hospital', keyword: 'hospital' },        { type: 'hospital', keyword: 'hospital' },

        { type: 'pharmacy', keyword: 'pharmacy' },        { type: 'pharmacy', keyword: 'pharmacy' },

        { type: 'gas_station', keyword: 'gas station' },        { type: 'gas_station', keyword: 'gas station' },

        { type: 'car_repair', keyword: 'auto repair' }        { type: 'car_repair', keyword: 'auto repair' }

      ];      ];



      for (const service of serviceTypes) {      for (const service of serviceTypes) {

        try {        try {

          const results = await this.searchGooglePlaces(location, service.keyword, radius);          const results = await this.searchGooglePlaces(location, service.keyword, radius);

          services.push(...results.slice(0, 2)); // Get top 2 results for each type          services.push(...results.slice(0, 2)); // Get top 2 results for each type

        } catch (error) {        } catch (error) {

          console.error(`Error searching for ${service.type}:`, error);          console.error(`Error searching for ${service.type}:`, error);

        }        }

      }      }



      // Sort by distance and return top 10      // Sort by distance and return top 10

      return services      return services

        .sort((a, b) => (a.distance || 0) - (b.distance || 0))        .sort((a, b) => (a.distance || 0) - (b.distance || 0))

        .slice(0, 10);        .slice(0, 10);



    } catch (error) {    } catch (error) {

      console.error('Error searching for emergency services:', error);      console.error('Error searching for emergency services:', error);

      return this.getFallbackEmergencyServices();      return this.getFallbackEmergencyServices();

    }    }

  }  }



  // Search Google Places API  // Search Google Places API

  private static async searchGooglePlaces(  private static async searchGooglePlaces(

    location: Location,     location: Location, 

    keyword: string,     keyword: string, 

    radius: number    radius: number

  ): Promise<EmergencyService[]> {  ): Promise<EmergencyService[]> {

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${this.GOOGLE_PLACES_API_KEY}`;    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${this.GOOGLE_PLACES_API_KEY}`;

        

    try {    // Note: In production, this should be called from your backend to avoid CORS issues

      // Note: In production, this should be called from your backend to avoid CORS issues    const response = await fetch(url);

      const response = await fetch(url);    const data = await response.json();

      const data = await response.json();

    if (data.status === 'OK' && data.results?.length > 0) {

      if (data.status === 'OK' && data.results?.length > 0) {      const detailedServices = await Promise.all(

        const detailedServices = await Promise.all(        data.results.slice(0, 3).map(async (place: any) => {

          data.results.slice(0, 3).map(async (place: any) => {          const details = await this.getPlaceDetails(place.place_id);

            const details = await this.getPlaceDetails(place.place_id);          return {

            return {            id: place.place_id,

              id: place.place_id,            name: place.name,

              name: place.name,            phone: details.phone || this.getEmergencyNumber(),

              phone: details.phone || this.getEmergencyNumber(),            address: place.vicinity || place.formatted_address || 'Address not available',

              address: place.vicinity || place.formatted_address || 'Address not available',            location: {

              location: {              lat: place.geometry.location.lat,

                lat: place.geometry.location.lat,              lng: place.geometry.location.lng

                lng: place.geometry.location.lng            },

              },            distance: this.calculateDistance(location, {

              distance: this.calculateDistance(location, {              lat: place.geometry.location.lat,

                lat: place.geometry.location.lat,              lng: place.geometry.location.lng

                lng: place.geometry.location.lng            }),

              }),            rating: place.rating,

              rating: place.rating,            isOpen: place.opening_hours?.open_now,

              isOpen: place.opening_hours?.open_now,            type: keyword

              type: keyword          };

            };        })

          })      );

        );      

              return detailedServices;

        return detailedServices;    }

      }

    return [];

      return [];  }

    } catch (error) {

      console.error('Google Places API error:', error);  // Get detailed place information including phone number

      return [];  private static async getPlaceDetails(placeId: string): Promise<any> {

    }    try {

  }      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,international_phone_number&key=${this.GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);

  // Get detailed place information including phone number      const data = await response.json();

  private static async getPlaceDetails(placeId: string): Promise<any> {      

    try {      return {

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,international_phone_number&key=${this.GOOGLE_PLACES_API_KEY}`;        phone: data.result?.formatted_phone_number || data.result?.international_phone_number

      const response = await fetch(url);      };

      const data = await response.json();    } catch (error) {

            console.error('Error getting place details:', error);

      return {      return {};

        phone: data.result?.formatted_phone_number || data.result?.international_phone_number    }

      };  }

    } catch (error) {

      console.error('Error getting place details:', error);  // Calculate distance between two points

      return {};  private static calculateDistance(pos1: Location, pos2: Location): number {

    }    const R = 6371; // Earth's radius in kilometers

  }    const dLat = this.deg2rad(pos2.lat - pos1.lat);

    const dLon = this.deg2rad(pos2.lng - pos1.lng);

  // Calculate distance between two points    const a = 

  private static calculateDistance(pos1: Location, pos2: Location): number {      Math.sin(dLat/2) * Math.sin(dLat/2) +

    const R = 6371; // Earth's radius in kilometers      Math.cos(this.deg2rad(pos1.lat)) * Math.cos(this.deg2rad(pos2.lat)) * 

    const dLat = this.deg2rad(pos2.lat - pos1.lat);      Math.sin(dLon/2) * Math.sin(dLon/2);

    const dLon = this.deg2rad(pos2.lng - pos1.lng);    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const a =     return R * c * 1000; // Distance in meters

      Math.sin(dLat/2) * Math.sin(dLat/2) +  }

      Math.cos(this.deg2rad(pos1.lat)) * Math.cos(this.deg2rad(pos2.lat)) * 

      Math.sin(dLon/2) * Math.sin(dLon/2);  private static deg2rad(deg: number): number {

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));    return deg * (Math.PI/180);

    return R * c * 1000; // Distance in meters  }

  }

  // Fallback emergency services (Sri Lankan numbers)

  private static deg2rad(deg: number): number {  private static getFallbackEmergencyServices(): EmergencyService[] {

    return deg * (Math.PI/180);    return [

  }      {

        id: 'emergency-police',

  // Fallback emergency services (Sri Lankan numbers)        name: 'Police Emergency',

  private static getFallbackEmergencyServices(): EmergencyService[] {        phone: '119',

    return [        address: 'National Emergency Service',

      {        location: { lat: 0, lng: 0 },

        id: 'emergency-police',        type: 'police'

        name: 'Police Emergency',      },

        phone: '119',      {

        address: 'National Emergency Service',        id: 'emergency-ambulance',

        location: { lat: 0, lng: 0 },        name: 'Suwa Seriya Ambulance',

        type: 'police'        phone: '1990',

      },        address: 'National Ambulance Service',

      {        location: { lat: 0, lng: 0 },

        id: 'emergency-ambulance',        type: 'ambulance'

        name: 'Suwa Seriya Ambulance',      },

        phone: '1990',      {

        address: 'National Ambulance Service',        id: 'emergency-fire',

        location: { lat: 0, lng: 0 },        name: 'Fire & Rescue',

        type: 'ambulance'        phone: '110',

      },        address: 'Fire Department',

      {        location: { lat: 0, lng: 0 },

        id: 'emergency-fire',        type: 'fire'

        name: 'Fire & Rescue',      }

        phone: '110',    ];

        address: 'Fire Department',  }

        location: { lat: 0, lng: 0 },

        type: 'fire'  private static getEmergencyNumber(): string {

      },    return '119'; // Default emergency number

      {  }

        id: 'emergency-breakdown',

        name: 'Vehicle Breakdown Service',  // Contact emergency service

        phone: '+94112574574',  static async contactEmergencyService(service: EmergencyService): Promise<void> {

        address: 'Roadside Assistance',    try {

        location: { lat: 0, lng: 0 },      // Try to make a phone call

        type: 'breakdown'      if (service.phone) {

      }        window.open(`tel:${service.phone}`, '_self');

    ];        

  }        toast({

          title: "Calling Emergency Service",

  private static getEmergencyNumber(): string {          description: `Calling ${service.name} at ${service.phone}`,

    return '119'; // Default emergency number        });

  }      }

    } catch (error) {

  // Contact emergency service      console.error('Error contacting emergency service:', error);

  static async contactEmergencyService(service: EmergencyService): Promise<void> {      

    try {      // Fallback: copy number to clipboard

      // Try to make a phone call      if (navigator.clipboard && service.phone) {

      if (service.phone) {        await navigator.clipboard.writeText(service.phone);

        window.open(`tel:${service.phone}`, '_self');        toast({

                  title: "Phone Number Copied",

        toast({          description: `${service.name}: ${service.phone} copied to clipboard`,

          title: "Calling Emergency Service",        });

          description: `Calling ${service.name} at ${service.phone}`,      }

        });    }

      }  }

    } catch (error) {}

      console.error('Error contacting emergency service:', error);    location: Location,

          serviceType: 'police' | 'ambulance' | 'vehicle_repair' | 'tyre_repair',

      // Fallback: copy number to clipboard    radius: number = 5000

      if (navigator.clipboard && service.phone) {  ): Promise<EmergencyService[]> {

        await navigator.clipboard.writeText(service.phone);    if (!this.GOOGLE_PLACES_API_KEY) {

        toast({      console.warn('Google Places API key not configured');

          title: "Phone Number Copied",      return this.getFallbackEmergencyServices(serviceType);

          description: `${service.name}: ${service.phone} copied to clipboard`,    }

        });

      }    try {

    }      const query = this.getSearchQuery(serviceType);

  }      

}      // Using CORS proxy for web requests or direct API call
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=establishment&keyword=${encodeURIComponent(query)}&key=${this.GOOGLE_PLACES_API_KEY}`;
      
      // For production, you should use your own backend to make this API call
      const response = await fetch(proxyUrl + targetUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        return data.results.slice(0, 3).map((place: any) => ({
          type: serviceType,
          name: place.name,
          phone: place.formatted_phone_number || this.getFallbackPhone(serviceType),
          address: place.vicinity || place.formatted_address || 'Address not available',
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          distance: this.calculateDistance(location, {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          })
        }));
      }

      // Fallback if no results found
      return this.getFallbackEmergencyServices(serviceType);
    } catch (error) {
      console.error('Error searching for emergency services:', error);
      return this.getFallbackEmergencyServices(serviceType);
    }
  }

  // Get search query based on service type
  private static getSearchQuery(serviceType: 'police' | 'ambulance' | 'vehicle_repair' | 'tyre_repair'): string {
    switch (serviceType) {
      case 'police':
        return 'police station';
      case 'ambulance':
        return 'hospital emergency ambulance service';
      case 'vehicle_repair':
        return 'auto repair shop vehicle service';
      case 'tyre_repair':
        return 'tire repair shop tyre service';
      default:
        return 'emergency service';
    }
  }

  // Get fallback phone numbers
  private static getFallbackPhone(serviceType: 'police' | 'ambulance' | 'vehicle_repair' | 'tyre_repair'): string {
    switch (serviceType) {
      case 'police':
        return '119';
      case 'ambulance':
        return '1990';
      case 'vehicle_repair':
        return '+94112574574';
      case 'tyre_repair':
        return '+94740464232';
      default:
        return '119';
    }
  }

  // Fallback emergency services (Sri Lankan numbers)
  private static getFallbackEmergencyServices(serviceType: 'police' | 'ambulance' | 'vehicle_repair' | 'tyre_repair'): EmergencyService[] {
    const fallbackServices: Record<string, EmergencyService[]> = {
      police: [
        {
          type: 'police',
          name: 'Police Emergency Hotline',
          phone: '119',
          address: 'National Emergency Service',
          location: { lat: 0, lng: 0 }
        },
        {
          type: 'police',
          name: 'Tourist Police',
          phone: '1912',
          address: 'Tourist Police Service',
          location: { lat: 0, lng: 0 }
        }
      ],
      ambulance: [
        {
          type: 'ambulance',
          name: 'Suwa Seriya Ambulance',
          phone: '1990',
          address: 'National Ambulance Service',
          location: { lat: 0, lng: 0 }
        },
        {
          type: 'ambulance',
          name: 'Emergency Medical Service',
          phone: '110',
          address: 'Emergency Medical Response',
          location: { lat: 0, lng: 0 }
        }
      ],
      vehicle_repair: [
        {
          type: 'vehicle_repair',
          name: 'AA Lanka Breakdown Service',
          phone: '+94112574574',
          address: 'Vehicle Breakdown Service',
          location: { lat: 0, lng: 0 }
        },
        {
          type: 'vehicle_repair',
          name: 'Emergency Vehicle Service',
          phone: '+94740464232',
          address: 'Mobile Vehicle Repair',
          location: { lat: 0, lng: 0 }
        }
      ],
      tyre_repair: [
        {
          type: 'tyre_repair',
          name: 'Mobile Tyre Repair',
          phone: '+94740464232',
          address: 'On-site Tyre Service',
          location: { lat: 0, lng: 0 }
        },
        {
          type: 'tyre_repair',
          name: 'Emergency Tyre Service',
          phone: '+94112345678',
          address: 'Mobile Tyre Repair Service',
          location: { lat: 0, lng: 0 }
        }
      ]
    };

    return fallbackServices[serviceType] || [];
  }

  // Calculate distance between two locations (in meters)
  private static calculateDistance(point1: Location, point2: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Handle emergency contact (initiate call)
  static async contactEmergencyService(service: EmergencyService, userLocation: Location): Promise<void> {
    try {
      // Log the emergency contact attempt
      console.log(`🚨 Emergency Contact Initiated:`, {
        service: service.type,
        name: service.name,
        phone: service.phone,
        userLocation,
        serviceLocation: service.location
      });

      // Create emergency message
      const emergencyMessage = this.createEmergencyMessage(service, userLocation);
      
      // Show confirmation toast
      toast({
        title: "Emergency Contact Initiated",
        description: `Contacting ${service.name} at ${service.phone}`,
        duration: 5000,
      });

      // Try to initiate phone call (mobile devices)
      if (this.isMobileDevice()) {
        window.open(`tel:${service.phone}`, '_self');
      } else {
        // For desktop, copy phone number to clipboard
        await navigator.clipboard.writeText(service.phone);
        toast({
          title: "Phone Number Copied",
          description: `${service.phone} has been copied to clipboard`,
          duration: 3000,
        });
      }

      // Log emergency contact for tracking
      await this.logEmergencyContact(service, userLocation, emergencyMessage);

    } catch (error) {
      console.error('Error contacting emergency service:', error);
      toast({
        title: "Contact Error",
        description: "Unable to initiate emergency contact. Please call manually.",
        variant: "destructive",
      });
    }
  }

  // Create emergency message with location details
  private static createEmergencyMessage(service: EmergencyService, userLocation: Location): string {
    const locationString = userLocation.address || `${userLocation.lat}, ${userLocation.lng}`;
    const timestamp = new Date().toLocaleString();
    
    return `EMERGENCY REQUEST - ${service.type.toUpperCase()}
Time: ${timestamp}
Location: ${locationString}
Service Requested: ${service.name}
Contact: ${service.phone}
User needs immediate assistance.`;
  }

  // Check if device is mobile
  private static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Log emergency contact for tracking purposes
  private static async logEmergencyContact(
    service: EmergencyService, 
    userLocation: Location, 
    message: string
  ): Promise<void> {
    try {
      // In a real application, you would save this to your database
      console.log('📝 Emergency Contact Log:', {
        timestamp: new Date().toISOString(),
        service,
        userLocation,
        message
      });
    } catch (error) {
      console.error('Error logging emergency contact:', error);
    }
  }

  // Get emergency service type display name
  static getServiceDisplayName(type: 'police' | 'ambulance' | 'vehicle_repair' | 'tyre_repair'): string {
    const displayNames = {
      police: 'Police',
      ambulance: 'Ambulance',
      vehicle_repair: 'Vehicle Repair',
      tyre_repair: 'Tyre Repair'
    };
    return displayNames[type];
  }

  // Get emergency service icon
  static getServiceIcon(type: 'police' | 'ambulance' | 'vehicle_repair' | 'tyre_repair'): string {
    const icons = {
      police: '🚔',
      ambulance: '🚑',
      vehicle_repair: '🔧',
      tyre_repair: '🛞'
    };
    return icons[type];
  }
}