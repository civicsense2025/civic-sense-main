import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../atoms/Text';
import { Card } from '../ui/Card';
import { Button } from '../Button';
import { spacing, borderRadius, shadows } from '../../lib/theme';
import { ComprehensiveMultiplayerEngine, GameSettings } from '../../lib/multiplayer/comprehensive-engine';
import { Player, GameState } from '../../lib/multiplayer/game-state';
import useUIStrings from '../../lib/hooks/useUIStrings'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface EnhancedWaitingRoomProps {
  roomCode: string;
  roomId: string;
  hostUserId: string;
  topicId: string;
  gameSettings: GameSettings;
  onGameStart?: () => void;
  onLeaveRoom: () => void;
  difficulty?: string;
}

interface PlayerCardProps {
  player: Player & { isNPC?: boolean };
  isCurrentUser: boolean;
  isHost: boolean;
}

interface ReadyStatusProps {
  readyCount: number;
  totalPlayers: number;
  minPlayers: number;
}

// ============================================================================
// WAITING ROOM COMPONENT
// ============================================================================

export const EnhancedWaitingRoom: React.FC<EnhancedWaitingRoomProps> = ({
  roomCode,
  roomId,
  hostUserId,
  topicId,
  gameSettings,
  onGameStart,
  onLeaveRoom,
  difficulty = 'adaptive'
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { uiStrings } = useUIStrings();
  
  // State management
  const [gameEngine, setGameEngine] = useState<ComprehensiveMultiplayerEngine | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'starting' | 'in_progress' | 'completed'>('waiting');
  const [isHost, setIsHost] = useState(false);
  const [currentUserReady, setCurrentUserReady] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [startingGame, setStartingGame] = useState(false);
  
  // Animation values
  const pulseAnimation = useState(new Animated.Value(1))[0];
  const fadeAnimation = useState(new Animated.Value(0))[0];

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!user?.id) return;
    
    initializeGameEngine();
    
    return () => {
      gameEngine?.cleanup();
    };
  }, [user?.id, roomId]);

  const initializeGameEngine = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setConnecting(true);
      
      const engine = new ComprehensiveMultiplayerEngine(roomId, user.id, gameSettings);
      setGameEngine(engine);
      setIsHost(user.id === hostUserId);
      
      // Set up event listeners
      engine.onStateChange((state: GameState) => {
        setPlayers(state.players);
        setGameStatus(state.status);
        
        // Update current user ready state
        const currentPlayer = state.players.find((p: Player) => p.id === user.id);
        setCurrentUserReady(currentPlayer?.isReady || false);
      });
      
      // Join the room
      await engine.joinRoom(user.id, user.user_metadata?.full_name || 'Anonymous');
      
      // Start fade in animation
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('Error initializing waiting room:', error);
      Alert.alert(uiStrings.multiplayer.connectionError, uiStrings.multiplayer.failedToJoin);
    } finally {
      setConnecting(false);
    }
  }, [user?.id, roomId, hostUserId, gameSettings]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleToggleReady = useCallback(() => {
    if (!gameEngine || isHost) return;
    
    gameEngine.toggleReady();
    setCurrentUserReady(!currentUserReady);
    
    // Visual feedback
    Animated.sequence([
      Animated.timing(pulseAnimation, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  }, [gameEngine, isHost, currentUserReady, pulseAnimation]);

  const handleStartGame = useCallback(async () => {
    if (!gameEngine || !isHost) return;
    
    try {
      setStartingGame(true);
      await gameEngine.startGame();
      onGameStart?.();
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert(uiStrings.status.error, uiStrings.multiplayer.failedToStart);
    } finally {
      setStartingGame(false);
    }
  }, [gameEngine, isHost, onGameStart]);

  const handleLeaveRoom = useCallback(async () => {
    Alert.alert(
      '',
      uiStrings.multiplayer.leaveRoomConfirm,
      [
        { text: uiStrings.actions.cancel, style: 'cancel' },
        {
          text: uiStrings.actions.yes,
          style: 'destructive',
          onPress: async () => {
            if (gameEngine && user?.id) {
              await gameEngine.leaveRoom(user.id);
            }
            onLeaveRoom();
          }
        }
      ]
    );
  }, [gameEngine, user?.id, onLeaveRoom]);

  const handleInviteFriends = useCallback(async () => {
    const inviteMessage = uiStrings.multiplayer.inviteMessage.replace('{{roomCode}}', roomCode);
    
    try {
      const { Share } = await import('react-native');
      await Share.share({
        message: inviteMessage,
        title: uiStrings.multiplayer.inviteTitle
      });
    } catch (error) {
      console.error('Error sharing room code:', error);
    }
  }, [roomCode]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getReadyCount = useCallback(() => {
    return players.filter(p => p.isReady || p.isHost).length;
  }, [players]);

  const canStartGame = useCallback(() => {
    const readyCount = getReadyCount();
    const humanPlayers = players.filter(p => !(p as any).isNPC);
    
    return (
      isHost &&
      gameStatus === 'waiting' &&
      players.length >= gameSettings.minPlayers &&
      humanPlayers.length >= 1 &&
      readyCount === players.length
    );
  }, [isHost, gameStatus, players, gameSettings.minPlayers, getReadyCount]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderPlayerCard = ({ player, isCurrentUser, isHost: playerIsHost }: PlayerCardProps) => (
    <Card key={player.id} style={{ ...styles.playerCard, borderColor: theme.border }} variant="outlined">
      <View style={styles.playerInfo}>
        <View style={styles.playerAvatar}>
          <Text style={styles.playerIcon}>
            {(player as any).isNPC ? '🤖' : '👤'}
          </Text>
        </View>
        <View style={styles.playerDetails}>
          <Text variant="callout" color="inherit" style={styles.playerName}>
            {player.name} {isCurrentUser && '(You)'} {playerIsHost && '👑'}
          </Text>
          <Text style={[styles.playerType, { color: theme.foregroundSecondary }]}>
            {(player as any).isNPC ? uiStrings.multiplayer.aiPlayer : uiStrings.multiplayer.humanPlayer}
          </Text>
        </View>
      </View>
      
      <View style={styles.playerStatus}>
        {player.isReady || playerIsHost ? (
          <View style={[styles.readyBadge, { backgroundColor: theme.success }]}>
            <Ionicons name="checkmark" size={16} color={theme.background} />
            <Text variant="footnote" style={[styles.readyText, { color: theme.background }]}>
              Ready
            </Text>
          </View>
        ) : (
          <View style={[styles.waitingBadge, { backgroundColor: theme.busy }]}>
            <Ionicons name="time-outline" size={16} color={theme.background} />
            <Text variant="footnote" style={[styles.waitingText, { color: theme.background }]}>
              Waiting
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  const renderReadyStatus = ({ readyCount, totalPlayers, minPlayers }: ReadyStatusProps) => (
    <Card style={{ ...styles.statusCard, backgroundColor: theme.background }}>
      <View style={styles.statusHeader}>
        <Text variant="title3" color="inherit" style={styles.statusTitle}>
          Room Status
        </Text>
        <View style={styles.statusBadge}>
          <Text variant="footnote" style={[styles.statusText, { color: theme.primary }]}>
            {readyCount}/{totalPlayers} Ready
          </Text>
        </View>
      </View>
      
      <View style={styles.statusDetails}>
        <Text variant="callout" color="secondary">
          Minimum players: {minPlayers} | Maximum: {gameSettings.maxPlayers}
        </Text>
        {totalPlayers >= minPlayers && readyCount === totalPlayers && (
          <Text variant="callout" style={[styles.allReadyText, { color: theme.success }]}>
            ✅ All players ready!
          </Text>
        )}
      </View>
      
      {/* Progress bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: theme.success,
              width: `${Math.min(100, (readyCount / totalPlayers) * 100)}%`
            }
          ]}
        />
      </View>
    </Card>
  );

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (connecting) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="callout" color="secondary" style={styles.loadingText}>
            Joining room...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnimation }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleLeaveRoom}>
            <Ionicons name="chevron-back" size={24} color={theme.foregroundSecondary} />
            <Text variant="callout" color="secondary">Leave</Text>
          </TouchableOpacity>
          
          <View style={styles.roomInfo}>
            <Text variant="title2" color="inherit" style={styles.roomTitle}>
              Quiz Room
            </Text>
            <Text variant="footnote" color="secondary">
              Code: {roomCode}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleInviteFriends}>
            <Ionicons name="share-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Game Settings */}
          <Card style={{ ...styles.settingsCard, backgroundColor: theme.background }}>
            <Text variant="title3" color="inherit" style={styles.settingsTitle}>
              Game Settings
            </Text>
            <View style={styles.settingsGrid}>
              <View style={styles.settingItem}>
                <Text variant="footnote" color="secondary">Topic</Text>
                <Text variant="callout" color="inherit">{gameSettings.topic}</Text>
              </View>
              <View style={styles.settingItem}>
                <Text variant="footnote" color="secondary">Questions</Text>
                <Text variant="callout" color="inherit">{gameSettings.questionCount}</Text>
              </View>
              <View style={styles.settingItem}>
                <Text variant="footnote" color="secondary">Time Limit</Text>
                <Text variant="callout" color="inherit">{gameSettings.timePerQuestion}s</Text>
              </View>
              <View style={styles.settingItem}>
                <Text variant="footnote" color="secondary">Difficulty</Text>
                <Text variant="callout" color="inherit" style={styles.capitalize}>
                  {gameSettings.difficultyLevel}
                </Text>
              </View>
            </View>
          </Card>

          {/* Ready Status */}
          {renderReadyStatus({
            readyCount: getReadyCount(),
            totalPlayers: players.length,
            minPlayers: gameSettings.minPlayers
          })}

          {/* Players List */}
          <Text variant="title3" color="inherit" style={styles.playersTitle}>
            Players ({players.length}/{gameSettings.maxPlayers})
          </Text>
          
          {players.map(player => renderPlayerCard({
            player: player as Player & { isNPC?: boolean },
            isCurrentUser: player.id === user?.id,
            isHost: player.isHost
          }))}

          {/* Empty slots */}
          {Array.from({ length: gameSettings.maxPlayers - players.length }).map((_, index) => (
            <Card
              key={`empty-${index}`}
              style={{ ...styles.emptySlot, borderColor: theme.border }}
              variant="outlined"
            >
              <View style={styles.emptySlotContent}>
                <Ionicons name="person-add-outline" size={24} color={theme.foregroundTertiary} />
                <Text variant="callout" color="tertiary">
                  Waiting for player...
                </Text>
              </View>
            </Card>
          ))}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottomActions, { backgroundColor: theme.background }]}>
          {!isHost ? (
            <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
              <Button
                title={currentUserReady ? "Ready ✓" : "Ready Up"}
                onPress={handleToggleReady}
                variant={currentUserReady ? "secondary" : "primary"}
                size="lg"
                fullWidth
                disabled={gameStatus !== 'waiting'}
              />
            </Animated.View>
          ) : (
            <Button
              title={startingGame ? "Starting..." : "Start Game"}
              onPress={handleStartGame}
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canStartGame()}
              loading={startingGame}
            />
          )}
          
          {gameStatus === 'starting' && (
            <View style={styles.startingIndicator}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text variant="callout" color="secondary" style={styles.startingText}>
                Game starting in 3 seconds...
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  roomInfo: {
    alignItems: 'center',
  },
  roomTitle: {
    textAlign: 'center',
  },
  shareButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  settingsCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  settingsTitle: {
    marginBottom: spacing.md,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  settingItem: {
    flex: 1,
    minWidth: '45%',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  statusCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusTitle: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontWeight: '600',
  },
  statusDetails: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  allReadyText: {
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  playersTitle: {
    marginBottom: spacing.md,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  playerIcon: {
    fontSize: 20,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontWeight: '600',
  },
  playerType: {
    fontSize: 12,
    marginTop: 2,
  },
  playerStatus: {
    alignItems: 'flex-end',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  readyText: {
    fontWeight: '600',
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  waitingText: {
    fontWeight: '600',
  },
  emptySlot: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderStyle: 'dashed',
  },
  emptySlotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  bottomActions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    ...shadows.card,
  },
  startingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  startingText: {
    textAlign: 'center',
  },
}); 