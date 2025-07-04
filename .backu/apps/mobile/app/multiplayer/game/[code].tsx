import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
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
  GameQuestion,
  PlayerAnswer,
  type PresenceStatus 
} from '../../../lib/multiplayer/game-state';
import { realtimeManager, performanceMonitor } from '../../../lib/realtime-manager';
import { QuestionResponseService } from '../../../lib/services/question-response-service';

export default function MultiplayerGameScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
      // Using QuestionResponseService directly for better performance
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const gameManagerRef = useRef<MultiplayerGameState | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  
  // Animated values for smooth UI updates
  const scoreAnimation = useRef(new Animated.Value(0)).current;
  const timerAnimation = useRef(new Animated.Value(100)).current;
  const questionAnimation = useRef(new Animated.Value(0)).current;

  // Get user display name
  const getUserName = useCallback(() => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.username) return profile.username;
    if (user?.email) return user.email.split('@')[0];
    return 'Player';
  }, [profile, user]);

  // Initialize game manager
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
          setGameState(prev => {
            const newState = prev ? { ...prev, ...update } : null;
            
            // Handle timer updates
            if (update.timeRemaining !== undefined) {
              setTimeRemaining(update.timeRemaining);
              animateTimer(update.timeRemaining);
            }
            
            // Handle question changes
            if (update.currentQuestionIndex !== undefined && 
                update.currentQuestionIndex !== prev?.currentQuestionIndex) {
              setSelectedAnswer(null);
              setHasAnswered(false);
              animateQuestionChange();
            }
            
            // Handle game completion
            if (update.status === 'completed') {
              handleGameComplete(newState);
            }
            
            return newState;
          });
        });

        const unsubscribePlayerAction = gameManager.onPlayerAction((action) => {
          performanceMonitor.trackLatency('player_action_received', Date.now());
          
          // Handle score updates for animations
          if (action.type === 'answer' && action.playerId === user.id) {
            const currentPlayer = gameManager.getCurrentPlayer();
            if (currentPlayer) {
              animateScore(currentPlayer.score);
            }
          }
        });

        const unsubscribePresenceChange = gameManager.onPresenceChange((presence) => {
          console.log('Presence changed in game:', presence);
        });

        // Set initial presence
        gameManager.updatePresence({
          status: 'online',
          lastSeen: new Date().toISOString()
        });

        // Get initial game state
        const initialState = gameManager.getGameState();
        setGameState(initialState);
        setTimeRemaining(initialState.timeRemaining);

        // Start game timer if in progress
        if (initialState.status === 'in_progress') {
          startGameTimer();
        }

        // Cleanup function
        return () => {
          unsubscribeGameUpdate();
          unsubscribePlayerAction();
          unsubscribePresenceChange();
          stopGameTimer();
          gameManager.cleanup();
        };

      } catch (err) {
        console.error('Error initializing game:', err);
        setError('Failed to join game. Please try again.');
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
        // App came to foreground
        if (gameManagerRef.current) {
          gameManagerRef.current.updatePresence({
            status: 'online',
            lastSeen: new Date().toISOString()
          });
        }
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App went to background
        if (gameManagerRef.current) {
          gameManagerRef.current.updatePresence({
            status: 'away',
            lastSeen: new Date().toISOString()
          });
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
      if (gameManagerRef.current && gameState) {
        const presenceData: PresenceStatus = {
          status: 'online',
          lastSeen: new Date().toISOString()
        };
        
        if (gameState.currentQuestionIndex !== undefined) {
          presenceData.currentQuestion = gameState.currentQuestionIndex;
        }
        
        gameManagerRef.current.updatePresence(presenceData);
      }

      return () => {
        if (gameManagerRef.current) {
          gameManagerRef.current.updatePresence({
            status: 'away',
            lastSeen: new Date().toISOString()
          });
        }
      };
    }, [gameState])
  );

  const startGameTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up
          if (!hasAnswered && gameManagerRef.current?.isHost()) {
            // Host moves to next question
            gameManagerRef.current.nextQuestion();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [hasAnswered]);

  const stopGameTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const animateScore = useCallback((newScore: number) => {
    Animated.timing(scoreAnimation, {
      toValue: newScore,
      duration: 500,
      useNativeDriver: false
    }).start();
  }, [scoreAnimation]);

  const animateTimer = useCallback((time: number) => {
    const percentage = gameState?.gameSettings.timePerQuestion 
      ? (time / gameState.gameSettings.timePerQuestion) * 100 
      : 0;
    
    Animated.timing(timerAnimation, {
      toValue: percentage,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [timerAnimation, gameState?.gameSettings.timePerQuestion]);

  const animateQuestionChange = useCallback(() => {
    Animated.sequence([
      Animated.timing(questionAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(questionAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  }, [questionAnimation]);

  const handleAnswerSelect = useCallback((answer: string) => {
    if (hasAnswered || !gameManagerRef.current) return;
    
    setSelectedAnswer(answer);
  }, [hasAnswered]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!selectedAnswer || hasAnswered || !gameManagerRef.current || !user?.id) return;

    const startTime = Date.now();
    
    // Use the game manager's updated submitAnswer method which includes QuestionResponseService
    try {
      await gameManagerRef.current.submitAnswer(selectedAnswer, 4); // Default confidence level
      setHasAnswered(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
      // Still mark as answered to prevent multiple submissions
      setHasAnswered(true);
    }
    
    // Track performance (if performanceMonitor is available)
    try {
      performanceMonitor.trackLatency('answer_submit', startTime);
    } catch (error) {
      // Ignore if performanceMonitor is not available
    }
  }, [selectedAnswer, hasAnswered, user?.id]);

  const handleGameComplete = useCallback((finalGameState: GameState | null) => {
    stopGameTimer();
    
    if (!finalGameState) return;

    // Calculate final scores and rankings
    const sortedPlayers = [...finalGameState.players].sort((a, b) => b.score - a.score);
    const currentPlayer = sortedPlayers.find(p => p.id === user?.id);
    const rank = sortedPlayers.findIndex(p => p.id === user?.id) + 1;

    Alert.alert(
      'Game Complete!',
      `You finished ${rank}${getRankSuffix(rank)} with ${currentPlayer?.score || 0} points!`,
      [
        {
          text: 'View Results',
          onPress: () => {
            router.replace(`/multiplayer/results/${code}` as any);
          }
        },
        {
          text: 'Back to Lobby',
          onPress: () => router.replace('/multiplayer/lobby' as any)
        }
      ]
    );
  }, [code, router, user?.id]);

  const getRankSuffix = (rank: number): string => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  const handleLeaveGame = useCallback(() => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave the game? You will lose your progress.',
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
            router.replace('/multiplayer/lobby' as any);
          }
        }
      ]
    );
  }, [router]);

  const renderAnswerOption = useCallback((option: string, index: number) => {
    if (!gameState) return null;
    
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    if (!currentQuestion) return null;
    
    const isSelected = selectedAnswer === option;
    const isCorrect = option === currentQuestion.correctAnswer;
    const showResult = hasAnswered;

    let cardStyle: any = {};
    if (showResult) {
      if (isCorrect) {
        cardStyle = { borderColor: '#10B981', backgroundColor: '#10B98110' };
      } else if (isSelected && !isCorrect) {
        cardStyle = { borderColor: '#EF4444', backgroundColor: '#EF444410' };
      }
    } else if (isSelected) {
      cardStyle = { borderColor: theme.primary, backgroundColor: `${theme.primary}10` };
    }

    return (
      <TouchableOpacity
        key={index}
        style={styles.answerOption}
        onPress={() => handleAnswerSelect(option)}
        disabled={hasAnswered}
        activeOpacity={0.8}
      >
        <Card style={[styles.answerCard, cardStyle] as any} variant="outlined">
          <View style={styles.answerContent}>
            <View style={styles.answerLabel}>
              <Text variant="callout" color="secondary" style={styles.answerLetter}>
                {String.fromCharCode(65 + index)}
              </Text>
            </View>
            <Text variant="body" color="inherit" style={styles.answerText}>
              {option}
            </Text>
            {showResult && isCorrect && (
              <Text style={styles.checkmark}>✓</Text>
            )}
            {showResult && isSelected && !isCorrect && (
              <Text style={styles.crossmark}>✗</Text>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  }, [gameState, selectedAnswer, hasAnswered, theme, handleAnswerSelect]);

  const renderPlayerScore = useCallback((player: Player) => (
    <View key={player.id} style={styles.playerScoreItem}>
      <View style={styles.playerScoreInfo}>
        <View style={[styles.playerScoreAvatar, { backgroundColor: theme.primary }]}>
          <Text style={styles.playerScoreInitial}>
            {player.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text variant="footnote" color="inherit" style={styles.playerScoreName}>
          {player.name} {player.id === user?.id && '(You)'}
        </Text>
      </View>
      <Text variant="footnote" color="primary" style={styles.playerScorePoints}>
        {player.score}
      </Text>
    </View>
  ), [theme, user?.id]);

  // Redirect if game is not in progress
  useEffect(() => {
    if (gameState && gameState.status === 'waiting') {
      router.replace(`/multiplayer/room/${code}` as any);
    } else if (gameState && gameState.status === 'completed') {
      router.replace(`/multiplayer/results/${code}` as any);
    }
  }, [gameState?.status, code, router]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Loading game...
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
            Game Error
          </Text>
          <Text variant="body" color="secondary" style={styles.errorMessage}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => router.replace('/multiplayer/lobby' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Back to Lobby</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameState || gameState.questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text variant="body" color="secondary">
            Waiting for game to start...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const progress = ((gameState.currentQuestionIndex + 1) / gameState.questions.length) * 100;
  const currentPlayer = gameState.players.find(p => p.id === user?.id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.leaveButton}
          onPress={handleLeaveGame}
          activeOpacity={0.8}
        >
          <Text variant="callout" color="secondary">✕</Text>
        </TouchableOpacity>
        
        <View style={styles.gameProgress}>
          <Text variant="footnote" color="secondary" style={styles.progressText}>
            Question {gameState.currentQuestionIndex + 1} of {gameState.questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.primary }]} 
            />
          </View>
        </View>
        
        <View style={styles.timerContainer}>
          <Animated.View style={[
            styles.timerCircle,
            {
              transform: [{
                rotate: timerAnimation.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0deg', '360deg']
                })
              }]
            }
          ]}>
            <Text variant="footnote" color="primary" style={styles.timerText}>
              {timeRemaining}
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Player Scores */}
      <View style={styles.scoresContainer}>
        {gameState.players.map(renderPlayerScore)}
      </View>

      <View style={styles.content}>
        {/* Question */}
        <Animated.View style={[
          styles.questionContainer,
          {
            opacity: questionAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.3]
            })
          }
        ]}>
          <Card style={styles.questionCard} variant="elevated">
            <Text variant="title3" color="inherit" style={styles.questionText}>
              {currentQuestion?.question}
            </Text>
          </Card>
        </Animated.View>

        {/* Answers */}
        <View style={styles.answersContainer}>
          {currentQuestion?.options?.map(renderAnswerOption)}
        </View>

        {/* Submit Button */}
        {!hasAnswered && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: selectedAnswer ? theme.primary : '#9CA3AF' }
            ]}
            onPress={handleSubmitAnswer}
            disabled={!selectedAnswer}
            activeOpacity={0.8}
          >
            <Text variant="callout" style={styles.submitButtonText}>
              Submit Answer
            </Text>
          </TouchableOpacity>
        )}

        {/* Waiting for others */}
        {hasAnswered && (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text variant="body" color="secondary" style={styles.waitingText}>
              Waiting for other players...
            </Text>
          </View>
        )}
      </View>

      {/* Performance Stats (Development only) */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text variant="footnote" color="secondary">
            Latency: {Math.round(performanceMonitor.getAverageLatency('game_update'))}ms
          </Text>
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
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  leaveButton: {
    padding: spacing.xs,
  },
  gameProgress: {
    flex: 1,
    alignItems: 'center',
  },
  progressText: {
    fontFamily: fontFamily.mono,
    marginBottom: spacing.xs,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontFamily: fontFamily.mono,
    fontWeight: '600',
  },
  scoresContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  playerScoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  playerScoreInfo: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  playerScoreAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  playerScoreInitial: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  playerScoreName: {
    fontFamily: fontFamily.text,
    fontSize: 10,
    textAlign: 'center',
  },
  playerScorePoints: {
    fontFamily: fontFamily.mono,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  questionContainer: {
    marginBottom: spacing.xl,
  },
  questionCard: {
    padding: spacing.lg,
  },
  questionText: {
    fontFamily: fontFamily.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  answersContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  answerOption: {
    width: '100%',
  },
  answerCard: {
    padding: spacing.md,
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  answerLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerLetter: {
    fontFamily: fontFamily.mono,
    fontWeight: '600',
  },
  answerText: {
    flex: 1,
    fontFamily: fontFamily.text,
    lineHeight: 20,
  },
  checkmark: {
    fontSize: 20,
    color: '#10B981',
  },
  crossmark: {
    fontSize: 20,
    color: '#EF4444',
  },
  submitButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  waitingText: {
    fontFamily: fontFamily.text,
  },
  debugContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
}); 