-- Sprint 7: Content Moderation & Platform Safety

-- 1. Update profiles table with administrative columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.role IS 'The administrative role of the user.';
COMMENT ON COLUMN profiles.is_banned IS 'Whether the user is banned from contributing content.';

-- 2. Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Update RLS policies for global admin access

-- Spots: Admins can do everything
DROP POLICY IF EXISTS "admin_manage_spots" ON spots;
CREATE POLICY "admin_manage_spots" ON spots
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Profiles: Admins can update any profile (e.g., to ban)
DROP POLICY IF EXISTS "admin_manage_profiles" ON profiles;
CREATE POLICY "admin_manage_profiles" ON profiles
FOR UPDATE TO authenticated
USING (is_admin());

-- Spot Comments: Admins can delete
DROP POLICY IF EXISTS "admin_delete_comments" ON spot_comments;
CREATE POLICY "admin_delete_comments" ON spot_comments
FOR DELETE TO authenticated
USING (is_admin());

-- Spot Photos: Admins can delete
DROP POLICY IF EXISTS "admin_delete_photos" ON spot_photos;
CREATE POLICY "admin_delete_photos" ON spot_photos
FOR DELETE TO authenticated
USING (is_admin());

-- Spot Videos: Admins can delete
DROP POLICY IF EXISTS "admin_delete_videos" ON spot_videos;
CREATE POLICY "admin_delete_videos" ON spot_videos
FOR DELETE TO authenticated
USING (is_admin());

-- Content Reports: Admins can view and delete (resolve)
DROP POLICY IF EXISTS "admin_manage_reports" ON content_reports;
CREATE POLICY "admin_manage_reports" ON content_reports
FOR ALL TO authenticated
USING (is_admin());

-- 4. Prevent banned users from contributing content
-- We update the existing insert/update policies to check is_banned status

-- Helper function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_banned()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_banned = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update Spots Insert/Update policies
DROP POLICY IF EXISTS "authenticated_insert_spots" ON spots;
CREATE POLICY "authenticated_insert_spots" ON spots 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = created_by AND NOT is_banned());

DROP POLICY IF EXISTS "authenticated_update_spots" ON spots;
CREATE POLICY "authenticated_update_spots" ON spots 
FOR UPDATE TO authenticated 
USING ((select auth.uid()) = created_by AND NOT is_banned());

-- Update Comments Insert policy
DROP POLICY IF EXISTS "authenticated_insert_spot_comments" ON spot_comments;
CREATE POLICY "authenticated_insert_spot_comments" ON spot_comments 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = user_id AND NOT is_banned());

-- Update Photos Insert policy
DROP POLICY IF EXISTS "authenticated_insert_photos" ON spot_photos;
CREATE POLICY "authenticated_insert_photos" ON spot_photos 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = user_id AND NOT is_banned());

-- Update Videos Insert policy
DROP POLICY IF EXISTS "authenticated_insert_videos" ON spot_videos;
CREATE POLICY "authenticated_insert_videos" ON spot_videos 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = user_id AND NOT is_banned());

-- 5. Cleanup reports when target content is deleted
CREATE OR REPLACE FUNCTION public.cleanup_reports_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM content_reports WHERE target_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_spot_delete_cleanup_reports ON spots;
CREATE TRIGGER on_spot_delete_cleanup_reports
  BEFORE DELETE ON spots
  FOR EACH ROW EXECUTE FUNCTION cleanup_reports_on_delete();

DROP TRIGGER IF EXISTS on_comment_delete_cleanup_reports ON spot_comments;
CREATE TRIGGER on_comment_delete_cleanup_reports
  BEFORE DELETE ON spot_comments
  FOR EACH ROW EXECUTE FUNCTION cleanup_reports_on_delete();

DROP TRIGGER IF EXISTS on_photo_delete_cleanup_reports ON spot_photos;
CREATE TRIGGER on_photo_delete_cleanup_reports
  BEFORE DELETE ON spot_photos
  FOR EACH ROW EXECUTE FUNCTION cleanup_reports_on_delete();

DROP TRIGGER IF EXISTS on_video_delete_cleanup_reports ON spot_videos;
CREATE TRIGGER on_video_delete_cleanup_reports
  BEFORE DELETE ON spot_videos
  FOR EACH ROW EXECUTE FUNCTION cleanup_reports_on_delete();
