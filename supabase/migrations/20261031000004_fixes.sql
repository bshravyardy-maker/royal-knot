-- ==============================================================================
-- THE ROYAL KNOT - Phase 4 Fixes Migration: Enhanced Validation on Deposit
-- ==============================================================================

-- Update record_booking_deposit to validate that the enquiry has a positive budget
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
    -- 1. Validation: Positive deposit amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Booking deposit amount must be greater than 0';
    END IF;

    -- 2. Enquiry existence and state validation
    SELECT * INTO v_enquiry FROM enquiries WHERE id = p_enquiry_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Enquiry not found (ID: %)', p_enquiry_id;
    END IF;

    IF v_enquiry.stage = 'Won' THEN
        RAISE EXCEPTION 'Enquiry is already marked as Won.';
    END IF;

    -- 3. Budget validation: reject if enquiry has no budget or budget <= 0
    IF v_enquiry.budget IS NULL OR v_enquiry.budget <= 0 THEN
        RAISE EXCEPTION 'Cannot record deposit: Enquiry has no budget or budget is zero. A positive budget is required to establish wedding contract value.';
    END IF;

    -- 4. Verify signed contract
    SELECT * INTO v_contract 
    FROM contracts 
    WHERE enquiry_id = p_enquiry_id 
      AND (signed_at IS NOT NULL OR status = 'Signed')
    ORDER BY created_at DESC 
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cannot record deposit: No signed service agreement exists for %.', v_enquiry.couple_name;
    END IF;

    -- 5. Sets the enquiry stage to Won
    UPDATE enquiries 
    SET stage = 'Won', updated_at = now() 
    WHERE id = p_enquiry_id;

    -- 6. Creates couple record & wedding
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

    -- 7. Generates wedding_tasks from task_templates matching package
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

    -- 8. Creates 3 client_payments:
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

    -- 9. Return new wedding ID
    RETURN v_wedding_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
