-- Migration: Add missing columns to guests and contracts tables
-- Run this in your Supabase Dashboard → SQL Editor

-- GUESTS: Add rich guest profile columns
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS room_allocation TEXT,
  ADD COLUMN IF NOT EXISTS table_number TEXT,
  ADD COLUMN IF NOT EXISTS dietary_requirements TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- CONTRACTS: Add contract metadata columns
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS contract_type TEXT,
  ADD COLUMN IF NOT EXISTS contract_value BIGINT,
  ADD COLUMN IF NOT EXISTS terms TEXT;
