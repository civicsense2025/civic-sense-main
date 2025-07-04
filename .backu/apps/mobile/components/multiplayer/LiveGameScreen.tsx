import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
  ScrollView,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../atoms/Text';
import { Card } from '../ui/Card';
import { Button } from '../Button';
import { spacing, borderRadius, shadows } from '../../lib/theme';
import { ComprehensiveMultiplayerEngine } from '../../lib/multiplayer/comprehensive-engine';
import { GameState, Player } from '../../lib/multiplayer/game-state';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface LiveGameScreenProps {
  gameEngine: ComprehensiveMultiplayerEngine;
  onGameEnd?: (results: any) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface LiveLeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  isNPC: boolean;
  answeredCurrent: boolean;
}

// ============================================================================
// LIVE GAME SCREEN COMPONENT
// ============================================================================

export function LiveGameScreen({ gameEngine, onGameEnd }: LiveGameScreenProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  // Game state
  const [gameState, setGameState] = useState<GameState>(gameEngine.getGameState());
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [showResults, setShowResults] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LiveLeaderboardEntry[]>([]);
  
  // Animations
  const progressAnimation = useRef(new Animated.Value(100)).current;
  const questionFadeAnimation = useRef(new Animated.Value(1)).current;
  const answerAnimations = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const scoreAnimations = useRef(new Map<string, Animated.Value>()).current;
  
  // Timers
  const questionTimer = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // INITIALIZATION & EFFECTS
  // ============================================================================

  useEffect(() => {
    // Listen to game state changes
    const unsubscribe = gameEngine.onStateChange((newState) => {
      setGameState(newState);
      updateGameFromState(newState);
    });

    // Initialize current question
    updateGameFromState(gameState);

    return () => {
      unsubscribe();
      if (questionTimer.current) {
        clearTimeout(questionTimer.current);
      }
    };
  }, [gameEngine]);

  const updateGameFromState = useCallback((state: GameState) => {
    // Update current question
    if (state.questions && state.questions.length > 0) {
      const question = state.questions[state.currentQuestionIndex];
      setCurrentQuestion(question);
      
      // Reset answer state for new question
      if (question?.id !== currentQuestion?.id) {
        setSelectedAnswer(null);
        setHasAnswered(false);
        setShowResults(false);
        resetAnswerAnimations();
      }
    }

    // Update timer
    setTimeRemaining(state.timeRemaining);
    
    // Update leaderboard
    updateLeaderboard(state.players);
    
    // Handle game completion
    if (state.status === 'completed') {
      handleGameCompletion(state);
    }

    // Start question timer animation
    if (state.status === 'in_progress' && state.timeRemaining > 0) {
      startTimerAnimation(state.timeRemaining);
    }
  }, [currentQuestion]);

  // ============================================================================
  // TIMER & ANIMATIONS
  // ============================================================================

  const startTimerAnimation = useCallback((totalTime: number) => {
    // Animate progress bar from 100% to 0%
    Animated.timing(progressAnimation, {
      toValue: 0,
      duration: totalTime * 1000,
      useNativeDriver: false,
    }).start();

    // Countdown timer
    let currentTime = totalTime;
    const countdown = () => {
      setTimeRemaining(currentTime);
      
      if (currentTime <= 0) {
        // Time's up - show results
        setShowResults(true);
        showCorrectAnswer();
      } else if (currentTime <= 5) {
        // Warning vibration in last 5 seconds
        Vibration.vibrate(100);
      }
      
      if (currentTime > 0) {
        currentTime--;
        questionTimer.current = setTimeout(countdown, 1000);
      }
    };
    
    questionTimer.current = setTimeout(countdown, 1000);
  }, [progressAnimation]);

  const resetAnswerAnimations = useCallback(() => {
    answerAnimations.forEach(animation => {
      animation.setValue(1);
    });
    questionFadeAnimation.setValue(1);
  }, [answerAnimations, questionFadeAnimation]);

  const animateAnswerSelection = useCallback((answerIndex: number) => {
    // Pulse animation for selected answer
    Animated.sequence([
      Animated.timing(answerAnimations[answerIndex], {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(answerAnimations[answerIndex], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  }, [answerAnimations]);

  const showCorrectAnswer = useCallback(() => {
    if (!currentQuestion) return;
    
    // Fade out question slightly
    Animated.timing(questionFadeAnimation, {
      toValue: 0.6,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Highlight correct answer
    const correctIndex = currentQuestion.options.indexOf(currentQuestion.correctAnswer);
    if (correctIndex !== -1) {
      Animated.timing(answerAnimations[correctIndex], {
        toValue: 1.1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [currentQuestion, questionFadeAnimation, answerAnimations]);

  // ============================================================================
  // GAME LOGIC
  // ============================================================================

  const handleAnswerSelection = useCallback((answer: string, answerIndex: number) => {
    if (hasAnswered || showResults) return;
    
    setSelectedAnswer(answer);
    setHasAnswered(true);
    
    // Submit answer to game engine
    gameEngine.submitAnswer(answer);
    
    // Visual feedback
    animateAnswerSelection(answerIndex);
    
    // Haptic feedback
    Vibration.vibrate(50);
    
    console.log(`📝 Answer submitted: ${answer}`);
  }, [hasAnswered, showResults, gameEngine, animateAnswerSelection]);

  const updateLeaderboard = useCallback((players: Player[]) => {
    const leaderboardData: LiveLeaderboardEntry[] = players
      .map(player => ({
        playerId: player.id,
        playerName: player.name,
        score: player.score,
        isNPC: (player as any).isNPC || false,
        answeredCurrent: false, // This would come from game state
      }))
      .sort((a, b) => b.score - a.score);
    
    setLeaderboard(leaderboardData);
  }, []);

  const handleGameCompletion = useCallback((finalState: GameState) => {
    console.log('🏁 Game completed');
    
    // Show final results after a delay
    setTimeout(() => {
      onGameEnd?.(finalState.players);
    }, 3000);
  }, [onGameEnd]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderProgressBar = () => (
    <View style={[styles.progressContainer, { backgroundColor: theme.backgroundSecondary }]}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: timeRemaining <= 5 ? theme.destructive : theme.primary,
            width: progressAnimation.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp',
            }),
          }
        ]}
      />
      <View style={styles.timerContainer}>
        <Text variant="callout" color="inherit" style={[
          styles.timerText,
          { color: timeRemaining <= 5 ? theme.destructive : theme.foreground }
        ]}>
          {timeRemaining}s
        </Text>
      </View>
    </View>
  );

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <Animated.View style={[styles.questionContainer, { opacity: questionFadeAnimation }]}>
        <Card style={[styles.questionCard, { backgroundColor: theme.background }]}>
          <Text variant="title3" color="inherit" style={styles.questionNumber}>
            Question {gameState.currentQuestionIndex + 1} of {gameState.questions.length}
          </Text>
          <Text variant="title2" color="inherit" style={styles.questionText}>
            {currentQuestion.question}
          </Text>
        </Card>
      </Animated.View>
    );
  };

  const renderAnswerOptions = () => {
    if (!currentQuestion) return null;

    return (
      <View style={styles.answersContainer}>
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === currentQuestion.correctAnswer;
          const showCorrect = showResults && isCorrect;
          const showIncorrect = showResults && isSelected && !isCorrect;

          return (
            <Animated.View
              key={index}
              style={[
                styles.answerWrapper,
                { transform: [{ scale: answerAnimations[index] }] }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.answerButton,
                  {
                    backgroundColor: showCorrect
                      ? theme.success
                      : showIncorrect
                      ? theme.destructive
                      : isSelected
                      ? theme.primary
                      : theme.backgroundSecondary,
                    borderColor: showCorrect
                      ? theme.success
                      : showIncorrect
                      ? theme.destructive
                      : isSelected
                      ? theme.primary
                      : theme.border,
                  }
                ]}
                onPress={() => handleAnswerSelection(option, index)}
                disabled={hasAnswered || showResults}
                activeOpacity={0.8}
              >
                <View style={styles.answerContent}>
                  <View style={[
                    styles.answerLetter,
                    {
                      backgroundColor: showCorrect || showIncorrect || isSelected
                        ? 'rgba(255, 255, 255, 0.2)'
                        : theme.border
                    }
                  ]}>
                    <Text variant="callout" style={[
                      styles.answerLetterText,
                      {
                        color: showCorrect || showIncorrect || isSelected
                          ? theme.background
                          : theme.foreground
                      }
                    ]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text variant="callout" style={[
                    styles.answerText,
                    {
                      color: showCorrect || showIncorrect || isSelected
                        ? theme.background
                        : theme.foreground
                    }
                  ]}>
                    {option}
                  </Text>
                  {showCorrect && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.background} />
                  )}
                  {showIncorrect && (
                    <Ionicons name="close-circle" size={20} color={theme.background} />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderLiveLeaderboard = () => (
    <Card style={[styles.leaderboardCard, { backgroundColor: theme.backgroundSecondary }]}>
      <Text variant="title3" color="inherit" style={styles.leaderboardTitle}>
        Live Scores
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.leaderboardContainer}>
          {leaderboard.slice(0, 6).map((entry, index) => (
            <View
              key={entry.playerId}
              style={[
                styles.leaderboardEntry,
                {
                  backgroundColor: entry.playerId === user?.id
                    ? theme.primary + '20'
                    : 'transparent'
                }
              ]}
            >
              <Text variant="footnote" color="secondary" style={styles.leaderboardRank}>
                #{index + 1}
              </Text>
              <Text variant="footnote" color="inherit" style={styles.leaderboardName}>
                {entry.isNPC ? '🤖' : '👤'} {entry.playerName}
              </Text>
              <Text variant="callout" color="inherit" style={styles.leaderboardScore}>
                {entry.score}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Card>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (gameState.status === 'completed') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.completedContainer}>
          <Text variant="largeTitle" color="inherit" style={styles.gameCompleteText}>
            🏁 Game Complete!
          </Text>
          <Text variant="callout" color="secondary" style={styles.finalScoreText}>
            Final results loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.background, theme.backgroundSecondary]}
        style={styles.gradient}
      >
        {/* Header with progress */}
        <View style={styles.header}>
          {renderProgressBar()}
        </View>

        {/* Main content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderQuestion()}
          {renderAnswerOptions()}
          
          {/* Show explanation after answering */}
          {showResults && currentQuestion?.explanation && (
            <Card style={[styles.explanationCard, { backgroundColor: theme.backgroundSecondary }]}>
              <Text variant="callout" color="inherit" style={styles.explanationTitle}>
                💡 Explanation
              </Text>
              <Text variant="body" color="secondary" style={styles.explanationText}>
                {currentQuestion.explanation}
              </Text>
            </Card>
          )}
        </ScrollView>

        {/* Live leaderboard */}
        <View style={styles.bottomSection}>
          {renderLiveLeaderboard()}
        </View>
      </LinearGradient>
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
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  timerContainer: {
    position: 'absolute',
    top: -24,
    right: 0,
  },
  timerText: {
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  questionContainer: {
    marginBottom: spacing.lg,
  },
  questionCard: {
    padding: spacing.lg,
    ...shadows.card,
  },
  questionNumber: {
    textAlign: 'center',
    marginBottom: spacing.sm,
    opacity: 0.7,
  },
  questionText: {
    textAlign: 'center',
    lineHeight: 32,
  },
  answersContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  answerWrapper: {
    width: '100%',
  },
  answerButton: {
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  answerLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerLetterText: {
    fontWeight: '600',
  },
  answerText: {
    flex: 1,
    lineHeight: 20,
  },
  explanationCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  explanationTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  explanationText: {
    lineHeight: 20,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  leaderboardCard: {
    padding: spacing.md,
  },
  leaderboardTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  leaderboardContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  leaderboardEntry: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 80,
  },
  leaderboardRank: {
    fontWeight: '600',
  },
  leaderboardName: {
    fontSize: 10,
    textAlign: 'center',
    marginVertical: 2,
  },
  leaderboardScore: {
    fontWeight: '700',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  gameCompleteText: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  finalScoreText: {
    textAlign: 'center',
  },
}); 