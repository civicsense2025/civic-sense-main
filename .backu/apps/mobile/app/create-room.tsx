import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme-context';
import { useAuth } from '../lib/auth-context';
import { 
  createMultiplayerRoom,
  getQuestionTopics,
} from '../lib/database';
import { QuizDataService } from '../lib/quiz-data-service';
import type { DbCategory, DbQuestionTopic } from '../lib/supabase';
import { Text } from '../components/atoms/Text';
import { Card } from '../components/ui/Card';
import { spacing, borderRadius, fontFamily, typography, shadows } from '../lib/theme';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/molecules/LoadingSpinner';

export default function CreateRoomScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DbCategory | null>(null);
  const [topics, setTopics] = useState<DbQuestionTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<DbQuestionTopic | null>(null);
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showRoomNameInput, setShowRoomNameInput] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadTopicsForCategory(selectedCategory.id);
    } else {
      setTopics([]);
      setSelectedTopic(null);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      console.log('📂 Loading categories for room creation...');
      
      const categoriesData = await QuizDataService.loadCategories();
      console.log(`📂 Loaded ${categoriesData.length} categories`);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
      Alert.alert('Error', 'Failed to load quiz categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTopicsForCategory = async (categoryId: string) => {
    try {
      console.log(`📚 Loading topics for category: ${categoryId}`);
      
      const topicsData = await getQuestionTopics(categoryId);
      console.log(`📚 Loaded ${topicsData.length} topics for category`);
      setTopics(topicsData || []);
      setSelectedTopic(null);
    } catch (error) {
      console.error('Error loading topics for category:', error);
      setTopics([]);
      Alert.alert('Error', 'Failed to load topics for this category. Please try selecting a different category.');
    }
  };

  const handleCreateRoom = () => {
    if (!selectedTopic) {
      Alert.alert('Missing Selection', 'Please select a category and topic first.');
      return;
    }

    if (Platform.OS === 'web') {
      setShowRoomNameInput(true);
    } else {
      Alert.prompt(
        'Create Room',
        'Enter a name for your room',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create', onPress: (name) => name?.trim() && handleRoomNameSubmit(name.trim()) }
        ],
        'plain-text',
        '',
        'default'
      );
    }
  };

  const handleRoomNameSubmit = async (name: string) => {
    if (!name.trim() || !selectedTopic || !user) {
      return;
    }

    try {
      setCreating(true);
      setShowRoomNameInput(false);
      
      console.log('🎮 Creating room:', { name, topicId: selectedTopic.id });
      
      const result = await createMultiplayerRoom(
        name.trim(),
        selectedTopic.id,
        getUserName(),
        user.id,
        4, // max players
        '🎯' // default emoji
      );

      if (result.success && result.data) {
        console.log('✅ Successfully created room:', result.data.room_code);
        
        // Navigate to the room
        router.replace(`/room/${result.data.room_code}` as any);
      } else {
        console.error('Failed to create room:', result.error);
        Alert.alert('Error', result.error || 'Failed to create room. Please try again.');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room. Please check your connection and try again.');
    } finally {
      setCreating(false);
    }
  };

  const getUserName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    return user?.email?.split('@')[0] || 'Anonymous Player';
  };

  const handleBack = () => {
    router.back();
  };

  const renderCategoryCard = ({ item }: { item: DbCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        { 
          backgroundColor: theme.card,
          borderColor: selectedCategory?.id === item.id ? theme.primary : theme.border,
          borderWidth: selectedCategory?.id === item.id ? 2 : 1,
        }
      ]}
      onPress={() => setSelectedCategory(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.categoryEmoji, {
        transform: [{ scale: selectedCategory?.id === item.id ? 1.1 : 1 }]
      }]}>{item.emoji}</Text>
      <Text variant="caption" color="inherit" style={[
        styles.categoryName,
        { color: selectedCategory?.id === item.id ? theme.primary : theme.foreground }
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderTopicCard = ({ item }: { item: DbQuestionTopic }) => (
    <TouchableOpacity
      style={styles.topicCard}
      onPress={() => setSelectedTopic(item)}
      activeOpacity={0.7}
    >
      <Card 
        style={[
          styles.topicCardContent,
          selectedTopic?.id === item.id && {
            borderColor: theme.primary,
            borderWidth: 2,
            backgroundColor: theme.primary + '08',
          }
        ]}
        variant="outlined"
      >
        <View style={styles.topicHeader}>
          <Text variant="callout" weight="600" color="inherit" style={styles.topicTitle}>
            {item.title || 'Untitled Topic'}
          </Text>
          {selectedTopic?.id === item.id && (
            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
          )}
        </View>
        {item.description && (
          <Text variant="footnote" color="secondary" style={styles.topicDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.topicMeta}>
          <Text variant="caption" color="secondary">
            Level {item.difficulty_level || 1}
          </Text>
          <Text variant="caption" color="tertiary">
            • Questions available
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Loading categories...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Navigation Header */}
      <View style={[styles.navigationHeader, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.foreground} />
        </TouchableOpacity>
        <Text variant="headline" weight="600" color="inherit" style={styles.headerTitle}>
          Create Room
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentWrapper}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text variant="body" color="secondary" style={styles.headerSubtitle}>
              Set up your quiz room for friends to join
            </Text>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text variant="headline" weight="600" color="inherit" style={styles.sectionTitle}>
              Choose Category
            </Text>
            <Text variant="callout" color="secondary" style={styles.sectionDescription}>
              Select a topic category for your quiz room
            </Text>
            
            <FlatList
              data={categories}
              renderItem={renderCategoryCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            />
          </View>

          {/* Topic Selection */}
          {selectedCategory && (
            <View style={styles.section}>
              <Text variant="headline" weight="600" color="inherit" style={styles.sectionTitle}>
                Choose Topic
              </Text>
              <Text variant="callout" color="secondary" style={styles.sectionDescription}>
                Pick a specific topic from {selectedCategory.name}
              </Text>
              
              {topics.length > 0 ? (
                <FlatList
                  data={topics}
                  renderItem={renderTopicCard}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.topicsList}
                />
              ) : (
                <Card style={styles.emptyCard} variant="outlined">
                  <Text style={[styles.emptyIcon, { color: theme.foregroundTertiary }]}>📚</Text>
                  <Text variant="callout" color="secondary" style={styles.emptyTitle}>
                    Loading Topics...
                  </Text>
                  <Text variant="footnote" color="tertiary" style={styles.emptyDescription}>
                    Please wait while we load topics for {selectedCategory.name}
                  </Text>
                </Card>
              )}
            </View>
          )}

          {/* Create Button */}
          {selectedTopic && (
            <View style={styles.section}>
              <Button
                title="Create Room"
                onPress={handleCreateRoom}
                variant="primary"
                size="lg"
                fullWidth
                disabled={creating || !selectedTopic}
                loading={creating}
              />
              <Text variant="footnote" color="tertiary" style={styles.createHint}>
                You'll get a room code to share with friends
              </Text>
            </View>
          )}

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Room Name Input Modal */}
      <Modal
        visible={showRoomNameInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoomNameInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text variant="headline" weight="600" color="inherit" style={styles.modalTitle}>
              Create Room
            </Text>
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.foreground,
              }]}
              placeholder="Enter room name..."
              placeholderTextColor={theme.foregroundSecondary}
              value={roomName}
              onChangeText={setRoomName}
              autoFocus
              maxLength={50}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowRoomNameInput(false);
                  setRoomName('');
                }}
                variant="outlined"
                size="md"
                disabled={creating}
              />
              <Button
                title="Create"
                onPress={() => handleRoomNameSubmit(roomName)}
                variant="primary"
                size="md"
                disabled={!roomName.trim() || creating}
                loading={creating}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    fontFamily: fontFamily.display,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  contentWrapper: {
    paddingHorizontal: spacing.lg,
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
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerSubtitle: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
    paddingHorizontal: spacing.lg,
  },
  section: {
    gap: spacing.lg,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
  },
  sectionDescription: {
    fontFamily: fontFamily.text,
    lineHeight: typography.callout.lineHeight,
  },
  categoryList: {
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  categoryCard: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    minWidth: 100,
    ...shadows.card,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  topicsList: {
    gap: spacing.md,
  },
  topicCard: {
    // No additional styles needed
  },
  topicCardContent: {
    padding: spacing.lg,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  topicTitle: {
    fontFamily: fontFamily.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  topicDescription: {
    fontFamily: fontFamily.text,
    lineHeight: typography.footnote.lineHeight,
    marginBottom: spacing.sm,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  createHint: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDescription: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    lineHeight: typography.footnote.lineHeight,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    gap: spacing.lg,
    ...shadows.card,
  },
  modalTitle: {
    fontFamily: fontFamily.display,
    textAlign: 'center',
  },
  modalInput: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    fontSize: typography.body.fontSize,
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
}); 