import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../lib/theme-context';
import { useAuth } from '../../../lib/auth-context';
import { Text } from '../../../components/atoms/Text';
import { spacing, borderRadius, fontFamily, typography } from '../../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { ApiConfig, buildApiUrl } from '../../../config/api-config';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MultipleChoice, TrueFalse, TextInput, Ranking,
  Timeline, ImageHotspots, DragDrop, MapInteraction,
  IntroCard, SwipeCards, InfoCards, ProgressCards,
  Reflection, ActionChecklist, ContactForm,
  QuickPoll, SurveyEmbed, OpinionSlider,
  Simulation, RolePlay, DecisionTree,
  Concept, Example, Summary, CaseStudy, Comparison, Research, Debate
} from '../../../components/collections/interactive';
import { QuestionResponseService, type QuestionResponseData } from '../../../lib/services/question-response-service';
import { LoadingSpinner } from '../../../components/molecules/LoadingSpinner';
import { CrossPlatformPagerView, type PagerViewRef } from '../../../components/ui/CrossPlatformPagerView';

interface LessonStep {
  id: string;
  collection_item_id: string;
  step_number: number;
  step_type: string;
  title: string;
  content: string;
  estimated_seconds?: number;
  estimated_duration_minutes?: number;
  auto_advance_seconds?: number;
  requires_interaction: boolean;
  can_skip: boolean;
  interaction_config?: any; // JSONB field for interactive components
  skip_conditions?: any;
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  alt_text?: string;
  transcript?: string;
  key_concepts?: string[];
  learning_objectives?: string[];
  sources?: any[];
  next_step_id?: string;
  media_url?: string;
  media_type?: string;
  completion_criteria?: any;
  prerequisites?: string[];
  translations?: any;
  created_at?: string;
  updated_at?: string;
}

interface Collection {
  id: string;
  title: string;
  description: string;
  emoji: string;
  slug: string;
  difficulty_level: number;
  estimated_minutes: number;
  learning_objectives: string[];
  lesson_steps?: LessonStep[];
  progress?: any;
}

// Enhanced Step Type Configuration
const getStepTypeConfig = (type: string) => {
  const configs: Record<string, {
    label: string;
    icon: string;
    gradient: [string, string];
    bgColor: string;
    textColor: string;
    emoji: string;
    description: string;
  }> = {
    'intro': {
      label: 'Introduction',
      icon: 'hand-right-outline',
      gradient: ['#3B82F6', '#1E40AF'],
      bgColor: '#EFF6FF',
      textColor: '#1E40AF',
      emoji: '👋',
      description: 'Welcome to this topic'
    },
    'learn': {
      label: 'Concept',
      icon: 'bulb-outline',
      gradient: ['#10B981', '#059669'],
      bgColor: '#ECFDF5',
      textColor: '#059669',
      emoji: '💡',
      description: 'Core concepts'
    },
    'concept': {
      label: 'Learn',
      icon: 'library-outline',
      gradient: ['#10B981', '#059669'],
      bgColor: '#ECFDF5',
      textColor: '#059669',
      emoji: '📚',
      description: 'Key information'
    },
    'practice': {
      label: 'Practice',
      icon: 'fitness-outline',
      gradient: ['#8B5CF6', '#7C3AED'],
      bgColor: '#F3E8FF',
      textColor: '#7C3AED',
      emoji: '🎯',
      description: 'Apply knowledge'
    },
    'interaction': {
      label: 'Interactive',
      icon: 'play-circle-outline',
      gradient: ['#8B5CF6', '#7C3AED'],
      bgColor: '#F3E8FF',
      textColor: '#7C3AED',
      emoji: '🎮',
      description: 'Hands-on experience'
    },
    'example': {
      label: 'Example',
      icon: 'document-text-outline',
      gradient: ['#F59E0B', '#D97706'],
      bgColor: '#FFFBEB',
      textColor: '#D97706',
      emoji: '📋',
      description: 'Real-world cases'
    },
    'quiz': {
      label: 'Quiz',
      icon: 'help-circle-outline',
      gradient: ['#EF4444', '#DC2626'],
      bgColor: '#FEF2F2',
      textColor: '#DC2626',
      emoji: '❓',
      description: 'Test your knowledge'
    },
    'assessment': {
      label: 'Assessment',
      icon: 'checkmark-circle-outline',
      gradient: ['#EF4444', '#DC2626'],
      bgColor: '#FEF2F2',
      textColor: '#DC2626',
      emoji: '✅',
      description: 'Measure understanding'
    },
    'reflection': {
      label: 'Reflection',
      icon: 'chatbubble-outline',
      gradient: ['#6366F1', '#4F46E5'],
      bgColor: '#EEF2FF',
      textColor: '#4F46E5',
      emoji: '💭',
      description: 'Think deeper'
    },
    'summary': {
      label: 'Summary',
      icon: 'list-outline',
      gradient: ['#6B7280', '#4B5563'],
      bgColor: '#F9FAFB',
      textColor: '#4B5563',
      emoji: '📝',
      description: 'Key takeaways'
    }
  };
  
  return configs[type] || {
    label: 'Step',
    icon: 'ellipse-outline',
    gradient: ['#6B7280', '#4B5563'] as [string, string],
    bgColor: '#F9FAFB',
    textColor: '#4B5563',
    emoji: '⭕',
    description: 'Learning content'
  };
};

// Enhanced Step Badge Component
const StepBadge: React.FC<{ 
  type: string; 
  number: number;
  size?: 'small' | 'medium' | 'large';
}> = ({ type, number, size = 'medium' }) => {
  const { theme } = useTheme();
  const config = getStepTypeConfig(type);
  
  const sizeStyles = {
    small: { width: 32, height: 32, fontSize: 11 },
    medium: { width: 40, height: 40, fontSize: 13 },
    large: { width: 48, height: 48, fontSize: 15 }
  };

  return (
    <View style={[styles.stepBadgeContainer, sizeStyles[size]]}>
      <LinearGradient
        colors={config.gradient}
        style={styles.stepBadgeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.stepBadgeNumber, { 
          fontSize: sizeStyles[size].fontSize,
          fontFamily: fontFamily.monoBold 
        }]}>
          {number}
        </Text>
      </LinearGradient>
      <Text style={[styles.stepBadgeEmoji, { fontSize: sizeStyles[size].fontSize + 2 }]}>
        {config.emoji}
      </Text>
    </View>
  );
};

// Progress Ring Component (React Native compatible)
const ProgressRing: React.FC<{ progress: number; size?: number }> = ({ 
  progress, 
  size = 80 
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <View style={[
        styles.progressCircleBackground,
        { 
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: theme.border,
          borderWidth: 6
        }
      ]} />
      <View style={[
        styles.progressCircleForeground,
        { 
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: theme.primary,
          borderWidth: 6,
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          transform: [{ rotate: `${(progress / 100) * 360}deg` }]
        }
      ]} />
      <View style={styles.progressText}>
        <Text style={[styles.progressPercentage, { 
          color: theme.primary,
          fontFamily: fontFamily.monoBold 
        }]}>
          {Math.round(progress)}%
        </Text>
      </View>
    </View>
  );
};

// Interactive Content Renderer
const InteractiveContent: React.FC<{ 
  step: LessonStep; 
  theme: any;
}> = ({ step, theme }) => {
  // Parse interaction_config from the step data
  let interactionConfig = null;
  try {
    // Check for interaction_config directly on the step
    if (step?.interaction_config) {
      interactionConfig = typeof step.interaction_config === 'string' 
        ? JSON.parse(step.interaction_config) 
        : step.interaction_config;
    }
    // Fallback: check if it's nested in content
    else if (step?.content && typeof step.content === 'object' && (step.content as any).interaction_config) {
      interactionConfig = (step.content as any).interaction_config;
    }
  } catch (error) {
    console.warn('Failed to parse interaction config:', error);
  }

  const handleComplete = (success: boolean, data?: any) => {
    console.log('Interactive component completed:', { success, data, stepType: step.step_type });
    // Here you could track progress, save state, etc.
  };

  // Handle different step types with appropriate components
  switch (step.step_type) {
    case 'intro':
      if (interactionConfig?.type === 'intro_card') {
        return (
          <IntroCard 
            config={interactionConfig}
            title={step.title}
            content={typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'concept':
      if (interactionConfig?.type === 'concept') {
        return (
          <Concept
            config={interactionConfig}
            title={step.title}
            content={typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'example':
      if (interactionConfig?.type === 'example') {
        return (
          <Example
            config={interactionConfig}
            title={step.title}
            content={typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'summary':
      if (interactionConfig?.type === 'summary') {
        return (
          <Summary
            config={interactionConfig}
            title={step.title}
            content={typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'case_study':
      if (interactionConfig?.type === 'case_study') {
        return (
          <CaseStudy
            config={interactionConfig}
            title={step.title}
            content={typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'comparison':
      if (interactionConfig?.type === 'comparison') {
        return (
          <Comparison
            config={interactionConfig}
            title={step.title}
            content={typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'research':
      if (interactionConfig?.type === 'research') {
        return (
          <Research
            config={interactionConfig}
            title={step.title}
            content={typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'debate':
      if (interactionConfig?.type === 'debate') {
        return (
          <Debate
            config={interactionConfig}
            title={step.title}
            content={typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'timeline':
      if (interactionConfig?.type === 'timeline') {
        return (
          <Timeline
            config={interactionConfig}
            title={step.title}
            content={typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'simulation':
      if (interactionConfig?.type === 'simulation') {
        return (
          <Simulation
            config={interactionConfig}
            title={step.title}
            content={typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'reflection':
      if (interactionConfig?.type === 'reflection') {
        return (
          <Reflection
            config={interactionConfig}
            title={step.title}
            content={typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'action_item':
      if (interactionConfig?.type === 'action_checklist') {
        return (
          <ActionChecklist
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'knowledge_check':
      // Handle different question types
      if (interactionConfig?.type === 'multiple_choice') {
        return (
          <MultipleChoice
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'true_false') {
        return (
          <TrueFalse
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'text_input') {
        return (
          <TextInput
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'ranking') {
        return (
          <Ranking
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      }
      break;

    case 'interaction':
      // Handle various interaction types
      if (interactionConfig?.type === 'quick_poll') {
        return (
          <QuickPoll
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'survey_embed') {
        return (
          <SurveyEmbed
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'opinion_slider') {
        return (
          <OpinionSlider
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'drag_drop') {
        return (
          <DragDrop
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'image_hotspots') {
        return (
          <ImageHotspots
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'swipe_cards') {
        return (
          <SwipeCards
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'info_cards') {
        return (
          <InfoCards
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'progress_cards') {
        return (
          <ProgressCards
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'contact_form') {
        return (
          <ContactForm
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'role_play') {
        return (
          <RolePlay
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'decision_tree') {
        return (
          <DecisionTree
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      } else if (interactionConfig?.type === 'map_interaction') {
        return (
          <MapInteraction
            config={interactionConfig}
            title={step.title}
            content={step.content}
            onComplete={handleComplete}
          />
        );
      }
      break;

    default:
      // Default fallback for steps without interaction_config or unsupported types
      break;
  }

  // Fallback: Show clean content without blocky card
  return (
    <View style={styles.cleanContent}>
      <Text style={[styles.cleanContentText, { 
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: fontFamily.mono
      }]}>
        {typeof step.content === 'string' ? step.content : 'Content not available'}
      </Text>
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Transform collection data to flatten lesson steps for the learning experience
const transformCollectionForLearning = (collection: any): Collection => {
  // Extract and flatten all lesson steps from collection items
  const allLessonSteps: LessonStep[] = [];
  
  if (collection.collection_items && Array.isArray(collection.collection_items)) {
    collection.collection_items.forEach((item: any, itemIndex: number) => {
      if (item.lesson_steps && Array.isArray(item.lesson_steps)) {
        // Add lesson steps with updated step numbers for global ordering
        item.lesson_steps.forEach((step: LessonStep, stepIndex: number) => {
          allLessonSteps.push({
            ...step,
            step_number: allLessonSteps.length + 1, // Renumber for global sequence
            collection_item_id: item.id,
            // Add context about which collection item this step belongs to
            title: step.title || `${item.title} - Step ${stepIndex + 1}`,
          });
        });
      }
    });
  }

  // Sort by step number to ensure proper ordering
  allLessonSteps.sort((a, b) => a.step_number - b.step_number);

  console.log(`📚 Transformed collection: ${allLessonSteps.length} total lesson steps from ${collection.collection_items?.length || 0} items`);

  return {
    ...collection,
    lesson_steps: allLessonSteps,
    total_steps: allLessonSteps.length,
  };
};

export default function CollectionLearnScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  const pagerRef = useRef<PagerViewRef>(null);

  useEffect(() => {
    console.log('📖 LearnScreen mounted with slug:', slug);
    if (slug) {
      loadCollectionSteps();
    }
  }, [slug]);

  const loadCollectionSteps = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading collection steps for:', slug);
      
      // Try to fetch from API first
      const url = buildApiUrl(`/api/collections/${slug}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log('⚠️ API failed, falling back to mock data');
        const mockData = getMockCollectionData();
        if (mockData) {
          setCollection(mockData);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Collection steps loaded:', data);
      
      if (data) {
        // Transform the collection data to flatten lesson steps for the learning experience
        const transformedCollection = transformCollectionForLearning(data);
        
        // Check if we have any lesson steps after transformation
        if (!transformedCollection.lesson_steps || transformedCollection.lesson_steps.length === 0) {
          console.warn('⚠️ No lesson steps found in collection items, using mock data');
          const mockData = getMockCollectionData();
          if (mockData) {
            setCollection(mockData);
          } else {
            setError('No lesson content available for this collection');
          }
        } else {
          setCollection(transformedCollection);
        }
      } else {
        console.log('⚠️ No data returned, falling back to mock data');
        const mockData = getMockCollectionData();
        if (mockData) {
          setCollection(mockData);
        } else {
          setError('Collection not found');
        }
      }
    } catch (error) {
      console.error('❌ Error loading collection steps:', error);
      
      // Fallback to mock data on any error
      const mockData = getMockCollectionData();
      if (mockData) {
        console.log('🔄 Using mock data as fallback');
        setCollection(mockData);
      } else {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const getMockCollectionData = (): Collection | null => {
    if (!slug) return null;
    
    // Enhanced mock data with comprehensive lesson steps based on SQL schema
    return {
      id: '15034388-ed85-4757-ba40-35d4f80edbc7',
      title: 'AI-Powered Political Targeting',
      description: 'Learn how political campaigns use AI and big data to micro-target voters with unprecedented precision.',
      emoji: '🎯',
      slug: slug,
      difficulty_level: 3,
      estimated_minutes: 45,
      learning_objectives: [
        'Understand how AI analyzes voter data for political targeting',
        'Learn about the $16 billion digital political advertising industry',
        'Discover how to investigate your own targeting profile',
        'Explore regulatory responses and self-defense strategies'
      ],
      lesson_steps: [
        {
          id: 'f67d75b0-ec3f-4818-bf3d-f4dbbf8ecfee',
          collection_item_id: '15034388-ed85-4757-ba40-35d4f80edbc7',
          step_number: 1,
          step_type: 'intro',
          title: '$16 Billion in Precision Politics: AI Knows How You Vote',
          content: 'Political campaigns collect 5,000+ data points about you—from shopping habits to Netflix preferences—to predict your vote with 89% accuracy. In 2024, campaigns spent $16 billion on digital advertising powered by AI micro-targeting that makes traditional polling look primitive.',
          estimated_seconds: 40,
          requires_interaction: false,
          can_skip: true,
          interaction_config: {
            type: "intro_card",
            emoji: "🎯",
            accuracy: "89% accuracy in vote prediction",
            subtitle: "AI-Powered Political Targeting",
            source_note: "FEC filings, political consulting firm data",
            shocking_fact: "$16 billion spent on digital political advertising",
            data_collection: "5,000+ data points collected per voter",
            background_color: "#7C3AED"
          },
          key_concepts: ["micro-targeting", "data-collection", "political-advertising", "voter-prediction"],
          learning_objectives: [
            'Understand the scale of political data collection',
            'Learn how AI predicts voting behavior',
            'Discover the financial impact of micro-targeting'
          ]
        },
        {
          id: 'a12345b0-ec3f-4818-bf3d-f4dbbf8ecf01',
          collection_item_id: '15034388-ed85-4757-ba40-35d4f80edbc7',
          step_number: 2,
          step_type: 'interactive',
          title: 'How Your Data Creates a Voter Profile',
          content: 'Every app download, website visit, and purchase feeds into sophisticated algorithms that political strategists use to segment voters into micro-categories. Let\'s explore how this data profiling actually works.',
          estimated_seconds: 180,
          requires_interaction: true,
          can_skip: false,
          interaction_config: {
            type: "data_profiling_simulator",
            user_inputs: [
              { type: "multiple_choice", question: "What type of content do you share most on social media?", options: ["Political news", "Personal updates", "Memes/humor", "Professional content"] },
              { type: "multiple_choice", question: "Which news sources do you trust most?", options: ["Traditional media", "Social media", "Independent journalists", "Government sources"] }
            ],
            result_categories: ["Liberal Activist", "Conservative Traditional", "Swing Moderate", "Politically Disengaged"],
            accuracy_simulation: true
          },
          key_concepts: ["data-profiling", "algorithmic-targeting", "voter-segmentation"],
          learning_objectives: [
            'Experience how your data creates voter profiles',
            'Understand algorithmic categorization',
            'See how micro-targeting actually works'
          ]
        },
        {
          id: 'b23456c0-ec3f-4818-bf3d-f4dbbf8ecf02',
          collection_item_id: '15034388-ed85-4757-ba40-35d4f80edbc7',
          step_number: 3,
          step_type: 'investigation',
          title: 'Investigate Your Own Targeting Profile',
          content: 'Time to turn the tables. Use these transparency tools to see exactly how political campaigns are targeting you personally.',
          estimated_seconds: 300,
          requires_interaction: true,
          can_skip: false,
          interaction_config: {
            type: "investigation_checklist",
            tools: [
              { name: "Facebook Ad Library", url: "https://www.facebook.com/ads/library/", description: "See political ads targeted at your location" },
              { name: "Google My Ad Center", url: "https://myadcenter.google.com/", description: "View your advertising profile" },
              { name: "Twitter Ad Transparency", url: "https://ads.twitter.com/transparency", description: "Political ad spending data" }
            ],
            checklist_items: [
              "Check your Facebook political ad preferences",
              "Review your Google advertising profile",
              "Look up political ads in your area",
              "Document surprising targeting categories"
            ],
            reflection_prompts: [
              "What surprised you most about your profile?",
              "How accurate do you think the targeting is?",
              "What data points concern you most?"
            ]
          },
          key_concepts: ["transparency-tools", "self-investigation", "ad-targeting"],
          learning_objectives: [
            'Use real transparency tools',
            'Analyze your own targeting profile',
            'Understand the accuracy of political profiling'
          ]
        },
        {
          id: 'c34567d0-ec3f-4818-bf3d-f4dbbf8ecf03',
          collection_item_id: '15034388-ed85-4757-ba40-35d4f80edbc7',
          step_number: 4,
          step_type: 'action',
          title: 'Defend Against Manipulation',
          content: 'Now that you understand how political targeting works, here are concrete steps to protect yourself and push for systemic change.',
          estimated_seconds: 240,
          requires_interaction: true,
          can_skip: false,
          interaction_config: {
            type: "action_planner",
            action_categories: [
              {
                title: "Personal Defense",
                actions: [
                  "Adjust your ad targeting settings",
                  "Diversify your news sources",
                  "Use privacy-focused browsers",
                  "Review app permissions regularly"
                ]
              },
              {
                title: "Systemic Change",
                actions: [
                  "Support algorithmic transparency legislation",
                  "Contact representatives about political ad regulations",
                  "Share transparency tools with friends",
                  "Advocate for digital privacy rights"
                ]
              }
            ],
            commitment_tracker: true,
            follow_up_reminders: true
          },
          key_concepts: ["digital-self-defense", "policy-advocacy", "transparency-activism"],
          learning_objectives: [
            'Implement personal privacy protections',
            'Understand policy solutions',
            'Take action for systemic change'
          ]
        }
      ]
    };
  };

  const handleNext = () => {
    if (!collection?.lesson_steps) return;
    
    // Mark current step as completed
    setCompletedSteps(prev => new Set([...Array.from(prev), currentStepIndex]));
    
    if (currentStepIndex < collection.lesson_steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      console.log(`🎯 Navigating from step ${currentStepIndex} to step ${nextIndex}`);
      
      // Move to the next page - let the onPageSelected callback handle state update
      if (pagerRef.current) {
        pagerRef.current.setPageWithoutAnimation(nextIndex);
      }
    } else {
      // Collection complete
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      pagerRef.current?.setPageWithoutAnimation(prevIndex);
    }
  };

  const handleComplete = () => {
    // Navigate back with completion
    router.push(`/collections/${slug}?completed=true`);
  };

  const renderStep = (step: LessonStep, index: number) => {
    const isCompleted = completedSteps.has(index);
    const isCurrent = index === currentStepIndex;
    
    const stepConfig = getStepTypeConfig(step.step_type);

    return (
      <View key={step.id} style={styles.stepContainer}>
        <View style={styles.stepContent}>
          {/* Step Header */}
          <View style={styles.stepHeader}>
            <View style={styles.stepIndicator}>
              <View style={[
                styles.stepNumber,
                isCurrent && styles.stepNumberActive,
                isCompleted && styles.stepNumberCompleted
              ]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={[
                    styles.stepNumberText,
                    ...(isCurrent ? [styles.stepNumberTextActive] : [])
                  ]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text style={styles.stepLabel}>
                Step {index + 1} of {collection?.lesson_steps?.length || 0}
              </Text>
            </View>
          </View>

          {/* Step Content */}
          <View style={styles.contentCard}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.content}</Text>
            
            {/* Interactive Content based on interaction_config */}
            <InteractiveContent step={step} theme={theme} />

            {/* Learning Objectives */}
            {step.learning_objectives && step.learning_objectives.length > 0 && (
              <View style={styles.objectivesSection}>
                <Text style={[styles.objectivesTitle, { 
                  color: theme.foreground,
                  fontFamily: fontFamily.display
                }]}>
                  What You'll Learn
                </Text>
                <View style={styles.objectivesList}>
                  {step.learning_objectives.map((objective, index) => (
                    <View key={index} style={styles.objectiveItem}>
                      <View style={[styles.objectiveBullet, { backgroundColor: stepConfig.gradient[0] }]} />
                      <Text style={[styles.objectiveText, { 
                        color: theme.foregroundSecondary,
                        fontFamily: fontFamily.text
                      }]}>
                        {objective}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.stepActions}>
              {index > 0 && (
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.border }]}
                  onPress={() => handlePrevious()}
                >
                  <Ionicons name="chevron-back" size={20} color={theme.primary} />
                  <Text style={[styles.secondaryButtonText, { 
                    color: theme.primary,
                    fontFamily: fontFamily.monoBold
                  }]}>
                    Previous
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: stepConfig.gradient[0] }]}
                onPress={() => handleNext()}
              >
                <LinearGradient
                  colors={stepConfig.gradient}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={[styles.primaryButtonText, { fontFamily: fontFamily.monoBold }]}>
                    {isCompleted ? 'Completed' : 'Mark Complete'}
                  </Text>
                  <Ionicons 
                    name={isCompleted ? 'checkmark' : 'chevron-forward'} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!collection) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.foreground }]}>
            Collection not found
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progress = ((currentStepIndex + 1) / (collection.lesson_steps?.length || 1)) * 100;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={['#2563EB', '#1D4ED8', '#1E40AF']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Clean Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.collectionTitle} numberOfLines={1}>
                {collection.title}
              </Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {/* Handle menu */}}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Main Content - Swipeable Steps */}
          <CrossPlatformPagerView
            ref={pagerRef}
            style={styles.pagerView}
            initialPage={0}
            onPageSelected={(e) => {
              const newPosition = e.nativeEvent.position;
              console.log(`📄 PagerView moved to position: ${newPosition}`);
              setCurrentStepIndex(newPosition);
            }}
            orientation="horizontal"
            offscreenPageLimit={1}
          >
            {collection.lesson_steps && collection.lesson_steps.length > 0 
              ? collection.lesson_steps.map((step, index) => renderStep(step, index))
              : [
                  <View key="empty-state" style={styles.stepContainer}>
                    <View style={styles.contentCard}>
                      <Text style={[styles.contentPlaceholder, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                        No lesson content available
                      </Text>
                      <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)', marginTop: spacing.lg }]}
                        onPress={() => router.back()}
                      >
                        <Text style={[styles.backButtonText, { color: '#FFFFFF' }]}>Go Back</Text>
                      </TouchableOpacity>
                    </View>
                  </View>,
                  <View key="placeholder" style={styles.stepContainer}>
                    <View style={styles.contentCard}>
                      <Text style={[styles.contentPlaceholder, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                        Loading...
                      </Text>
                    </View>
                  </View>
                ]
            }
          </CrossPlatformPagerView>

          {/* Bottom Navigation */}
          <View style={styles.bottomSection}>
            <View style={styles.navigationRow}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  currentStepIndex === 0 && styles.navButtonDisabled
                ]}
                onPress={handlePrevious}
                disabled={currentStepIndex === 0}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={20} 
                  color={currentStepIndex === 0 ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} 
                />
                <Text style={[
                  styles.navButtonText,
                  ...(currentStepIndex === 0 ? [styles.navButtonTextDisabled] : [])
                ]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>
                  {currentStepIndex === (collection.lesson_steps?.length || 0) - 1 
                    ? 'Complete' 
                    : 'Continue'
                  }
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    color: '#FFFFFF',
    ...typography.body,
    fontFamily: fontFamily.mono,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    ...typography.title2,
    fontFamily: fontFamily.mono,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    color: '#FFFFFF',
    ...typography.callout,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerButton: {
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  collectionTitle: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 200,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: fontFamily.mono,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },

  // Content
  pagerView: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    marginBottom: spacing.xl,
  },
  stepIndicator: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepNumberActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#FFFFFF',
  },
  stepNumberCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepNumberText: {
    ...typography.callout,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },
  stepNumberTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    ...typography.footnote,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: fontFamily.mono,
  },

  // Content Card
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flex: 1,
  },
  stepTitle: {
    ...typography.title2,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: spacing.md,
    fontFamily: fontFamily.mono,
  },
  stepDescription: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    marginBottom: spacing.xl,
    fontFamily: fontFamily.mono,
  },
  interactiveContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  contentPlaceholder: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: fontFamily.mono,
  },

  // Bottom Navigation
  bottomSection: {
    padding: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: fontFamily.mono,
  },
  navButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    backgroundColor: '#2E4057',
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },

  // Missing styles for StepBadge and ProgressRing components
  stepBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeGradient: {
    borderRadius: borderRadius.full,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeNumber: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },
  stepBadgeEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleBackground: {
    position: 'absolute',
  },
  progressCircleForeground: {
    position: 'absolute',
  },
  progressPercentage: {
    ...typography.footnote,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    textAlign: 'center',
  },

  // Clean content styles (no blocky card)
  cleanContent: {
    paddingVertical: spacing.lg,
  },
  cleanContentText: {
    ...typography.body,
    lineHeight: 24,
    fontFamily: fontFamily.mono,
    textAlign: 'left',
  },

  // Objectives styles
  objectivesSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  objectivesTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  objectivesList: {
    gap: spacing.sm,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  objectiveBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  objectiveText: {
    ...typography.body,
    flex: 1,
    lineHeight: 22,
  },

  // Step actions
  stepActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: spacing.md,
  },
  primaryButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  primaryButtonText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.callout,
    fontWeight: '500',
  },
}); 