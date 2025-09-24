import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Phone, MapPin, AlertTriangle, ArrowLeft, Shield, Heart, Wrench, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Location {
  lat: number;
  lng: number;
}

interface EmergencyService {
  id: string;
  name: string;
  phone: string;
  address: string;
  distance?: number;
}

type ServiceCategory = 'police' | 'hospital' | 'vehicle_repair' | 'tyre_repair';

interface EmergencyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmergencyContactModal: React.FC<EmergencyContactModalProps> = ({
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [allServices, setAllServices] = useState<Record<ServiceCategory, EmergencyService[]>>({
    police: [],
    hospital: [],
    vehicle_repair: [],
    tyre_repair: []
  });

  const serviceCategories = [
    {
      id: 'police' as ServiceCategory,
      name: 'Police',
      icon: Shield,
      description: 'Law enforcement assistance',
      color: 'bg-blue-100 border-blue-200 hover:bg-blue-150',
      iconColor: 'text-blue-600'
    },
    {
      id: 'hospital' as ServiceCategory,
      name: 'Hospital',
      icon: Heart,
      description: 'Medical emergency services',
      color: 'bg-red-100 border-red-200 hover:bg-red-150',
      iconColor: 'text-red-600'
    },
    {
      id: 'vehicle_repair' as ServiceCategory,
      name: 'Vehicle Repair',
      icon: Wrench,
      description: 'Auto repair & breakdown',
      color: 'bg-green-100 border-green-200 hover:bg-green-150',
      iconColor: 'text-green-600'
    },
    {
      id: 'tyre_repair' as ServiceCategory,
      name: 'Tyre Repair',
      icon: Zap,
      description: 'Tire services & puncture',
      color: 'bg-orange-100 border-orange-200 hover:bg-orange-150',
      iconColor: 'text-orange-600'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      getLocationAndServices();
    } else {
      // Reset when modal closes
      setSelectedCategory(null);
      setLocation(null);
    }
  }, [isOpen]);

  const getLocationAndServices = async () => {
    setLoading(true);
    
    try {
      // Get current location
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      
      // Get categorized emergency services using real location-based search
      const categorizedServices = await getCategorizedServices(currentLocation);
      setAllServices(categorizedServices);
      
      toast({
        title: "Location Found",
        description: "Emergency services within 5km radius",
      });
      
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location Error",
        description: "Using default emergency services",
        variant: "destructive",
      });
      
      // Use fallback services
      const fallbackServices = getFallbackCategorizedServices();
      setAllServices(fallbackServices);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error('Unable to get location'));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const getCategorizedServices = async (location: Location): Promise<Record<ServiceCategory, EmergencyService[]>> => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const radius = 5000; // 5km radius
    
    if (!apiKey) {
      console.warn('Google Places API key not configured, using regional fallback');
      return getCategorizedServicesFallback(location);
    }

    try {
      // Search for real nearby services using Google Places API
      const [policeServices, hospitalServices, vehicleServices, tyreServices] = await Promise.all([
        searchNearbyServices(location, 'police station', apiKey, radius),
        searchNearbyServices(location, 'hospital', apiKey, radius),
        searchNearbyServices(location, 'auto repair mechanic', apiKey, radius),
        searchNearbyServices(location, 'tire repair shop', apiKey, radius)
      ]);

      return {
        police: policeServices.length > 0 ? policeServices : getEmergencyFallback('police'),
        hospital: hospitalServices.length > 0 ? hospitalServices : getEmergencyFallback('hospital'),
        vehicle_repair: vehicleServices.length > 0 ? vehicleServices : getEmergencyFallback('vehicle_repair'),
        tyre_repair: tyreServices.length > 0 ? tyreServices : getEmergencyFallback('tyre_repair')
      };
    } catch (error) {
      console.error('Error fetching nearby services:', error);
      return getCategorizedServicesFallback(location);
    }
  };

  const searchNearbyServices = async (
    location: Location, 
    query: string, 
    apiKey: string, 
    radius: number
  ): Promise<EmergencyService[]> => {
    try {
      // Use local proxy server to avoid CORS issues
      const proxyUrl = 'http://localhost:3001/api/places/nearby';
      const params = new URLSearchParams({
        location: `${location.lat},${location.lng}`,
        radius: radius.toString(),
        keyword: query,
        key: apiKey
      });
      
      const response = await fetch(`${proxyUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.length > 0) {
        // Get detailed information for each place
        const services = await Promise.all(
          data.results.slice(0, 5).map(async (place: any) => {
            const details = await getPlaceDetails(place.place_id, apiKey);
            
            return {
              id: place.place_id,
              name: place.name,
              phone: details.phone || getDefaultPhoneForQuery(query),
              address: place.vicinity || place.formatted_address || 'Address not available',
              distance: calculateDistance(location, {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
              })
            };
          })
        );
        
        // Sort by distance and return top 3
        return services.sort((a, b) => (a.distance || 0) - (b.distance || 0)).slice(0, 3);
      }
      
      return [];
    } catch (error) {
      console.error(`Error searching for ${query}:`, error);
      // If proxy server is not running, try fallback method
      return await searchNearbyServicesFallback(location, query, apiKey, radius);
    }
  };

  const searchNearbyServicesFallback = async (
    location: Location, 
    query: string, 
    apiKey: string, 
    radius: number
  ): Promise<EmergencyService[]> => {
    try {
      // Fallback to public CORS proxy if local proxy is not running
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const response = await fetch(proxyUrl + encodeURIComponent(url));
      
      if (!response.ok) {
        throw new Error('Fallback API request failed');
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.length > 0) {
        const services = await Promise.all(
          data.results.slice(0, 3).map(async (place: any) => {
            return {
              id: place.place_id,
              name: place.name,
              phone: getDefaultPhoneForQuery(query),
              address: place.vicinity || place.formatted_address || 'Address not available',
              distance: calculateDistance(location, {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
              })
            };
          })
        );
        
        return services.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
      
      return [];
    } catch (error) {
      console.error(`Fallback search failed for ${query}:`, error);
      return [];
    }
  };

  const getPlaceDetails = async (placeId: string, apiKey: string): Promise<{phone?: string}> => {
    try {
      // Try local proxy first
      const proxyUrl = 'http://localhost:3001/api/places/details';
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'formatted_phone_number,international_phone_number',
        key: apiKey
      });
      
      const response = await fetch(`${proxyUrl}?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          phone: data.result?.formatted_phone_number || data.result?.international_phone_number
        };
      }
    } catch (error) {
      console.error('Error getting place details from proxy:', error);
      // Fallback method could be added here if needed
    }
    
    return {};
  };

  const getCategorizedServicesFallback = (location: Location): Record<ServiceCategory, EmergencyService[]> => {
    // Generate location-based services using the actual GPS coordinates
    const lat = location.lat;
    const lng = location.lng;
    
    // Determine region/city based on coordinates (Sri Lankan regions)
    const region = getRegionFromCoordinates(lat, lng);
    
    return {
      police: getPoliceServices(region, location),
      hospital: getHospitalServices(region, location),
      vehicle_repair: getVehicleRepairServices(region, location),
      tyre_repair: getTyreRepairServices(region, location)
    };
  };

  const getDefaultPhoneForQuery = (query: string): string => {
    if (query.includes('police')) return '119';
    if (query.includes('hospital')) return '1990';
    if (query.includes('auto repair')) return '+94112574574';
    if (query.includes('tire')) return '+94771234567';
    return '119';
  };

  const getEmergencyFallback = (category: ServiceCategory): EmergencyService[] => {
    const fallbacks: Record<ServiceCategory, EmergencyService[]> = {
      police: [{
        id: 'emergency-police',
        name: 'Police Emergency',
        phone: '119',
        address: 'National Emergency Service',
        distance: 0
      }],
      hospital: [{
        id: 'emergency-ambulance',
        name: 'Suwa Seriya Ambulance',
        phone: '1990',
        address: 'National Ambulance Service',
        distance: 0
      }],
      vehicle_repair: [{
        id: 'emergency-breakdown',
        name: 'Vehicle Breakdown Emergency',
        phone: '+94112574574',
        address: 'Roadside Assistance Service',
        distance: 0
      }],
      tyre_repair: [{
        id: 'emergency-tire',
        name: 'Emergency Tire Service',
        phone: '+94771234567',
        address: 'Mobile Tire Repair',
        distance: 0
      }]
    };
    
    return fallbacks[category] || [];
  };

  const getRegionFromCoordinates = (lat: number, lng: number): string => {
    // Sri Lankan major city regions based on coordinates
    if (lat >= 6.9 && lat <= 7.0 && lng >= 79.8 && lng <= 80.0) {
      return 'Colombo';
    } else if (lat >= 7.25 && lat <= 7.35 && lng >= 80.6 && lng <= 80.7) {
      return 'Kandy';
    } else if (lat >= 6.0 && lat <= 6.1 && lng >= 80.2 && lng <= 80.3) {
      return 'Galle';
    } else if (lat >= 8.5 && lat <= 8.6 && lng >= 80.0 && lng <= 80.1) {
      return 'Anuradhapura';
    } else if (lat >= 7.8 && lat <= 7.9 && lng >= 80.7 && lng <= 80.8) {
      return 'Matale';
    } else {
      return 'General'; // Fallback for other areas
    }
  };

  const getPoliceServices = (region: string, location: Location): EmergencyService[] => {
    const services: Record<string, EmergencyService[]> = {
      'Colombo': [
        {
          id: 'police-col-1',
          name: 'Colombo Central Police',
          phone: '0112421111',
          address: 'Central Police Station, Colombo 01',
          distance: calculateDistance(location, { lat: 6.9344, lng: 79.8428 })
        },
        {
          id: 'police-col-2',
          name: 'Fort Police Station',
          phone: '0112326171',
          address: 'Fort Police Station, Colombo 01',
          distance: calculateDistance(location, { lat: 6.9355, lng: 79.8487 })
        }
      ],
      'Kandy': [
        {
          id: 'police-kan-1',
          name: 'Kandy Police Station',
          phone: '0812222222',
          address: 'Kandy Police Station, Kandy',
          distance: calculateDistance(location, { lat: 7.2906, lng: 80.6337 })
        }
      ],
      'Galle': [
        {
          id: 'police-gal-1',
          name: 'Galle Police Station',
          phone: '0912234567',
          address: 'Galle Police Station, Galle',
          distance: calculateDistance(location, { lat: 6.0535, lng: 80.2210 })
        }
      ],
      'General': [
        {
          id: 'police-emergency',
          name: 'Police Emergency Hotline',
          phone: '119',
          address: 'National Emergency Service',
          distance: 0
        }
      ]
    };
    
    return services[region] || services['General'];
  };

  const getHospitalServices = (region: string, location: Location): EmergencyService[] => {
    const services: Record<string, EmergencyService[]> = {
      'Colombo': [
        {
          id: 'hospital-col-1',
          name: 'National Hospital of Sri Lanka',
          phone: '0112691111',
          address: 'Regent Street, Colombo 07',
          distance: calculateDistance(location, { lat: 6.9147, lng: 79.8757 })
        },
        {
          id: 'hospital-col-2',
          name: 'Colombo General Hospital',
          phone: '0112693711',
          address: 'Kynsey Road, Colombo 08',
          distance: calculateDistance(location, { lat: 6.9175, lng: 79.8668 })
        }
      ],
      'Kandy': [
        {
          id: 'hospital-kan-1',
          name: 'Teaching Hospital Kandy',
          phone: '0812205261',
          address: 'William Gopallawa Mawatha, Kandy',
          distance: calculateDistance(location, { lat: 7.3019, lng: 80.6378 })
        }
      ],
      'Galle': [
        {
          id: 'hospital-gal-1',
          name: 'Teaching Hospital Karapitiya',
          phone: '0912232261',
          address: 'Karapitiya, Galle',
          distance: calculateDistance(location, { lat: 6.0367, lng: 80.2147 })
        }
      ],
      'General': [
        {
          id: 'ambulance-emergency',
          name: 'Suwa Seriya Ambulance',
          phone: '1990',
          address: 'National Ambulance Service',
          distance: 0
        }
      ]
    };
    
    return services[region] || services['General'];
  };

  const getVehicleRepairServices = (region: string, location: Location): EmergencyService[] => {
    const services: Record<string, EmergencyService[]> = {
      'Colombo': [
        {
          id: 'auto-col-1',
          name: 'Colombo Auto Service',
          phone: '+94112574574',
          address: 'Baseline Road, Colombo 09',
          distance: calculateDistance(location, { lat: 6.9095, lng: 79.8746 })
        },
        {
          id: 'auto-col-2',
          name: 'City Motors Colombo',
          phone: '+94740464232',
          address: 'Galle Road, Bambalapitiya',
          distance: calculateDistance(location, { lat: 6.8989, lng: 79.8553 })
        }
      ],
      'Kandy': [
        {
          id: 'auto-kan-1',
          name: 'Kandy Vehicle Service',
          phone: '+94812345678',
          address: 'Peradeniya Road, Kandy',
          distance: calculateDistance(location, { lat: 7.2955, lng: 80.6419 })
        }
      ],
      'General': [
        {
          id: 'auto-emergency',
          name: 'Mobile Vehicle Recovery',
          phone: '+94777123456',
          address: '24/7 Breakdown Service',
          distance: 0
        }
      ]
    };
    
    return services[region] || services['General'];
  };

  const getTyreRepairServices = (region: string, location: Location): EmergencyService[] => {
    const services: Record<string, EmergencyService[]> = {
      'Colombo': [
        {
          id: 'tire-col-1',
          name: 'Quick Tire Fix Colombo',
          phone: '+94771234567',
          address: 'High Level Road, Nugegoda',
          distance: calculateDistance(location, { lat: 6.8648, lng: 79.8997 })
        }
      ],
      'Kandy': [
        {
          id: 'tire-kan-1',
          name: 'Kandy Tire Service',
          phone: '+94776543210',
          address: 'Katugastota Road, Kandy',
          distance: calculateDistance(location, { lat: 7.3344, lng: 80.6247 })
        }
      ],
      'General': [
        {
          id: 'tire-emergency',
          name: 'Emergency Tire Service',
          phone: '+94771234567',
          address: 'Mobile Tire Repair',
          distance: 0
        }
      ]
    };
    
    return services[region] || services['General'];
  };

  const calculateDistance = (pos1: Location, pos2: Location): number => {
    // Calculate actual distance using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 1000); // Distance in meters
  };

  const getFallbackCategorizedServices = (): Record<ServiceCategory, EmergencyService[]> => {
    return {
      police: [
        {
          id: 'police-emergency',
          name: 'Police Emergency',
          phone: '119',
          address: 'National Emergency Service',
          distance: 0
        }
      ],
      hospital: [
        {
          id: 'ambulance-emergency',
          name: 'Suwa Seriya Ambulance',
          phone: '1990',
          address: 'National Ambulance Service',
          distance: 0
        }
      ],
      vehicle_repair: [
        {
          id: 'breakdown-emergency',
          name: 'Vehicle Breakdown Emergency',
          phone: '+94112574574',
          address: 'Roadside Assistance Service',
          distance: 0
        }
      ],
      tyre_repair: [
        {
          id: 'tire-emergency',
          name: 'Emergency Tire Service',
          phone: '+94771234567',
          address: 'Mobile Tire Repair',
          distance: 0
        }
      ]
    };
  };

  const handleCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category);
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  const callService = (service: EmergencyService) => {
    window.open(`tel:${service.phone}`, '_self');
    toast({
      title: "Calling Emergency Service",
      description: `Calling ${service.name} at ${service.phone}`,
    });
  };

  const getCurrentCategoryInfo = () => {
    return serviceCategories.find(cat => cat.id === selectedCategory);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Emergency Contacts
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Locating regional emergency services...</span>
          </div>
        ) : !selectedCategory ? (
          /* Category Selection Screen */
          <div className="space-y-4">
            {location && (
              <div className="text-sm text-gray-600 mb-4">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location detected - select emergency service type
              </div>
            )}
            
            {serviceCategories.map((category) => {
              const IconComponent = category.icon;
              const serviceCount = allServices[category.id]?.length || 0;
              
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all duration-200 ${category.color} border-2 hover:shadow-md`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white ${category.iconColor}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {serviceCount} service{serviceCount !== 1 ? 's' : ''} available
                        </p>
                      </div>
                      <div className="text-gray-400">
                        →
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <p className="text-xs text-red-700">
                <strong>Life-threatening emergency?</strong> Call 119 (Police) or 1990 (Ambulance) immediately.
              </p>
            </div>
          </div>
        ) : (
          /* Service List Screen */
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2 h-auto"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                {(() => {
                  const categoryInfo = getCurrentCategoryInfo();
                  if (!categoryInfo) return null;
                  const IconComponent = categoryInfo.icon;
                  return (
                    <>
                      <IconComponent className={`w-5 h-5 ${categoryInfo.iconColor}`} />
                      <span className="font-semibold">{categoryInfo.name}</span>
                    </>
                  );
                })()}
              </div>
            </div>

            {allServices[selectedCategory]?.map((service) => (
              <Card key={service.id} className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-gray-600">{service.address}</p>
                      {service.distance !== undefined && service.distance > 0 && (
                        <p className="text-xs text-gray-500">
                          {service.distance < 1000 
                            ? `${Math.round(service.distance)}m away`
                            : `${(service.distance / 1000).toFixed(1)}km away`
                          }
                        </p>
                      )}
                      {service.distance === 0 && (
                        <p className="text-xs text-blue-600 font-medium">
                          Mobile Service - Comes to you
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={() => callService(service)}
                      className="bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyContactModal;