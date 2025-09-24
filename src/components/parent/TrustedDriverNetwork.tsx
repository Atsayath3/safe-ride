import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from '../../hooks/use-toast';
import { 
  Users, 
  Plus, 
  Star, 
  Phone, 
  Car, 
  Clock, 
  Shield,
  Heart,
  Edit,
  Trash2,
  Calendar,
  MessageCircle
} from 'lucide-react';
import { TrustedDriver, DriverRating } from '../../interfaces/personalization';
import { TrustedDriverService } from '../../services/trustedDriverService';

interface TrustedDriverNetworkProps {
  parentId: string;
}

export const TrustedDriverNetwork: React.FC<TrustedDriverNetworkProps> = ({ parentId }) => {
  const [trustedDrivers, setTrustedDrivers] = useState<TrustedDriver[]>([]);
  const [driverStats, setDriverStats] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<TrustedDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'preferred' | 'priority'>('all');

  // Form states for adding driver
  const [driverForm, setDriverForm] = useState({
    driverId: '',
    driverName: '',
    phone: '',
    vehicleInfo: {
      make: '',
      model: '',
      color: '',
      plateNumber: ''
    },
    specialties: [] as string[],
    notes: '',
    isPreferred: false,
    isPriority: false,
    availability: {
      monday: [] as string[],
      tuesday: [] as string[],
      wednesday: [] as string[],
      thursday: [] as string[],
      friday: [] as string[],
      saturday: [] as string[],
      sunday: [] as string[]
    }
  });

  // Rating form states
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    categories: {
      safety: 5,
      punctuality: 5,
      cleanliness: 5,
      communication: 5,
      childFriendliness: 5
    },
    review: '',
    wouldRecommend: true
  });

  const specialtyOptions = [
    'Patient with children',
    'Punctual',
    'Safe driving',
    'Child car seats available',
    'Speaks multiple languages',
    'Emergency availability',
    'Long distance trips',
    'School pickup specialist'
  ];

  const timeSlots = [
    '06:00-08:00', '08:00-10:00', '10:00-12:00',
    '12:00-14:00', '14:00-16:00', '16:00-18:00',
    '18:00-20:00', '20:00-22:00'
  ];

  useEffect(() => {
    loadData();
  }, [parentId, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filter === 'preferred') filters.isPreferred = true;
      if (filter === 'priority') filters.isPriority = true;
      
      const [drivers, stats] = await Promise.all([
        TrustedDriverService.getTrustedDrivers(parentId, filters),
        TrustedDriverService.getDriverNetworkStats(parentId)
      ]);
      
      setTrustedDrivers(drivers);
      setDriverStats(stats);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load trusted drivers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTrustedDriver = async () => {
    if (!driverForm.driverName || !driverForm.phone) {
      toast({
        title: "Validation Error",
        description: "Driver name and phone are required",
        variant: "destructive"
      });
      return;
    }

    try {
      await TrustedDriverService.addTrustedDriver(parentId, {
        ...driverForm,
        parentId
      });

      toast({
        title: "Success",
        description: "Driver added to trusted network"
      });

      // Reset form
      setDriverForm({
        driverId: '',
        driverName: '',
        phone: '',
        vehicleInfo: {
          make: '',
          model: '',
          color: '',
          plateNumber: ''
        },
        specialties: [],
        notes: '',
        isPreferred: false,
        isPriority: false,
        availability: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        }
      });
      setIsAddModalOpen(false);
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add trusted driver",
        variant: "destructive"
      });
    }
  };

  const rateDriver = async () => {
    if (!selectedDriver) return;

    try {
      await TrustedDriverService.rateDriver({
        driverId: selectedDriver.driverId,
        parentId,
        rideId: 'manual-rating', // In real app, this would be from actual ride
        ...ratingForm
      });

      toast({
        title: "Success",
        description: "Driver rating submitted"
      });

      setIsRatingModalOpen(false);
      setSelectedDriver(null);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive"
      });
    }
  };

  const togglePreference = async (driver: TrustedDriver) => {
    try {
      await TrustedDriverService.setDriverPreference(parentId, driver.driverId, !driver.isPreferred);
      toast({
        title: "Success",
        description: `Driver ${driver.isPreferred ? 'removed from' : 'added to'} preferences`
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preference",
        variant: "destructive"
      });
    }
  };

  const togglePriority = async (driver: TrustedDriver) => {
    try {
      await TrustedDriverService.setDriverPriority(parentId, driver.driverId, !driver.isPriority);
      toast({
        title: "Success",
        description: `Driver ${driver.isPriority ? 'removed from' : 'added to'} priority list`
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive"
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    if (checked) {
      setDriverForm({
        ...driverForm,
        specialties: [...driverForm.specialties, specialty]
      });
    } else {
      setDriverForm({
        ...driverForm,
        specialties: driverForm.specialties.filter(s => s !== specialty)
      });
    }
  };

  const handleAvailabilityChange = (day: string, timeSlot: string, checked: boolean) => {
    const daySchedule = driverForm.availability[day as keyof typeof driverForm.availability];
    if (checked) {
      setDriverForm({
        ...driverForm,
        availability: {
          ...driverForm.availability,
          [day]: [...daySchedule, timeSlot]
        }
      });
    } else {
      setDriverForm({
        ...driverForm,
        availability: {
          ...driverForm.availability,
          [day]: daySchedule.filter(slot => slot !== timeSlot)
        }
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading trusted driver network...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Trusted Driver Network</h2>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Trusted Driver</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="driverName">Driver Name</Label>
                  <Input
                    id="driverName"
                    value={driverForm.driverName}
                    onChange={(e) => setDriverForm({...driverForm, driverName: e.target.value})}
                    placeholder="Enter driver name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({...driverForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <Label>Vehicle Information</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    placeholder="Make (e.g., Toyota)"
                    value={driverForm.vehicleInfo.make}
                    onChange={(e) => setDriverForm({
                      ...driverForm,
                      vehicleInfo: {...driverForm.vehicleInfo, make: e.target.value}
                    })}
                  />
                  <Input
                    placeholder="Model (e.g., Prius)"
                    value={driverForm.vehicleInfo.model}
                    onChange={(e) => setDriverForm({
                      ...driverForm,
                      vehicleInfo: {...driverForm.vehicleInfo, model: e.target.value}
                    })}
                  />
                  <Input
                    placeholder="Color"
                    value={driverForm.vehicleInfo.color}
                    onChange={(e) => setDriverForm({
                      ...driverForm,
                      vehicleInfo: {...driverForm.vehicleInfo, color: e.target.value}
                    })}
                  />
                  <Input
                    placeholder="Plate Number"
                    value={driverForm.vehicleInfo.plateNumber}
                    onChange={(e) => setDriverForm({
                      ...driverForm,
                      vehicleInfo: {...driverForm.vehicleInfo, plateNumber: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Specialties</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {specialtyOptions.map(specialty => (
                    <label key={specialty} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={driverForm.specialties.includes(specialty)}
                        onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                      />
                      <span className="text-sm">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Availability</Label>
                <div className="space-y-2 mt-2">
                  {Object.keys(driverForm.availability).map(day => (
                    <div key={day}>
                      <p className="text-sm font-medium capitalize">{day}</p>
                      <div className="grid grid-cols-4 gap-1 mt-1">
                        {timeSlots.map(slot => (
                          <label key={slot} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={driverForm.availability[day as keyof typeof driverForm.availability].includes(slot)}
                              onChange={(e) => handleAvailabilityChange(day, slot, e.target.checked)}
                            />
                            <span className="text-xs">{slot}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={driverForm.notes}
                  onChange={(e) => setDriverForm({...driverForm, notes: e.target.value})}
                  placeholder="Any additional notes about this driver"
                  className="w-full mt-1 p-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={driverForm.isPreferred}
                    onChange={(e) => setDriverForm({...driverForm, isPreferred: e.target.checked})}
                  />
                  <span>Mark as Preferred</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={driverForm.isPriority}
                    onChange={(e) => setDriverForm({...driverForm, isPriority: e.target.checked})}
                  />
                  <span>Emergency Priority</span>
                </label>
              </div>

              <Button onClick={addTrustedDriver} className="w-full">
                Add to Trusted Network
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      {driverStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Drivers</p>
                  <p className="text-2xl font-bold">{driverStats.totalTrustedDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Preferred</p>
                  <p className="text-2xl font-bold">{driverStats.preferredDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="text-2xl font-bold">{driverStats.priorityDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold">{driverStats.averageRating}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Drivers
        </Button>
        <Button
          variant={filter === 'preferred' ? 'default' : 'outline'}
          onClick={() => setFilter('preferred')}
        >
          Preferred
        </Button>
        <Button
          variant={filter === 'priority' ? 'default' : 'outline'}
          onClick={() => setFilter('priority')}
        >
          Priority
        </Button>
      </div>

      {/* Driver List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trustedDrivers.map(driver => (
          <Card key={driver.id} className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={driver.driverPhoto} />
                    <AvatarFallback>
                      {driver.driverName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold">{driver.driverName}</h3>
                    <div className="flex items-center gap-2">
                      {renderStars(driver.rating)}
                      <span className="text-sm text-gray-600">({driver.totalRides} rides)</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {driver.isPreferred && (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      <Heart className="w-3 h-3 mr-1" />
                      Preferred
                    </Badge>
                  )}
                  {driver.isPriority && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Priority
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{driver.phone}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {driver.vehicleInfo.color} {driver.vehicleInfo.make} {driver.vehicleInfo.model}
                    {driver.vehicleInfo.plateNumber && ` (${driver.vehicleInfo.plateNumber})`}
                  </span>
                </div>
                
                {driver.specialties.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Specialties:</p>
                    <div className="flex flex-wrap gap-1">
                      {driver.specialties.slice(0, 3).map(specialty => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {driver.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{driver.specialties.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {driver.notes && (
                  <div>
                    <p className="text-sm font-medium">Notes:</p>
                    <p className="text-sm text-gray-600">{driver.notes}</p>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePreference(driver)}
                    className="flex items-center gap-1"
                  >
                    <Heart className={`w-3 h-3 ${driver.isPreferred ? 'fill-red-500 text-red-500' : ''}`} />
                    {driver.isPreferred ? 'Remove' : 'Prefer'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePriority(driver)}
                    className="flex items-center gap-1"
                  >
                    <Shield className={`w-3 h-3 ${driver.isPriority ? 'fill-green-500 text-green-500' : ''}`} />
                    Priority
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedDriver(driver);
                      setIsRatingModalOpen(true);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" />
                    Rate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {trustedDrivers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Trusted Drivers</h3>
            <p className="text-gray-600 mb-4">Build your network of trusted drivers for reliable service</p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Driver
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rating Modal */}
      <Dialog open={isRatingModalOpen} onOpenChange={setIsRatingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Driver</DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-4">
              <div className="text-center">
                <Avatar className="w-16 h-16 mx-auto mb-2">
                  <AvatarImage src={selectedDriver.driverPhoto} />
                  <AvatarFallback>
                    {selectedDriver.driverName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold">{selectedDriver.driverName}</h3>
              </div>

              <div>
                <Label>Overall Rating</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-6 h-6 cursor-pointer ${
                        star <= ratingForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                      onClick={() => setRatingForm({...ratingForm, rating: star})}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Category Ratings</Label>
                <div className="space-y-2 mt-2">
                  {Object.entries(ratingForm.categories).map(([category, rating]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-4 h-4 cursor-pointer ${
                              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                            onClick={() => setRatingForm({
                              ...ratingForm,
                              categories: {...ratingForm.categories, [category]: star}
                            })}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="review">Review (Optional)</Label>
                <textarea
                  id="review"
                  value={ratingForm.review}
                  onChange={(e) => setRatingForm({...ratingForm, review: e.target.value})}
                  placeholder="Share your experience with this driver"
                  className="w-full mt-1 p-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={ratingForm.wouldRecommend}
                    onChange={(e) => setRatingForm({...ratingForm, wouldRecommend: e.target.checked})}
                  />
                  <span>Would recommend to other parents</span>
                </label>
              </div>

              <Button onClick={rateDriver} className="w-full">
                Submit Rating
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};