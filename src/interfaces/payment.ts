export interface PaymentTransactionRecord {
  id?: string;
  bookingId: string;
  parentId: string;
  driverId: string;
  totalAmount: number;
  upfrontPaid: number;
  balancePaid: number;
  systemCommission: number;
  payhereFee: number;
  driverEarning: number;
  status: 'pending_upfront' | 'upfront_paid' | 'fully_paid' | 'overdue' | 'suspended';
  upfrontPaymentDate?: Date;
  balancePaymentDate?: Date;
  balanceDueDate: Date;
  remindersSent: {
    threeDays: boolean;
    oneDay: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverWallet {
  id?: string;
  driverId: string;
  totalEarnings: number;
  pendingPayouts: number;
  lastPayoutDate?: Date;
  transactions: WalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  bookingId: string;
  parentId: string;
  amount: number;
  type: 'upfront_earning' | 'balance_earning' | 'payout';
  date: Date;
  status: 'pending' | 'completed';
  payoutBatchId?: string;
}

export interface PayoutBatch {
  id?: string;
  driverIds: string[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  transactions: PayoutTransaction[];
}

export interface PayoutTransaction {
  driverId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  paymentType: 'upfront' | 'balance';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  gatewayResponse?: any;
}

export interface PaymentCalculation {
  totalAmount: number;
  upfrontAmount: number;
  balanceAmount: number;
  payhereFee: number;
  systemCommission: number;
  driverEarning: number;
  balanceDueDate: Date;
}

// Legacy interfaces for backward compatibility
export interface PaymentRecord {
  id: string;
  bookingId: string;
  parentId: string;
  driverId: string;
  amount: number;
  totalAmount: number;
  remainingAmount: number;
  paymentStatus: 'pending' | 'partial' | 'completed' | 'failed' | 'overdue';
  paymentMethod: 'card' | 'bank_transfer' | 'mobile_payment' | 'cash';
  transactionId?: string;
  paymentDate: Date;
  dueDate: Date;
  finalPaymentDue: Date; // 2 days before trip ends
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    gatewayResponse?: any;
    notes?: string;
  };
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  amount: number;
  transactionType: 'initial' | 'partial' | 'final' | 'refund';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  gatewayResponse?: any;
  createdAt: Date;
}

export interface PaymentGatewayConfig {
  provider: 'stripe' | 'payhere' | 'mock'; // Mock for testing
  publicKey: string;
  currency: 'LKR' | 'USD';
  minimumAmount: number;
  maximumAmount: number;
}

export interface LegacyPaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  description: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  amount?: number;
  status: 'completed' | 'pending' | 'failed';
  message: string;
  gatewayResponse?: any;
}

export interface PaymentReminder {
  id: string;
  paymentId: string;
  reminderType: 'final_payment_due' | 'overdue_payment' | 'payment_confirmation';
  sentAt: Date;
  scheduledFor: Date;
  status: 'scheduled' | 'sent' | 'failed';
  method: 'email' | 'sms' | 'push_notification';
}
