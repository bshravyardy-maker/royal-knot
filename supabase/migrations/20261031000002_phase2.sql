-- ==============================================================================
-- THE ROYAL KNOT - Phase 2 Schema & Workflow Migration
-- Enquiry to Wedding Pipeline, Signatures Storage, RPC, and 30 Task Templates
-- ==============================================================================

-- 1. Private Storage Bucket for Signatures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'signatures',
    'signatures',
    false,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for signatures bucket
DO $$
BEGIN
    -- Drop existing storage policies if present
    DROP POLICY IF EXISTS "Service role full access on signatures" ON storage.objects;
    DROP POLICY IF EXISTS "Anon and authenticated select on signatures" ON storage.objects;

    -- Service role can upload, view, delete
    CREATE POLICY "Service role full access on signatures"
    ON storage.objects FOR ALL TO service_role
    USING (bucket_id = 'signatures')
    WITH CHECK (bucket_id = 'signatures');

    -- Anon and authenticated can read signatures for signed URL viewing
    CREATE POLICY "Anon and authenticated select on signatures"
    ON storage.objects FOR SELECT TO authenticated, anon
    USING (bucket_id = 'signatures');
EXCEPTION WHEN OTHERS THEN
    -- In some Supabase self-hosted or test environments storage schema is pre-configured
    NULL;
END $$;

-- 2. Schema Enhancements for Contracts & Weddings
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS enquiry_id UUID REFERENCES enquiries(id) ON DELETE CASCADE;
ALTER TABLE contracts ALTER COLUMN wedding_id DROP NOT NULL;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS couple_name TEXT;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS contract_value NUMERIC(14, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_contracts_enquiry ON contracts(enquiry_id);

-- 3. Seed 30 Task Templates across 7 Palatial Phases
-- Phases: Venue, Design, Vendors, Guests, Events, Day-of, Post-event
DELETE FROM task_templates WHERE is_demo = true;

INSERT INTO task_templates (title, phase, offset_days_from_wedding, default_role, package, is_demo) VALUES
-- Venue Phase
('Palace Venue Contract & Booking Deposit Confirmation', 'Venue', -120, 'Lead Planner', 'All', true),
('Heritage Department Permits & Firecracker Clearances', 'Venue', -90, 'Head of Logistics', 'All', true),
('On-site Technical Recce (Generators, Power & Lake Access)', 'Venue', -60, 'Head of Logistics', 'All', true),

-- Design Phase
('Mood Board & Imperial Rajputana Color Palette Finalization', 'Design', -100, 'Artisan Vendor Director', 'All', true),
('3D Floral Mandap & Architectural Stage Blueprint Signoff', 'Design', -75, 'Artisan Vendor Director', 'All', true),
('Royal Stationery, Gold Leaf Itineraries & Wax Seals Approval', 'Design', -60, 'Lead Planner', 'All', true),
('Ambient Illumination & Palace Facade Mapping Layout', 'Design', -45, 'Head of Logistics', 'All', true),

-- Vendors Phase
('Master Royal Feast Tasting & Silver Thali Menu Signoff', 'Vendors', -80, 'Lead Planner', 'All', true),
('Floral Artisan & Velvet Shamiana Vendor Contract Execution', 'Vendors', -70, 'Artisan Vendor Director', 'All', true),
('Leica Portraiture & Drone Aerial Cinematography Briefing', 'Vendors', -60, 'Lead Planner', 'All', true),
('Bridal Sojat Henna Artists & Poshak Draping Team Lock-in', 'Vendors', -50, 'Artisan Vendor Director', 'All', true),
('Manganiyar Folk Ensemble & Sufi Qawwali Stage Technical Rider', 'Vendors', -40, 'Head of Logistics', 'All', true),
('Vintage Rolls Royce & Decorated Royal Baggi Reservation', 'Vendors', -35, 'Head of Logistics', 'All', true),
('24k Gold Foil Mithai Hampers & Welcome Favors Dispatch Order', 'Vendors', -30, 'Lead Planner', 'All', true),

-- Guests Phase
('VVIP Royal Guest List & Protocol Hierarchy Finalization', 'Guests', -90, 'Lead Planner', 'All', true),
('Digital Save-The-Dates & Palace Travel Concierge Portal Launch', 'Guests', -75, 'Lead Planner', 'All', true),
('Formal Wedding Invocations & Palace Suite Allocations', 'Guests', -45, 'Lead Planner', 'All', true),
('Airport Chauffeur Conveyance & Private Jet Manifest Sync', 'Guests', -20, 'Head of Logistics', 'All', true),
('Final Dietary Protocols, Jain Catering & RSVP Tally Lock', 'Guests', -14, 'Lead Planner', 'All', true),

-- Events Phase
('Royal High Tea & Mehendi Sundowner Run-Sheet Rehearsal', 'Events', -10, 'Lead Planner', 'All', true),
('Sangeet Stage Choreography & Sufi Mehfil Lighting Soundcheck', 'Events', -7, 'Head of Logistics', 'All', true),
('Haldi Yellow Blossom Floral Shower Logistics Alignment', 'Events', -3, 'Artisan Vendor Director', 'All', true),
('Barat Grand Procession Route, Tuskers & Brass Band Alignment', 'Events', -2, 'Head of Logistics', 'All', true),
('Sunset Pheras Sacred Ritual Timing & Pandit Alignment', 'Events', -1, 'Lead Planner', 'All', true),
('Grand Reception Royal Durbar Seating & Toast Timetable', 'Events', 0, 'Lead Planner', 'All', true),

-- Day-of Phase (included in both Full and Partial packages)
('Dawn Team Operational Briefing & Radiocomms Check', 'Day-of', 0, 'Lead Planner', 'All', true),
('Vendor Influx Check-in & Fire Marshal Compliance Audit', 'Day-of', 0, 'Head of Logistics', 'All', true),
('Barat to Mandap Live Queueing & Bride Entry Fire-Torches', 'Day-of', 0, 'Head of Logistics', 'All', true),

-- Post-event Phase (included in both Full and Partial packages)
('Palace Suite Inventory Handover & Chauffeur Luggage Sweep', 'Post-event', 1, 'Head of Logistics', 'All', true),
('Artisan Vendor Invoice Reconciliation & Final Settlements', 'Post-event', 3, 'Lead Planner', 'All', true);

-- 4. Transactional Function: record_booking_deposit
-- Runs in ONE atomic transaction:
-- a. Rejects if enquiry is already Won or has no signed contract
-- b. Sets enquiry stage to Won
-- c. Creates wedding from enquiry
-- d. Generates wedding_tasks matching package
-- e. Creates 3 client_payments (Booking = p_amount, Advance = 50% remainder, Final = 50% remainder)
-- f. Returns new wedding id
CREATE OR REPLACE FUNCTION record_booking_deposit(p_enquiry_id UUID, p_amount NUMERIC)
RETURNS UUID AS $$
DECLARE
    v_enquiry RECORD;
    v_contract RECORD;
    v_wedding_id UUID;
    v_couple_id UUID;
    v_wedding_date DATE;
    v_remaining_amount NUMERIC(14, 2);
    v_advance_amount NUMERIC(14, 2);
    v_final_amount NUMERIC(14, 2);
    v_template RECORD;
    v_owner_id UUID;
    v_partner1 TEXT;
    v_partner2 TEXT;
BEGIN
    -- Validation: Positive amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Booking deposit amount must be greater than 0';
    END IF;

    -- a. Rejects if the enquiry is already Won or does not exist
    SELECT * INTO v_enquiry FROM enquiries WHERE id = p_enquiry_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Enquiry not found (ID: %)', p_enquiry_id;
    END IF;

    IF v_enquiry.stage = 'Won' THEN
        RAISE EXCEPTION 'Enquiry is already marked as Won.';
    END IF;

    -- Verify signed contract
    SELECT * INTO v_contract 
    FROM contracts 
    WHERE enquiry_id = p_enquiry_id 
      AND (signed_at IS NOT NULL OR status = 'Signed')
    ORDER BY created_at DESC 
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cannot record deposit: No signed service agreement exists for %.', v_enquiry.couple_name;
    END IF;

    -- b. Sets the enquiry stage to Won
    UPDATE enquiries 
    SET stage = 'Won', updated_at = now() 
    WHERE id = p_enquiry_id;

    -- c. Creates couple record & wedding
    v_wedding_date := COALESCE(v_enquiry.wedding_date, CURRENT_DATE + INTERVAL '90 days');
    
    -- Extract partner names safely
    IF position('&' IN v_enquiry.couple_name) > 0 THEN
        v_partner1 := trim(split_part(v_enquiry.couple_name, '&', 1));
        v_partner2 := trim(split_part(v_enquiry.couple_name, '&', 2));
    ELSIF position('and' IN lower(v_enquiry.couple_name)) > 0 THEN
        v_partner1 := trim(split_part(v_enquiry.couple_name, 'and', 1));
        v_partner2 := trim(split_part(v_enquiry.couple_name, 'and', 2));
    ELSE
        v_partner1 := v_enquiry.couple_name;
        v_partner2 := 'Partner';
    END IF;

    INSERT INTO couples (
        partner_1_name,
        partner_2_name,
        primary_contact_name,
        phone,
        email,
        city,
        notes,
        is_demo
    ) VALUES (
        v_partner1,
        v_partner2,
        v_enquiry.couple_name,
        v_enquiry.phone,
        v_enquiry.email,
        v_enquiry.city,
        'Created automatically upon recording deposit for ' || v_enquiry.couple_name,
        v_enquiry.is_demo
    )
    RETURNING id INTO v_couple_id;

    INSERT INTO weddings (
        title,
        couple_id,
        enquiry_id,
        package_id,
        wedding_date,
        wedding_end_date,
        city,
        venue,
        guest_count,
        total_budget,
        contract_value,
        status,
        theme,
        notes,
        is_demo
    ) VALUES (
        v_enquiry.couple_name || ' Royal Wedding',
        v_couple_id,
        p_enquiry_id,
        v_enquiry.package_id,
        v_wedding_date,
        v_wedding_date + INTERVAL '2 days',
        v_enquiry.city,
        CASE 
            WHEN v_enquiry.city = 'Udaipur' THEN 'The Oberoi Udaivilas, Lake Pichola'
            ELSE 'Rambagh Palace Heritage Estate, Jaipur'
        END,
        v_enquiry.guests,
        v_enquiry.budget,
        v_enquiry.budget,
        'Planning',
        COALESCE(v_enquiry.theme, 'Palatial Romance'),
        'Confirmed with booking deposit of INR ' || p_amount || '. Contract ID: ' || v_contract.id,
        v_enquiry.is_demo
    )
    RETURNING id INTO v_wedding_id;

    -- Link signed contract with the created wedding
    UPDATE contracts 
    SET wedding_id = v_wedding_id, updated_at = now() 
    WHERE id = v_contract.id;

    -- d. Generates wedding_tasks from task_templates matching package
    -- Full gets all, Partial gets only Day-of and Post-event phases
    FOR v_template IN 
        SELECT * FROM task_templates 
        WHERE (
            v_enquiry.package ILIKE '%Full%' 
            OR phase IN ('Day-of', 'Post-event')
        )
    LOOP
        -- Assign owner from team_members matching role or fallback
        SELECT id INTO v_owner_id 
        FROM team_members 
        WHERE role ILIKE '%' || v_template.default_role || '%' 
        ORDER BY created_at ASC 
        LIMIT 1;

        IF v_owner_id IS NULL THEN
            SELECT id INTO v_owner_id FROM team_members ORDER BY created_at ASC LIMIT 1;
        END IF;

        INSERT INTO wedding_tasks (
            wedding_id,
            title,
            phase,
            stage,
            owner,
            due_date,
            notes,
            is_demo
        ) VALUES (
            v_wedding_id,
            v_template.title,
            v_template.phase,
            'To Plan',
            v_owner_id,
            v_wedding_date + (v_template.offset_days_from_wedding * INTERVAL '1 day'),
            'Offset: ' || v_template.offset_days_from_wedding || ' days from wedding date.',
            v_enquiry.is_demo
        );
    END LOOP;

    -- e. Creates 3 client_payments:
    -- Booking (amount = p_amount, paid_at = now),
    -- Advance (due wedding_date - 30 days),
    -- Final (due wedding_date + 7 days),
    -- splitting remaining contract value 50/50
    v_remaining_amount := GREATEST(0, v_enquiry.budget - p_amount);
    v_advance_amount := ROUND(v_remaining_amount / 2, 2);
    v_final_amount := v_remaining_amount - v_advance_amount;

    -- 1. Booking Milestone (Paid)
    INSERT INTO client_payments (
        wedding_id,
        milestone,
        amount,
        due_date,
        paid_at,
        payment_method,
        transaction_reference,
        status,
        is_demo
    ) VALUES (
        v_wedding_id,
        'Booking',
        p_amount,
        CURRENT_DATE,
        now(),
        'RTGS / Palace Wire Transfer',
        'DEP-' || substr(v_wedding_id::text, 1, 8),
        'Paid',
        v_enquiry.is_demo
    );

    -- 2. Advance Milestone (~1 month prior)
    INSERT INTO client_payments (
        wedding_id,
        milestone,
        amount,
        due_date,
        status,
        is_demo
    ) VALUES (
        v_wedding_id,
        'Advance',
        v_advance_amount,
        v_wedding_date - INTERVAL '30 days',
        'Pending',
        v_enquiry.is_demo
    );

    -- 3. Final Milestone (+7 days post-event)
    INSERT INTO client_payments (
        wedding_id,
        milestone,
        amount,
        due_date,
        status,
        is_demo
    ) VALUES (
        v_wedding_id,
        'Final',
        v_final_amount,
        v_wedding_date + INTERVAL '7 days',
        'Pending',
        v_enquiry.is_demo
    );

    -- f. Return new wedding ID
    RETURN v_wedding_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
