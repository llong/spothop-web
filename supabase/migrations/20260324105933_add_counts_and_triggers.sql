-- Phase 1: Add counter columns
ALTER TABLE public.spots ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;
ALTER TABLE public.spot_photos ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE public.spot_photos ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
ALTER TABLE public.spot_videos ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE public.spot_videos ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Phase 2: Create Trigger Functions for counters

-- 1. Spot Favorites
CREATE OR REPLACE FUNCTION public.handle_spot_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.spots SET favorite_count = favorite_count + 1 WHERE id = NEW.spot_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.spots SET favorite_count = GREATEST(0, favorite_count - 1) WHERE id = OLD.spot_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Media Likes (Photo/Video)
CREATE OR REPLACE FUNCTION public.handle_media_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.photo_id IS NOT NULL THEN
            UPDATE public.spot_photos SET like_count = like_count + 1 WHERE id = NEW.photo_id;
        ELSIF NEW.video_id IS NOT NULL THEN
            UPDATE public.spot_videos SET like_count = like_count + 1 WHERE id = NEW.video_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.photo_id IS NOT NULL THEN
            UPDATE public.spot_photos SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.photo_id;
        ELSIF OLD.video_id IS NOT NULL THEN
            UPDATE public.spot_videos SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.video_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Media Comments (Photo/Video)
CREATE OR REPLACE FUNCTION public.handle_media_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.photo_id IS NOT NULL THEN
            UPDATE public.spot_photos SET comment_count = comment_count + 1 WHERE id = NEW.photo_id;
        ELSIF NEW.video_id IS NOT NULL THEN
            UPDATE public.spot_videos SET comment_count = comment_count + 1 WHERE id = NEW.video_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.photo_id IS NOT NULL THEN
            UPDATE public.spot_photos SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.photo_id;
        ELSIF OLD.video_id IS NOT NULL THEN
            UPDATE public.spot_videos SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.video_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. User Follows
CREATE OR REPLACE FUNCTION public.handle_user_follow_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
        UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
        UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase 3: Create Triggers

DROP TRIGGER IF EXISTS on_spot_favorite_count ON public.user_favorite_spots;
CREATE TRIGGER on_spot_favorite_count
AFTER INSERT OR DELETE ON public.user_favorite_spots
FOR EACH ROW EXECUTE FUNCTION public.handle_spot_favorite_count();

DROP TRIGGER IF EXISTS on_media_like_count ON public.media_likes;
CREATE TRIGGER on_media_like_count
AFTER INSERT OR DELETE ON public.media_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_media_like_count();

DROP TRIGGER IF EXISTS on_user_follow_count ON public.user_follows;
CREATE TRIGGER on_user_follow_count
AFTER INSERT OR DELETE ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.handle_user_follow_count();

DROP TRIGGER IF EXISTS on_media_comment_count ON public.media_comments;
CREATE TRIGGER on_media_comment_count
AFTER INSERT OR DELETE ON public.media_comments
FOR EACH ROW EXECUTE FUNCTION public.handle_media_comment_count();

-- Phase 4: Seed existing counts
UPDATE public.spots s SET favorite_count = (SELECT COUNT(*)::int FROM public.user_favorite_spots ufs WHERE ufs.spot_id = s.id);
UPDATE public.spot_photos sp SET like_count = (SELECT COUNT(*)::int FROM public.media_likes ml WHERE ml.photo_id = sp.id);
UPDATE public.spot_photos sp SET comment_count = (SELECT COUNT(*)::int FROM public.media_comments mc WHERE mc.photo_id = sp.id);
UPDATE public.spot_videos sv SET like_count = (SELECT COUNT(*)::int FROM public.media_likes ml WHERE ml.video_id = sv.id);
UPDATE public.spot_videos sv SET comment_count = (SELECT COUNT(*)::int FROM public.media_comments mc WHERE mc.video_id = sv.id);
UPDATE public.profiles p SET follower_count = (SELECT COUNT(*)::int FROM public.user_follows uf WHERE uf.following_id = p.id);
UPDATE public.profiles p SET following_count = (SELECT COUNT(*)::int FROM public.user_follows uf WHERE uf.follower_id = p.id);
