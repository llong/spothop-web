CREATE TABLE IF NOT EXISTS spot_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(spot_id, user_id)
);

-- Enable RLS
ALTER TABLE spot_flags ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to insert their own flags
CREATE POLICY "Users can create flags"
ON spot_flags FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to see their own flags
CREATE POLICY "Users can view their own flags"
ON spot_flags FOR SELECT
USING (auth.uid() = user_id);

-- Comment on table and columns
COMMENT ON TABLE spot_flags IS 'Community reports for inappropriate or incorrect spots.';
COMMENT ON COLUMN spot_flags.reason IS 'Predefined reason for flagging.';
COMMENT ON COLUMN spot_flags.details IS 'Additional details provided by the user.';
