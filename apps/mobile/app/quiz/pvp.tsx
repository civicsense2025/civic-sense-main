import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Room {
  id: string;
  code: string;
  name: string;
  host_id: string;
  host_name: string;
  topic_id: string;
  topic_name: string;
  max_players: number;
  current_players: number;
  status: 'waiting' | 'in_progress' | 'completed';
  created_at: string;
  game_mode: 'classic_quiz' | 'speed_round' | 'debate_mode';
  is_private: boolean;
}

interface RoomCardProps {
  room: Room;
  onJoin: () => void;
  isJoining: boolean;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin, isJoining }) => {
  const { theme } = useTheme();
  
  const getStatusColor = () => {
    switch (room.status) {
      case 'waiting': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#6B7280';
      default: return theme.foregroundSecondary;
    }
  };
  
  const getModeIcon = () => {
    switch (room.game_mode) {
      case 'speed_round': return '⚡';
      case 'debate_mode': return '💬';
      default: return '🎯';
    }
  };
  
  const canJoin = room.status === 'waiting' && room.current_players < room.max_players;
  
  return (
    <Card style={styles.roomCard} variant="outlined">
      <View style={styles.roomHeader}>
        <View style={styles.roomInfo}>
          <View style={styles.roomTitleRow}>
            <Text style={styles.modeIcon}>{getModeIcon()}</Text>
            <Text variant="callout" color="inherit" style={styles.roomName}>
              {room.name}
            </Text>
            {room.is_private && (
              <View style={[styles.privateBadge, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="lock-closed" size={12} color={theme.primary} />
              </View>
            )}
          </View>
          <Text variant="footnote" color="secondary" style={styles.hostName}>
            Host: {room.host_name}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {room.status === 'waiting' ? 'Open' : room.status === 'in_progress' ? 'Playing' : 'Ended'}
          </Text>
        </View>
      </View>
      
      <View style={styles.roomDetails}>
        <Text variant="footnote" color="secondary" style={styles.topicText}>
          📚 {room.topic_name}
        </Text>
        <View style={styles.playerCount}>
          <Ionicons name="people" size={14} color={theme.foregroundSecondary} />
          <Text variant="footnote" color="secondary">
            {room.current_players}/{room.max_players}
          </Text>
        </View>
      </View>
      
      {canJoin && (
        <TouchableOpacity
          style={[styles.joinButton, { backgroundColor: theme.primary }]}
          onPress={onJoin}
          disabled={isJoining}
        >
          {isJoining ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.joinButtonText}>Join Room</Text>
          )}
        </TouchableOpacity>
      )}
    </Card>
  );
};

export default function PvPScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinPrivate, setShowJoinPrivate] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'public' | 'my_rooms'>('public');
  
  useEffect(() => {
    loadRooms();
    
    // Set up real-time subscription for room updates
    const subscription = supabase
      .channel('room_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'multiplayer_rooms' },
        handleRoomUpdate
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const loadRooms = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - in production, fetch from Supabase
      const mockRooms: Room[] = [
        {
          id: '1',
          code: 'ABC123',
          name: 'Constitutional Challenge',
          host_id: 'host1',
          host_name: 'Alex Smith',
          topic_id: 'const-law',
          topic_name: 'Constitutional Law',
          max_players: 4,
          current_players: 2,
          status: 'waiting',
          created_at: new Date().toISOString(),
          game_mode: 'classic_quiz',
          is_private: false,
        },
        {
          id: '2',
          code: 'XYZ789',
          name: 'Speed Quiz Arena',
          host_id: 'host2',
          host_name: 'Jordan Lee',
          topic_id: 'civics-101',
          topic_name: 'Civics 101',
          max_players: 6,
          current_players: 4,
          status: 'waiting',
          created_at: new Date().toISOString(),
          game_mode: 'speed_round',
          is_private: false,
        },
        {
          id: '3',
          code: 'DEF456',
          name: 'Debate Night',
          host_id: 'host3',
          host_name: 'Sam Chen',
          topic_id: 'current-events',
          topic_name: 'Current Events',
          max_players: 8,
          current_players: 8,
          status: 'in_progress',
          created_at: new Date().toISOString(),
          game_mode: 'debate_mode',
          is_private: true,
        },
      ];
      
      setRooms(mockRooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
      Alert.alert('Error', 'Failed to load multiplayer rooms.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRoomUpdate = (payload: any) => {
    // Handle real-time room updates
    if (payload.eventType === 'INSERT') {
      setRooms(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setRooms(prev => prev.map(room => 
        room.id === payload.new.id ? payload.new : room
      ));
    } else if (payload.eventType === 'DELETE') {
      setRooms(prev => prev.filter(room => room.id !== payload.old.id));
    }
  };
  
  const handleJoinRoom = async (room: Room) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to join multiplayer games.');
      return;
    }
    
    try {
      setJoiningRoomId(room.id);
      
      // Save room info for quick rejoin
      await AsyncStorage.setItem('@last_room', JSON.stringify({
        roomId: room.id,
        roomCode: room.code,
        timestamp: Date.now()
      }));
      
      // Navigate to quiz session with multiplayer mode
      router.push({
        pathname: `/quiz-session/${room.topic_id}`,
        params: {
          mode: room.game_mode,
          roomId: room.id,
          roomCode: room.code,
          isHost: 'false'
        }
      } as any);
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Error', 'Failed to join room. Please try again.');
    } finally {
      setJoiningRoomId(null);
    }
  };
  
  const handleCreateRoom = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to create multiplayer games.');
      return;
    }
    
    router.push('/quiz/create-room' as any);
  };
  
  const handleJoinPrivateRoom = async () => {
    if (!roomCode.trim()) {
      Alert.alert('Code Required', 'Please enter a room code.');
      return;
    }
    
    try {
      setLoading(true);
      
      // In production, verify room code with backend
      const room = rooms.find(r => r.code === roomCode.toUpperCase());
      
      if (room) {
        await handleJoinRoom(room);
      } else {
        Alert.alert('Invalid Code', 'No room found with that code.');
      }
    } finally {
      setLoading(false);
      setShowJoinPrivate(false);
      setRoomCode('');
    }
  };
  
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadRooms().finally(() => setRefreshing(false));
  }, []);
  
  const filteredRooms = activeTab === 'public' 
    ? rooms.filter(r => !r.is_private)
    : rooms.filter(r => r.host_id === user?.id || r.current_players > 0); // My rooms or rooms I'm in
  
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen 
          options={{
            title: 'Multiplayer',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" variant="pulse" />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Finding multiplayer rooms...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Multiplayer',
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
        }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🎮</Text>
        <Text variant="title2" color="inherit" style={styles.headerTitle}>
          PvP Quiz Battles
        </Text>
        <Text variant="body" color="secondary" style={styles.headerSubtitle}>
          Challenge friends in real-time quiz competitions
        </Text>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateRoom}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Create Room</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setShowJoinPrivate(true)}
        >
          <Ionicons name="key" size={20} color={theme.foreground} />
          <Text style={[styles.actionButtonText, { color: theme.foreground }]}>
            Join Private
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'public' && styles.tabActive,
            activeTab === 'public' && { borderBottomColor: theme.primary }
          ]}
          onPress={() => setActiveTab('public')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'public' ? theme.primary : theme.foregroundSecondary }
          ]}>
            Public Rooms
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my_rooms' && styles.tabActive,
            activeTab === 'my_rooms' && { borderBottomColor: theme.primary }
          ]}
          onPress={() => setActiveTab('my_rooms')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'my_rooms' ? theme.primary : theme.foregroundSecondary }
          ]}>
            My Rooms
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Room List */}
      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            onJoin={() => handleJoinRoom(item)}
            isJoining={joiningRoomId === item.id}
          />
        )}
        contentContainerStyle={styles.roomList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text variant="title3" color="inherit" style={styles.emptyTitle}>
              No Rooms Available
            </Text>
            <Text variant="body" color="secondary" style={styles.emptyText}>
              {activeTab === 'public' 
                ? 'Be the first to create a public room!'
                : 'Create a room or join one to get started'}
            </Text>
          </View>
        }
      />
      
      {/* Join Private Room Modal */}
      {showJoinPrivate && (
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent} variant="elevated">
            <Text variant="title3" color="inherit" style={styles.modalTitle}>
              Join Private Room
            </Text>
            <Text variant="body" color="secondary" style={styles.modalSubtitle}>
              Enter the room code shared by the host
            </Text>
            
            <TextInput
              style={[styles.codeInput, { backgroundColor: theme.card, color: theme.foreground }]}
              placeholder="Enter room code"
              placeholderTextColor={theme.foregroundSecondary}
              value={roomCode}
              onChangeText={setRoomCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outlined"
                onPress={() => {
                  setShowJoinPrivate(false);
                  setRoomCode('');
                }}
                style={styles.modalButton}
              />
              <Button
                title="Join"
                variant="primary"
                onPress={handleJoinPrivateRoom}
                style={styles.modalButton}
              />
            </View>
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    fontFamily: fontFamily.text,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fontFamily.text,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.text,
  },
  roomList: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  roomCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  roomInfo: {
    flex: 1,
  },
  roomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  modeIcon: {
    fontSize: 18,
  },
  roomName: {
    fontFamily: fontFamily.text,
    flex: 1,
  },
  privateBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  hostName: {
    fontFamily: fontFamily.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily.text,
  },
  roomDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  topicText: {
    fontFamily: fontFamily.text,
    flex: 1,
  },
  playerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  joinButton: {
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fontFamily.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: spacing.xl,
  },
  modalTitle: {
    fontFamily: fontFamily.display,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  codeInput: {
    height: 56,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    fontSize: 20,
    fontFamily: fontFamily.mono,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
}); 