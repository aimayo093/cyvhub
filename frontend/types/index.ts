export type UserRole = 'driver' | 'customer' | 'admin' | 'carrier';

export type JobStatus =
  | 'DRAFT'
  | 'PENDING_DISPATCH'
  | 'ASSIGNED'
  | 'DRIVER_ACCEPTED'
  | 'EN_ROUTE_TO_PICKUP'
  | 'ARRIVED_PICKUP'
  | 'PICKED_UP'
  | 'EN_ROUTE_TO_DROPOFF'
  | 'ARRIVED_DROPOFF'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type JobPriority = 'NORMAL' | 'URGENT';

export type DeliveryStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DRIVER_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export type QuoteStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

export type SLAStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'MET';

export interface Parcel {
  id: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  quantity: number;
  description?: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  status: JobStatus;
  priority: JobPriority;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupAddressLine1: string;
  pickupCity: string;
  pickupPostcode: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  dropoffContactName: string;
  dropoffContactPhone: string;
  dropoffAddressLine1: string;
  dropoffCity: string;
  dropoffPostcode: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  dropoffWindowStart: string;
  dropoffWindowEnd: string;
  vehicleType: string;
  specialInstructions?: string;
  goodsDescription?: string;
  calculatedPrice: number;
  payoutAmount?: number;
  distanceKm?: number;
  businessName?: string;
  categoryName: string;
  createdAt: string;
  completedAt?: string;
  slaTarget?: string;
  slaStatus?: SLAStatus;
  carbonKg?: number;
  podSignature?: boolean;
  podPhotos?: number;
  podNotes?: string;
  assignedDriver?: string;
  assignedCarrier?: string;
  parcels?: Parcel[];
  notes?: any[];
}

export interface DriverProfile {
  id: string;
  userId: string;
  driverNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  licenceNumber: string;
  licenceExpiry: string;
  currentStatus: 'AVAILABLE' | 'ON_JOB' | 'OFFLINE' | 'BREAK';
  totalJobsCompleted: number;
  rating: number;
  memberSince: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  defaultAddress?: string;
  defaultCity?: string;
  defaultPostcode?: string;
  totalDeliveries: number;
  memberSince: string;
  businessAccountId?: string | null;
}

export interface Delivery {
  id: string;
  jobNumber: string;
  trackingNumber: string;
  status: DeliveryStatus;
  pickupAddress: string;
  pickupCity: string;
  pickupPostcode: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropoffAddress: string;
  dropoffCity: string;
  dropoffPostcode: string;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  pickupContact: string;
  dropoffContact: string;
  packageDescription: string;
  vehicleType: string;
  estimatedPrice: number;
  calculatedPrice: number;
  driverName?: string;
  driverPhone?: string;
  driverId?: string;
  estimatedPickup?: string;
  estimatedDelivery?: string;
  createdAt: string;
  deliveredAt?: string;
  jobType?: string;
  specialInstructions?: string;
  pickupTimeWindow?: string;
  deliveryTimeWindow?: string;
  slaStatus?: SLAStatus;
  aiEta?: string;
  aiEtaConfidence?: number;
  paymentStatus?: PaymentStatus;
  parcels?: Parcel[];
}

export interface ComplianceItem {
  id: string;
  type: string;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING';
  expiryDate?: string;
}

export interface EarningsData {
  period: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  jobsCompleted: number;
  hoursWorked: number;
  milesDriven: number;
}

export interface DailyEarning {
  date: string;
  dayLabel: string;
  amount: number;
  jobs: number;
}

export interface ActivityItem {
  id: string;
  type: 'delivery_created' | 'delivery_picked_up' | 'delivery_completed' | 'payment' | 'rating';
  title: string;
  subtitle: string;
  timestamp: string;
  amount?: number;
  deliveryId?: string;
}

export interface AdminProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'super_admin' | 'admin' | 'support';
  memberSince: string;
}



export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'DRAFT';
  amount: number;
  date: string;
  dueDate: string;
  items: number;
  description: string;
}

export interface PlatformStats {
  totalDrivers: number;
  activeDrivers: number;
  totalCustomers: number;
  totalBusinesses: number;
  totalCarriers: number;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalRevenue: number;
  monthlyRevenue: number;
  avgDeliveryTime: string;
  slaComplianceRate: number;
  carbonSavedKg: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'driver' | 'customer' | 'carrier' | 'business';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  joinDate: string;
  totalActivity: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  businessName: string;
  businessId: string;
  pickupCity: string;
  pickupPostcode: string;
  dropoffCity: string;
  dropoffPostcode: string;
  vehicleType: string;
  jobType: string;
  distanceKm: number;
  estimatedPrice: number;
  finalPrice?: number;
  slaRequirement: string;
  notes?: string;
  createdAt: string;
  expiresAt: string;
  convertedJobId?: string;
}



export interface DispatchJob {
  id: string;
  jobNumber: string;
  status: JobStatus;
  priority: JobPriority;
  pickupCity: string;
  dropoffCity: string;
  vehicleType: string;
  calculatedPrice: number;
  slaStatus: SLAStatus;
  slaTarget: string;
  businessName: string;
  assignedTo?: string;
  assignedType?: 'driver' | 'carrier';
  distanceKm: number;
  createdAt: string;
  notes?: any[];
  trackingNumber?: string;
}

export interface AnalyticsData {
  jobVolume: { month: string; count: number }[];
  slaCompliance: { month: string; rate: number }[];
  costPerRoute: { route: string; avgCost: number; jobs: number }[];
  topDrivers: { name: string; jobs: number; rating: number; sla: number }[];
  topCarriers: { name: string; jobs: number; rating: number; sla: number }[];
  delayHotspots: { location: string; avgDelay: number; incidents: number }[];
  carbonByMonth: { month: string; kgCO2: number }[];
}

export interface CarrierProfile {
  id: string;
  userId: string;
  companyName: string;
  tradingName: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  avatar?: string;
  registrationNumber: string;
  vatNumber: string;
  insuranceExpiry: string;
  operatorLicence: string;
  operatorLicenceExpiry: string;
  coverageRegions: string[];
  status: 'APPROVED' | 'PENDING' | 'SUSPENDED';
  totalJobsCompleted: number;
  slaScore: number;
  rating: number;
  memberSince: string;
}

export interface FleetVehicle {
  id: string;
  registration: string;
  type: string;
  make: string;
  model: string;
  year: number;
  capacity: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  currentDriver?: string;
  motExpiry: string;
  insuranceExpiry: string;
  lastService: string;
}

export interface CarrierRateCard {
  id: string;
  vehicleType: string;
  baseRate: number;
  perKmRate: number;
  perStopRate: number;
  weekendSurcharge: number;
  outOfHoursSurcharge: number;
  heavyGoodsSurcharge: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'DRAFT' | 'EXPIRED';
}

export interface CarrierEarnings {
  period: string;
  totalRevenue: number;
  completedJobs: number;
  avgPerJob: number;
  pendingPayment: number;
  paidOut: number;
}

export interface CarrierPerformance {
  month: string;
  jobsCompleted: number;
  slaCompliance: number;
  onTimePercent: number;
  revenue: number;
  avgRating: number;
}

export interface BusinessAccount {
  id: string;
  companyName: string;
  tradingName: string;
  registrationNumber: string;
  vatNumber: string;
  billingAddress: string;
  billingCity: string;
  billingPostcode: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  billingTerms: string;
  creditLimit: number;
  currentBalance: number;
  status: 'ACTIVE' | 'ON_HOLD' | 'SUSPENDED' | 'PENDING';
  industryProfile: 'Construction' | 'IT / Technology' | 'Manufacturing' | 'Wholesale / Distribution' | 'Medical' | 'Furniture' | 'Custom';
  totalJobs: number;
  totalSpend: number;
  slaCompliance: number;
  joinDate: string;
  contractId?: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  businessId: string;
  businessName: string;
  status: 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'PENDING';
  startDate: string;
  endDate: string;
  rateRules: ContractRateRule[];
  surcharges: ContractSurcharges;
  slaDefaults: SLADefaults;
  totalValue: number;
  createdAt: string;
  businessAccount?: {
    companyName?: string;
    tradingName?: string;
  };
}

export interface ContractRateRule {
  vehicleType: string;
  baseRate: number;
  perKmRate: number;
  perStopRate: number;
  vehicleMultiplier: number;
}

export interface ContractSurcharges {
  weekend: number;
  outOfHours: number;
  heavyGoods: number;
  urgentDelivery: number;
}

export interface SLADefaults {
  standardDeliveryHours: number;
  urgentDeliveryHours: number;
  sameDayDeliveryHours: number;
  breachPenaltyPercent: number;
}

export interface AdminCarrierView {
  id: string;
  companyName: string;
  tradingName: string;
  contactName: string;
  email: string;
  phone: string;
  status: 'APPROVED' | 'PENDING' | 'SUSPENDED';
  coverageRegions: string[];
  totalJobs: number;
  slaScore: number;
  rating: number;
  activeVehicles: number;
  totalVehicles: number;
  complianceStatus: 'COMPLIANT' | 'EXPIRING_SOON' | 'NON_COMPLIANT';
  joinDate: string;
  preferredFor?: string[];
}

export interface AIDispatchSuggestion {
  id: string;
  jobNumber: string;
  pickupCity: string;
  dropoffCity: string;
  vehicleType: string;
  suggestedAssignee: string;
  assigneeType: 'driver' | 'carrier';
  confidence: number;
  reasons: string[];
  estimatedETA: string;
  slaRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AISLARiskPrediction {
  id: string;
  jobNumber: string;
  businessName: string;
  route: string;
  currentStatus: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  predictedDelay: number;
  reasons: string[];
  suggestedAction: string;
}

export interface AIAnomalyAlert {
  id: string;
  type: 'ROUTE_DELAY' | 'CARRIER_PERFORMANCE' | 'COST_SPIKE' | 'SLA_PATTERN' | 'DRIVER_ISSUE';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  affectedEntity: string;
  detectedAt: string;
  suggestedAction: string;
  acknowledged: boolean;
}

export interface LiveActivityEvent {
  id: string;
  type: 'JOB_CREATED' | 'JOB_ASSIGNED' | 'STATUS_CHANGE' | 'SLA_BREACH' | 'DELIVERY_COMPLETE' | 'CARRIER_JOINED' | 'INVOICE_PAID' | 'QUOTE_RECEIVED';
  title: string;
  description: string;
  timestamp: string;
  entityId?: string;
  severity?: 'info' | 'warning' | 'success' | 'danger';
}

export type DriverNotificationType = 'new_job' | 'sla_warning' | 'assignment_change' | 'job_update' | 'compliance' | 'system';

export interface DriverNotification {
  id: string;
  type: DriverNotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  jobId?: string;
  severity: 'info' | 'warning' | 'urgent';
}

export interface SustainabilityData {
  emissionsPerJob: { jobNumber: string; route: string; kgCO2: number; vehicleType: string }[];
  emissionsByRoute: { route: string; totalKgCO2: number; avgKgCO2: number; jobs: number }[];
  emissionsByBusiness: { business: string; totalKgCO2: number; jobs: number; trend: 'up' | 'down' | 'stable' }[];
  monthlyTrend: { month: string; kgCO2: number; jobCount: number; avgPerJob: number }[];
  aiSuggestions: { id: string; title: string; description: string; potentialSaving: number; difficulty: 'EASY' | 'MEDIUM' | 'HARD' }[];
}

export type PaymentMethod = 'stripe' | 'paypal';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'ON_HOLD';

export interface PaymentCard {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface PayPalAccount {
  id: string;
  email: string;
  isDefault: boolean;
}

export interface PaymentTransaction {
  id: string;
  type: 'charge' | 'refund' | 'payout';
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  description: string;
  deliveryId?: string;
  trackingNumber?: string;
  jobNumber?: string;
  customerName?: string;
  customerEmail?: string;
  cardLast4?: string;
  paypalEmail?: string;
  stripePaymentId?: string;
  paypalOrderId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PayoutRecord {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientType: 'driver' | 'carrier';
  status: PayoutStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  periodStart: string;
  periodEnd: string;
  jobsCount: number;
  deductions: number;
  grossAmount: number;
  bankAccount?: string;
  paypalEmail?: string;
  stripeAccountId?: string;
  createdAt: string;
  paidAt?: string;
  reference: string;
}

export interface PaymentSummary {
  totalRevenue: number;
  totalPayouts: number;
  platformFees: number;
  pendingPayments: number;
  pendingPayouts: number;
  stripeBalance: number;
  paypalBalance: number;
  monthlyRevenue: { month: string; revenue: number; payouts: number; fees: number }[];
}

// === Location Tracking Types ===

export interface DriverLocation {
  driverId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  timestamp: string;
  status: 'AVAILABLE' | 'ON_JOB' | 'OFFLINE' | 'BREAK';
  currentJobId?: string;
  vehicleType?: string;
}

export interface TrackingSession {
  deliveryId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  driverLocation: DriverLocation;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  routeCoordinates: { latitude: number; longitude: number }[];
  estimatedArrival: string;
  distanceRemaining: number;
  status: DeliveryStatus;
}

// === Settlement & Accounting Types ===

export type SettlementStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED';

export interface SettlementDeduction {
  type: 'platform_fee' | 'insurance' | 'tax' | 'adjustment' | 'penalty';
  description: string;
  amount: number;
}

export interface SettlementBatch {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientType: 'driver' | 'carrier';
  periodStart: string;
  periodEnd: string;
  jobIds: string[];
  jobsCount: number;
  grossAmount: number;
  deductions: SettlementDeduction[];
  totalDeductions: number;
  netAmount: number;
  status: SettlementStatus;
  method: PaymentMethod;
  approvedBy?: string;
  approvedAt?: string;
  processedAt?: string;
  reference: string;
  createdAt: string;
  notes?: string;
}

export type AccountingEntryType = 'credit' | 'debit';
export type AccountingCategory = 'delivery_revenue' | 'delivery_payment' | 'driver_payout' | 'carrier_payout' | 'platform_fee' | 'refund' | 'adjustment' | 'insurance_levy' | 'tax';

export interface AccountingEntry {
  id: string;
  type: AccountingEntryType;
  category: AccountingCategory;
  amount: number;
  description: string;
  date: string;
  reference: string;
  recipientId?: string;
  recipientName?: string;
  settlementId?: string;
  balance: number;
}
