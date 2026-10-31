export type Stage = 'New' | 'Contacted' | 'Meeting' | 'Proposal' | 'Won' | 'Lost';
export type WeddingStatus = 'Planning' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
export type PaymentMilestone = 'Booking' | 'Advance' | 'Final';
export type PaymentStatus = 'Pending' | 'Paid' | 'Overdue';
export type TaskStage = 'To Plan' | 'In Progress' | 'Blocked' | 'Done';

export interface Couple {
  id: string;
  partner_1_name: string;
  partner_2_name: string;
  primary_contact_name?: string;
  email?: string;
  phone: string;
  city?: string;
  notes?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  tier: string;
  description?: string;
  starting_price: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enquiry {
  id: string;
  couple_name: string;
  phone: string;
  email?: string;
  stage: Stage;
  guests: number;
  budget: number;
  theme?: string;
  source?: string;
  package: string;
  package_id?: string;
  wedding_date?: string;
  city: string;
  notes?: string;
  assigned_to?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wedding {
  id: string;
  title: string;
  couple_id?: string;
  enquiry_id?: string;
  package_id?: string;
  lead_planner_id?: string;
  wedding_date: string;
  wedding_end_date?: string;
  city: string;
  venue: string;
  guest_count: number;
  total_budget: number;
  contract_value?: number;
  status: WeddingStatus;
  theme?: string;
  notes?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  contact_person?: string;
  phone?: string;
  email?: string;
  notes?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientPayment {
  id: string;
  wedding_id: string;
  milestone: PaymentMilestone;
  amount: number;
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  transaction_reference?: string;
  status: PaymentStatus;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeddingVendor {
  id: string;
  wedding_id: string;
  vendor_id: string;
  role_description?: string;
  category?: string;
  agreed_amount: number;
  advance_paid: number;
  source_quote_id?: string;
  arrival_status?: string;
  arrived_at?: string;
  status: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

export interface QuoteRequest {
  id: string;
  wedding_id: string;
  category: string;
  scope_description?: string;
  guest_count: number;
  requested_deadline?: string;
  status: 'Open' | 'Quotes Received' | 'Awarded' | 'Closed';
  awarded_quote_id?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  wedding?: {
    id: string;
    title: string;
    city: string;
    guest_count: number;
  };
  quotes_count?: number;
}

export interface VendorQuote {
  id: string;
  quote_request_id: string;
  vendor_id: string;
  amount?: number;
  price_per_plate: number;
  extra_hour_rate: number;
  inclusions: string[];
  total: number;
  status: 'Submitted' | 'Shortlisted' | 'Accepted' | 'Rejected' | 'Awarded' | 'Closed';
  notes?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

export interface Contract {
  id: string;
  wedding_id?: string;
  enquiry_id?: string;
  title: string;
  total_value: number;
  signature_url?: string;
  signed_at?: string;
  status: 'Draft' | 'Sent' | 'Signed' | 'Expired';
  terms?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplate {
  id: string;
  title: string;
  phase: string;
  offset_days_from_wedding: number;
  default_role: string;
  package: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeddingTask {
  id: string;
  wedding_id: string;
  title: string;
  phase?: string;
  stage: TaskStage;
  owner?: string;
  due_date?: string;
  completed_at?: string;
  notes?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  wedding?: {
    id: string;
    title: string;
  };
  owner_member?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar_url?: string;
  is_demo: boolean;
}

export interface RecentEvent {
  id: string;
  type: "enquiry" | "payment" | "award";
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
}

export interface OverviewMetrics {
  activeWeddingsCount: number;
  newEnquiriesCount: number;
  confirmedBookingsCount: number;
  totalRevenue: number;
  outstandingPayments: number;
  estimatedProfit: number;
  openQuoteRequestsCount: number;
  monthlyRevenue: { month: string; amount: number }[];
  pipelineStages: { stage: Stage; count: number; value: number }[];
  upcomingWeddings: (Wedding & { couple_names?: string })[];
  recentEvents?: RecentEvent[];
}

export interface ScheduleItem {
  id: string;
  wedding_id: string;
  title: string;
  event_name?: string;
  venue_sublocation?: string;
  scheduled_time: string;
  start_time?: string;
  end_time?: string;
  responsible_vendor_id?: string | null;
  responsible_member_id?: string | null;
  status: 'Pending' | 'Live' | 'Done' | 'Delayed';
  arrived_at?: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  vendor?: {
    id: string;
    name?: string;
    business_name?: string;
    category: string;
    phone?: string;
  } | null;
  team_member?: {
    id: string;
    name: string;
    role: string;
    phone?: string;
  } | null;
}

export interface Incident {
  id: string;
  wedding_id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Resolved' | 'Reported' | 'Resolving';
  owner_id?: string | null;
  reported_by?: string | null;
  resolution?: string | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

