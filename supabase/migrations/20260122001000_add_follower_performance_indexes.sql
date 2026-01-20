-- Sprint 9 Performance Indexes for User Followers
-- Optimize follower/following count queries

-- Index for checking if user follows someone
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_followers_following 
ON user_followers(following_id);

-- Index for checking user's followers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_followers_follower 
ON user_followers(follower_id);

-- Composite index for efficient follower list queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_followers_follower_created 
ON user_followers(follower_id, created_at DESC);

-- Composite index for efficient following list queries  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_followers_following_created 
ON user_followers(following_id, created_at DESC);