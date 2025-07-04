/**
 * DEPRECATED: This file uses the old multiplayer engine API
 * 
 * TODO: Update this file to use the new UniversalGameEngine with useGameEngine hooks
 * See: lib/hooks/useGameEngine.ts for the new React hook-based approach
 * See: lib/multiplayer/universal-game-engine.ts for the consolidated engine
 * 
 * This file is currently broken due to API changes during engine consolidation.
 * It should be refactored to use the new hook-based architecture.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/Button';
import { spacing, borderRadius, typography, responsiveFontSizes } from '../../lib/theme';
import { UniversalGameEngine, GameConfiguration } from '../../lib/multiplayer/universal-game-engine';
import { GameState } from '../../lib/multiplayer/game-state';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Player card component
const PlayerCard: React.FC<{
  player: any;
  isCurrentUser: boolean;
}> = ({ player, isCurrentUser }) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        marginBottom: spacing.sm,
      }}
    >
      <Card style={StyleSheet.flatten([styles.playerCard, { borderColor: theme.border }])} variant="outlined">
        <View style={styles.playerRow}>
          <View style={styles.playerInfo}>
            <View style={[
              styles.playerAvatar,
              { backgroundColor: player.isHost ? '#FFD60A' : theme.primary }
            ]}>
              <Text style={styles.playerInitial}>
                {player.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.playerDetails}>
              <Text style={[styles.playerName, { color: theme.foreground }]}>
                {player.name} {isCurrentUser && '(You)'}
              </Text>
              <View style={styles.playerBadges}>
                {player.isHost && (
                  <View style={[styles.badge, { backgroundColor: '#FFD60A' }]}>
                    <Text style={styles.badgeText}>HOST</Text>
                  </View>
                )}
                {player.isReady && (
                  <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.badgeText}>READY</Text>
                  </View>
                )}
                {!player.isOnline && (
                  <View style={[styles.badge, { backgroundColor: '#9CA3AF' }]}>
                    <Text style={styles.badgeText}>OFFLINE</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={styles.playerScore}>
            <Text style={[styles.scoreValue, { color: theme.primary }]}>{player.score}</Text>
            <Text style={[styles.scoreLabel, { color: theme.foregroundSecondary }]}>pts</Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
};

// Room code display
const RoomCodeDisplay: React.FC<{ code: string }> = ({ code }) => {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleShare = () => {
    // In a real app, implement share functionality
    Alert.alert('Share Room Code', `Room code: ${code}`);
  };

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Card style={StyleSheet.flatten([styles.roomCodeCard, { backgroundColor: theme.primary }])} variant="elevated">
        <Text style={styles.roomCodeLabel}>Room Code</Text>
        <Text style={styles.roomCodeValue}>{code}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Text style={styles.shareButtonText}>Share Code</Text>
        </TouchableOpacity>
      </Card>
    </Animated.View>
  );
};

// Connection status indicator
const ConnectionStatus: React.FC<{ connected: boolean }> = ({ connected }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.connectionStatus}>
      <View style={[
        styles.connectionDot,
        { backgroundColor: connected ? '#10B981' : '#EF4444' }
      ]} />
      <Text style={[styles.connectionText, { color: theme.foregroundSecondary }]}>
        {connected ? 'Connected' : 'Reconnecting...'}
      </Text>
    </View>
  );
};

export default function MobileRoomScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const engineRef = useRef<UniversalGameEngine | null>(null);

  useEffect(() => {
    if (!code || !user?.id) return;

    const initializeRoom = async () => {
      try {
        setLoading(true);
        
        // Create game configuration for multiplayer
        const gameConfig: GameConfiguration = {
          mode: 'multiplayer',
          topicId: 'general', // You might want to get this from route params
          difficultyLevel: 'medium',
          questionCount: 10,
          timePerQuestion: 30,
          userId: user.id,
          roomId: code,
          allowNPCs: true,
          maxNPCs: 2
        };
        
        // Create multiplayer engine
        const engine = new UniversalGameEngine(gameConfig);
        engineRef.current = engine;

        // Set up callbacks with proper types
        engine.onQuestionChange((question, index) => {
          // Handle question changes
          console.log('Question changed:', question, index);
        });

        engine.onScoreUpdate((score: number) => {
          // Handle score updates
          console.log('Score updated:', score);
        });

        engine.onError((err: Error) => {
          setError(err.message);
        });

        // Initialize the game
        await engine.startGame();
        setConnected(true);
        setLoading(false);
      } catch (err) {
        console.error('Room initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to join room');
        setLoading(false);
      }
    };

    initializeRoom();

    return () => {
      // Clean up the engine
      engineRef.current?.cleanup();
    };
  }, [code, user?.id]);

  const handleToggleReady = async () => {
    try {
      setIsReady(!isReady);
      // In a real implementation, you'd notify other players about ready status
      Alert.alert('Ready Status', isReady ? 'You are no longer ready' : 'You are now ready!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update ready status');
    }
  };

  const handleStartGame = async () => {
    try {
      // Start the actual game
      await engineRef.current?.startGame();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to start game');
    }
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            // Clean up and navigate back
            engineRef.current?.cleanup();
            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
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
          <Text style={[styles.errorTitle, { color: theme.foreground }]}>
            Connection Error
          </Text>
          <Text style={[styles.errorMessage, { color: theme.foregroundSecondary }]}>
            {error}
          </Text>
          <Button
            title="Back to Lobby"
            onPress={() => router.back()}
            variant="primary"
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Mock data for demonstration (in real app, this would come from game state)
  const isHost = user?.id === 'host_user_id'; // Replace with actual host logic
  const canStart = isReady && isHost; // Simplified logic
  const currentPlayer = gameState?.players.find(p => p.id === user?.id);
  const mockPlayers = [
    {
      id: user?.id || 'user1',
      name: profile?.full_name || 'You',
      isHost: isHost,
      isReady: isReady,
      score: 0,
      isOnline: true
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeaveRoom} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>
            ← Leave
          </Text>
        </TouchableOpacity>
        <ConnectionStatus connected={connected} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Room Code */}
        {code && <RoomCodeDisplay code={code} />}

        {/* Players Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            Players ({mockPlayers.length}/4)
          </Text>
          
          {mockPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentUser={player.id === user?.id}
            />
          ))}

          {/* Empty slots */}
          {mockPlayers.length < 4 && (
            <View style={styles.emptySlots}>
              {Array.from({ length: 4 - mockPlayers.length }).map((_, index) => (
                <View key={`empty-${index}`} style={[styles.emptySlot, { borderColor: theme.border }]}>
                  <Text style={[styles.emptySlotText, { color: theme.foregroundTertiary }]}>
                    Waiting for player...
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Game Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            Game Settings
          </Text>
          <Card style={styles.settingsCard} variant="outlined">
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: theme.foregroundSecondary }]}>
                Topic
              </Text>
              <Text style={[styles.settingValue, { color: theme.foreground }]}>
                General Knowledge
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: theme.foregroundSecondary }]}>
                Questions
              </Text>
              <Text style={[styles.settingValue, { color: theme.foreground }]}>
                10 questions
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: theme.foregroundSecondary }]}>
                Time Limit
              </Text>
              <Text style={[styles.settingValue, { color: theme.foreground }]}>
                30s per question
              </Text>
            </View>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!isReady && !isHost && (
            <Button
              title="I'm Ready!"
              onPress={handleToggleReady}
              variant="primary"
              fullWidth
              style={styles.actionButton}
            />
          )}
          
          {isReady && !isHost && (
            <Button
              title="Not Ready"
              onPress={handleToggleReady}
              variant="outlined"
              fullWidth
              style={styles.actionButton}
            />
          )}
          
          {isHost && (
            <Button
              title={canStart ? "Start Game" : "Waiting for Players"}
              onPress={handleStartGame}
              variant={canStart ? "primary" : "outlined"}
              disabled={!canStart}
              fullWidth
              style={styles.actionButton}
            />
          )}
        </View>

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
    ...typography.body,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    ...typography.title2,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorButton: {
    minWidth: 200,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    ...typography.callout,
    fontWeight: '500',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    ...typography.footnote,
  },

  // Room Code
  roomCodeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  roomCodeLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
  },
  roomCodeValue: {
    ...typography.title1,
    fontSize: responsiveFontSizes.displaySmall,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: spacing.md,
  },
  shareButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.full,
  },
  shareButtonText: {
    ...typography.footnote,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Players
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.title3,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  playerCard: {
    padding: spacing.md,
    borderWidth: 1,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    ...typography.callout,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  playerBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  badgeText: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  playerScore: {
    alignItems: 'center',
  },
  scoreValue: {
    ...typography.title2,
    fontWeight: '700',
  },
  scoreLabel: {
    ...typography.caption,
  },
  emptySlots: {
    gap: spacing.sm,
  },
  emptySlot: {
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  emptySlotText: {
    ...typography.footnote,
  },

  // Settings
  settingsCard: {
    padding: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    ...typography.body,
  },
  settingValue: {
    ...typography.body,
    fontWeight: '500',
  },

  // Actions
  actions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },

  bottomSpacer: {
    height: spacing.xl * 2,
  },
}); 