-- Enable RLS on multiplayer tables
alter table public.multiplayer_rooms enable row level security;
alter table public.multiplayer_room_players enable row level security;

-- Drop ALL existing policies to ensure clean slate
drop policy if exists "Anyone can create a player in a room" on public.multiplayer_room_players;
drop policy if exists "Anyone can read players" on public.multiplayer_room_players;
drop policy if exists "multiplayer_room_players_delete_own" on public.multiplayer_room_players;
drop policy if exists "multiplayer_room_players_insert_own" on public.multiplayer_room_players;
drop policy if exists "multiplayer_room_players_update_own" on public.multiplayer_room_players;
drop policy if exists "multiplayer_room_players_view_room_members" on public.multiplayer_room_players;
drop policy if exists "Players can delete their own records" on public.multiplayer_room_players;
drop policy if exists "Players can update their own records" on public.multiplayer_room_players;
drop policy if exists "room_visibility" on public.multiplayer_rooms;

-- Create new RLS policies for multiplayer_room_players
create policy "players_can_select_themselves"
on public.multiplayer_room_players
for select
using (
  -- User can see their own rows
  user_id = auth.uid()
  -- Or guest rows matching their token
  or (
    guest_token is not null 
    and guest_token = coalesce(
      current_setting('request.jwt.claims', true)::jsonb ->> 'guest_token',
      current_setting('app.guest_token', true)
    )
  )
);

create policy "players_can_insert_themselves"
on public.multiplayer_room_players
for insert
with check (
  -- Authenticated users can only insert rows for themselves
  (auth.uid() is not null and user_id = auth.uid())
  -- Guests can only insert rows with their token
  or (
    auth.uid() is null 
    and guest_token = coalesce(
      current_setting('request.jwt.claims', true)::jsonb ->> 'guest_token',
      current_setting('app.guest_token', true)
    )
  )
);

-- Create policy for multiplayer_rooms
create policy "room_visibility"
on public.multiplayer_rooms
for all using (
  -- Room is visible if:
  exists (
    select 1 
    from public.multiplayer_room_players
    where room_id = id
    and (
      -- User is a player in the room
      user_id = auth.uid()
      -- Or guest token matches
      or (
        guest_token is not null 
        and guest_token = coalesce(
          current_setting('request.jwt.claims', true)::jsonb ->> 'guest_token',
          current_setting('app.guest_token', true)
        )
      )
    )
  )
  -- Or room is not expired
  or (expires_at > now())
);

-- Create atomic join function
create or replace function public.join_multiplayer_room(
  p_room_code text,
  p_player_name text,
  p_player_emoji text default '😊'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_room multiplayer_rooms%rowtype;
  v_player multiplayer_room_players%rowtype;
  v_user_id uuid;
  v_guest_token text;
begin
  -- Get current user context
  v_user_id := auth.uid();
  v_guest_token := coalesce(
    current_setting('request.jwt.claims', true)::jsonb ->> 'guest_token',
    current_setting('app.guest_token', true)
  );

  -- Find room
  select * into v_room
  from public.multiplayer_rooms
  where room_code = upper(p_room_code)
  and (expires_at > now() or expires_at is null);

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  -- Check if room is full
  if v_room.current_players >= v_room.max_players then
    raise exception 'ROOM_FULL';
  end if;

  -- Check if player already exists
  select * into v_player
  from public.multiplayer_room_players
  where room_id = v_room.id
  and (
    (v_user_id is not null and user_id = v_user_id)
    or (v_guest_token is not null and guest_token = v_guest_token)
  );

  if not found then
    -- Create new player
    insert into public.multiplayer_room_players (
      room_id,
      user_id,
      guest_token,
      player_name,
      player_emoji,
      is_host,
      is_connected,
      is_ready,
      join_order,
      score,
      questions_answered,
      questions_correct,
      last_activity_at
    )
    values (
      v_room.id,
      v_user_id,
      case when v_user_id is null then v_guest_token else null end,
      p_player_name,
      p_player_emoji,
      -- First player becomes host
      (select count(*) = 0 from public.multiplayer_room_players where room_id = v_room.id),
      true,
      false,
      (select coalesce(max(join_order), 0) + 1 from public.multiplayer_room_players where room_id = v_room.id),
      0,
      0,
      0,
      now()
    )
    returning * into v_player;

    -- Update room player count
    update public.multiplayer_rooms
    set current_players = (
      select count(*)
      from public.multiplayer_room_players
      where room_id = v_room.id
    )
    where id = v_room.id
    returning * into v_room;
  else
    -- Update existing player
    update public.multiplayer_room_players
    set
      player_name = p_player_name,
      player_emoji = p_player_emoji,
      is_connected = true,
      last_activity_at = now()
    where id = v_player.id
    returning * into v_player;
  end if;

  -- Return combined room and player data
  return jsonb_build_object(
    'room', to_jsonb(v_room),
    'player', to_jsonb(v_player)
  );
end;
$$; 