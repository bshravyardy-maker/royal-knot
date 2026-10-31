-- ==============================================================================
-- THE ROYAL KNOT - Phase 4 Schema Migration: Day-of Command Center
-- ==============================================================================

-- 1. Enhance schedule_items table
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMPTZ;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS responsible_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS responsible_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ;

-- Backwards compatibility sync for existing rows
UPDATE schedule_items SET title = event_name WHERE title IS NULL AND event_name IS NOT NULL;
UPDATE schedule_items SET scheduled_time = start_time WHERE scheduled_time IS NULL AND start_time IS NOT NULL;

-- Update status constraint for schedule_items
ALTER TABLE schedule_items DROP CONSTRAINT IF EXISTS schedule_items_status_check;
ALTER TABLE schedule_items ADD CONSTRAINT schedule_items_status_check
    CHECK (status IN ('Pending', 'Live', 'Done', 'Delayed'));

-- 2. Enhance incidents table
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES team_members(id) ON DELETE SET NULL;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolution TEXT;

-- Backwards compatibility sync for existing rows
UPDATE incidents SET resolution = resolution_notes WHERE resolution IS NULL AND resolution_notes IS NOT NULL;
UPDATE incidents SET owner_id = reported_by WHERE owner_id IS NULL AND reported_by IS NOT NULL;

-- Update status constraint for incidents to support Open and Resolved
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_status_check;
ALTER TABLE incidents ADD CONSTRAINT incidents_status_check
    CHECK (status IN ('Open', 'Resolved', 'Reported', 'Resolving'));

ALTER TABLE incidents ALTER COLUMN status SET DEFAULT 'Open';

-- Update severity check constraint
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_severity_check;
ALTER TABLE incidents ADD CONSTRAINT incidents_severity_check
    CHECK (severity IN ('Low', 'Medium', 'High', 'Critical'));
