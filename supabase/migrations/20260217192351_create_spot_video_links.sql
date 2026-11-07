-- Create spot_video_links table
CREATE TABLE IF NOT EXISTS public.spot_video_links (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    spot_id uuid REFERENCES public.spots(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    youtube_video_id text NOT NULL,
    start_time integer NOT NULL, -- in seconds
    end_time integer, -- in seconds, optional
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create spot_video_link_likes table
CREATE TABLE IF NOT EXISTS public.spot_video_link_likes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    link_id uuid REFERENCES public.spot_video_links(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(link_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_spot_video_links_spot_id ON public.spot_video_links(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_video_links_user_id ON public.spot_video_links(user_id);
CREATE INDEX IF NOT EXISTS idx_spot_video_link_likes_link_id ON public.spot_video_link_likes(link_id);
CREATE INDEX IF NOT EXISTS idx_spot_video_link_likes_user_id ON public.spot_video_link_likes(user_id);

-- Enable RLS
ALTER TABLE public.spot_video_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_video_link_likes ENABLE ROW LEVEL SECURITY;

-- Policies for spot_video_links
CREATE POLICY "Spot video links are viewable by everyone" 
    ON public.spot_video_links FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can create spot video links" 
    ON public.spot_video_links FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own spot video links" 
    ON public.spot_video_links FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spot video links" 
    ON public.spot_video_links FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies for spot_video_link_likes
CREATE POLICY "Spot video link likes are viewable by everyone" 
    ON public.spot_video_link_likes FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can like spot video links" 
    ON public.spot_video_link_likes FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can unlike their own likes" 
    ON public.spot_video_link_likes FOR DELETE 
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_spot_video_links_updated_at
    BEFORE UPDATE ON public.spot_video_links
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
