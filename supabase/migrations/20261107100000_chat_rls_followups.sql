-- Chat RLS follow-ups (verified offline against a PGlite copy of these tables and policies):
-- 1. conversations had no UPDATE policy, so group admins' renames silently affected 0 rows.
-- 2. The "creator can always add participants" rule never expired: a creator removed from a chat could
--    re-insert themselves as admin. Creators may now only bootstrap a conversation that has no
--    participants yet; after that only chat admins can add participants.
-- 3. Drop check_email_exists: an anon-callable account-enumeration oracle that no client code uses.

-- SECURITY DEFINER on purpose: under RLS a removed creator cannot see the other participants, so a plain
-- NOT EXISTS subquery would always look empty to them and the backdoor would remain.
CREATE OR REPLACE FUNCTION public.chat_has_participants(chat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = chat_id);
$$;
REVOKE EXECUTE ON FUNCTION public.chat_has_participants(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chat_has_participants(uuid) TO authenticated;

DROP POLICY IF EXISTS "insert_participants_creator_or_admin" ON public.conversation_participants;
DROP POLICY IF EXISTS "insert_participants_bootstrap_or_admin" ON public.conversation_participants;
CREATE POLICY "insert_participants_bootstrap_or_admin"
    ON public.conversation_participants FOR INSERT TO authenticated
    WITH CHECK (
        (
            EXISTS (
                SELECT 1 FROM public.conversations c
                WHERE c.id = conversation_id AND c.created_by = (SELECT auth.uid())
            )
            AND NOT public.chat_has_participants(conversation_id)
        )
        OR public.is_chat_admin(conversation_id)
    );

DROP POLICY IF EXISTS "update_conversations_admin" ON public.conversations;
CREATE POLICY "update_conversations_admin"
    ON public.conversations FOR UPDATE TO authenticated
    USING (public.is_chat_admin(id))
    WITH CHECK (public.is_chat_admin(id));

DROP FUNCTION IF EXISTS public.check_email_exists(text);
