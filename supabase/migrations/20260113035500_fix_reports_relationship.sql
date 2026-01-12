-- Fix relationship between content_reports and profiles

-- 1. Drop the existing foreign key constraint if it exists
ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS content_reports_user_id_fkey;

-- 2. Add the new foreign key constraint referencing profiles table
ALTER TABLE content_reports 
ADD CONSTRAINT content_reports_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Add an index for better join performance
CREATE INDEX IF NOT EXISTS idx_content_reports_user_id ON content_reports(user_id);

COMMENT ON TABLE content_reports IS 'Table for storing reports on spots, comments, and media. Now linked directly to profiles for enrichment.';
