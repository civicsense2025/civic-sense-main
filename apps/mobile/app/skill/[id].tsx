import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { getSkillDetailData, getSkillRelatedQuestions } from '../../lib/database';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { spacing, fontFamily, borderRadius } from '../../lib/theme';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SkillDetailData {
  skill: any;
  learningObjectives: any[];
  practiceRecommendations: any[];
  prerequisites: any[];
  progressionPathways: any[];
  userProgress: any | null;
  userMastery: any | null;
  userPreferences: any | null;
}

interface SkillQuestion {
  question_id: string;
  weight: number;
  is_primary_skill: boolean;
  questions: any & {
    question_topics?: any;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SkillDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [skillData, setSkillData] = useState<SkillDetailData | null>(null);
  const [relatedQuestions, setRelatedQuestions] = useState<SkillQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (id) {
      loadSkillData();
    }
  }, [id, user]);

  const loadSkillData = async () => {
    try {
      setLoading(true);
      
      // Load comprehensive skill data
      const data = await getSkillDetailData(id!, user?.id);
      
      if (data) {
        setSkillData(data);
        
        // Load related questions
        const questions = await getSkillRelatedQuestions(id!, 5);
        setRelatedQuestions(questions);
      } else {
        setSkillData(null);
      }
    } catch (error) {
      console.error('Error loading skill data:', error);
      Alert.alert('Error', 'Failed to load skill information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getDifficultyLabel = (level: number | null) => {
    if (!level) return 'Not specified';
    if (level <= 2) return 'Beginner';
    if (level <= 4) return 'Intermediate';
    return 'Advanced';
  };

  const getDifficultyColor = (level: number | null) => {
    if (!level) return theme.muted;
    if (level <= 2) return '#10B981'; // Green
    if (level <= 4) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const getMasteryLevelColor = (level: string | null) => {
    switch (level) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      case 'expert': return '#8B5CF6';
      default: return theme.muted;
    }
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const getAccuracyPercentage = () => {
    if (!skillData || !skillData.userProgress) return 0;
    const userProgress = skillData.userProgress;
    if (!userProgress.questions_attempted || userProgress.questions_attempted === 0) return 0;
    return Math.round((userProgress.questions_correct || 0) / userProgress.questions_attempted * 100);
  };

  const handleStartPractice = () => {
    if (relatedQuestions.length > 0 && relatedQuestions[0]?.questions?.topic_id) {
      // Navigate to practice with skill-specific questions
      const topicId = relatedQuestions[0].questions.topic_id;
              router.push(`/quiz-session/${topicId}?skill=${id}` as any);
    } else {
      Alert.alert('No Practice Available', 'No practice questions found for this skill yet.');
    }
  };

  const handleViewLearningPath = () => {
    // Navigate to learning path or show more details
    Alert.alert('Learning Path', 'Learning path feature coming soon!');
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderUserProgressCard = () => {
    const { userProgress, userMastery } = skillData!;
    
    if (!userProgress && !userMastery) {
      return (
        <Card style={styles.progressCard} variant="outlined">
          <View style={styles.progressHeader}>
            <Text variant="title3" color="inherit">🚀 Start Your Journey</Text>
          </View>
          <Text variant="body" color="secondary" style={styles.progressDescription}>
            You haven't started practicing this skill yet. Begin building your civic knowledge!
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleStartPractice}
            activeOpacity={0.8}
          >
            <Text variant="callout" style={{ color: theme.foreground, fontWeight: '600' }}>
              Start Practicing
            </Text>
          </TouchableOpacity>
        </Card>
      );
    }

    const accuracy = getAccuracyPercentage();
    const progressPercentage = userMastery?.progress_percentage || 0;
    const masteryLevel = userProgress?.mastery_level || 'beginner';
    
    return (
      <Card style={styles.progressCard} variant="outlined">
        <View style={styles.progressHeader}>
          <Text variant="title3" color="inherit">📊 Your Progress</Text>
          {userProgress?.last_practiced_at && (
            <Text variant="caption" color="secondary">
              Last practiced {formatTimeAgo(userProgress.last_practiced_at)}
            </Text>
          )}
        </View>

        {/* Mastery Level */}
        <View style={styles.masterySection}>
          <View style={styles.masteryBadge}>
            <View 
              style={[
                styles.masteryIndicator, 
                { backgroundColor: getMasteryLevelColor(masteryLevel) }
              ]} 
            />
            <Text variant="callout" color="inherit" style={styles.masteryText}>
              {masteryLevel?.charAt(0).toUpperCase() + masteryLevel?.slice(1)} Level
            </Text>
          </View>
          {progressPercentage > 0 && (
            <Text variant="footnote" color="secondary">
              {progressPercentage}% mastered
            </Text>
          )}
        </View>

        {/* Progress Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text variant="title2" color="inherit">{userProgress?.questions_attempted || 0}</Text>
            <Text variant="caption" color="secondary">Questions</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="title2" color="inherit">{accuracy}%</Text>
            <Text variant="caption" color="secondary">Accuracy</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="title2" color="inherit">{userProgress?.consecutive_correct || 0}</Text>
            <Text variant="caption" color="secondary">Streak</Text>
          </View>
          {userProgress?.confidence_level && (
            <View style={styles.statItem}>
              <Text variant="title2" color="inherit">{Math.round(userProgress.confidence_level * 100)}%</Text>
              <Text variant="caption" color="secondary">Confidence</Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        {progressPercentage > 0 && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: theme.primary 
                  }
                ]} 
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.secondary }]}
          onPress={handleStartPractice}
          activeOpacity={0.8}
        >
          <Text variant="callout" style={{ color: theme.foreground, fontWeight: '600' }}>
            Continue Practice
          </Text>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderLearningObjectives = () => {
    const { learningObjectives } = skillData!;
    
    if (!learningObjectives.length) return null;

    return (
      <View style={styles.section}>
        <Text variant="title2" color="inherit" style={styles.sectionTitle}>
          🎯 Learning Objectives
        </Text>
        <View style={styles.objectivesList}>
          {learningObjectives.map((objective, index) => (
            <Card key={objective.id} style={styles.objectiveCard} variant="outlined">
              <View style={styles.objectiveHeader}>
                <View style={styles.objectiveNumber}>
                  <Text variant="footnote" color="inherit" style={styles.objectiveNumberText}>
                    {index + 1}
                  </Text>
                </View>
                <Text variant="callout" color="inherit" style={styles.objectiveText}>
                  {objective.objective_text}
                </Text>
              </View>
              {objective.mastery_level_required && (
                <Text variant="caption" color="secondary" style={styles.objectiveLevel}>
                  Required level: {objective.mastery_level_required}
                </Text>
              )}
            </Card>
          ))}
        </View>
      </View>
    );
  };

  const renderPracticeRecommendations = () => {
    const { practiceRecommendations } = skillData!;
    
    if (!practiceRecommendations.length) return null;

    return (
      <View style={styles.section}>
        <Text variant="title2" color="inherit" style={styles.sectionTitle}>
          💪 Practice Recommendations
        </Text>
        <View style={styles.recommendationsList}>
          {practiceRecommendations.map((rec) => (
            <TouchableOpacity
              key={rec.id}
              onPress={handleStartPractice}
              activeOpacity={0.8}
            >
              <Card style={styles.recommendationCard} variant="outlined">
                <View style={styles.recommendationHeader}>
                  <Text variant="callout" color="inherit" style={styles.recommendationType}>
                    {rec.practice_type?.charAt(0).toUpperCase() + rec.practice_type?.slice(1)}
                  </Text>
                  <View style={styles.estimatedTime}>
                    <Text variant="caption" color="secondary">
                      ~{rec.estimated_minutes} min
                    </Text>
                  </View>
                </View>
                <Text variant="body" color="secondary" style={styles.recommendationDescription}>
                  {rec.practice_description}
                </Text>
                <View style={styles.difficultyTag}>
                  <View 
                    style={[
                      styles.difficultyIndicator,
                      { backgroundColor: getDifficultyColor(1) } // Default to beginner
                    ]}
                  />
                  <Text variant="caption" color="secondary">
                    {rec.difficulty_level?.charAt(0).toUpperCase() + rec.difficulty_level?.slice(1)}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderProgressionPathways = () => {
    const { progressionPathways } = skillData!;
    
    if (!progressionPathways.length) return null;

    return (
      <View style={styles.section}>
        <Text variant="title2" color="inherit" style={styles.sectionTitle}>
          🛤️ Learning Pathways
        </Text>
        <View style={styles.pathwaysList}>
          {progressionPathways.map((pathway) => (
            <TouchableOpacity
              key={pathway.id}
              onPress={handleViewLearningPath}
              activeOpacity={0.8}
            >
              <Card style={styles.pathwayCard} variant="outlined">
                <View style={styles.pathwayHeader}>
                  <Text variant="callout" color="inherit" style={styles.pathwayName}>
                    {pathway.pathway_name}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {pathway.estimated_hours}h
                  </Text>
                </View>
                <Text variant="body" color="secondary" style={styles.pathwayDescription}>
                  {pathway.pathway_description}
                </Text>
                <View style={styles.pathwayLevel}>
                  <View 
                    style={[
                      styles.difficultyIndicator,
                      { backgroundColor: getDifficultyColor(2) }
                    ]}
                  />
                  <Text variant="caption" color="secondary">
                    {pathway.difficulty_level?.charAt(0).toUpperCase() + pathway.difficulty_level?.slice(1)} Level
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderRelatedQuestions = () => {
    if (!relatedQuestions.length) return null;

    return (
      <View style={styles.section}>
        <Text variant="title2" color="inherit" style={styles.sectionTitle}>
          ❓ Practice Questions
        </Text>
        <Text variant="body" color="secondary" style={styles.sectionDescription}>
          Questions that help build this skill
        </Text>
        <View style={styles.questionsList}>
          {relatedQuestions.slice(0, 3).map((item, index) => (
            <Card key={item.question_id} style={styles.questionCard} variant="outlined">
              <View style={styles.questionHeader}>
                <Text variant="footnote" color="secondary">
                  Question {index + 1}
                  {item.is_primary_skill && ' • Primary Skill'}
                </Text>
                <Text variant="caption" color="secondary">
                  Weight: {item.weight}
                </Text>
              </View>
              <Text variant="callout" color="inherit" numberOfLines={2} style={styles.questionText}>
                {item.questions.question}
              </Text>
              {item.questions.question_topics && (
                <Text variant="caption" color="secondary" style={styles.questionTopic}>
                  From: {item.questions.question_topics.topic_title}
                </Text>
              )}
            </Card>
          ))}
        </View>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={handleStartPractice}
          activeOpacity={0.8}
        >
          <Text variant="callout" style={{ color: theme.foreground, fontWeight: '600' }}>
            Practice These Questions
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Loading skill details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!skillData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text variant="title2" color="inherit" style={styles.errorTitle}>
            Skill Not Found
          </Text>
          <Text variant="body" color="secondary" style={styles.errorMessage}>
            The requested skill could not be found.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
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

  const { skill } = skillData;

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

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
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text variant="callout" color="primary">
              ← Back
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skill Header */}
        <View style={styles.content}>
          <View style={styles.titleSection}>
            {skill.emoji && (
              <Text style={styles.emoji}>{skill.emoji}</Text>
            )}
            <Text variant="title" color="inherit" style={styles.title}>
              {skill.skill_name}
            </Text>
            <View style={styles.skillMeta}>
              <View style={styles.difficultyBadge}>
                <View
                  style={[
                    styles.difficultyIndicator,
                    { backgroundColor: getDifficultyColor(skill.difficulty_level) }
                  ]}
                />
                <Text variant="footnote" color="secondary">
                  {getDifficultyLabel(skill.difficulty_level)}
                </Text>
              </View>
              {skill.is_core_skill && (
                <View style={styles.coreSkillBadge}>
                  <Text variant="footnote" style={{ color: theme.primary, fontWeight: '600' }}>
                    ⭐ Core Skill
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {skill.description && (
            <Card style={styles.descriptionCard} variant="outlined">
              <Text variant="body" color="inherit" style={styles.description}>
                {skill.description}
              </Text>
            </Card>
          )}

          {/* User Progress */}
          {user && renderUserProgressCard()}

          {/* Learning Objectives */}
          {renderLearningObjectives()}

          {/* Practice Recommendations */}
          {renderPracticeRecommendations()}

          {/* Progression Pathways */}
          {renderProgressionPathways()}

          {/* Related Questions */}
          {renderRelatedQuestions()}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  content: {
    padding: spacing.lg,
  },
  titleSection: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  skillMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: borderRadius.md,
  },
  difficultyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  coreSkillBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  descriptionCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  description: {
    fontFamily: fontFamily.text,
    lineHeight: 24,
  },
  
  // Progress Card
  progressCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  progressHeader: {
    marginBottom: spacing.md,
  },
  progressDescription: {
    fontFamily: fontFamily.text,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  masterySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  masteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masteryIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  masteryText: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressBarContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  
  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.md,
  },
  
  // Learning Objectives
  objectivesList: {
    gap: spacing.sm,
  },
  objectiveCard: {
    padding: spacing.md,
  },
  objectiveHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  objectiveNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  objectiveNumberText: {
    fontWeight: '600',
    fontSize: 12,
  },
  objectiveText: {
    fontFamily: fontFamily.text,
    lineHeight: 20,
    flex: 1,
  },
  objectiveLevel: {
    marginTop: spacing.xs,
    marginLeft: 32,
  },
  
  // Practice Recommendations
  recommendationsList: {
    gap: spacing.sm,
  },
  recommendationCard: {
    padding: spacing.md,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recommendationType: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  estimatedTime: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: borderRadius.sm,
  },
  recommendationDescription: {
    fontFamily: fontFamily.text,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  difficultyTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Progression Pathways
  pathwaysList: {
    gap: spacing.sm,
  },
  pathwayCard: {
    padding: spacing.md,
  },
  pathwayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pathwayName: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    flex: 1,
  },
  pathwayDescription: {
    fontFamily: fontFamily.text,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  pathwayLevel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Related Questions
  questionsList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  questionCard: {
    padding: spacing.md,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  questionText: {
    fontFamily: fontFamily.text,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  questionTopic: {
    fontStyle: 'italic',
  },
  
  // Action Button
  actionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontFamily: fontFamily.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
}); 