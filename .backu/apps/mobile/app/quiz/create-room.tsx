import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/Button';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';
import { standardDataService, type StandardTopic, type StandardCategory } from '../../lib/standardized-data-service';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RoomSettings {
  name: string;
  isPrivate: boolean;
  maxPlayers: number;
  gameMode: 'classic_quiz' | 'speed_round' | 'debate_mode';
  categoryId: string | null;
  topicId: string | null;
  questionCount: number;
  timePerQuestion: number;
}

const gameModeOptions = [
  {
    id: 'classic_quiz' as const,
    name: 'Classic Quiz',
    description: 'Traditional quiz format',
    icon: '🎯',
  },
  {
    id: 'speed_round' as const,
    name: 'Speed Round',
    description: 'Fast-paced with time pressure',
    icon: '⚡',
  },
  {
    id: 'debate_mode' as const,
    name: 'Debate Mode',
    description: 'Discuss answers with opponents',
    icon: '💬',
  },
];

export default function CreateRoomScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<StandardCategory[]>([]);
  const [topics, setTopics] = useState<StandardTopic[]>([]);
  const [settings, setSettings] = useState<RoomSettings>({
    name: '',
    isPrivate: false,
    maxPlayers: 4,
    gameMode: 'classic_quiz',
    categoryId: null,
    topicId: null,
    questionCount: 10,
    timePerQuestion: 30,
  });
  
  useEffect(() => {
    loadCategories();
  }, []);
  
  useEffect(() => {
    if (settings.categoryId) {
      loadTopics(settings.categoryId);
    }
  }, [settings.categoryId]);
  
  const loadCategories = async () => {
    try {
      const response = await standardDataService.fetchCategories({ useCache: true });
      if (!response.error && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };
  
  const loadTopics = async (categoryId: string) => {
    try {
      const response = await standardDataService.fetchTopics(categoryId, { useCache: true });
      if (!response.error && response.data) {
        const filteredTopics = response.data.filter(t => t.question_count && t.question_count > 0);
        setTopics(filteredTopics);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };
  
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };
  
  const handleCreateRoom = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to create multiplayer games.');
      return;
    }
    
    if (!settings.name.trim()) {
      Alert.alert('Room Name Required', 'Please enter a name for your room.');
      return;
    }
    
    if (!settings.topicId) {
      Alert.alert('Topic Required', 'Please select a topic for the quiz.');
      return;
    }
    
    try {
      setLoading(true);
      
      const roomCode = generateRoomCode();
      const selectedTopic = topics.find(t => t.id === settings.topicId);
      
      // In production, create room in Supabase
      const roomData = {
        code: roomCode,
        name: settings.name,
        host_id: user.id,
        host_name: user.user_metadata?.full_name || 'Anonymous',
        topic_id: settings.topicId,
        topic_name: selectedTopic?.title || 'Unknown Topic',
        max_players: settings.maxPlayers,
        game_mode: settings.gameMode,
        is_private: settings.isPrivate,
        question_count: settings.questionCount,
        time_per_question: settings.timePerQuestion,
        status: 'waiting',
      };
      
      // Save room data for navigation
      await AsyncStorage.setItem('@created_room', JSON.stringify({
        roomId: `room_${Date.now()}`,
        roomCode,
        ...roomData,
      }));
      
      // Navigate to quiz session as host
      router.push({
        pathname: `/quiz-session/${settings.topicId}`,
        params: {
          mode: settings.gameMode,
          roomId: `room_${Date.now()}`,
          roomCode,
          isHost: 'true',
          maxPlayers: String(settings.maxPlayers),
          questionCount: String(settings.questionCount),
          timeLimit: String(settings.timePerQuestion),
        }
      } as any);
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const updateSetting = <K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Reset topic when category changes
    if (key === 'categoryId') {
      setSettings(prev => ({ ...prev, topicId: null }));
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Create Room',
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
        }}
      />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Room Name */}
          <Card style={styles.section} variant="outlined">
            <Text variant="callout" color="inherit" style={styles.sectionTitle}>
              Room Details
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.foreground }]}
              placeholder="Enter room name"
              placeholderTextColor={theme.foregroundSecondary}
              value={settings.name}
              onChangeText={(text) => updateSetting('name', text)}
              maxLength={30}
            />
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="callout" color="inherit">Private Room</Text>
                <Text variant="footnote" color="secondary">
                  Players need code to join
                </Text>
              </View>
              <Switch
                value={settings.isPrivate}
                onValueChange={(value) => updateSetting('isPrivate', value)}
                trackColor={{ false: theme.border, true: theme.primary }}
                ios_backgroundColor={theme.border}
              />
            </View>
          </Card>
          
          {/* Game Mode */}
          <Card style={styles.section} variant="outlined">
            <Text variant="callout" color="inherit" style={styles.sectionTitle}>
              Game Mode
            </Text>
            <View style={styles.optionsGrid}>
              {gameModeOptions.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeOption,
                    settings.gameMode === mode.id && styles.modeOptionSelected,
                    { 
                      backgroundColor: theme.card,
                      borderColor: settings.gameMode === mode.id ? theme.primary : theme.border 
                    }
                  ]}
                  onPress={() => updateSetting('gameMode', mode.id)}
                >
                  <Text style={styles.modeIcon}>{mode.icon}</Text>
                  <Text variant="footnote" color="inherit" style={styles.modeName}>
                    {mode.name}
                  </Text>
                  <Text variant="caption1" color="secondary" style={styles.modeDescription}>
                    {mode.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
          
          {/* Topic Selection */}
          <Card style={styles.section} variant="outlined">
            <Text variant="callout" color="inherit" style={styles.sectionTitle}>
              Quiz Topic
            </Text>
            
            {/* Category Selection */}
            <Text variant="footnote" color="secondary" style={styles.fieldLabel}>
              Category
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    settings.categoryId === category.id && styles.categoryChipSelected,
                    { 
                      backgroundColor: settings.categoryId === category.id ? theme.primary : theme.card,
                      borderColor: theme.border 
                    }
                  ]}
                  onPress={() => updateSetting('categoryId', category.id)}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji || '📚'}</Text>
                  <Text style={[
                    styles.categoryText,
                    { color: settings.categoryId === category.id ? '#FFFFFF' : theme.foreground }
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Topic Selection */}
            {topics.length > 0 && (
              <>
                <Text variant="footnote" color="secondary" style={[styles.fieldLabel, { marginTop: spacing.md }]}>
                  Topic
                </Text>
                <View style={styles.topicsList}>
                  {topics.map((topic) => (
                    <TouchableOpacity
                      key={topic.id}
                      style={[
                        styles.topicItem,
                        settings.topicId === topic.id && styles.topicItemSelected,
                        { 
                          backgroundColor: theme.card,
                          borderColor: settings.topicId === topic.id ? theme.primary : theme.border 
                        }
                      ]}
                      onPress={() => updateSetting('topicId', topic.id)}
                    >
                      <Text variant="footnote" color="inherit">
                        {topic.title}
                      </Text>
                      <Text variant="caption1" color="secondary">
                        {topic.question_count} questions
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </Card>
          
          {/* Game Settings */}
          <Card style={styles.section} variant="outlined">
            <Text variant="callout" color="inherit" style={styles.sectionTitle}>
              Game Settings
            </Text>
            
            {/* Max Players */}
            <View style={styles.settingRow}>
              <Text variant="footnote" color="inherit">Max Players</Text>
              <View style={styles.numberPicker}>
                <TouchableOpacity
                  style={[styles.numberButton, { backgroundColor: theme.card }]}
                  onPress={() => updateSetting('maxPlayers', Math.max(2, settings.maxPlayers - 1))}
                >
                  <Ionicons name="remove" size={16} color={theme.foreground} />
                </TouchableOpacity>
                <Text variant="callout" color="inherit" style={styles.numberValue}>
                  {settings.maxPlayers}
                </Text>
                <TouchableOpacity
                  style={[styles.numberButton, { backgroundColor: theme.card }]}
                  onPress={() => updateSetting('maxPlayers', Math.min(8, settings.maxPlayers + 1))}
                >
                  <Ionicons name="add" size={16} color={theme.foreground} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Questions */}
            <View style={styles.settingRow}>
              <Text variant="footnote" color="inherit">Questions</Text>
              <View style={styles.numberPicker}>
                <TouchableOpacity
                  style={[styles.numberButton, { backgroundColor: theme.card }]}
                  onPress={() => updateSetting('questionCount', Math.max(5, settings.questionCount - 5))}
                >
                  <Ionicons name="remove" size={16} color={theme.foreground} />
                </TouchableOpacity>
                <Text variant="callout" color="inherit" style={styles.numberValue}>
                  {settings.questionCount}
                </Text>
                <TouchableOpacity
                  style={[styles.numberButton, { backgroundColor: theme.card }]}
                  onPress={() => updateSetting('questionCount', Math.min(30, settings.questionCount + 5))}
                >
                  <Ionicons name="add" size={16} color={theme.foreground} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Time per Question */}
            <View style={styles.settingRow}>
              <Text variant="footnote" color="inherit">Time per Question</Text>
              <View style={styles.numberPicker}>
                <TouchableOpacity
                  style={[styles.numberButton, { backgroundColor: theme.card }]}
                  onPress={() => updateSetting('timePerQuestion', Math.max(10, settings.timePerQuestion - 5))}
                >
                  <Ionicons name="remove" size={16} color={theme.foreground} />
                </TouchableOpacity>
                <Text variant="callout" color="inherit" style={styles.numberValue}>
                  {settings.timePerQuestion}s
                </Text>
                <TouchableOpacity
                  style={[styles.numberButton, { backgroundColor: theme.card }]}
                  onPress={() => updateSetting('timePerQuestion', Math.min(60, settings.timePerQuestion + 5))}
                >
                  <Ionicons name="add" size={16} color={theme.foreground} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
          
          {/* Create Button */}
          <View style={styles.footer}>
            <Button
              title={loading ? 'Creating...' : 'Create Room'}
              onPress={handleCreateRoom}
              disabled={loading || !settings.name || !settings.topicId}
              style={styles.createButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  section: {
    margin: spacing.lg,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.md,
  },
  input: {
    height: 48,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: fontFamily.text,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  switchInfo: {
    flex: 1,
  },
  optionsGrid: {
    gap: spacing.sm,
  },
  modeOption: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modeOptionSelected: {
    borderWidth: 2,
  },
  modeIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  modeName: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  modeDescription: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },
  fieldLabel: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.sm,
  },
  categoryScroll: {
    marginBottom: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.xs,
    marginRight: spacing.sm,
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
    fontFamily: fontFamily.text,
  },
  topicsList: {
    gap: spacing.sm,
  },
  topicItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  topicItemSelected: {
    borderWidth: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  numberPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  numberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberValue: {
    fontFamily: fontFamily.mono,
    minWidth: 40,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
  },
  createButton: {
    marginBottom: spacing.xl,
  },
}); 