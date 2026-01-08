-- 1. Create spot_comments table
CREATE TABLE IF NOT EXISTS spot_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES spot_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create comment_reactions table
CREATE TABLE IF NOT EXISTS comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES spot_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(comment_id, user_id)
);

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'reply', 'like_spot', 'like_media'
    entity_id UUID NOT NULL, -- ID of the comment, spot, or media
    entity_type TEXT NOT NULL, -- 'comment', 'spot', 'media'
    context_id UUID, -- Optional: Spot ID for linking
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Create generic content_reports table
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('spot', 'comment', 'media')),
    reason TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Migrate existing spot_flags to content_reports
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spot_flags') THEN
        INSERT INTO content_reports (user_id, target_id, target_type, reason, details, created_at)
        SELECT user_id, spot_id, 'spot', reason, details, created_at FROM spot_flags;
        DROP TABLE spot_flags;
    END IF;
END $$;

-- 6. Enable RLS
ALTER TABLE spot_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Spot Comments
CREATE POLICY "Anyone can view spot comments" ON spot_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON spot_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON spot_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON spot_comments FOR DELETE USING (auth.uid() = user_id);

-- Comment Reactions
CREATE POLICY "Anyone can view comment reactions" ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reactions" ON comment_reactions FOR ALL USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Content Reports
CREATE POLICY "Users can create reports" ON content_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view report counts" ON content_reports FOR SELECT USING (true);
-- Admin only policies would go here for DELETE

-- 8. Trigger for Reply Notifications
CREATE OR REPLACE FUNCTION handle_comment_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
    original_comment_author_id UUID;
BEGIN
    -- Only trigger if it's a reply (has parent_id) and not replying to self
    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id INTO original_comment_author_id FROM spot_comments WHERE id = NEW.parent_id;
        
        IF original_comment_author_id != NEW.user_id THEN
            INSERT INTO notifications (user_id, actor_id, type, entity_id, entity_type, context_id)
            VALUES (original_comment_author_id, NEW.user_id, 'reply', NEW.id, 'comment', NEW.spot_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_reply
    AFTER INSERT ON spot_comments
    FOR EACH ROW EXECUTE FUNCTION handle_comment_reply_notification();

-- 9. Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_spot_comments_updated_at
    BEFORE UPDATE ON spot_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
