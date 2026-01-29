-- Create user_follows table
-- Created at: 2026-01-29

CREATE TABLE public.user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent self-following
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    -- Unique follow pair
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Add indexes
CREATE INDEX idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON public.user_follows(following_id);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to follows"
    ON public.user_follows FOR SELECT
    USING (true);

CREATE POLICY "Allow users to follow others"
    ON public.user_follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Allow users to unfollow"
    ON public.user_follows FOR DELETE
    USING (auth.uid() = follower_id);

-- Follow/Unfollow RPC
CREATE OR REPLACE FUNCTION public.handle_user_follow(
    p_following_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_follower_id UUID;
    v_exists BOOLEAN;
BEGIN
    v_follower_id := auth.uid();
    IF v_follower_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.user_follows 
        WHERE follower_id = v_follower_id AND following_id = p_following_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.user_follows 
        WHERE follower_id = v_follower_id AND following_id = p_following_id;
    ELSE
        INSERT INTO public.user_follows (follower_id, following_id)
        VALUES (v_follower_id, p_following_id);
    END IF;
END;
$$;