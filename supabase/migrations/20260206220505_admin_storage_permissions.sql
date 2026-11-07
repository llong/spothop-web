-- Allow admins to delete any file in any bucket
CREATE POLICY "Admins can delete any file" ON storage.objects
FOR DELETE TO authenticated
USING (public.is_admin() = true);

-- Also allow admins to update any file if needed (e.g. for re-processing)
CREATE POLICY "Admins can update any file" ON storage.objects
FOR UPDATE TO authenticated
USING (public.is_admin() = true);

-- Ensure spot-media bucket has appropriate policies (some were missing)
CREATE POLICY "Public access to spot-media" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'spot-media');

CREATE POLICY "Authenticated users can upload to spot-media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'spot-media');
