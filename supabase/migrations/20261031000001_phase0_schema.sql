-- ==============================================================================
-- THE ROYAL KNOT - Luxury Wedding Agency Management Platform
-- Phase 0 Schema Migration: 19 Tables with UUIDs, Foreign Keys, RLS, and Indexes
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. TEAM MEMBERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Wedding Planner',
    phone TEXT,
    avatar_url TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. COUPLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_1_name TEXT NOT NULL,
    partner_2_name TEXT NOT NULL,
    primary_contact_name TEXT,
    email TEXT,
    phone TEXT NOT NULL,
    city TEXT DEFAULT 'Jaipur',
    notes TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. PACKAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tier TEXT NOT NULL DEFAULT 'Full-Service', -- 'Full-Service', 'Partial / Day-of'
    description TEXT,
    starting_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. ENQUIRIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    stage TEXT NOT NULL CHECK (stage IN ('New', 'Contacted', 'Meeting', 'Proposal', 'Won', 'Lost')) DEFAULT 'New',
    guests INTEGER NOT NULL DEFAULT 400,
    budget NUMERIC(14, 2) NOT NULL DEFAULT 0,
    theme TEXT,
    source TEXT,
    package TEXT NOT NULL DEFAULT 'Full-Service',
    package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
    wedding_date DATE,
    city TEXT NOT NULL DEFAULT 'Jaipur',
    notes TEXT,
    assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. WEDDINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
    enquiry_id UUID REFERENCES enquiries(id) ON DELETE SET NULL,
    package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
    lead_planner_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    wedding_date DATE NOT NULL,
    wedding_end_date DATE,
    city TEXT NOT NULL DEFAULT 'Jaipur' CHECK (city IN ('Jaipur', 'Udaipur', 'Jodhpur', 'Other')),
    venue TEXT NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 400,
    total_budget NUMERIC(14, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('Planning', 'Confirmed', 'In Progress', 'Completed', 'Cancelled')) DEFAULT 'Confirmed',
    theme TEXT,
    notes TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. VENDORS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Jaipur',
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.8 CHECK (rating >= 1.0 AND rating <= 5.0),
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 7. QUOTE REQUESTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    scope_description TEXT NOT NULL,
    requested_deadline DATE,
    status TEXT NOT NULL CHECK (status IN ('Open', 'Quotes Received', 'Awarded', 'Closed')) DEFAULT 'Open',
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. VENDOR QUOTES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    proposed_terms TEXT,
    status TEXT NOT NULL CHECK (status IN ('Submitted', 'Shortlisted', 'Accepted', 'Rejected')) DEFAULT 'Submitted',
    valid_until DATE,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 9. WEDDING VENDORS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wedding_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    role_description TEXT,
    agreed_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    advance_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
    arrived_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('Confirmed', 'Contract Signed', 'Deposit Paid', 'Completed')) DEFAULT 'Confirmed',
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_wedding_vendor UNIQUE (wedding_id, vendor_id)
);

-- ------------------------------------------------------------------------------
-- 10. TASK TEMPLATES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    phase TEXT NOT NULL,
    offset_days_from_wedding INTEGER NOT NULL,
    default_role TEXT NOT NULL DEFAULT 'Lead Planner',
    package TEXT NOT NULL DEFAULT 'All',
    package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 11. WEDDING TASKS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wedding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    phase TEXT,
    stage TEXT NOT NULL CHECK (stage IN ('To Plan', 'In Progress', 'Blocked', 'Done')) DEFAULT 'To Plan',
    owner UUID REFERENCES team_members(id) ON DELETE SET NULL,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 12. GUESTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    party_size INTEGER NOT NULL DEFAULT 1,
    side TEXT CHECK (side IN ('Bride', 'Groom', 'Both', 'VIP')) DEFAULT 'Both',
    rsvp_status TEXT CHECK (rsvp_status IN ('Pending', 'Attending', 'Declined')) DEFAULT 'Pending',
    dietary_notes TEXT,
    hotel_assigned TEXT,
    room_number TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 13. CONTRACTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    signature_url TEXT,
    signed_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Sent', 'Signed', 'Expired')) DEFAULT 'Draft',
    terms TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 14. CLIENT PAYMENTS (3 Stages: Booking, Advance, Final)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    milestone TEXT NOT NULL CHECK (milestone IN ('Booking', 'Advance', 'Final')),
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    payment_method TEXT,
    transaction_reference TEXT,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Paid', 'Overdue')) DEFAULT 'Pending',
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 15. VENDOR BILLS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    invoice_number TEXT,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Paid')) DEFAULT 'Pending',
    notes TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 16. VENDOR PAYMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES vendor_bills(id) ON DELETE SET NULL,
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    idempotency_key TEXT NOT NULL UNIQUE,
    payment_reference TEXT,
    status TEXT NOT NULL CHECK (status IN ('Initiated', 'Completed', 'Failed')) DEFAULT 'Completed',
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 17. EXPENSES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    incurred_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 18. SCHEDULE ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    venue_sublocation TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    lead_coordinator_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 19. INCIDENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    status TEXT NOT NULL CHECK (status IN ('Reported', 'Resolving', 'Resolved')) DEFAULT 'Reported',
    reported_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & FAST LOOKUPS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_enquiries_stage ON enquiries(stage);
CREATE INDEX IF NOT EXISTS idx_enquiries_wedding_date ON enquiries(wedding_date);
CREATE INDEX IF NOT EXISTS idx_weddings_status ON weddings(status);
CREATE INDEX IF NOT EXISTS idx_weddings_wedding_date ON weddings(wedding_date);
CREATE INDEX IF NOT EXISTS idx_client_payments_wedding ON client_payments(wedding_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_status ON client_payments(status);
CREATE INDEX IF NOT EXISTS idx_client_payments_milestone ON client_payments(milestone);
CREATE INDEX IF NOT EXISTS idx_wedding_vendors_wedding ON wedding_vendors(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_vendors_vendor ON wedding_vendors(vendor_id);
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_wedding ON wedding_tasks(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_stage ON wedding_tasks(stage);
CREATE INDEX IF NOT EXISTS idx_expenses_wedding ON expenses(wedding_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Security Model:
-- - RLS enabled on all 19 tables.
-- - anon role receives SELECT (read-only) policies only.
-- - No anon INSERT, UPDATE, or DELETE policies exist.
-- - All mutations execute through Next.js server actions/APIs using service_role key.
-- ==============================================================================

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'team_members',
        'couples',
        'packages',
        'enquiries',
        'weddings',
        'vendors',
        'quote_requests',
        'vendor_quotes',
        'wedding_vendors',
        'task_templates',
        'wedding_tasks',
        'guests',
        'contracts',
        'client_payments',
        'vendor_bills',
        'vendor_payments',
        'expenses',
        'schedule_items',
        'incidents'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        
        -- Drop existing policy if any
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon and auth read access" ON %I;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow service_role full management" ON %I;', t);
        
        -- Grant SELECT only to anon and authenticated
        EXECUTE format('CREATE POLICY "Allow anon and auth read access" ON %I FOR SELECT TO anon, authenticated USING (true);', t);
        
        -- Grant full access to service_role (used by server actions and seed scripts)
        EXECUTE format('CREATE POLICY "Allow service_role full management" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true);', t);
    END LOOP;
END $$;
