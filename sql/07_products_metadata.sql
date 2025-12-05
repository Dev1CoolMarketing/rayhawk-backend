-- Add product metadata fields for unit details and billing.
-- Safe to re-run thanks to IF NOT EXISTS.
ALTER TABLE core.products
  ADD COLUMN IF NOT EXISTS unit_count integer,
  ADD COLUMN IF NOT EXISTS unit_count_type text,
  ADD COLUMN IF NOT EXISTS form_factor text,
  ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'one_time' CHECK (billing_type IN ('one_time','recurring')),
  ADD COLUMN IF NOT EXISTS billing_interval text CHECK (billing_interval IN ('month','year')),
  ADD COLUMN IF NOT EXISTS billing_quantity integer NOT NULL DEFAULT 1;
