-- Add displayName column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "displayName" TEXT;

COMMENT ON COLUMN profiles."displayName" IS 'The flexible display name chosen by the user during onboarding.';
