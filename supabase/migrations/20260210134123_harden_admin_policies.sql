-- Direct subquery policies for maximum reliability
DROP POLICY IF EXISTS "delete_spot_photos" ON "public"."spot_photos";
CREATE POLICY "delete_spot_photos" ON "public"."spot_photos"
FOR DELETE TO authenticated
USING (
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) OR 
    (auth.uid() = user_id)
);

DROP POLICY IF EXISTS "delete_spot_videos" ON "public"."spot_videos";
CREATE POLICY "delete_spot_videos" ON "public"."spot_videos"
FOR DELETE TO authenticated
USING (
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) OR 
    (auth.uid() = user_id)
);

DROP POLICY IF EXISTS "delete_spots" ON "public"."spots";
CREATE POLICY "delete_spots" ON "public"."spots"
FOR DELETE TO authenticated
USING (
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) OR 
    (auth.uid() = created_by)
);

-- Also ensure the same for spot_comments
DROP POLICY IF EXISTS "delete_spot_comments" ON "public"."spot_comments";
CREATE POLICY "delete_spot_comments" ON "public"."spot_comments"
FOR DELETE TO authenticated
USING (
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) OR 
    (auth.uid() = user_id)
);
