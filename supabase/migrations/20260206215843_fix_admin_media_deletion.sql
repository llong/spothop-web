-- Explicitly grant permissions to is_admin function
ALTER FUNCTION public.is_admin() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- Harden the delete policies to be absolutely clear about admin access
DROP POLICY IF EXISTS "delete_spot_photos" ON "public"."spot_photos";
CREATE POLICY "delete_spot_photos" ON "public"."spot_photos"
FOR DELETE TO authenticated
USING (
    (public.is_admin() = true) OR 
    (auth.uid() = user_id)
);

DROP POLICY IF EXISTS "delete_spot_videos" ON "public"."spot_videos";
CREATE POLICY "delete_spot_videos" ON "public"."spot_videos"
FOR DELETE TO authenticated
USING (
    (public.is_admin() = true) OR 
    (auth.uid() = user_id)
);

-- Also verify the spots table policy while we are here
DROP POLICY IF EXISTS "delete_spots" ON "public"."spots";
CREATE POLICY "delete_spots" ON "public"."spots"
FOR DELETE TO authenticated
USING (
    (public.is_admin() = true) OR 
    (auth.uid() = created_by)
);
