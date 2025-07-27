export interface Driver {
  id: string;
  phoneNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  city: string;
  vehicleType: 'school-bus' | 'van' | 'mini-van';
  seatCapacity: number;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  vehiclePlate: string;
  profilePicture?: string;
  nicDocument?: string;
  insuranceDocument?: string;
  licenseDocument?: string;
  whatsappConnected: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  route?: {
    startPoint: {
      address: string;
      coordinates: { lat: number; lng: number };
    };
    endPoint: {
      address: string;
      coordinates: { lat: number; lng: number };
    };
  };
}

export interface RegistrationStep {
  step: number;
  completed: boolean;
  data?: any;
}