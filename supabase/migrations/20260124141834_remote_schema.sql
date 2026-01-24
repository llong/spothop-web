create extension if not exists "postgis" with schema "public";

alter table "public"."spots" alter column "location" set data type public.geometry(Point,4326) using "location"::public.geometry(Point,4326);

alter table "public"."comment_reactions" add constraint "comment_reactions_comment_id_user_id_key" UNIQUE using index "comment_reactions_comment_id_user_id_key";

alter table "public"."comment_reactions" add constraint "comment_reactions_type_check" CHECK ((type = ANY (ARRAY['like'::text, 'dislike'::text]))) not valid;

alter table "public"."comment_reactions" validate constraint "comment_reactions_type_check";

alter table "public"."content_reports" add constraint "content_reports_target_type_check" CHECK ((target_type = ANY (ARRAY['spot'::text, 'comment'::text, 'media'::text]))) not valid;

alter table "public"."content_reports" validate constraint "content_reports_target_type_check";

alter table "public"."conversation_participants" add constraint "conversation_participants_conversation_id_user_id_key" UNIQUE using index "conversation_participants_conversation_id_user_id_key";

alter table "public"."conversation_participants" add constraint "conversation_participants_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text]))) not valid;

alter table "public"."conversation_participants" validate constraint "conversation_participants_role_check";

alter table "public"."conversation_participants" add constraint "conversation_participants_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text]))) not valid;

alter table "public"."conversation_participants" validate constraint "conversation_participants_status_check";

alter table "public"."media_likes" add constraint "media_likes_check_single_target" CHECK ((((photo_id IS NOT NULL) AND (video_id IS NULL) AND (media_type = 'photo'::public.media_type_enum)) OR ((photo_id IS NULL) AND (video_id IS NOT NULL) AND (media_type = 'video'::public.media_type_enum)))) not valid;

alter table "public"."media_likes" validate constraint "media_likes_check_single_target";

alter table "public"."media_likes" add constraint "media_likes_user_photo_unique" UNIQUE using index "media_likes_user_photo_unique";

alter table "public"."media_likes" add constraint "media_likes_user_video_unique" UNIQUE using index "media_likes_user_video_unique";

alter table "public"."profiles" add constraint "profiles_rider_type_check" CHECK (("riderType" = ANY (ARRAY['inline'::text, 'skateboard'::text, 'bmx'::text, 'scooter'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_rider_type_check";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'moderator'::text, 'user'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."spots" add constraint "spots_difficulty_check" CHECK ((difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))) not valid;

alter table "public"."spots" validate constraint "spots_difficulty_check";

alter table "public"."spots" add constraint "spots_kickout_risk_check" CHECK (((kickout_risk >= 1) AND (kickout_risk <= 5))) not valid;

alter table "public"."spots" validate constraint "spots_kickout_risk_check";

alter table "public"."spots" add constraint "spots_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'flagged'::text, 'removed'::text]))) not valid;

alter table "public"."spots" validate constraint "spots_status_check";

alter table "public"."user_blocks" add constraint "user_blocks_blocker_id_blocked_id_key" UNIQUE using index "user_blocks_blocker_id_blocked_id_key";

alter table "public"."user_roles" add constraint "user_roles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'user'::text]))) not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_check";

alter table "public"."user_roles" add constraint "user_roles_user_id_key" UNIQUE using index "user_roles_user_id_key";

set check_function_bodies = off;

create type "public"."geometry_dump" as ("path" integer[], "geom" public.geometry);

CREATE OR REPLACE FUNCTION public.get_user_followers_batch(p_user_id uuid, p_cursor uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(user_id uuid, username text, avatar_url text, cursor uuid, has_more boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH list AS (
        SELECT 
            p.id as r_user_id,
            p.username as r_username,
            p."avatarUrl" as r_avatar_url,
            p.id as r_cursor
        FROM user_followers uf
        JOIN profiles p ON uf.follower_id = p.id
        WHERE uf.following_id = p_user_id
          AND (p_cursor IS NULL OR p.id > p_cursor)
        ORDER BY p.id
        LIMIT p_limit + 1
    )
    SELECT 
        r_user_id,
        r_username,
        r_avatar_url,
        r_cursor,
        (SELECT COUNT(*) FROM list) > p_limit
    FROM list
    LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_following_batch(p_user_id uuid, p_cursor uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(user_id uuid, username text, avatar_url text, cursor uuid, has_more boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH list AS (
        SELECT 
            p.id as r_user_id,
            p.username as r_username,
            p."avatarUrl" as r_avatar_url,
            p.id as r_cursor
        FROM user_followers uf
        JOIN profiles p ON uf.following_id = p.id
        WHERE uf.follower_id = p_user_id
          AND (p_cursor IS NULL OR p.id > p_cursor)
        ORDER BY p.id
        LIMIT p_limit + 1
    )
    SELECT 
        r_user_id,
        r_username,
        r_avatar_url,
        r_cursor,
        (SELECT COUNT(*) FROM list) > p_limit
    FROM list
    LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_comment_reply_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_media_like_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    owner_id UUID;
BEGIN
    IF NEW.media_type = 'photo' THEN
        SELECT user_id INTO owner_id FROM spot_photos WHERE id = NEW.photo_id;
    ELSE
        SELECT user_id INTO owner_id FROM spot_videos WHERE id = NEW.video_id;
    END IF;
    IF owner_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, actor_id, type, entity_id, entity_type)
        VALUES (owner_id, NEW.user_id, 'like_media', COALESCE(NEW.photo_id, NEW.video_id), 'media');
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_comment_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    spot_creator_id UUID;
BEGIN
    IF NEW.parent_id IS NULL THEN
        SELECT created_by INTO spot_creator_id FROM spots WHERE id = NEW.spot_id;
        IF spot_creator_id != NEW.user_id THEN
            INSERT INTO notifications (user_id, actor_id, type, entity_id, entity_type)
            VALUES (spot_creator_id, NEW.user_id, 'comment', NEW.id, 'comment');
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_spot_favorite_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    spot_creator_id UUID;
BEGIN
    SELECT created_by INTO spot_creator_id FROM spots WHERE id = NEW.spot_id;
    IF spot_creator_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, actor_id, type, entity_id, entity_type)
        VALUES (spot_creator_id, NEW.user_id, 'like_spot', NEW.spot_id, 'spot');
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_banned()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND "isBanned" = true
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_chat_participant(chat_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = chat_id AND user_id = auth.uid()
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.protect_profile_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.spots_in_view(min_lat double precision, min_lng double precision, max_lat double precision, max_lng double precision)
 RETURNS TABLE(id uuid, name text, description text, latitude double precision, longitude double precision, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  return query
  select
    s.id,
    s.name,
    s.description,
    s.latitude,
    s.longitude,
    s.created_at
  from
    spots s
  where
    s.latitude >= min_lat
    and s.latitude <= max_lat
    and s.longitude >= min_lng
    and s.longitude <= max_lng;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spots_within_distance(lat double precision, lng double precision, distance_km double precision)
 RETURNS TABLE(id uuid, name text, description text, created_by uuid, spot_type text, difficulty text, is_lit boolean, kickout_risk text, latitude double precision, longitude double precision, address text, city text, country text, created_at timestamp with time zone, updated_at timestamp with time zone, distance double precision)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  return query
  select
    s.*,
    ST_Distance(
      s.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1000 as distance
  from spots s
  where ST_DWithin(
    s.location::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    distance_km * 1000
  )
  order by distance;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_spot_location()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.location := ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

create type "public"."valid_detail" as ("valid" boolean, "reason" character varying, "location" public.geometry);

CREATE OR REPLACE FUNCTION public.check_spot_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.downvotes > 0 AND (NEW.downvotes::float / NULLIF(NEW.upvotes, 0)) >= 2 THEN
    NEW.status := 'flagged';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_reports_on_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM content_reports WHERE target_id = OLD.id;
  RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.find_common_1on1_conversation(user_a uuid, user_b uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    found_id UUID;
BEGIN
    SELECT c.id INTO found_id
    FROM conversations c
    JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
    JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
    WHERE c.is_group = false
    AND cp1.user_id = user_a
    AND cp2.user_id = user_b
    LIMIT 1;
    RETURN found_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_follow_stats_simple(p_user_id uuid)
 RETURNS TABLE(follower_count bigint, following_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM user_followers WHERE following_id = p_user_id) as follower_count,
        (SELECT COUNT(*) FROM user_followers WHERE follower_id = p_user_id) as following_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_on_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE participant RECORD;
BEGIN
    FOR participant IN SELECT user_id FROM conversation_participants WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id AND status = 'accepted'
    LOOP
        INSERT INTO notifications (user_id, actor_id, type, entity_id, entity_type, context_id)
        VALUES (participant.user_id, NEW.sender_id, 'new_message', NEW.id, 'message', NEW.conversation_id);
    END LOOP;
    RETURN NEW;
END;
$function$
;


  create policy "delete_comment_reactions"
  on "public"."comment_reactions"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "insert_comment_reactions"
  on "public"."comment_reactions"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "select_comment_reactions"
  on "public"."comment_reactions"
  as permissive
  for select
  to public
using (true);



  create policy "update_comment_reactions"
  on "public"."comment_reactions"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "delete_content_reports"
  on "public"."content_reports"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "insert_content_reports"
  on "public"."content_reports"
  as permissive
  for insert
  to authenticated
with check ((public.is_admin() OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "select_content_reports"
  on "public"."content_reports"
  as permissive
  for select
  to authenticated
using ((public.is_admin() OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "update_content_reports"
  on "public"."content_reports"
  as permissive
  for update
  to authenticated
using (public.is_admin());



  create policy "auth_select_participants"
  on "public"."conversation_participants"
  as permissive
  for select
  to authenticated
using (public.is_chat_participant(conversation_id));



  create policy "authenticated_insert_participants"
  on "public"."conversation_participants"
  as permissive
  for insert
  to authenticated
with check (((( SELECT auth.uid() AS uid) = user_id) OR public.is_chat_participant(conversation_id)));



  create policy "authenticated_update_participants"
  on "public"."conversation_participants"
  as permissive
  for update
  to authenticated
using (((( SELECT auth.uid() AS uid) = user_id) OR public.is_chat_participant(conversation_id)));



  create policy "authenticated_insert_conversations"
  on "public"."conversations"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = created_by));



  create policy "authenticated_select_conversations"
  on "public"."conversations"
  as permissive
  for select
  to authenticated
using ((public.is_chat_participant(id) OR (( SELECT auth.uid() AS uid) = created_by)));



  create policy "authenticated_delete_media_comments"
  on "public"."media_comments"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = userid));



  create policy "authenticated_insert_media_comments"
  on "public"."media_comments"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = userid));



  create policy "authenticated_update_media_comments"
  on "public"."media_comments"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = userid));



  create policy "media_comments_select_policy"
  on "public"."media_comments"
  as permissive
  for select
  to public
using (true);



  create policy "delete_media_likes"
  on "public"."media_likes"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "insert_media_likes"
  on "public"."media_likes"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "select_media_likes"
  on "public"."media_likes"
  as permissive
  for select
  to public
using (true);



  create policy "update_media_likes"
  on "public"."media_likes"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "authenticated_delete_media_tags"
  on "public"."media_tags"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = userid));



  create policy "authenticated_insert_media_tags"
  on "public"."media_tags"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = userid));



  create policy "media_tags_select_policy"
  on "public"."media_tags"
  as permissive
  for select
  to public
using (true);



  create policy "auth_insert_messages"
  on "public"."messages"
  as permissive
  for insert
  to authenticated
with check (public.is_chat_participant(conversation_id));



  create policy "auth_select_messages"
  on "public"."messages"
  as permissive
  for select
  to authenticated
using (public.is_chat_participant(conversation_id));



  create policy "manage_notifications_delete"
  on "public"."notifications"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "manage_notifications_select"
  on "public"."notifications"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "manage_notifications_update"
  on "public"."notifications"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable read access for all users"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "authenticated_insert_profiles"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = id));



  create policy "manage_profiles_update"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((public.is_admin() OR (( SELECT auth.uid() AS uid) = id)));



  create policy "delete_spot_comments"
  on "public"."spot_comments"
  as permissive
  for delete
  to authenticated
using ((public.is_admin() OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "insert_spot_comments"
  on "public"."spot_comments"
  as permissive
  for insert
  to authenticated
with check (((( SELECT auth.uid() AS uid) = user_id) AND (NOT public.is_banned())));



  create policy "select_spot_comments"
  on "public"."spot_comments"
  as permissive
  for select
  to public
using (true);



  create policy "update_spot_comments"
  on "public"."spot_comments"
  as permissive
  for update
  to authenticated
using ((public.is_admin() OR ((( SELECT auth.uid() AS uid) = user_id) AND (NOT public.is_banned()))));



  create policy "anyone_select_photos"
  on "public"."spot_photos"
  as permissive
  for select
  to public
using (true);



  create policy "authenticated_update_photos"
  on "public"."spot_photos"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "delete_spot_photos"
  on "public"."spot_photos"
  as permissive
  for delete
  to authenticated
using ((public.is_admin() OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "insert_spot_photos"
  on "public"."spot_photos"
  as permissive
  for insert
  to authenticated
with check (((( SELECT auth.uid() AS uid) = user_id) AND (NOT public.is_banned())));



  create policy "anyone_select_videos"
  on "public"."spot_videos"
  as permissive
  for select
  to public
using (true);



  create policy "authenticated_update_videos"
  on "public"."spot_videos"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "delete_spot_videos"
  on "public"."spot_videos"
  as permissive
  for delete
  to authenticated
using ((public.is_admin() OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "insert_spot_videos"
  on "public"."spot_videos"
  as permissive
  for insert
  to authenticated
with check (((( SELECT auth.uid() AS uid) = user_id) AND (NOT public.is_banned())));



  create policy "delete_spots"
  on "public"."spots"
  as permissive
  for delete
  to authenticated
using ((public.is_admin() OR (( SELECT auth.uid() AS uid) = created_by)));



  create policy "insert_spots"
  on "public"."spots"
  as permissive
  for insert
  to authenticated
with check ((public.is_admin() OR ((( SELECT auth.uid() AS uid) = created_by) AND (NOT public.is_banned()))));



  create policy "select_spots"
  on "public"."spots"
  as permissive
  for select
  to public
using (true);



  create policy "update_spots"
  on "public"."spots"
  as permissive
  for update
  to authenticated
using ((public.is_admin() OR ((( SELECT auth.uid() AS uid) = created_by) AND (NOT public.is_banned()))));



  create policy "authenticated_manage_blocks"
  on "public"."user_blocks"
  as permissive
  for all
  to authenticated
using ((( SELECT auth.uid() AS uid) = blocker_id));



  create policy "authenticated_manage_favorites"
  on "public"."user_favorite_spots"
  as permissive
  for all
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Public user_followers are viewable by everyone."
  on "public"."user_followers"
  as permissive
  for select
  to public
using (true);



  create policy "authenticated_delete_followers"
  on "public"."user_followers"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = follower_id));



  create policy "authenticated_insert_followers"
  on "public"."user_followers"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = follower_id));



  create policy "Allow authenticated users to read roles"
  on "public"."user_roles"
  as permissive
  for select
  to authenticated
using (true);


CREATE TRIGGER on_media_like AFTER INSERT ON public.media_likes FOR EACH ROW EXECUTE FUNCTION public.handle_media_like_notification();

CREATE TRIGGER on_new_message_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_message();

CREATE TRIGGER on_profile_update_protect_roles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_roles();

CREATE TRIGGER on_comment_delete_cleanup_reports BEFORE DELETE ON public.spot_comments FOR EACH ROW EXECUTE FUNCTION public.cleanup_reports_on_delete();

CREATE TRIGGER on_comment_reply AFTER INSERT ON public.spot_comments FOR EACH ROW EXECUTE FUNCTION public.handle_comment_reply_notification();

CREATE TRIGGER on_new_comment AFTER INSERT ON public.spot_comments FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment_notification();

CREATE TRIGGER update_spot_comments_updated_at BEFORE UPDATE ON public.spot_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_photo_delete_cleanup_reports BEFORE DELETE ON public.spot_photos FOR EACH ROW EXECUTE FUNCTION public.cleanup_reports_on_delete();

CREATE TRIGGER on_video_delete_cleanup_reports BEFORE DELETE ON public.spot_videos FOR EACH ROW EXECUTE FUNCTION public.cleanup_reports_on_delete();

CREATE TRIGGER on_spot_delete_cleanup_reports BEFORE DELETE ON public.spots FOR EACH ROW EXECUTE FUNCTION public.cleanup_reports_on_delete();

CREATE TRIGGER spot_status_trigger BEFORE UPDATE ON public.spots FOR EACH ROW EXECUTE FUNCTION public.check_spot_status();

CREATE TRIGGER spots_location_trigger BEFORE INSERT OR UPDATE ON public.spots FOR EACH ROW EXECUTE FUNCTION public.update_spot_location();

CREATE TRIGGER on_spot_favorite AFTER INSERT ON public.user_favorite_spots FOR EACH ROW EXECUTE FUNCTION public.handle_spot_favorite_notification();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


