-- Add skater_name column to spot_video_links
ALTER TABLE public.spot_video_links ADD COLUMN IF NOT EXISTS skater_name text;
