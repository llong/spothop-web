-- Create media_comment_reactions table
-- Created at: 2026-01-29

CREATE TABLE public.media_comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.media_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL DEFAULT 'like',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Unique reaction per user per comment
    CONSTRAINT unique_media_comment_reaction UNIQUE (comment_id, user_id)
);

-- Add indexes
CREATE INDEX idx_media_comment_reactions_comment_id ON public.media_comment_reactions(comment_id);

-- Enable RLS
ALTER TABLE public.media_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to media comment reactions"
    ON public.media_comment_reactions FOR SELECT
    USING (true);

CREATE POLICY "Allow users to react to media comments"
    ON public.media_comment_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to remove their reactions"
    ON public.media_comment_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- RPC to handle media comment reaction
CREATE OR REPLACE FUNCTION public.handle_media_comment_reaction(
    p_comment_id UUID,
    p_reaction_type TEXT DEFAULT 'like'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.media_comment_reactions 
        WHERE comment_id = p_comment_id AND user_id = v_user_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.media_comment_reactions 
        WHERE comment_id = p_comment_id AND user_id = v_user_id;
    ELSE
        INSERT INTO public.media_comment_reactions (comment_id, user_id, reaction_type)
        VALUES (p_comment_id, v_user_id, p_reaction_type);
    END IF;
END;
$$;