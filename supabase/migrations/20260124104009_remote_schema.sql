drop extension if exists "pg_net";

-- Setup extensions in the dedicated schema
create extension if not exists "postgis" with schema "extensions";
create extension if not exists "uuid-ossp" with schema "extensions";

create type "public"."media_type_enum" as enum ('photo', 'video');
create type "public"."spot_type_enum" as enum ('rail', 'ledge', 'gap', 'wall_ride', 'skatepark', 'manual_pad');

create table "public"."comment_reactions" (
    "id" uuid not null default gen_random_uuid(),
    "comment_id" uuid not null,
    "user_id" uuid not null,
    "type" text not null,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."comment_reactions" enable row level security;

create table "public"."content_reports" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "target_id" uuid not null,
    "target_type" text not null,
    "reason" text not null,
    "details" text,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."content_reports" enable row level security;

create table "public"."conversation_participants" (
    "id" uuid not null default gen_random_uuid(),
    "conversation_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null default 'member'::text,
    "status" text not null default 'pending'::text,
    "joined_at" timestamp with time zone not null default now()
);

alter table "public"."conversation_participants" enable row level security;

create table "public"."conversations" (
    "id" uuid not null default gen_random_uuid(),
    "name" text,
    "is_group" boolean not null default false,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "last_message_at" timestamp with time zone not null default now()
);

alter table "public"."conversations" enable row level security;

create table "public"."media_comments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "mediaid" uuid,
    "userid" uuid,
    "content" text not null,
    "createdat" timestamp with time zone default now(),
    "updatedat" timestamp with time zone default now()
);

alter table "public"."media_comments" enable row level security;

create table "public"."media_likes" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "photo_id" uuid,
    "video_id" uuid,
    "media_type" public.media_type_enum not null,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."media_likes" enable row level security;

create table "public"."media_tags" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "mediaid" uuid,
    "userid" uuid,
    "createdby" uuid,
    "createdat" timestamp with time zone default now()
);

alter table "public"."media_tags" enable row level security;

create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "conversation_id" uuid not null,
    "sender_id" uuid not null,
    "content" text not null,
    "is_read" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."messages" enable row level security;

create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "actor_id" uuid not null,
    "type" text not null,
    "entity_id" uuid not null,
    "entity_type" text not null,
    "is_read" boolean default false,
    "created_at" timestamp with time zone not null default now(),
    "context_id" uuid
);

alter table "public"."notifications" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "username" text not null,
    "avatarUrl" text,
    "city" text,
    "country" text,
    "riderType" text,
    "bio" text,
    "instagramHandle" text,
    "spotsContributed" uuid[] default ARRAY[]::uuid[],
    "likedSpots" uuid[] default ARRAY[]::uuid[],
    "dislikedSpots" uuid[] default ARRAY[]::uuid[],
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now(),
    "displayName" text,
    "role" text default 'user'::text,
    "isBanned" boolean default false
);

alter table "public"."profiles" enable row level security;

create table "public"."spot_comments" (
    "id" uuid not null default gen_random_uuid(),
    "spot_id" uuid not null,
    "user_id" uuid not null,
    "parent_id" uuid,
    "content" text not null,
    "is_edited" boolean default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

alter table "public"."spot_comments" enable row level security;

create table "public"."spot_photos" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "spot_id" uuid,
    "user_id" uuid,
    "url" text not null,
    "created_at" timestamp without time zone default now(),
    "mediaid" uuid,
    "width" integer,
    "height" integer,
    "thumbnailurl" text,
    "thumbnail_large_url" text,
    "thumbnail_small_url" text
);

alter table "public"."spot_photos" enable row level security;

create table "public"."spot_videos" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "spot_id" uuid,
    "user_id" uuid,
    "url" text not null,
    "thumbnail_url" text not null,
    "duration" integer not null,
    "created_at" timestamp without time zone default now(),
    "width" integer,
    "height" integer,
    "file_size" bigint
);

alter table "public"."spot_videos" enable row level security;

create table "public"."spots" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "created_by" uuid not null,
    "difficulty" text not null,
    "is_lit" boolean default false,
    "kickout_risk" integer not null,
    "latitude" double precision not null,
    "longitude" double precision not null,
    "location" extensions.geometry(Point,4326),
    "address" text,
    "city" text,
    "country" text,
    "created_at" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now(),
    "spotType" public.spot_type_enum[] default '{}'::public.spot_type_enum[],
    "postal_code" text,
    "media" jsonb default '[]'::jsonb,
    "thumbnail_url" text,
    "upvotes" integer default 0,
    "downvotes" integer default 0,
    "flag_count" integer default 0,
    "status" text default 'active'::text,
    "spot_type" public.spot_type_enum[] default '{}'::public.spot_type_enum[],
    "state" text
);

alter table "public"."spots" enable row level security;

create table "public"."user_blocks" (
    "id" uuid not null default gen_random_uuid(),
    "blocker_id" uuid not null,
    "blocked_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."user_blocks" enable row level security;

create table "public"."user_favorite_spots" (
    "user_id" uuid not null,
    "spot_id" uuid not null,
    "created_at" timestamp with time zone default now()
);

alter table "public"."user_favorite_spots" enable row level security;

create table "public"."user_followers" (
    "follower_id" uuid not null,
    "following_id" uuid not null,
    "created_at" timestamp with time zone default now()
);

alter table "public"."user_followers" enable row level security;

create table "public"."user_roles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "role" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);

alter table "public"."user_roles" enable row level security;

-- Index section
CREATE UNIQUE INDEX comment_reactions_comment_id_user_id_key ON public.comment_reactions USING btree (comment_id, user_id);
CREATE UNIQUE INDEX comment_reactions_pkey ON public.comment_reactions USING btree (id);
CREATE UNIQUE INDEX content_reports_pkey ON public.content_reports USING btree (id);
CREATE UNIQUE INDEX conversation_participants_conversation_id_user_id_key ON public.conversation_participants USING btree (conversation_id, user_id);
CREATE UNIQUE INDEX conversation_participants_pkey ON public.conversation_participants USING btree (id);
CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);
CREATE INDEX idx_spot_photos_spot_id ON public.spot_photos USING btree (spot_id);
CREATE INDEX idx_spot_photos_user_id ON public.spot_photos USING btree (user_id);
CREATE UNIQUE INDEX media_comments_pkey ON public.media_comments USING btree (id);
CREATE UNIQUE INDEX media_likes_pkey ON public.media_likes USING btree (id);
CREATE UNIQUE INDEX media_likes_user_photo_unique ON public.media_likes USING btree (user_id, photo_id);
CREATE UNIQUE INDEX media_likes_user_video_unique ON public.media_likes USING btree (user_id, video_id);
CREATE UNIQUE INDEX media_tags_pkey ON public.media_tags USING btree (id);
CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);
CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);
CREATE UNIQUE INDEX spot_comments_pkey ON public.spot_comments USING btree (id);
CREATE UNIQUE INDEX spot_photos_pkey ON public.spot_photos USING btree (id);
CREATE UNIQUE INDEX spot_videos_pkey ON public.spot_videos USING btree (id);
CREATE UNIQUE INDEX spots_pkey ON public.spots USING btree (id);
CREATE UNIQUE INDEX user_blocks_blocker_id_blocked_id_key ON public.user_blocks USING btree (blocker_id, blocked_id);
CREATE UNIQUE INDEX user_blocks_pkey ON public.user_blocks USING btree (id);
CREATE UNIQUE INDEX user_favorite_spots_pkey ON public.user_favorite_spots USING btree (user_id, spot_id);
CREATE UNIQUE INDEX user_followers_pkey ON public.user_followers USING btree (follower_id, following_id);
CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);
CREATE UNIQUE INDEX user_roles_user_id_key ON public.user_roles USING btree (user_id);

-- Constraints
alter table "public"."comment_reactions" add constraint "comment_reactions_pkey" PRIMARY KEY using index "comment_reactions_pkey";
alter table "public"."content_reports" add constraint "content_reports_pkey" PRIMARY KEY using index "content_reports_pkey";
alter table "public"."conversation_participants" add constraint "conversation_participants_pkey" PRIMARY KEY using index "conversation_participants_pkey";
alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";
alter table "public"."media_comments" add constraint "media_comments_pkey" PRIMARY KEY using index "media_comments_pkey";
alter table "public"."media_likes" add constraint "media_likes_pkey" PRIMARY KEY using index "media_likes_pkey";
alter table "public"."media_tags" add constraint "media_tags_pkey" PRIMARY KEY using index "media_tags_pkey";
alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";
alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";
alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";
alter table "public"."spot_comments" add constraint "spot_comments_pkey" PRIMARY KEY using index "spot_comments_pkey";
alter table "public"."spot_photos" add constraint "spot_photos_pkey" PRIMARY KEY using index "spot_photos_pkey";
alter table "public"."spot_videos" add constraint "spot_videos_pkey" PRIMARY KEY using index "spot_videos_pkey";
alter table "public"."spots" add constraint "spots_pkey" PRIMARY KEY using index "spots_pkey";
alter table "public"."user_blocks" add constraint "user_blocks_pkey" PRIMARY KEY using index "user_blocks_pkey";
alter table "public"."user_favorite_spots" add constraint "user_favorite_spots_pkey" PRIMARY KEY using index "user_favorite_spots_pkey";
alter table "public"."user_followers" add constraint "user_followers_pkey" PRIMARY KEY using index "user_followers_pkey";
alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

-- Foreign Keys & Checks (Condensed for stability)
alter table "public"."comment_reactions" add constraint "comment_reactions_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.spot_comments(id) ON DELETE CASCADE;
alter table "public"."comment_reactions" add constraint "comment_reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."content_reports" add constraint "content_reports_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table "public"."conversation_participants" add constraint "conversation_participants_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
alter table "public"."conversation_participants" add constraint "conversation_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table "public"."conversations" add constraint "conversations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
alter table "public"."media_comments" add constraint "media_comments_userid_fkey" FOREIGN KEY (userid) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."media_likes" add constraint "media_likes_photo_id_fkey" FOREIGN KEY (photo_id) REFERENCES public.spot_photos(id) ON DELETE CASCADE;
alter table "public"."media_likes" add constraint "media_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."media_likes" add constraint "media_likes_video_id_fkey" FOREIGN KEY (video_id) REFERENCES public.spot_videos(id) ON DELETE CASCADE;
alter table "public"."media_tags" add constraint "media_tags_createdby_fkey" FOREIGN KEY (createdby) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."media_tags" add constraint "media_tags_userid_fkey" FOREIGN KEY (userid) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
alter table "public"."messages" add constraint "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
alter table "public"."notifications" add constraint "notifications_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."spot_comments" add constraint "spot_comments_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.spot_comments(id) ON DELETE CASCADE;
alter table "public"."spot_comments" add constraint "spot_comments_spot_id_fkey" FOREIGN KEY (spot_id) REFERENCES public.spots(id) ON DELETE CASCADE;
alter table "public"."spot_comments" add constraint "spot_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."spot_photos" add constraint "spot_photos_spot_id_fkey" FOREIGN KEY (spot_id) REFERENCES public.spots(id) ON DELETE CASCADE;
alter table "public"."spot_photos" add constraint "spot_photos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table "public"."spot_videos" add constraint "spot_videos_spot_id_fkey" FOREIGN KEY (spot_id) REFERENCES public.spots(id) ON DELETE CASCADE;
alter table "public"."spot_videos" add constraint "spot_videos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table "public"."spots" add constraint "spots_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table "public"."user_blocks" add constraint "user_blocks_blocked_id_fkey" FOREIGN KEY (blocked_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table "public"."user_blocks" add constraint "user_blocks_blocker_id_fkey" FOREIGN KEY (blocker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table "public"."user_favorite_spots" add constraint "user_favorite_spots_spot_id_fkey" FOREIGN KEY (spot_id) REFERENCES public.spots(id) ON DELETE CASCADE;
alter table "public"."user_favorite_spots" add constraint "user_favorite_spots_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."user_followers" add constraint "user_followers_follower_id_fkey" FOREIGN KEY (follower_id) REFERENCES auth.users(id);
alter table "public"."user_followers" add constraint "user_followers_following_id_fkey" FOREIGN KEY (following_id) REFERENCES auth.users(id);
alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

set check_function_bodies = off;

-- Functions
CREATE OR REPLACE FUNCTION public.check_spot_status() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$ BEGIN IF NEW.downvotes > 0 AND (NEW.downvotes::float / NULLIF(NEW.upvotes, 0)) >= 2 THEN NEW.status := 'flagged'; END IF; RETURN NEW; END; $function$;
CREATE OR REPLACE FUNCTION public.cleanup_reports_on_delete() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ BEGIN DELETE FROM content_reports WHERE target_id = OLD.id; RETURN OLD; END; $function$;
CREATE OR REPLACE FUNCTION public.find_common_1on1_conversation(user_a uuid, user_b uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE found_id UUID; BEGIN SELECT c.id INTO found_id FROM conversations c JOIN conversation_participants cp1 ON cp1.conversation_id = c.id JOIN conversation_participants cp2 ON cp2.conversation_id = c.id WHERE c.is_group = false AND cp1.user_id = user_a AND cp2.user_id = user_b LIMIT 1; RETURN found_id; END; $function$;
CREATE OR REPLACE FUNCTION public.get_user_follow_stats_simple(p_user_id uuid) RETURNS TABLE(follower_count bigint, following_count bigint) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ BEGIN RETURN QUERY SELECT (SELECT COUNT(*) FROM user_followers WHERE following_id = p_user_id) as follower_count, (SELECT COUNT(*) FROM user_followers WHERE follower_id = p_user_id) as following_count; END; $function$;

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
$function$;