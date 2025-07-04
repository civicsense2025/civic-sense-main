import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../lib/theme-context';
import { useAuth } from '../lib/auth-context';
import { Card } from './ui/Card';
import { spacing, borderRadius } from '../lib/theme';
import {
  getCategories,
  getGameDecksByCategory,
  getQuestionsFromDeck,
  createGameSession,
  getActiveMultiplayerRooms,
  createMultiplayerRoom,
} from '../lib/database';
import { MOBILE_CONSTANTS, GAME_SETTINGS } from '../lib/mobile-constants';
import type { DbCategory, DbQuestionTopic, DbQuestion } from '../lib/supabase';

interface GameDeckBrowserProps {
  onStartGame?: (deckId: string, gameMode: 'single' | 'multiplayer') => void;
}

export const GameDeckBrowser: React.FC<GameDeckBrowserProps> = ({ onStartGame }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  // State management
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [gameDecks, setGameDecks] = useState<DbQuestionTopic[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<DbQuestionTopic | null>(null);
  const [deckQuestions, setDeckQuestions] = useState<DbQuestion[]>([]);
  const [multiplayerRooms, setMultiplayerRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deckLoading, setDeckLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadMultiplayerRooms();
  }, []);

  // Load decks when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadGameDecks(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      
      // Auto-select first category
      if (categoriesData.length > 0 && !selectedCategory) {
        const firstCategory = categoriesData[0];
        if (firstCategory?.id) {
          setSelectedCategory(firstCategory.id);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGameDecks = async (categoryId: string) => {
    try {
      setDeckLoading(true);
      const decksData = await getGameDecksByCategory(categoryId);
      setGameDecks(decksData);
    } catch (error) {
      console.error('Error loading game decks:', error);
    } finally {
      setDeckLoading(false);
    }
  };

  const loadDeckQuestions = async (deck: DbQuestionTopic) => {
    try {
      setSelectedDeck(deck);
      const questionsData = await getQuestionsFromDeck(
        deck.id, 
        GAME_SETTINGS.DEFAULT_QUESTIONS_PER_DECK
      );
      setDeckQuestions(questionsData);
    } catch (error) {
      console.error('Error loading deck questions:', error);
    }
  };

  const loadMultiplayerRooms = async () => {
    try {
      const roomsData = await getActiveMultiplayerRooms(10);
      setMultiplayerRooms(roomsData);
    } catch (error) {
      console.error('Error loading multiplayer rooms:', error);
    }
  };

  const handleStartSinglePlayer = async (deck: DbQuestionTopic) => {
    if (!user) return;
    
    try {
      const gameSession = await createGameSession(user.id, deck.id, 'standard');
      if (gameSession) {
        onStartGame?.(deck.id, 'single');
      }
    } catch (error) {
      console.error('Error starting single player game:', error);
    }
  };

  const handleCreateMultiplayerRoom = async (deck: DbQuestionTopic) => {
    if (!user) return;
    
    try {
      const room = await createMultiplayerRoom(
        deck.id,
        user.id,
        undefined,
        `${deck.title} Game`,
        GAME_SETTINGS.MULTIPLAYER_MAX_PLAYERS,
        'standard'
      );
      
      if (room) {
        onStartGame?.(deck.id, 'multiplayer');
      }
    } catch (error) {
      console.error('Error creating multiplayer room:', error);
    }
  };

  const renderCategory = ({ item }: { item: DbCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        {
          backgroundColor: selectedCategory === item.id ? theme.primary : theme.card,
          borderColor: selectedCategory === item.id ? theme.primary : theme.border,
        },
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text style={styles.categoryEmoji}>{item.emoji}</Text>
      <Text
        style={[
          styles.categoryName,
          { color: selectedCategory === item.id ? theme.background : theme.foreground },
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderGameDeck = ({ item }: { item: DbQuestionTopic }) => (
    <Card style={styles.deckCard} variant="outlined">
      <TouchableOpacity onPress={() => loadDeckQuestions(item)}>
        <View style={styles.deckHeader}>
          <Text style={[styles.deckTitle, { color: theme.foreground }]}>
            {item.title}
          </Text>
          <View style={[styles.difficultyBadge, { backgroundColor: theme.accent + '20' }]}>
            <Text style={[styles.difficultyText, { color: theme.accent }]}>
              Level {(item as any).difficulty || 1}
            </Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={[styles.deckDescription, { color: theme.foregroundSecondary }]}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.deckStats}>
          <Text style={[styles.statText, { color: theme.foregroundSecondary }]}>
            📝 {(item as any).question_count || '?'} questions
          </Text>
          <Text style={[styles.statText, { color: theme.foregroundSecondary }]}>
            ⏱️ ~{Math.ceil(((item as any).question_count || 10) * 0.5)} min
          </Text>
        </View>
      </TouchableOpacity>
      
      {selectedDeck?.id === item.id && (
        <View style={styles.deckActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => handleStartSinglePlayer(item)}
          >
            <Text style={[styles.actionButtonText, { color: theme.background }]}>
              🎯 Play Solo
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.secondary }]}
            onPress={() => handleCreateMultiplayerRoom(item)}
          >
            <Text style={[styles.actionButtonText, { color: theme.background }]}>
              👥 Multiplayer
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  const renderQuestionPreview = ({ item }: { item: DbQuestion }) => (
    <View style={[styles.questionPreview, { backgroundColor: theme.input }]}>
      <Text style={[styles.questionText, { color: theme.foreground }]} numberOfLines={2}>
        {item.question}
      </Text>
      <View style={styles.questionMeta}>
        <Text style={[styles.metaText, { color: theme.foregroundSecondary }]}>
          Difficulty: {(item as any).difficulty || 'Medium'}
        </Text>
        <Text style={[styles.metaText, { color: theme.foregroundSecondary }]}>
          Type: {(item as any).question_type || 'Multiple Choice'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.foreground }]}>
            Loading game decks...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>
          🎮 Game Decks
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.foregroundSecondary }]}>
          Choose your civic challenge
        </Text>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
          📚 Categories
        </Text>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesList}
        />
      </View>

      {/* Game Decks */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
          🃏 Available Decks
        </Text>
        {deckLoading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <FlatList
            data={gameDecks}
            renderItem={renderGameDeck}
            keyExtractor={(item) => item.id}
            style={styles.decksList}
          />
        )}
      </View>

      {/* Question Preview */}
      {selectedDeck && deckQuestions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            👀 Question Preview ({deckQuestions.length} total)
          </Text>
          <FlatList
            data={deckQuestions.slice(0, 3)} // Show first 3 questions
            renderItem={renderQuestionPreview}
            keyExtractor={(item) => item.id}
            style={styles.questionsList}
          />
        </View>
      )}

      {/* Active Multiplayer Rooms */}
      {multiplayerRooms.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            🎯 Active Games ({multiplayerRooms.length})
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.foregroundSecondary }]}>
            Join an ongoing multiplayer game
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  categoriesList: {
    marginTop: spacing.sm,
  },
  categoryCard: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    minWidth: 100,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  decksList: {
    marginTop: spacing.sm,
  },
  deckCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  deckTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: spacing.md,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deckDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  deckStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deckActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionsList: {
    marginTop: spacing.sm,
  },
  questionPreview: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
  },
}); 