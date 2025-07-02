import { supabase } from '../supabase';
import { realtimeManager } from '../realtime-manager';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface WaitingRoomPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
  joinedAt: string;
  lastSeen: string;
  isNPC?: boolean;
  preferences?: {
    difficulty: 'easy' | 'medium' | 'hard';
    topics: string[];
    gameMode: string;
  };
}

export interface RoomSettings {
  maxPlayers: number;
  minPlayers: number;
  questionCount: number;
  timePerQuestion: number;
  topic: string;
  allowNPCs: boolean;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  gameMode: 'standard' | 'speed' | 'marathon' | 'tournament';
  isPrivate: boolean;
  requiresInvite: boolean;
}

export interface WaitingRoomState {
  roomId: string;
  roomCode: string;
  players: WaitingRoomPlayer[];
  settings: RoomSettings;
  isReady: boolean;
  hostId: string;
  createdAt: string;
  status: 'waiting' | 'starting' | 'full' | 'closed';
}

// ============================================================================
// WAITING ROOM MANAGER
// ============================================================================

export class WaitingRoomManager {
  private roomId: string;
  private settings: RoomSettings;
  private players: Map<string, WaitingRoomPlayer> = new Map();
  private playerJoinCallbacks: Set<(player: WaitingRoomPlayer) => void> = new Set();
  private playerLeaveCallbacks: Set<(playerId: string) => void> = new Set();
  private roomReadyCallbacks: Set<() => void> = new Set();
  private realtimeSubscription: any = null;

  constructor(roomId: string, settings: RoomSettings) {
    this.roomId = roomId;
    this.settings = settings;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<void> {
    try {
      console.log('🏠 Initializing waiting room for room:', this.roomId);

      // Set up real-time subscriptions for player activity
      await this.setupRealtimeSubscription();

      // Load existing players if room already exists
      await this.loadExistingPlayers();

      console.log('✅ Waiting room initialized');
    } catch (error) {
      console.error('Error initializing waiting room:', error);
      throw error;
    }
  }

  private async setupRealtimeSubscription(): Promise<void> {
    try {
      this.realtimeSubscription = supabase
        .channel(`waiting_room_${this.roomId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'multiplayer_room_players',
          filter: `room_id=eq.${this.roomId}`
        }, (payload) => {
          this.handlePlayerUpdate(payload);
        })
        .subscribe();

      console.log('🔄 Waiting room real-time subscription active');
    } catch (error) {
      console.error('Error setting up waiting room subscription:', error);
    }
  }

  private async loadExistingPlayers(): Promise<void> {
    try {
      const { data: existingPlayers, error } = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', this.roomId)
        .eq('is_active', true);

      if (error) throw error;

      if (existingPlayers) {
        for (const playerData of existingPlayers) {
          const player: WaitingRoomPlayer = {
            id: playerData.user_id || playerData.player_id,
            name: playerData.player_name,
            isHost: playerData.is_host,
            isReady: playerData.is_ready,
            isOnline: true,
            joinedAt: playerData.joined_at,
            lastSeen: new Date().toISOString(),
            isNPC: playerData.is_npc || false,
            preferences: playerData.preferences || undefined,
          };

          this.players.set(player.id, player);
        }

        console.log(`📥 Loaded ${existingPlayers.length} existing players`);
      }
    } catch (error) {
      console.error('Error loading existing players:', error);
    }
  }

  // ============================================================================
  // PLAYER MANAGEMENT
  // ============================================================================

  async addPlayer(player: WaitingRoomPlayer): Promise<boolean> {
    try {
      // Check if room is full
      if (this.players.size >= this.settings.maxPlayers) {
        console.warn('❌ Cannot add player - room is full');
        return false;
      }

      // Check if player already exists
      if (this.players.has(player.id)) {
        console.warn('⚠️ Player already in room');
        return false;
      }

      // Add player to room
      this.players.set(player.id, player);

      // Save to database
      await this.savePlayerToDatabase(player);

      // Notify callbacks
      this.playerJoinCallbacks.forEach(callback => {
        try {
          callback(player);
        } catch (error) {
          console.error('Error in player join callback:', error);
        }
      });

      console.log(`👤 Player joined: ${player.name} (${this.players.size}/${this.settings.maxPlayers})`);

      // Check if room is ready to start
      this.checkRoomReadiness();

      return true;
    } catch (error) {
      console.error('Error adding player:', error);
      return false;
    }
  }

  async removePlayer(playerId: string): Promise<void> {
    try {
      const player = this.players.get(playerId);
      if (!player) {
        console.warn('⚠️ Player not found in room');
        return;
      }

      // Remove from room
      this.players.delete(playerId);

      // Update database
      await supabase
        .from('multiplayer_room_players')
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq('room_id', this.roomId)
        .eq('user_id', playerId);

      // Notify callbacks
      this.playerLeaveCallbacks.forEach(callback => {
        try {
          callback(playerId);
        } catch (error) {
          console.error('Error in player leave callback:', error);
        }
      });

      console.log(`👋 Player left: ${player.name} (${this.players.size}/${this.settings.maxPlayers})`);

      // If host left, assign new host
      if (player.isHost && this.players.size > 0) {
        await this.assignNewHost();
      }

      // Check room status
      this.checkRoomReadiness();
    } catch (error) {
      console.error('Error removing player:', error);
    }
  }

  async updatePlayerReadiness(playerId: string, isReady: boolean): Promise<void> {
    try {
      const player = this.players.get(playerId);
      if (!player) {
        console.warn('⚠️ Player not found for readiness update');
        return;
      }

      // Update player readiness
      player.isReady = isReady;
      player.lastSeen = new Date().toISOString();

      // Update database
      await supabase
        .from('multiplayer_room_players')
        .update({ 
          is_ready: isReady,
          last_seen: player.lastSeen 
        })
        .eq('room_id', this.roomId)
        .eq('user_id', playerId);

      console.log(`🎯 Player readiness: ${player.name} = ${isReady ? 'ready' : 'not ready'}`);

      // Check if room is ready to start
      this.checkRoomReadiness();
    } catch (error) {
      console.error('Error updating player readiness:', error);
    }
  }

  private async assignNewHost(): Promise<void> {
    try {
      // Find the longest-standing human player to be the new host
      const humanPlayers = Array.from(this.players.values())
        .filter(player => !player.isNPC)
        .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

      if (humanPlayers.length > 0) {
        const newHost = humanPlayers[0];
        newHost.isHost = true;

        // Update database
        await supabase
          .from('multiplayer_room_players')
          .update({ is_host: true })
          .eq('room_id', this.roomId)
          .eq('user_id', newHost.id);

        console.log(`👑 New host assigned: ${newHost.name}`);
      }
    } catch (error) {
      console.error('Error assigning new host:', error);
    }
  }

  // ============================================================================
  // ROOM MANAGEMENT
  // ============================================================================

  private checkRoomReadiness(): void {
    const readyPlayers = Array.from(this.players.values()).filter(p => p.isReady || p.isHost);
    const humanPlayers = Array.from(this.players.values()).filter(p => !p.isNPC);
    
    const isReady = 
      this.players.size >= this.settings.minPlayers &&
      humanPlayers.length >= 1 && // At least one human player
      readyPlayers.length === this.players.size;

    if (isReady) {
      console.log('🚀 Room is ready to start!');
      this.roomReadyCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in room ready callback:', error);
        }
      });
    }
  }

  async updateRoomSettings(newSettings: Partial<RoomSettings>): Promise<void> {
    try {
      // Only host can update settings
      const host = Array.from(this.players.values()).find(p => p.isHost);
      if (!host) {
        console.warn('⚠️ No host found to update settings');
        return;
      }

      // Update settings
      this.settings = { ...this.settings, ...newSettings };

      // Update database
      await supabase
        .from('multiplayer_rooms')
        .update({
          max_players: this.settings.maxPlayers,
          min_players: this.settings.minPlayers,
          question_count: this.settings.questionCount,
          time_per_question: this.settings.timePerQuestion,
          topic: this.settings.topic,
          allow_npcs: this.settings.allowNPCs,
          difficulty_level: this.settings.difficultyLevel,
          game_mode: this.settings.gameMode,
          is_private: this.settings.isPrivate,
          requires_invite: this.settings.requiresInvite,
        })
        .eq('id', this.roomId);

      console.log('⚙️ Room settings updated:', newSettings);

      // Re-check readiness after settings change
      this.checkRoomReadiness();
    } catch (error) {
      console.error('Error updating room settings:', error);
    }
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  private async savePlayerToDatabase(player: WaitingRoomPlayer): Promise<void> {
    try {
      await supabase.from('multiplayer_room_players').insert({
        room_id: this.roomId,
        user_id: player.isNPC ? null : player.id,
        player_id: player.id,
        player_name: player.name,
        is_host: player.isHost,
        is_ready: player.isReady,
        is_npc: player.isNPC || false,
        joined_at: player.joinedAt,
        last_seen: player.lastSeen,
        preferences: player.preferences || null,
        is_active: true,
      });
    } catch (error) {
      console.error('Error saving player to database:', error);
      throw error;
    }
  }

  // ============================================================================
  // REAL-TIME HANDLERS
  // ============================================================================

  private handlePlayerUpdate(payload: any): void {
    console.log('👥 Player update received:', payload);
    
    switch (payload.eventType) {
      case 'INSERT':
        // New player joined
        this.handlePlayerJoined(payload.new);
        break;
      case 'UPDATE':
        // Player status updated
        this.handlePlayerStatusUpdate(payload.new);
        break;
      case 'DELETE':
        // Player left
        this.handlePlayerLeft(payload.old);
        break;
    }
  }

  private handlePlayerJoined(playerData: any): void {
    const player: WaitingRoomPlayer = {
      id: playerData.user_id || playerData.player_id,
      name: playerData.player_name,
      isHost: playerData.is_host,
      isReady: playerData.is_ready,
      isOnline: true,
      joinedAt: playerData.joined_at,
      lastSeen: playerData.last_seen,
      isNPC: playerData.is_npc || false,
      preferences: playerData.preferences || undefined,
    };

    if (!this.players.has(player.id)) {
      this.players.set(player.id, player);
      
      this.playerJoinCallbacks.forEach(callback => {
        try {
          callback(player);
        } catch (error) {
          console.error('Error in player join callback:', error);
        }
      });
    }
  }

  private handlePlayerStatusUpdate(playerData: any): void {
    const playerId = playerData.user_id || playerData.player_id;
    const player = this.players.get(playerId);
    
    if (player) {
      player.isReady = playerData.is_ready;
      player.isOnline = playerData.is_active;
      player.lastSeen = playerData.last_seen;
      
      this.checkRoomReadiness();
    }
  }

  private handlePlayerLeft(playerData: any): void {
    const playerId = playerData.user_id || playerData.player_id;
    
    if (this.players.has(playerId)) {
      this.players.delete(playerId);
      
      this.playerLeaveCallbacks.forEach(callback => {
        try {
          callback(playerId);
        } catch (error) {
          console.error('Error in player leave callback:', error);
        }
      });
    }
  }

  // ============================================================================
  // EVENT SUBSCRIPTIONS
  // ============================================================================

  onPlayerJoin(callback: (player: WaitingRoomPlayer) => void): () => void {
    this.playerJoinCallbacks.add(callback);
    return () => this.playerJoinCallbacks.delete(callback);
  }

  onPlayerLeave(callback: (playerId: string) => void): () => void {
    this.playerLeaveCallbacks.add(callback);
    return () => this.playerLeaveCallbacks.delete(callback);
  }

  onRoomReady(callback: () => void): () => void {
    this.roomReadyCallbacks.add(callback);
    return () => this.roomReadyCallbacks.delete(callback);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getPlayers(): WaitingRoomPlayer[] {
    return Array.from(this.players.values());
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  getHumanPlayerCount(): number {
    return Array.from(this.players.values()).filter(p => !p.isNPC).length;
  }

  isRoomFull(): boolean {
    return this.players.size >= this.settings.maxPlayers;
  }

  isRoomReady(): boolean {
    const readyPlayers = Array.from(this.players.values()).filter(p => p.isReady || p.isHost);
    const humanPlayers = Array.from(this.players.values()).filter(p => !p.isNPC);
    
    return this.players.size >= this.settings.minPlayers &&
           humanPlayers.length >= 1 &&
           readyPlayers.length === this.players.size;
  }

  getRoomSettings(): RoomSettings {
    return { ...this.settings };
  }

  getRoomState(): WaitingRoomState {
    return {
      roomId: this.roomId,
      roomCode: '', // Would be set by the room creation process
      players: this.getPlayers(),
      settings: this.getRoomSettings(),
      isReady: this.isRoomReady(),
      hostId: Array.from(this.players.values()).find(p => p.isHost)?.id || '',
      createdAt: new Date().toISOString(),
      status: this.isRoomFull() ? 'full' : (this.isRoomReady() ? 'starting' : 'waiting'),
    };
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  cleanup(): void {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }

    this.players.clear();
    this.playerJoinCallbacks.clear();
    this.playerLeaveCallbacks.clear();
    this.roomReadyCallbacks.clear();

    console.log('🧹 Waiting room manager cleaned up');
  }
} 