-- Mark products as featured for promoted placements.
ALTER TABLE core.products
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
