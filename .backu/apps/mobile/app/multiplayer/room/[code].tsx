import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTheme } from '../../../lib/theme-context';
import { useAuth } from '../../../lib/auth-context';
import { Text } from '../../../components/atoms/Text';
import { Card } from '../../../components/ui/Card';
import { spacing, borderRadius, fontFamily } from '../../../lib/theme';
import { 
  MultiplayerGameState, 
  Player, 
  GameState, 
  PlayerAction,
  type PresenceStatus 
} from '../../../lib/multiplayer/game-state';
import { realtimeManager, performanceMonitor } from '../../../lib/realtime-manager';

export default function MultiplayerRoomScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const gameManagerRef = useRef<MultiplayerGameState | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get user display name
  const getUserName = useCallback(() => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.username) return profile.username;
    if (user?.email) return user.email.split('@')[0];
    return 'Player';
  }, [profile, user]);

  // Initialize game manager and join room
  useEffect(() => {
    if (!code || !user?.id) return;

    const initializeGame = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create game manager
        const gameManager = new MultiplayerGameState(code, user.id);
        gameManagerRef.current = gameManager;

        // Set up event listeners
        const unsubscribeGameUpdate = gameManager.onGameUpdate((update) => {
          setGameState(prev => prev ? { ...prev, ...update } : null);
        });

        const unsubscribePlayerAction = gameManager.onPlayerAction((action) => {
          performanceMonitor.trackLatency('player_action_received', Date.now());
          // Game state is already updated in the game manager
        });

        const unsubscribePresenceChange = gameManager.onPresenceChange((presence) => {
          console.log('Presence changed:', presence);
        });

        // Join the room
        gameManager.broadcastPlayerAction({
          type: 'join',
          payload: {
            name: getUserName(),
            isHost: false // Will be determined by the backend
          }
        });

        // Set initial presence
        gameManager.updatePresence({
          status: 'online',
          lastSeen: new Date().toISOString()
        });

        // Get initial game state
        setGameState(gameManager.getGameState());
        
        // Start heartbeat
        startHeartbeat(gameManager);

        // Cleanup function
        return () => {
          unsubscribeGameUpdate();
          unsubscribePlayerAction();
          unsubscribePresenceChange();
          stopHeartbeat();
          gameManager.cleanup();
        };

      } catch (err) {
        console.error('Error initializing game:', err);
        setError('Failed to join room. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const cleanup = initializeGame();
    
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn?.());
      }
    };
  }, [code, user?.id, getUserName]);

  // Handle app state changes for battery optimization
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - restore full activity
        if (gameManagerRef.current) {
          gameManagerRef.current.updatePresence({
            status: 'online',
            lastSeen: new Date().toISOString()
          });
          startHeartbeat(gameManagerRef.current);
        }
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App went to background - reduce activity
        if (gameManagerRef.current) {
          gameManagerRef.current.updatePresence({
            status: 'away',
            lastSeen: new Date().toISOString()
          });
          stopHeartbeat();
        }
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Screen focus/blur handling
  useFocusEffect(
    useCallback(() => {
      // Screen focused
      if (gameManagerRef.current) {
        gameManagerRef.current.updatePresence({
          status: 'online',
          lastSeen: new Date().toISOString()
        });
      }

      return () => {
        // Screen blurred
        if (gameManagerRef.current) {
          gameManagerRef.current.updatePresence({
            status: 'away',
            lastSeen: new Date().toISOString()
          });
        }
      };
    }, [])
  );

  const startHeartbeat = (gameManager: MultiplayerGameState) => {
    stopHeartbeat(); // Clear any existing interval
    
         heartbeatIntervalRef.current = setInterval(() => {
       const presenceData: PresenceStatus = {
         status: 'online',
         lastSeen: new Date().toISOString()
       };
       
       if (gameState?.currentQuestionIndex !== undefined) {
         presenceData.currentQuestion = gameState.currentQuestionIndex;
       }
       
       gameManager.updatePresence(presenceData);
     }, 30000); // 30 second heartbeat
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const handleToggleReady = useCallback(() => {
    if (!gameManagerRef.current) return;

    const currentPlayer = gameManagerRef.current.getCurrentPlayer();
    const newReadyState = !currentPlayer?.isReady;

    gameManagerRef.current.broadcastPlayerAction({
      type: 'ready',
      payload: { isReady: newReadyState }
    });
  }, []);

  const handleStartGame = useCallback(async () => {
    if (!gameManagerRef.current) return;

    try {
      setConnecting(true);
      await gameManagerRef.current.startGame();
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game. Please try again.');
    } finally {
      setConnecting(false);
    }
  }, []);

  const handleLeaveRoom = useCallback(() => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            if (gameManagerRef.current) {
              gameManagerRef.current.broadcastPlayerAction({
                type: 'leave',
                payload: {}
              });
              gameManagerRef.current.cleanup();
            }
            router.back();
          }
        }
      ]
    );
  }, [router]);

  const renderPlayer = useCallback((player: Player) => (
    <Card key={player.id} style={styles.playerCard} variant="outlined">
      <View style={styles.playerRow}>
        <View style={styles.playerInfo}>
          <View style={[styles.playerAvatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.playerInitial}>
              {player.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.playerDetails}>
            <View style={styles.playerNameRow}>
              <Text variant="callout" color="inherit" style={styles.playerName}>
                {player.name} {player.id === user?.id && '(You)'}
              </Text>
              {!player.isOnline && (
                <View style={styles.offlineDot} />
              )}
            </View>
            <View style={styles.playerBadges}>
              {player.isHost && (
                <Text variant="footnote" color="primary" style={styles.hostBadge}>
                  Host
                </Text>
              )}
              <Text variant="footnote" color="secondary" style={styles.scoreBadge}>
                Score: {player.score}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.playerStatus}>
          <View style={[
            styles.readyIndicator,
            { backgroundColor: player.isReady ? theme.success : theme.border }
          ]}>
            <Text style={[
              styles.readyText,
              { color: player.isReady ? 'white' : theme.foregroundSecondary }
            ]}>
              {player.isReady ? '✓' : '○'}
            </Text>
          </View>
          <Text variant="footnote" color="secondary">
            {player.isReady ? 'Ready' : 'Not Ready'}
          </Text>
        </View>
      </View>
    </Card>
  ), [theme, user?.id]);

  // Redirect to game if it's starting or in progress
  useEffect(() => {
    if (gameState?.status === 'starting' || gameState?.status === 'in_progress') {
      router.replace(`/multiplayer/game/${code}` as any);
    }
  }, [gameState?.status, code, router]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Joining room...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text variant="title2" color="inherit" style={styles.errorTitle}>
            Connection Error
          </Text>
          <Text variant="body" color="secondary" style={styles.errorMessage}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setError(null);
              setLoading(true);
              // Re-trigger initialization
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameState) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text variant="body" color="secondary">
            Loading room...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === user?.id);
  const canStartGame = gameManagerRef.current?.canStartGame() || false;
  const isHost = currentPlayer?.isHost || false;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleLeaveRoom}
            activeOpacity={0.8}
          >
            <Text variant="callout" color="secondary">
              ← Leave
            </Text>
          </TouchableOpacity>
          
          <View style={styles.roomInfo}>
            <Text variant="title2" color="inherit" style={styles.roomTitle}>
              Quiz Room
            </Text>
            <Text variant="footnote" color="secondary" style={styles.roomCode}>
              Room Code: {code}
            </Text>
          </View>

          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionDot,
              { backgroundColor: realtimeManager.getConnectionStatus() === 'connected' ? theme.success : theme.destructive }
            ]} />
          </View>
        </View>

        {/* Game Status */}
        {gameState.status !== 'waiting' && (
          <View style={styles.gameStatusSection}>
            <Card style={styles.gameStatusCard} variant="outlined">
              <Text variant="callout" color="inherit" style={styles.gameStatusText}>
                {gameState.status === 'starting' && 'Game Starting...'}
                {gameState.status === 'in_progress' && 'Game In Progress'}
                {gameState.status === 'completed' && 'Game Completed'}
              </Text>
            </Card>
          </View>
        )}

        {/* Players Section */}
        <View style={styles.playersSection}>
          <Text variant="title2" color="inherit" style={styles.sectionTitle}>
            Players ({gameState.players.length}/{gameState.gameSettings.maxPlayers})
          </Text>
          
          <View style={styles.playersList}>
            {gameState.players.map(renderPlayer)}
          </View>
        </View>

        {/* Game Controls */}
        {gameState.status === 'waiting' && (
          <View style={styles.controlsSection}>
            <Card style={styles.controlsCard} variant="outlined">
              <Text variant="title3" color="inherit" style={styles.controlsTitle}>
                Game Controls
              </Text>
              
              <View style={styles.controlsButtons}>
                <TouchableOpacity
                  style={[
                    styles.readyButton,
                    { 
                      backgroundColor: currentPlayer?.isReady ? theme.success : theme.border,
                      borderColor: currentPlayer?.isReady ? theme.success : theme.border,
                    }
                  ]}
                  onPress={handleToggleReady}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.readyButtonText,
                    { color: currentPlayer?.isReady ? 'white' : theme.foregroundSecondary }
                  ]}>
                    {currentPlayer?.isReady ? '✓ Ready' : 'Mark Ready'}
                  </Text>
                </TouchableOpacity>
                
                {isHost && (
                  <TouchableOpacity
                    style={[
                      styles.startButton,
                      { 
                        backgroundColor: canStartGame ? theme.primary : '#9CA3AF',
                      }
                    ]}
                    onPress={handleStartGame}
                    disabled={!canStartGame || connecting}
                    activeOpacity={0.8}
                  >
                    {connecting ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.startButtonText}>
                        Start Game
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </View>
        )}

        {/* Room Settings (Host Only) */}
        {isHost && gameState.status === 'waiting' && (
          <View style={styles.settingsSection}>
            <Card style={styles.settingsCard} variant="outlined">
              <Text variant="title3" color="inherit" style={styles.settingsTitle}>
                Room Settings
              </Text>
              
              <View style={styles.settingsOptions}>
                <View style={styles.settingRow}>
                  <Text variant="callout" color="inherit">
                    Topic: {gameState.gameSettings.topic}
                  </Text>
                </View>
                <View style={styles.settingRow}>
                  <Text variant="callout" color="inherit">
                    Questions: {gameState.gameSettings.questionCount}
                  </Text>
                </View>
                <View style={styles.settingRow}>
                  <Text variant="callout" color="inherit">
                    Time Limit: {gameState.gameSettings.timePerQuestion}s per question
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Performance Stats (Development only) */}
        {__DEV__ && (
          <View style={styles.debugSection}>
            <Card style={styles.debugCard} variant="outlined">
              <Text variant="footnote" color="secondary">
                Connection: {realtimeManager.getConnectionStatus()}
              </Text>
              <Text variant="footnote" color="secondary">
                Channels: {realtimeManager.getActiveChannelsCount()}
              </Text>
              <Text variant="footnote" color="secondary">
                Latency: {Math.round(performanceMonitor.getAverageLatency('game_update'))}ms
              </Text>
            </Card>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: 'white',
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    marginRight: spacing.md,
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontFamily: fontFamily.display,
    fontWeight: '400',
    marginBottom: spacing.xs,
  },
  roomCode: {
    fontFamily: fontFamily.mono,
    fontWeight: '500',
  },
  connectionStatus: {
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gameStatusSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  gameStatusCard: {
    padding: spacing.md,
    alignItems: 'center',
  },
  gameStatusText: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  playersSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontWeight: '400',
    marginBottom: spacing.md,
  },
  playersList: {
    gap: spacing.sm,
  },
  playerCard: {
    padding: spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  playerInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  playerDetails: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  playerName: {
    fontFamily: fontFamily.text,
    fontWeight: '500',
    marginRight: spacing.xs,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  playerBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  hostBadge: {
    fontFamily: fontFamily.mono,
    fontWeight: '600',
    fontSize: 10,
  },
  scoreBadge: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
  },
  playerStatus: {
    alignItems: 'center',
  },
  readyIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  controlsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  controlsCard: {
    padding: spacing.lg,
  },
  controlsTitle: {
    fontFamily: fontFamily.display,
    fontWeight: '400',
    marginBottom: spacing.md,
  },
  controlsButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  readyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  readyButtonText: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  startButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  startButtonText: {
    color: 'white',
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  settingsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  settingsCard: {
    padding: spacing.lg,
  },
  settingsTitle: {
    fontFamily: fontFamily.display,
    fontWeight: '400',
    marginBottom: spacing.md,
  },
  settingsOptions: {
    gap: spacing.sm,
  },
  settingRow: {
    paddingVertical: spacing.xs,
  },
  debugSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  debugCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
}); 