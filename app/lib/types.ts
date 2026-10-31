export type Stage = 'New' | 'Contacted' | 'Meeting' | 'Proposal' | 'Won' | 'Lost';
export type WeddingStatus = 'Planning' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
export type PaymentMilestone = 'Booking' | 'Advance' | 'Final';
export type PaymentStatus = 'Pending' | 'Paid' | 'Overdue';

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
  agreed_amount: number;
  advance_paid: number;
  arrived_at?: string;
  status: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface OverviewMetrics {
  activeWeddingsCount: number;
  newEnquiriesCount: number;
  confirmedBookingsCount: number;
  totalRevenue: number;
  outstandingPayments: number;
  estimatedProfit: number;
  monthlyRevenue: { month: string; amount: number }[];
  pipelineStages: { stage: Stage; count: number; value: number }[];
  upcomingWeddings: (Wedding & { couple_names?: string })[];
}
