-- Tiny (96px) square photo used as the pin on the spots map, and a view that picks one cover photo per spot.

ALTER TABLE public.spot_photos ADD COLUMN IF NOT EXISTS thumbnail_pin_url text;

-- Admins fill in pin thumbnails for photos other users uploaded (the backfill in the admin dashboard).
DROP POLICY IF EXISTS admin_update_photos ON public.spot_photos;
CREATE POLICY admin_update_photos ON public.spot_photos
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

-- One cover photo per spot: the most liked photo; with no likes (or a tie) a "random" one, chosen by hashing
-- the photo id so the cover stays the same between requests until a photo gets liked.
CREATE OR REPLACE VIEW public.spot_cover_photos
WITH (security_invoker = true) AS
SELECT DISTINCT ON (sp.spot_id)
    sp.spot_id,
    sp.id AS photo_id,
    sp.url,
    sp.thumbnail_small_url,
    sp.thumbnail_large_url,
    sp.thumbnail_pin_url
FROM public.spot_photos sp
LEFT JOIN (
    SELECT photo_id, COUNT(*) AS likes
    FROM public.media_likes
    WHERE photo_id IS NOT NULL
    GROUP BY photo_id
) l ON l.photo_id = sp.id
ORDER BY sp.spot_id, COALESCE(l.likes, 0) DESC, md5(sp.id::text);

GRANT SELECT ON public.spot_cover_photos TO anon, authenticated;
