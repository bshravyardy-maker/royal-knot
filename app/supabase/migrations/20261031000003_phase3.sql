-- ==============================================================================
-- THE ROYAL KNOT - Phase 3 Schema Migration: Vendor Quotes & Award System
-- ==============================================================================

-- 1. Enhance quote_requests
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 400;
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS awarded_quote_id UUID;
ALTER TABLE quote_requests ALTER COLUMN scope_description DROP NOT NULL;

-- 2. Enhance vendor_quotes
ALTER TABLE vendor_quotes ADD COLUMN IF NOT EXISTS price_per_plate NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE vendor_quotes ADD COLUMN IF NOT EXISTS extra_hour_rate NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE vendor_quotes ADD COLUMN IF NOT EXISTS inclusions TEXT[] DEFAULT '{}';
ALTER TABLE vendor_quotes ADD COLUMN IF NOT EXISTS total NUMERIC(14, 2) DEFAULT 0;
ALTER TABLE vendor_quotes ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status check constraint for vendor_quotes
ALTER TABLE vendor_quotes DROP CONSTRAINT IF EXISTS vendor_quotes_status_check;
ALTER TABLE vendor_quotes ADD CONSTRAINT vendor_quotes_status_check 
    CHECK (status IN ('Submitted', 'Shortlisted', 'Accepted', 'Rejected', 'Awarded', 'Closed'));

-- Update status check constraint for quote_requests if exists
ALTER TABLE quote_requests DROP CONSTRAINT IF EXISTS quote_requests_status_check;
ALTER TABLE quote_requests ADD CONSTRAINT quote_requests_status_check 
    CHECK (status IN ('Open', 'Quotes Received', 'Awarded', 'Closed'));

-- Add foreign key constraint for awarded_quote_id if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_quote_requests_awarded_quote'
    ) THEN
        ALTER TABLE quote_requests
            ADD CONSTRAINT fk_quote_requests_awarded_quote
            FOREIGN KEY (awarded_quote_id) REFERENCES vendor_quotes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Enhance wedding_vendors
ALTER TABLE wedding_vendors ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE wedding_vendors ADD COLUMN IF NOT EXISTS source_quote_id UUID REFERENCES vendor_quotes(id) ON DELETE SET NULL;
ALTER TABLE wedding_vendors ADD COLUMN IF NOT EXISTS arrival_status TEXT DEFAULT 'Pending';

-- 4. Atomic Function: award_quote(p_quote_id uuid)
-- Runs in ONE transaction:
-- a. Rejects if the request is not Open
-- b. Sets the chosen quote to Awarded and all sibling quotes to Closed
-- c. Sets the request to Closed with awarded_quote_id
-- d. Inserts/updates a wedding_vendors row with agreed_amount = quote total and source_quote_id
-- e. Returns the wedding_vendors id
CREATE OR REPLACE FUNCTION award_quote(p_quote_id UUID)
RETURNS UUID AS $$
DECLARE
    v_quote RECORD;
    v_request RECORD;
    v_wedding_vendor_id UUID;
    v_category TEXT;
BEGIN
    -- 1. Fetch the selected quote
    SELECT * INTO v_quote FROM vendor_quotes WHERE id = p_quote_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Vendor quote not found: %', p_quote_id;
    END IF;

    -- 2. Fetch the parent quote request
    SELECT * INTO v_request FROM quote_requests WHERE id = v_quote.quote_request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Parent quote request not found: %', v_quote.quote_request_id;
    END IF;

    -- a. Reject if the request is not Open
    IF v_request.status <> 'Open' THEN
        RAISE EXCEPTION 'Quote request is already % (must be Open to award).', v_request.status;
    END IF;

    -- b. Set the chosen quote to Awarded
    UPDATE vendor_quotes
    SET status = 'Awarded', updated_at = now()
    WHERE id = p_quote_id;

    -- Set all sibling quotes to Closed
    UPDATE vendor_quotes
    SET status = 'Closed', updated_at = now()
    WHERE quote_request_id = v_request.id AND id <> p_quote_id;

    -- c. Set the request to Closed with awarded_quote_id
    UPDATE quote_requests
    SET status = 'Closed', awarded_quote_id = p_quote_id, updated_at = now()
    WHERE id = v_request.id;

    -- Determine category
    v_category := COALESCE(v_request.category, 'Catering');

    -- d. Insert or update wedding_vendors row
    INSERT INTO wedding_vendors (
        wedding_id,
        vendor_id,
        category,
        agreed_amount,
        advance_paid,
        source_quote_id,
        arrival_status,
        status,
        is_demo
    ) VALUES (
        v_request.wedding_id,
        v_quote.vendor_id,
        v_category,
        COALESCE(v_quote.total, v_quote.amount),
        0,
        v_quote.id,
        'Pending',
        'Confirmed',
        v_quote.is_demo
    )
    ON CONFLICT (wedding_id, vendor_id) DO UPDATE SET
        agreed_amount = EXCLUDED.agreed_amount,
        source_quote_id = EXCLUDED.source_quote_id,
        category = EXCLUDED.category,
        updated_at = now()
    RETURNING id INTO v_wedding_vendor_id;

    -- e. Return wedding_vendors id
    RETURN v_wedding_vendor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Seed Demo Quote Requests & Quotes (Idempotent seed data)
DO $$
DECLARE
    v_demo_wedding RECORD;
    v_caterer1 RECORD;
    v_caterer2 RECORD;
    v_caterer3 RECORD;
    v_decor_vendor RECORD;
    v_req1_id UUID;
    v_req2_id UUID;
    v_awarded_quote_id UUID;
BEGIN
    -- Look for demo wedding
    SELECT id, guest_count INTO v_demo_wedding FROM weddings WHERE is_demo = true ORDER BY wedding_date ASC LIMIT 1;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Clean old demo quote requests and quotes
    DELETE FROM vendor_quotes WHERE is_demo = true;
    DELETE FROM quote_requests WHERE is_demo = true;

    -- Look for catering vendors
    SELECT id INTO v_caterer1 FROM vendors WHERE category ILIKE '%Catering%' AND is_demo = true ORDER BY name ASC LIMIT 1;
    SELECT id INTO v_caterer2 FROM vendors WHERE category ILIKE '%Catering%' AND is_demo = true ORDER BY name DESC LIMIT 1;
    SELECT id INTO v_caterer3 FROM vendors WHERE is_demo = true ORDER BY created_at ASC OFFSET 2 LIMIT 1;

    -- 1. Create an Open Catering Quote Request
    INSERT INTO quote_requests (
        wedding_id,
        category,
        scope_description,
        guest_count,
        requested_deadline,
        status,
        is_demo
    ) VALUES (
        v_demo_wedding.id,
        'Catering & Royal Feasts',
        'Multi-course Royal Silver Thali banquet with authentic Mewar delicacies, live sigdi skewers, and 24k gold sweets.',
        COALESCE(v_demo_wedding.guest_count, 450),
        CURRENT_DATE + INTERVAL '14 days',
        'Open',
        true
    )
    RETURNING id INTO v_req1_id;

    -- Insert 3 competing quotes with different price per plate, extra-hour rate, and inclusions
    IF v_caterer1.id IS NOT NULL THEN
        INSERT INTO vendor_quotes (
            quote_request_id,
            vendor_id,
            price_per_plate,
            extra_hour_rate,
            inclusions,
            total,
            status,
            notes,
            is_demo
        ) VALUES (
            v_req1_id,
            v_caterer1.id,
            3200,
            25000,
            ARRAY['Silver Thali Service', 'Royal Welcome Drinks', 'Live Chaat Counter', 'Jain Dedicated Kitchen', 'Midnight Snack Bar'],
            3200 * COALESCE(v_demo_wedding.guest_count, 450),
            'Submitted',
            'Full traditional Mewar feast with 42 royal recipes cooked in copper degs.',
            true
        );
    END IF;

    IF v_caterer2.id IS NOT NULL AND v_caterer2.id <> v_caterer1.id THEN
        INSERT INTO vendor_quotes (
            quote_request_id,
            vendor_id,
            price_per_plate,
            extra_hour_rate,
            inclusions,
            total,
            status,
            notes,
            is_demo
        ) VALUES (
            v_req1_id,
            v_caterer2.id,
            3800,
            35000,
            ARRAY['Silver Thali Service', 'Royal Welcome Drinks', 'Live Chaat Counter', '24k Gold Foil Sweets', 'Artisan Mocktail Bar', 'Midnight Snack Bar'],
            3800 * COALESCE(v_demo_wedding.guest_count, 450),
            'Submitted',
            'Gourmet royal feast with handcrafted 24k gold leaf mithai hampers and mixologist beverage program.',
            true
        );
    END IF;

    IF v_caterer3.id IS NOT NULL AND v_caterer3.id <> v_caterer1.id AND v_caterer3.id <> v_caterer2.id THEN
        INSERT INTO vendor_quotes (
            quote_request_id,
            vendor_id,
            price_per_plate,
            extra_hour_rate,
            inclusions,
            total,
            status,
            notes,
            is_demo
        ) VALUES (
            v_req1_id,
            v_caterer3.id,
            2950,
            20000,
            ARRAY['Silver Thali Service', 'Royal Welcome Drinks', 'Live Chaat Counter', 'Jain Dedicated Kitchen'],
            2950 * COALESCE(v_demo_wedding.guest_count, 450),
            'Submitted',
            'Heritage Rajasthani menu with woodfire clay ovens and traditional dal baati stations.',
            true
        );
    END IF;

    -- 2. Create one Closed past request for decor with an awarded quote
    SELECT id INTO v_decor_vendor FROM vendors WHERE category ILIKE '%Decor%' AND is_demo = true LIMIT 1;
    IF v_decor_vendor.id IS NOT NULL THEN
        INSERT INTO quote_requests (
            wedding_id,
            category,
            scope_description,
            guest_count,
            requested_deadline,
            status,
            is_demo
        ) VALUES (
            v_demo_wedding.id,
            'Decor & Florals',
            'Full palace floral architecture, imported tuberose mandap, and velvet courtyard draping.',
            COALESCE(v_demo_wedding.guest_count, 450),
            CURRENT_DATE - INTERVAL '10 days',
            'Closed',
            true
        )
        RETURNING id INTO v_req2_id;

        INSERT INTO vendor_quotes (
            quote_request_id,
            vendor_id,
            price_per_plate,
            extra_hour_rate,
            inclusions,
            total,
            status,
            notes,
            is_demo
        ) VALUES (
            v_req2_id,
            v_decor_vendor.id,
            0,
            50000,
            ARRAY['Lotus Mandap Structure', 'Palace Facade Fairy Lights', 'Marigold Gateways', 'Bridal Entry Torches'],
            1850000,
            'Awarded',
            'Tender won for premier heritage decor and botanical styling.',
            true
        )
        RETURNING id INTO v_awarded_quote_id;

        UPDATE quote_requests SET awarded_quote_id = v_awarded_quote_id WHERE id = v_req2_id;

        -- Link into wedding_vendors
        INSERT INTO wedding_vendors (
            wedding_id,
            vendor_id,
            category,
            agreed_amount,
            advance_paid,
            source_quote_id,
            arrival_status,
            status,
            is_demo
        ) VALUES (
            v_demo_wedding.id,
            v_decor_vendor.id,
            'Decor & Florals',
            1850000,
            500000,
            v_awarded_quote_id,
            'Pending',
            'Confirmed',
            true
        )
        ON CONFLICT (wedding_id, vendor_id) DO NOTHING;
    END IF;

END $$;
