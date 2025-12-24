create table user_followers (
  follower_id uuid references auth.users not null,
  following_id uuid references auth.users not null,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- RLS policies
alter table user_followers enable row level security;

create policy "Public user_followers are viewable by everyone."
  on user_followers for select
  using ( true );

create policy "Users can insert their own follower rows."
  on user_followers for insert
  with check ( auth.uid() = follower_id );

create policy "Users can delete their own follower rows."
  on user_followers for delete
  using ( auth.uid() = follower_id );
