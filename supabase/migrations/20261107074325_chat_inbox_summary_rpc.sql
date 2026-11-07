-- Chat inbox: return last message + unread count per conversation in one indexed query,
-- instead of the client downloading every message of every conversation (messages (*)).
-- SECURITY INVOKER: RLS on messages / conversation_participants still applies.

CREATE OR REPLACE FUNCTION public.get_inbox_summary()
RETURNS TABLE (conversation_id uuid, unread_count integer, last_message jsonb)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT
        cp.conversation_id,
        COALESCE(u.cnt, 0)::integer AS unread_count,
        lm.msg AS last_message
    FROM public.conversation_participants cp
    LEFT JOIN LATERAL (
        SELECT to_jsonb(m) AS msg
        FROM public.messages m
        WHERE m.conversation_id = cp.conversation_id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) lm ON true
    LEFT JOIN LATERAL (
        SELECT count(*) AS cnt
        FROM public.messages m
        WHERE m.conversation_id = cp.conversation_id
          AND m.is_read IS NOT TRUE
          AND m.sender_id <> (SELECT auth.uid())
    ) u ON true
    WHERE cp.user_id = (SELECT auth.uid())
      AND cp.status <> 'rejected';
$$;

REVOKE EXECUTE ON FUNCTION public.get_inbox_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_inbox_summary() TO authenticated;

-- Fast unread counts.
CREATE INDEX IF NOT EXISTS idx_messages_unread
    ON public.messages (conversation_id) WHERE is_read IS NOT TRUE;
