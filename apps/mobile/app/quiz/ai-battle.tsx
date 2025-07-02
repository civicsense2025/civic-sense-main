import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';
import { NPCService, type NPCPersonality, type NPCPersonalityCompat } from '../../lib/multiplayer/npc-service';
import { standardDataService, type StandardTopic, type StandardCategory } from '../../lib/standardized-data-service';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

interface BattleSettings {
  chatEnabled: boolean;
  maxPlayers: number;
  timeLimit: number;
  difficulty: 'adaptive' | 'fixed';
}

interface NPCCardProps {
  npc: NPCPersonalityCompat;
  isSelected: boolean;
  onPress: () => void;
}

const NPCCard: React.FC<NPCCardProps> = ({ npc, isSelected, onPress }) => {
  const { theme } = useTheme();
  
  const getPersonalityColor = (): [string, string] => {
    switch (npc.personality_type) {
      case 'academic': return ['#4F46E5', '#7C3AED'];
      case 'civic': return ['#059669', '#10B981'];
      case 'competitive': return ['#DC2626', '#EF4444'];
      case 'democratic': return ['#2563EB', '#3B82F6'];
      case 'analytical': return ['#7C3AED', '#8B5CF6'];
      case 'collaborative': return ['#0891B2', '#06B6D4'];
      default: return ['#6B7280', '#9CA3AF'];
    }
  };
  
  const getPersonalityDescription = () => {
    switch (npc.personality_type) {
      case 'academic': return 'Methodical and precise';
      case 'civic': return 'Community focused';
      case 'competitive': return 'Loves a challenge';
      case 'democratic': return 'Fair and balanced';
      case 'analytical': return 'Data-driven thinker';
      case 'collaborative': return 'Team player';
      default: return 'Unique perspective';
    }
  };

  // Fix accuracy calculation - values are already percentages
  const displayAccuracy = () => {
    // Use base_accuracy directly since it's already a percentage value
    return Math.round(npc.base_accuracy);
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.npcCard,
        isSelected && styles.npcCardSelected,
        { borderColor: isSelected ? theme.primary : theme.border }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getPersonalityColor()}
        style={styles.npcGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.npcContent}>
          <Text style={styles.npcEmoji}>{npc.avatar_emoji}</Text>
          <Text style={styles.npcName}>{npc.name}</Text>
          <Text style={styles.npcPersonality}>{getPersonalityDescription()}</Text>
          
          <View style={styles.npcStats}>
            <View style={styles.npcStat}>
              <Text style={styles.npcStatLabel}>Accuracy</Text>
              <Text style={styles.npcStatValue}>{displayAccuracy()}%</Text>
            </View>
            <View style={styles.npcStat}>
              <Text style={styles.npcStatLabel}>Speed</Text>
              <Text style={styles.npcStatValue}>
                {npc.response_time_range[0] < 3000 ? '⚡' : npc.response_time_range[0] < 5000 ? '🏃' : '🚶'}
              </Text>
            </View>
          </View>
          
          {npc.chattiness_level > 0.7 && (
            <View style={styles.npcBadge}>
              <Text style={styles.npcBadgeText}>💬 Chatty</Text>
            </View>
          )}
          
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const BattleSettingsPanel: React.FC<{
  settings: BattleSettings;
  onSettingsChange: (settings: BattleSettings) => void;
}> = ({ settings, onSettingsChange }) => {
  const { theme } = useTheme();

  const updateSetting = <K extends keyof BattleSettings>(key: K, value: BattleSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card style={styles.settingsPanel} variant="outlined">
      <Text variant="title3" color="inherit" style={styles.settingsPanelTitle}>
        ⚙️ Battle Settings
      </Text>
      
      {/* Chat Toggle */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text variant="callout" color="inherit">Enable Chat</Text>
          <Text variant="footnote" color="secondary">NPC will comment during battle</Text>
        </View>
        <Switch
          value={settings.chatEnabled}
          onValueChange={(value) => updateSetting('chatEnabled', value)}
          trackColor={{ false: theme.border, true: theme.primary + '40' }}
          thumbColor={settings.chatEnabled ? theme.primary : '#f4f3f4'}
        />
      </View>

      {/* Time Limit */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text variant="callout" color="inherit">Time per Question</Text>
          <Text variant="footnote" color="secondary">Seconds to answer each question</Text>
        </View>
        <View style={styles.timeLimitButtons}>
          {[15, 30, 45].map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeLimitButton,
                settings.timeLimit === time && styles.timeLimitButtonSelected,
                { 
                  backgroundColor: settings.timeLimit === time ? theme.primary : theme.card,
                  borderColor: theme.border 
                }
              ]}
              onPress={() => updateSetting('timeLimit', time)}
            >
              <Text
                variant="footnote"
                style={[
                  styles.timeLimitButtonText,
                  { color: settings.timeLimit === time ? '#FFFFFF' : theme.foreground }
                ]}
              >
                {time}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Difficulty Mode */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text variant="callout" color="inherit">Difficulty Mode</Text>
          <Text variant="footnote" color="secondary">How NPC adapts to your performance</Text>
        </View>
        <View style={styles.difficultyButtons}>
          <TouchableOpacity
            style={[
              styles.difficultyButton,
              settings.difficulty === 'fixed' && styles.difficultyButtonSelected,
              { 
                backgroundColor: settings.difficulty === 'fixed' ? theme.primary : theme.card,
                borderColor: theme.border 
              }
            ]}
            onPress={() => updateSetting('difficulty', 'fixed')}
          >
            <Text
              variant="footnote"
              style={[
                styles.difficultyButtonText,
                { color: settings.difficulty === 'fixed' ? '#FFFFFF' : theme.foreground }
              ]}
            >
              Fixed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.difficultyButton,
              settings.difficulty === 'adaptive' && styles.difficultyButtonSelected,
              { 
                backgroundColor: settings.difficulty === 'adaptive' ? theme.primary : theme.card,
                borderColor: theme.border 
              }
            ]}
            onPress={() => updateSetting('difficulty', 'adaptive')}
          >
            <Text
              variant="footnote"
              style={[
                styles.difficultyButtonText,
                { color: settings.difficulty === 'adaptive' ? '#FFFFFF' : theme.foreground }
              ]}
            >
              Adaptive
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

export default function AIBattleScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [npcs, setNpcs] = useState<NPCPersonalityCompat[]>([]);
  const [selectedNpc, setSelectedNpc] = useState<NPCPersonalityCompat | null>(null);
  const [categories, setCategories] = useState<StandardCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<StandardCategory | null>(null);
  const [topics, setTopics] = useState<StandardTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<StandardTopic | null>(null);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [battleSettings, setBattleSettings] = useState<BattleSettings>({
    chatEnabled: true,
    maxPlayers: 2,
    timeLimit: 30,
    difficulty: 'adaptive',
  });
  
  const npcService = NPCService.getInstance();
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load NPCs from database
      const dbNPCs = await npcService.getAllActivePersonalities();
      
      // Convert to compatible format for UI
      const compatNPCs = dbNPCs.map(npc => npcService.toCompatPersonality(npc));
      
      setNpcs(compatNPCs);
      if (compatNPCs.length > 0) {
        setSelectedNpc(compatNPCs[0] || null);
      }
      
      // Load categories
      const categoriesResponse = await standardDataService.fetchCategories({ useCache: true });
      if (!categoriesResponse.error && categoriesResponse.data) {
        console.log('📂 Categories loaded:', categoriesResponse.data.map(c => ({ id: c.id, name: c.name })));
        setCategories(categoriesResponse.data);
        if (categoriesResponse.data.length > 0) {
          const firstCategory = categoriesResponse.data[0];
          if (firstCategory) {
            console.log(`🎯 Auto-selecting first category: "${firstCategory.name}" (ID: ${firstCategory.id})`);
            setSelectedCategory(firstCategory);
            await loadTopicsForCategory(firstCategory.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading NPC battle data:', error);
      Alert.alert('Error', 'Failed to load NPC opponents. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const loadTopicsForCategory = async (categoryId: string) => {
    try {
      setLoadingTopics(true);
      console.log(`🔄 Loading topics for category: ${categoryId}`);
      
      // First, let's diagnose what's actually in the database
      console.log(`🔍 DEBUGGING: Let's see what's in the database...`);
      
      // Check total active topics in database
      const { data: allActiveTopics, error: allTopicsError } = await supabase
        .from('question_topics')
        .select('topic_id, topic_title, categories, is_active')
        .eq('is_active', true)
        .limit(10);
      
      console.log(`📊 Database diagnostic - Total active topics:`, allActiveTopics?.length || 0);
      if (allActiveTopics && allActiveTopics.length > 0) {
        console.log(`📋 Sample topics and their categories:`, allActiveTopics.map(t => ({
          title: t.topic_title,
          categories: t.categories,
          categoriesType: typeof t.categories,
          categoriesLength: Array.isArray(t.categories) ? t.categories.length : 'not array'
        })));
      }
      
      // Check if any topics contain our specific category ID
      const { data: topicsWithCategory, error: categoryCheckError } = await supabase
        .from('question_topics')
        .select('topic_id, topic_title, categories')
        .eq('is_active', true)
        .contains('categories', JSON.stringify([categoryId]))
        .limit(5);
      
      console.log(`🎯 Topics containing category ${categoryId}:`, topicsWithCategory?.length || 0);
      if (topicsWithCategory && topicsWithCategory.length > 0) {
        console.log(`📝 Found topics:`, topicsWithCategory.map(t => t.topic_title));
      }
      
      // Try alternative query methods
      console.log(`🔄 Trying alternative category queries...`);
      
      // Method 1: Check if categories contain the ID as a string anywhere
      const { data: alternativeQuery1 } = await supabase
        .from('question_topics')
        .select('topic_id, topic_title, categories')
        .eq('is_active', true)
        .textSearch('categories', categoryId)
        .limit(3);
      
      console.log(`🔍 Text search method found:`, alternativeQuery1?.length || 0, 'topics');
      
      // Method 2: Use ilike to search within the JSONB
      const { data: alternativeQuery2 } = await supabase
        .from('question_topics')
        .select('topic_id, topic_title, categories')
        .eq('is_active', true)
        .ilike('categories', `%${categoryId}%`)
        .limit(3);
      
      console.log(`🔍 ILIKE search method found:`, alternativeQuery2?.length || 0, 'topics');
      
      // Now try the standard service call
      const topicsResponse = await standardDataService.fetchTopics(categoryId, { useCache: false });
      console.log('📊 Standard service response:', topicsResponse);
      
      if (!topicsResponse.error && topicsResponse.data) {
        console.log(`📋 Raw topics found: ${topicsResponse.data.length}`);
        
        // Don't filter by question_count initially - let's see all topics
        const allTopics = topicsResponse.data;
        console.log(`📝 All topics:`, allTopics.map(t => ({ 
          id: t.id, 
          title: t.title, 
          question_count: t.question_count 
        })));
        
        // Enhanced question count checking with fallbacks
        const topicsWithValidatedCounts = await Promise.all(
          allTopics.map(async (topic) => {
            let questionCount = topic.question_count || 0;
            
            // If the standardized service didn't get a count, try manual check
            if (questionCount === 0) {
              try {
                console.log(`🔍 Manually checking questions for topic: ${topic.topic_id}`);
                
                // Try main questions table first
                const { count: mainCount, error: mainError } = await supabase
                  .from('questions')
                  .select('*', { count: 'exact', head: true })
                  .eq('topic_id', topic.topic_id)
                  .eq('is_active', true);
                
                if (!mainError && mainCount && mainCount > 0) {
                  questionCount = mainCount;
                  console.log(`📊 Found ${questionCount} questions in main table for "${topic.title}"`);
                } else {
                  console.log(`⚠️ Main table failed or empty for "${topic.title}":`, mainError);
                  
                  // Try questions_test table as fallback
                  const { count: testCount, error: testError } = await supabase
                    .from('questions_test')
                    .select('*', { count: 'exact', head: true })
                    .eq('topic_id', topic.topic_id)
                    .eq('is_active', true);
                  
                  if (!testError && testCount && testCount > 0) {
                    questionCount = testCount;
                    console.log(`📊 Found ${questionCount} questions in test table for "${topic.title}"`);
                  } else {
                    console.log(`❌ Both tables failed for "${topic.title}":`, testError);
                  }
                }
              } catch (error) {
                console.error(`Error manually checking questions for topic ${topic.topic_id}:`, error);
              }
            }
            
            return {
              ...topic,
              question_count: questionCount
            };
          })
        );
        
        // Filter by question count but with more lenient criteria
        const filteredTopics = topicsWithValidatedCounts.filter(t => {
          const hasQuestions = t.question_count && t.question_count > 0;
          console.log(`📋 Topic "${t.title}": question_count=${t.question_count}, hasQuestions=${hasQuestions}`);
          return hasQuestions;
        });
        
        console.log(`📊 Found ${filteredTopics.length} topics with questions out of ${topicsWithValidatedCounts.length} total`);
        
        if (filteredTopics.length > 0) {
          setTopics(filteredTopics);
          setSelectedTopic(filteredTopics[0] || null);
        } else {
          // If no topics with questions, show all topics for now (for debugging)
          console.log('⚠️ No topics with questions found, showing all topics for selection');
          setTopics(topicsWithValidatedCounts);
          const firstTopic = topicsWithValidatedCounts.length > 0 ? topicsWithValidatedCounts[0] : null;
          setSelectedTopic(firstTopic || null);
        }
      } else {
        console.warn('❌ Failed to load topics:', topicsResponse.error);
        setTopics([]);
        setSelectedTopic(null);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
      setTopics([]);
      setSelectedTopic(null);
    } finally {
      setLoadingTopics(false);
    }
  };
  
  const handleCategorySelect = async (category: StandardCategory) => {
    if (selectedCategory?.id === category.id) return; // Don't reload same category
    
    console.log(`👆 User selected category: "${category.name}" (ID: ${category.id})`);
    setSelectedCategory(category);
    setSelectedTopic(null);
    await loadTopicsForCategory(category.id);
  };
  
  const handleStartBattle = () => {
    if (!selectedNpc || !selectedTopic) {
      Alert.alert('Selection Required', 'Please select an NPC opponent and a topic to battle.');
      return;
    }
    
    // Use base_accuracy directly since it's already a percentage value
    const npcAccuracy = selectedNpc.base_accuracy;
    
    // Navigate to quiz session with NPC battle mode
    router.push({
      pathname: `/quiz-session/${selectedTopic.id}`,
      params: {
        mode: 'npc_battle',
        npcId: selectedNpc.id,
        npcName: selectedNpc.name,
        npcPersonality: selectedNpc.personality_type,
        npcAccuracy: String(npcAccuracy / 100), // Convert back to decimal for quiz logic
        npcResponseTime: String(selectedNpc.response_time_range[0]),
        timeLimit: String(battleSettings.timeLimit),
        chatEnabled: String(battleSettings.chatEnabled),
        difficulty: battleSettings.difficulty
      }
    } as any);
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen 
          options={{
            title: 'NPC Battle',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" variant="pulse" />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading NPC opponents...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'NPC Battle',
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🤖</Text>
          <Text variant="title2" color="inherit" style={styles.headerTitle}>
            Choose Your NPC Opponent
          </Text>
          <Text variant="body" color="secondary" style={styles.headerSubtitle}>
            Battle against NPC personalities with unique playing styles
          </Text>
        </View>
        
        {/* NPC Selection */}
        <View style={styles.section}>
          <Text variant="title3" color="inherit" style={styles.sectionTitle}>
            Select Opponent
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.npcScrollContent}
          >
            {npcs.map((npc) => (
              <NPCCard
                key={npc.id}
                npc={npc}
                isSelected={selectedNpc?.id === npc.id}
                onPress={() => setSelectedNpc(npc)}
              />
            ))}
          </ScrollView>
        </View>
        
        {/* Category Selection */}
        <View style={styles.section}>
          <Text variant="title3" color="inherit" style={styles.sectionTitle}>
            Select Category
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory?.id === category.id && styles.categoryChipSelected,
                  { 
                    backgroundColor: selectedCategory?.id === category.id ? theme.primary : theme.card,
                    borderColor: theme.border 
                  }
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <Text style={styles.categoryEmoji}>{category.emoji || '📚'}</Text>
                <Text style={[
                  styles.categoryText,
                  { color: selectedCategory?.id === category.id ? '#FFFFFF' : theme.foreground }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Topic Selection */}
        <View style={styles.section}>
          <Text variant="title3" color="inherit" style={styles.sectionTitle}>
            Select Topic
          </Text>
          
          {loadingTopics ? (
            <View style={styles.topicsLoading}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text variant="footnote" color="secondary" style={styles.loadingTopicsText}>
                Loading topics...
              </Text>
            </View>
          ) : topics.length > 0 ? (
            <View style={styles.topicsGrid}>
              {topics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicCard,
                    selectedTopic?.id === topic.id && styles.topicCardSelected,
                    { 
                      backgroundColor: theme.card,
                      borderColor: selectedTopic?.id === topic.id ? theme.primary : theme.border 
                    }
                  ]}
                  onPress={() => setSelectedTopic(topic)}
                >
                  <Text variant="callout" color="inherit" style={styles.topicTitle}>
                    {topic.title}
                  </Text>
                  <Text variant="footnote" color="secondary" style={styles.topicMeta}>
                    {topic.question_count} questions
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noTopicsContainer}>
              <Text variant="body" color="secondary" style={styles.noTopicsText}>
                No topics available for this category yet.
              </Text>
            </View>
          )}
        </View>

        {/* Battle Settings */}
        <View style={styles.section}>
          <BattleSettingsPanel 
            settings={battleSettings}
            onSettingsChange={setBattleSettings}
          />
        </View>
        
        {/* Battle Preview */}
        {selectedNpc && selectedTopic && (
          <Card style={styles.previewCard} variant="elevated">
            <Text variant="callout" color="inherit" style={styles.previewTitle}>
              Battle Preview
            </Text>
            <View style={styles.previewContent}>
              <View style={styles.previewItem}>
                <Text style={styles.previewEmoji}>{selectedNpc.avatar_emoji}</Text>
                <Text variant="footnote" color="secondary">vs</Text>
                <Text style={styles.previewEmoji}>👤</Text>
              </View>
              <Text variant="body" color="secondary" style={styles.previewText}>
                {selectedNpc.name} • {selectedTopic.title}
              </Text>
              <View style={styles.previewSettings}>
                <Text variant="footnote" color="secondary">
                  {battleSettings.timeLimit}s per question • Chat {battleSettings.chatEnabled ? 'On' : 'Off'}
                </Text>
              </View>
            </View>
          </Card>
        )}
        
        {/* Start Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              { backgroundColor: theme.primary },
              (!selectedNpc || !selectedTopic) && styles.startButtonDisabled
            ]}
            onPress={handleStartBattle}
            disabled={!selectedNpc || !selectedTopic}
          >
            <Text style={styles.startButtonText}>Start NPC Battle</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 16,
    fontFamily: fontFamily.text,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  npcScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  npcCard: {
    borderRadius: 20,
    borderWidth: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  npcCardSelected: {
    borderWidth: 3,
  },
  npcGradient: {
    flex: 1,
    padding: spacing.md,
  },
  npcContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  npcEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  npcName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  npcPersonality: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  npcStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  npcStat: {
    alignItems: 'center',
  },
  npcStatLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  npcStatValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  npcBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  npcBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  selectedBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  categoryScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    minWidth: 120,
  },
  categoryChipSelected: {
    borderWidth: 0,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  topicsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  loadingTopicsText: {
    fontSize: 14,
  },
  topicsGrid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  topicCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 60,
  },
  topicCardSelected: {
    borderWidth: 2,
  },
  topicTitle: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.xs,
  },
  topicMeta: {
    fontFamily: fontFamily.text,
  },
  noTopicsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  noTopicsText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Battle Settings Panel
  settingsPanel: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
  },
  settingsPanelTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  timeLimitButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  timeLimitButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
  },
  timeLimitButtonSelected: {
    borderWidth: 0,
  },
  timeLimitButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  difficultyButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    borderWidth: 0,
  },
  difficultyButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },

  previewCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  previewTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  previewContent: {
    alignItems: 'center',
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  previewEmoji: {
    fontSize: 32,
  },
  previewText: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  previewSettings: {
    alignItems: 'center',
  },
  footer: {
    padding: spacing.lg,
  },
  startButton: {
    borderRadius: 20,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fontFamily.mono,
  },
}); 