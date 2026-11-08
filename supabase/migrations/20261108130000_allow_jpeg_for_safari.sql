-- iOS Safari cannot encode WebP from a canvas (toBlob silently returns PNG), so the client now falls back to
-- JPEG there. Allow JPEG in both buckets, and let avatars be named "<uid>.jpg" as well as "<uid>.webp".
-- PNG stays disallowed: the client never produces it.
-- Verified against live project wbkpofmvjcmdqbivocqc on 2026-11-08.

UPDATE storage.buckets SET allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'video/mp4']
    WHERE id = 'spot-media';
UPDATE storage.buckets SET allowed_mime_types = ARRAY['image/webp', 'image/jpeg']
    WHERE id = 'avatars';

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND name IN ((SELECT auth.uid())::text || '.webp', (SELECT auth.uid())::text || '.jpg'));
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND name IN ((SELECT auth.uid())::text || '.webp', (SELECT auth.uid())::text || '.jpg'));
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND name IN ((SELECT auth.uid())::text || '.webp', (SELECT auth.uid())::text || '.jpg'));
