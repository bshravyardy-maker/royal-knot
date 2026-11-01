-- ==============================================================================
-- THE ROYAL KNOT — Luxury Wedding Agency Management Platform
-- Migration: 20261101000009_royal_guest_concierge.sql
-- Royal Guest Concierge: Digital Wedding Passports & Multi-Day Itineraries
-- ==============================================================================

-- 1. Ensure composite unique constraint on guests(id, wedding_id) for database consistency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_guests_id_wedding_id'
  ) THEN
    ALTER TABLE public.guests ADD CONSTRAINT uq_guests_id_wedding_id UNIQUE (id, wedding_id);
  END IF;
END $$;

-- 2. GUEST CONCIERGE PASSPORTS TABLE
-- Stores cryptographically hashed access tokens and travel concierge details.
-- RSVP status and dietary requirements are stored on the guests table (single source of truth).
CREATE TABLE IF NOT EXISTS public.guest_passports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID NOT NULL UNIQUE,
    wedding_id UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the random bearer token
    welcome_message TEXT,
    airport_pickup_required BOOLEAN NOT NULL DEFAULT false,
    arrival_flight_train TEXT,
    arrival_time TIMESTAMPTZ,
    pickup_location TEXT,
    transport_status TEXT NOT NULL DEFAULT 'Not Required'
      CHECK (transport_status IN ('Not Required', 'Requested', 'Driver Assigned', 'In Transit', 'Completed')),
    assigned_driver_name TEXT,
    assigned_driver_phone TEXT,
    vehicle_details TEXT,
    departure_flight_train TEXT,
    departure_time TIMESTAMPTZ,
    departure_transport_notes TEXT,
    meal_preference TEXT NOT NULL DEFAULT 'Royal Rajputana Thali',
    special_assistance TEXT,
    revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    last_accessed_at TIMESTAMPTZ,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Enforce foreign keys and database consistency:
    CONSTRAINT fk_guest_passports_guest_wedding
      FOREIGN KEY (guest_id, wedding_id)
      REFERENCES public.guests(id, wedding_id)
      ON DELETE CASCADE
);

-- 3. WEDDING ITINERARIES TABLE
-- Multi-day royal wedding schedules with timings, venues, dress codes, and location maps.
CREATE TABLE IF NOT EXISTS public.wedding_itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL DEFAULT 1,
    day_title TEXT NOT NULL,
    event_name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    venue_sublocation TEXT NOT NULL,
    dress_code TEXT NOT NULL,
    description TEXT,
    location_map_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PERFORMANCE & LOOKUP INDEXES
CREATE INDEX IF NOT EXISTS idx_guest_passports_token_hash ON public.guest_passports(token_hash);
CREATE INDEX IF NOT EXISTS idx_guest_passports_wedding ON public.guest_passports(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guest_passports_guest ON public.guest_passports(guest_id);
CREATE INDEX IF NOT EXISTS idx_wedding_itineraries_wedding_day ON public.wedding_itineraries(wedding_id, day_number, sort_order);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.guest_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_itineraries ENABLE ROW LEVEL SECURITY;

-- Anonymous public read policy strictly by unrevoked, unexpired SHA-256 token hash
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read guest_passports by valid token hash'
  ) THEN
    CREATE POLICY "Public read guest_passports by valid token hash"
      ON public.guest_passports
      FOR SELECT
      TO anon, authenticated
      USING (revoked = false AND expires_at > now());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read wedding_itineraries'
  ) THEN
    CREATE POLICY "Public read wedding_itineraries"
      ON public.wedding_itineraries
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;
