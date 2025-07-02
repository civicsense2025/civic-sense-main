-- Add indexes for better multiplayer performance
-- These indexes will speed up common queries

-- Index for finding rooms by code (common operation)
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_room_code 
ON multiplayer_rooms(room_code);

-- Index for finding active rooms
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_status_expires 
ON multiplayer_rooms(room_status, expires_at);

-- Index for finding players in a room
CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_room_id 
ON multiplayer_room_players(room_id);

-- Index for finding player by user_id or guest_token
CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_user_id 
ON multiplayer_room_players(user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_guest_token 
ON multiplayer_room_players(guest_token) 
WHERE guest_token IS NOT NULL;

-- Index for question responses by room and player
CREATE INDEX IF NOT EXISTS idx_multiplayer_question_responses_room_player 
ON multiplayer_question_responses(room_id, player_id);

-- Index for question responses by attempt
CREATE INDEX IF NOT EXISTS idx_multiplayer_question_responses_attempt 
ON multiplayer_question_responses(attempt_id);

-- Index for chat messages by room
CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_room 
ON multiplayer_chat_messages(room_id, created_at DESC);

-- Index for game events by room
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_events_room 
ON multiplayer_game_events(room_id, created_at DESC);

-- Add comments for documentation
COMMENT ON INDEX idx_multiplayer_rooms_room_code IS 'Speed up room lookups by code';
COMMENT ON INDEX idx_multiplayer_rooms_status_expires IS 'Speed up finding active/expired rooms';
COMMENT ON INDEX idx_multiplayer_room_players_room_id IS 'Speed up player lookups by room';
COMMENT ON INDEX idx_multiplayer_room_players_user_id IS 'Speed up finding user rooms';
COMMENT ON INDEX idx_multiplayer_room_players_guest_token IS 'Speed up finding guest rooms';
COMMENT ON INDEX idx_multiplayer_question_responses_room_player IS 'Speed up response queries';
COMMENT ON INDEX idx_multiplayer_question_responses_attempt IS 'Speed up attempt queries';
COMMENT ON INDEX idx_multiplayer_chat_messages_room IS 'Speed up chat message queries';
COMMENT ON INDEX idx_multiplayer_game_events_room IS 'Speed up game event queries'; 