CREATE TABLE user_favorite_spots (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    spot_id UUID REFERENCES spots(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, spot_id)
);

ALTER TABLE user_favorite_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorite spots."
ON user_favorite_spots
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
