DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type_enum') THEN 
        CREATE TYPE media_type_enum AS ENUM ('photo', 'video'); 
    END IF; 
END $$;

-- Drop the table if it exists to ensure a clean state
DROP TABLE IF EXISTS media_likes CASCADE;

CREATE TABLE media_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_id UUID REFERENCES spot_photos(id) ON DELETE CASCADE,
    video_id UUID REFERENCES spot_videos(id) ON DELETE CASCADE,
    media_type media_type_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Ensure exactly one of photo_id or video_id is set
    CONSTRAINT media_likes_check_single_target CHECK (
        (photo_id IS NOT NULL AND video_id IS NULL AND media_type = 'photo') OR
        (photo_id IS NULL AND video_id IS NOT NULL AND media_type = 'video')
    ),
    
    -- Ensure a user can only like a specific photo or video once
    CONSTRAINT media_likes_user_photo_unique UNIQUE (user_id, photo_id),
    CONSTRAINT media_likes_user_video_unique UNIQUE (user_id, video_id)
);

-- Enable RLS
ALTER TABLE media_likes ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to toggle their own likes
CREATE POLICY "Users can manage their own media likes"
ON media_likes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow everyone to see likes
CREATE POLICY "Anyone can view media likes"
ON media_likes
FOR SELECT
USING (true);

-- Comment on table
COMMENT ON TABLE media_likes IS 'User likes for spot photos and videos.';
