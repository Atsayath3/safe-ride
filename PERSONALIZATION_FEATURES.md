# SafeWeb Personalization Features

## Overview
This document outlines the three key personalization features implemented in SafeWeb to enhance the user experience for parents managing their children's transportation needs.

## Features Implemented

### 1. 🧑‍🤝‍🧑 Sibling Coordination

**Purpose**: Group rides for multiple children with intelligent cost splitting

**Key Features**:
- **Create Sibling Groups**: Organize children into groups for regular travel together
- **Default Routes**: Set common pickup and drop-off locations
- **Cost Splitting Methods**:
  - Equal split (default)
  - Weighted by age/factors
  - Custom ratios
- **Group Booking**: Book rides for entire sibling groups
- **Scheduling**: Set preferred times for group rides

**Components**:
- `SiblingCoordination.tsx` - Main UI component
- `SiblingCoordinationService.ts` - Backend service logic
- `GroupRideRequest` interface for booking management

**Usage Example**:
```typescript
// Create a sibling group
await SiblingCoordinationService.createSiblingGroup(parentId, {
  name: "School Group",
  childIds: ["child1", "child2"],
  costSplitMethod: "equal",
  defaultPickupLocation: "Home",
  defaultDropoffLocation: "Royal College"
});

// Book group ride
const costSplit = SiblingCoordinationService.calculateCostSplit(
  1500, // total cost
  children,
  "equal"
);
```

### 2. 💰 Budget Tracking

**Purpose**: Monitor and control monthly transportation expenses per child

**Key Features**:
- **Monthly Limits**: Set spending limits for each child
- **Real-time Tracking**: Monitor current spending vs budget
- **Smart Notifications**:
  - Warning at 80% (configurable)
  - Alert when limit exceeded
  - Weekly spending reports
- **Expense History**: Detailed breakdown of rides and costs
- **Visual Progress**: Progress bars and status indicators

**Components**:
- `BudgetTracking.tsx` - Main UI component
- `BudgetTrackingService.ts` - Backend service logic
- `BudgetLimit` and `MonthlyExpense` interfaces

**Usage Example**:
```typescript
// Set budget limit
await BudgetTrackingService.createBudgetLimit({
  childId: "child1",
  monthlyLimit: 5000,
  warningThreshold: 80,
  notifications: {
    warningEnabled: true,
    limitReachedEnabled: true,
    weeklyReportEnabled: true
  }
});

// Add expense after ride
await BudgetTrackingService.addExpense(
  childId,
  rideId,
  amount,
  driverName,
  route
);
```

### 3. ⭐ Trusted Driver Network

**Purpose**: Build and manage a personal network of preferred drivers

**Key Features**:
- **Driver Profiles**: Complete driver information with photos
- **Rating System**: 5-star ratings with category breakdowns:
  - Safety
  - Punctuality
  - Cleanliness
  - Communication
  - Child-friendliness
- **Preference Management**:
  - Mark drivers as "Preferred"
  - Set "Priority" drivers for emergencies
- **Availability Tracking**: Driver schedules by day/time
- **Specialties**: Tag drivers with special skills
- **Recommendation Engine**: Suggest drivers based on ratings and criteria

**Components**:
- `TrustedDriverNetwork.tsx` - Main UI component
- `TrustedDriverService.ts` - Backend service logic
- `TrustedDriver` and `DriverRating` interfaces

**Usage Example**:
```typescript
// Add trusted driver
await TrustedDriverService.addTrustedDriver(parentId, {
  driverName: "John Silva",
  phone: "+94771234567",
  vehicleInfo: {
    make: "Toyota",
    model: "Prius",
    color: "White",
    plateNumber: "ABC-1234"
  },
  specialties: ["Patient with children", "Punctual"],
  isPreferred: true
});

// Rate driver after ride
await TrustedDriverService.rateDriver({
  driverId: "driver123",
  rating: 5,
  categories: {
    safety: 5,
    punctuality: 4,
    cleanliness: 5,
    communication: 5,
    childFriendliness: 5
  },
  review: "Excellent driver, very patient with my children"
});
```

## Integration Dashboard

### PersonalizationDashboard Component
A comprehensive dashboard that brings all three features together:

- **Overview Tab**: Quick stats and alerts
- **Sibling Groups Tab**: Manage group rides
- **Budget Tracking Tab**: Monitor spending
- **Trusted Drivers Tab**: Manage driver network

**Route**: `/parent/personalization`

## Data Models

### Core Interfaces

```typescript
interface SiblingGroup {
  id: string;
  name: string;
  childIds: string[];
  defaultPickupLocation: string;
  defaultDropoffLocation: string;
  costSplitMethod: 'equal' | 'weighted' | 'custom';
  // ... other properties
}

interface BudgetLimit {
  id: string;
  childId: string;
  monthlyLimit: number;
  currentSpent: number;
  warningThreshold: number;
  notifications: {
    warningEnabled: boolean;
    limitReachedEnabled: boolean;
    weeklyReportEnabled: boolean;
  };
  // ... other properties
}

interface TrustedDriver {
  id: string;
  driverName: string;
  phone: string;
  vehicleInfo: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  rating: number;
  specialties: string[];
  isPreferred: boolean;
  isPriority: boolean;
  // ... other properties
}
```

## Firebase Collections

The features use the following Firestore collections:

- `siblingGroups` - Sibling group configurations
- `groupRideRequests` - Group ride bookings
- `budgetLimits` - Budget limit settings
- `monthlyExpenses` - Monthly expense tracking
- `trustedDrivers` - Trusted driver profiles
- `driverRatings` - Driver rating history
- `notifications` - Budget and system notifications

## Benefits

### For Parents:
1. **Cost Savings**: Coordinate rides to split costs between siblings
2. **Budget Control**: Set and monitor spending limits
3. **Quality Assurance**: Build network of trusted, rated drivers
4. **Peace of Mind**: Know exactly who is driving your children

### For the Platform:
1. **Increased Loyalty**: Personal networks keep users engaged
2. **Better Matching**: Prefer trusted drivers for bookings
3. **Quality Improvement**: Rating system drives driver excellence
4. **Reduced Support**: Self-managed preferences reduce complaints

## Future Enhancements

1. **Smart Scheduling**: AI-powered optimal group ride scheduling
2. **Dynamic Pricing**: Adjust prices based on trust level and ratings
3. **Social Features**: Share driver recommendations with friends
4. **Integration**: Connect with school calendars and events
5. **Analytics**: Detailed spending and usage analytics
6. **Loyalty Programs**: Reward frequent users and top-rated drivers

## Security Considerations

- All personal data encrypted at rest and in transit
- Driver verification through background checks
- Rating system prevents fake reviews
- Budget notifications prevent overspending
- Emergency contact integration for safety

## API Integration

The features integrate seamlessly with existing SafeWeb APIs:
- Authentication system for user management
- Booking system for ride requests
- Payment system for cost tracking
- Notification system for alerts
- Maps API for location services

This personalization system transforms SafeWeb from a simple ride-sharing app into a comprehensive family transportation management platform.