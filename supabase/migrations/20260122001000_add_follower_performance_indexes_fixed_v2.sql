-- Sprint 9 Performance Indexes for User Followers (Fixed Syntax)
-- Optimize follower/following count queries without transaction conflicts

-- Create individual indexes without CONCURRENTLY to avoid transaction issues
CREATE INDEX IF NOT EXISTS idx_user_followers_following 
ON user_followers(following_id);

CREATE INDEX IF NOT EXISTS idx_user_followers_follower 
ON user_followers(follower_id);

CREATE INDEX IF NOT EXISTS idx_user_followers_follower_created 
ON user_followers(follower_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_followers_following_created 
ON user_followers(following_id, created_at DESC);