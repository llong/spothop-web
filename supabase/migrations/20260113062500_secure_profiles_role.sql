-- Security hardening for profiles table
-- Prevents non-admins from promoting themselves or unbanning accounts

CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is an admin, allow any change
  IF (SELECT public.is_admin()) THEN
    RETURN NEW;
  END IF;

  -- Otherwise, ensure sensitive columns are not changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;

  IF NEW."isBanned" IS DISTINCT FROM OLD."isBanned" THEN
    NEW."isBanned" := OLD."isBanned";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_update_protect_roles ON profiles;
CREATE TRIGGER on_profile_update_protect_roles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_roles();

COMMENT ON FUNCTION public.protect_profile_roles() IS 'Ensures only admins can modify roles and ban status on profiles.';
