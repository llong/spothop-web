-- Add state column to spots table
ALTER TABLE spots ADD COLUMN IF NOT EXISTS state TEXT;

COMMENT ON COLUMN spots.state IS 'Abbreviated state or province (e.g. NY, KL)';
