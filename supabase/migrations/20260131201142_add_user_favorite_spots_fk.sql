-- Add foreign key constraint from user_favorite_spots.user_id to profiles.id
-- This is necessary for PostgREST to automatically resolve the relationship
-- when fetching 'favoritedByUsers' for a spot.
ALTER TABLE public.user_favorite_spots
ADD CONSTRAINT fk_user_favorite_spots_user_id
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;