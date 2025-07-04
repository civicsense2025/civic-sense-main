import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { getQuestionTopics, getCategories } from '../../lib/database';
import { getCivicSkills } from '../../lib/content-service';
import type { DbQuestionTopic, DbCategory } from '../../lib/supabase';
import type { DbSkills } from '../../lib/database-constants';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { SkillsCard } from '../../components/ui/SkillsCard';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';

export default function CategoryDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [category, setCategory] = useState<DbCategory | null>(null);
  const [topics, setTopics] = useState<DbQuestionTopic[]>([]);
  const [skills, setSkills] = useState<DbSkills[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCategoryData();
    }
  }, [id]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      
      // Load category info, topics, and skills in parallel
      const [categoriesData, topicsData, skillsData] = await Promise.all([
        getCategories(),
        getQuestionTopics(id),
        getCivicSkills(id)
      ]);

      const categoryData = categoriesData.find(cat => cat.id === id);
      setCategory(categoryData || null);
      setTopics(topicsData);
      setSkills(skillsData);
    } catch (error) {
      console.error('Error loading category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicPress = (topicId: string) => {
    router.push(`/topic/${topicId}` as any);
  };

  const handleStartQuiz = (topicId: string) => {
    router.push(`/game-room/${topicId}` as any);
  };

  const renderTopicCard = (topic: DbQuestionTopic) => (
    <TouchableOpacity
      key={topic.id}
      style={styles.topicCard}
              onPress={() => handleTopicPress(topic.id)}
      activeOpacity={0.8}
    >
      <Card style={styles.topicCardInner} variant="outlined">
        <View style={styles.topicHeader}>
          <Text variant="title3" color="inherit" style={styles.topicTitle}>
            {topic.title}
          </Text>
                     {topic.difficulty_level && (
             <View style={[styles.difficultyBadge, getDifficultyBadgeStyle(String(topic.difficulty_level))]}>
               <Text variant="footnote" style={[styles.difficultyText, { color: 'white' }]}>
                 {String(topic.difficulty_level).toUpperCase()}
               </Text>
             </View>
           )}
        </View>
        
        {topic.description && (
          <Text variant="body" color="secondary" style={styles.topicDescription}>
            {topic.description}
          </Text>
        )}
        
        <View style={styles.topicFooter}>
          <TouchableOpacity
            style={styles.quizButton}
            onPress={() => handleStartQuiz(topic.id)}
            activeOpacity={0.8}
          >
            <Text variant="callout" color="primary" style={styles.quizButtonText}>
              Start Quiz →
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const getDifficultyBadgeStyle = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return { backgroundColor: '#10B981' };
      case 'medium':
        return { backgroundColor: '#F59E0B' };
      case 'hard':
        return { backgroundColor: '#EF4444' };
      default:
        return { backgroundColor: '#6B7280' };
    }
  };

  const getSkillDifficultyColor = (level: number | null) => {
    if (!level) return { backgroundColor: theme.secondary };
    if (level <= 2) return { backgroundColor: '#10B981' }; // Easy - Green
    if (level <= 4) return { backgroundColor: '#F59E0B' }; // Medium - Orange
    return { backgroundColor: '#EF4444' }; // Hard - Red
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Loading category...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!category) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text variant="title2" color="inherit" style={styles.errorTitle}>
            Category Not Found
          </Text>
          <Text variant="body" color="secondary" style={styles.errorMessage}>
            The requested category could not be found.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/discover')}
            activeOpacity={0.8}
          >
            <Text variant="callout" color="primary">
              ← Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            onPress={() => router.replace('/(tabs)/discover')}
            activeOpacity={0.8}
          >
            <Text variant="callout" color="primary">
              ← Discover
            </Text>
          </TouchableOpacity>
          
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            <Text variant="title" color="inherit" style={styles.categoryTitle}>
              {category.name}
            </Text>
            <Text variant="body" color="secondary" style={styles.categoryDescription}>
              {category.description}
            </Text>
          </View>
        </View>

        {/* Topics List */}
        <View style={styles.topicsSection}>
          <View style={styles.sectionHeader}>
            <Text variant="title2" color="inherit" style={styles.sectionTitle}>
              Topics
            </Text>
            <Text variant="footnote" color="secondary">
              {topics.length} available
            </Text>
          </View>
          
          {topics.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="body" color="secondary">
                No topics available in this category yet.
              </Text>
            </View>
          ) : (
            <View style={styles.topicsList}>
              {topics.map(renderTopicCard)}
            </View>
          )}
        </View>

        {/* Skills Section */}
        {skills.length > 0 && (
          <View style={styles.skillsSection}>
            <View style={styles.sectionHeader}>
              <Text variant="title2" color="inherit" style={styles.sectionTitle}>
                Related Skills
              </Text>
              <Text variant="footnote" color="secondary">
                {skills.length} skills
              </Text>
            </View>
            
            <View style={styles.skillsList}>
              {skills.map((skill) => (
                <View key={skill.id} style={styles.skillCard}>
                  <SkillsCard
                    skill={skill}
                    onPress={() => router.push(`/skill/${skill.id}` as any)}
                    variant="full"
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Spacing for Tab Bar */}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  categoryTitle: {
    fontFamily: fontFamily.display,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  categoryDescription: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  topicsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontWeight: '400',
  },
  topicsList: {
    gap: spacing.md,
  },
  topicCard: {
    marginBottom: spacing.sm,
  },
  topicCardInner: {
    padding: spacing.lg,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  topicTitle: {
    fontFamily: fontFamily.display,
    fontWeight: '400',
    flex: 1,
    marginRight: spacing.md,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  difficultyText: {
    fontFamily: fontFamily.mono,
    fontWeight: '600',
    fontSize: 10,
  },
  topicDescription: {
    fontFamily: fontFamily.text,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  topicFooter: {
    alignItems: 'flex-end',
  },
  quizButton: {
    paddingVertical: spacing.xs,
  },
  quizButtonText: {
    fontFamily: fontFamily.mono,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  skillsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  skillsList: {
    gap: spacing.md,
  },
  skillCard: {
    marginBottom: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
}); 