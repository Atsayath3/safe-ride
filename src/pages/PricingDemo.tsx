import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PricingService, PricingCalculation } from '@/services/pricingService';
import { Calculator, MapPin, Calendar, Users } from 'lucide-react';

const PricingDemo: React.FC = () => {
  const [pickupLat, setPickupLat] = useState('6.9271'); // Colombo
  const [pickupLng, setPickupLng] = useState('79.8612');
  const [dropoffLat, setDropoffLat] = useState('6.8649'); // Dehiwala
  const [dropoffLng, setDropoffLng] = useState('79.8640');
  const [numberOfDays, setNumberOfDays] = useState(22);
  const [totalSeats, setTotalSeats] = useState(8);
  const [bookedSeats, setBookedSeats] = useState(3);
  const [pricing, setPricing] = useState<PricingCalculation | null>(null);

  const calculatePricing = () => {
    const pickupLocation = {
      lat: parseFloat(pickupLat),
      lng: parseFloat(pickupLng)
    };

    const dropoffLocation = {
      lat: parseFloat(dropoffLat),
      lng: parseFloat(dropoffLng)
    };

    const driverAvailability = PricingService.calculateDriverAvailability(
      totalSeats,
      bookedSeats
    );

    const calculation = PricingService.calculateRidePrice(
      pickupLocation,
      dropoffLocation,
      numberOfDays,
      driverAvailability
    );

    setPricing(calculation);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Ride Pricing Calculator Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Pickup Location
              </h3>
              <div className="space-y-2">
                <Label htmlFor="pickupLat">Latitude</Label>
                <Input
                  id="pickupLat"
                  value={pickupLat}
                  onChange={(e) => setPickupLat(e.target.value)}
                  placeholder="6.9271"
                />
                <Label htmlFor="pickupLng">Longitude</Label>
                <Input
                  id="pickupLng"
                  value={pickupLng}
                  onChange={(e) => setPickupLng(e.target.value)}
                  placeholder="79.8612"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Dropoff Location
              </h3>
              <div className="space-y-2">
                <Label htmlFor="dropoffLat">Latitude</Label>
                <Input
                  id="dropoffLat"
                  value={dropoffLat}
                  onChange={(e) => setDropoffLat(e.target.value)}
                  placeholder="6.8649"
                />
                <Label htmlFor="dropoffLng">Longitude</Label>
                <Input
                  id="dropoffLng"
                  value={dropoffLng}
                  onChange={(e) => setDropoffLng(e.target.value)}
                  placeholder="79.8640"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="days" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                School Days
              </Label>
              <Input
                id="days"
                type="number"
                value={numberOfDays}
                onChange={(e) => setNumberOfDays(parseInt(e.target.value) || 0)}
                placeholder="22"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalSeats" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Seats
              </Label>
              <Input
                id="totalSeats"
                type="number"
                value={totalSeats}
                onChange={(e) => setTotalSeats(parseInt(e.target.value) || 0)}
                placeholder="8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookedSeats">Booked Seats</Label>
              <Input
                id="bookedSeats"
                type="number"
                value={bookedSeats}
                onChange={(e) => setBookedSeats(parseInt(e.target.value) || 0)}
                placeholder="3"
              />
            </div>
          </div>

          <Button onClick={calculatePricing} className="w-full">
            Calculate Pricing
          </Button>

          {/* Results Section */}
          {pricing && (
            <div className="mt-6">
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-900">Pricing Calculation Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-900">{pricing.totalDistance} km</div>
                      <div className="text-sm text-green-700">Distance</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">{pricing.numberOfDays}</div>
                      <div className="text-sm text-green-700">School Days</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">{pricing.driverAvailability}%</div>
                      <div className="text-sm text-green-700">Driver Availability</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        {PricingService.formatPrice(pricing.totalPrice)}
                      </div>
                      <div className="text-sm text-green-700">Total Price</div>
                    </div>
                  </div>

                  <div className="border-t border-green-200 pt-4">
                    <h4 className="font-semibold text-green-900 mb-2">Price Breakdown:</h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <div>{pricing.priceBreakdown.baseCalculation}</div>
                      <div>{pricing.priceBreakdown.availabilityAdjustment}</div>
                      <div className="font-semibold text-green-900">{pricing.priceBreakdown.finalTotal}</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h5 className="font-medium text-blue-900 mb-1">Pricing Formula:</h5>
                    <div className="text-sm text-blue-700">
                      Base Price = Rs.30 × Distance(km) × School Days<br/>
                      Availability Adjustment = Base Price × 20% × (100% - Availability%)<br/>
                      Total Price = Base Price + Availability Adjustment
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingDemo;
