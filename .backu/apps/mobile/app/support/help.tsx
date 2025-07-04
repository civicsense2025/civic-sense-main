import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { AppHeader } from '../../components/ui/AppHeader';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

// ============================================================================
// INTERFACES
// ============================================================================

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  faqs: FAQItem[];
}

// ============================================================================
// DATA
// ============================================================================

const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    description: 'Learn the basics of using CivicSense',
    faqs: [
      {
        id: 'gs1',
        question: 'What is CivicSense?',
        answer: 'CivicSense is an educational app designed to help you understand how democracy works, your civic rights, and how to engage effectively with government institutions. Through interactive quizzes and bite-sized lessons, we make civic education accessible and engaging.',
        category: 'getting-started',
      },
      {
        id: 'gs2',
        question: 'How do I start learning?',
        answer: 'Simply browse the available quiz topics on the home screen and tap any topic that interests you. Each quiz contains 5-10 questions and takes about 3-5 minutes to complete. We recommend starting with the "Democracy Basics" topic if you\'re new to civic education.',
        category: 'getting-started',
      },
      {
        id: 'gs3',
        question: 'Is CivicSense free to use?',
        answer: 'Yes! CivicSense is completely free to use. We believe civic education should be accessible to everyone. There are no hidden fees, subscriptions, or paywalls.',
        category: 'getting-started',
      },
      {
        id: 'gs4',
        question: 'Do I need to create an account?',
        answer: 'You can browse topics without an account, but creating a free account allows you to track your progress, earn achievements, maintain learning streaks, and sync your data across devices.',
        category: 'getting-started',
      },
    ],
  },
  {
    id: 'quizzes',
    title: 'Quizzes & Learning',
    icon: '📚',
    description: 'Understanding how quizzes work',
    faqs: [
      {
        id: 'q1',
        question: 'How are quiz questions selected?',
        answer: 'Our quiz questions are carefully curated by civic education experts and updated regularly to reflect current events and laws. Questions are selected randomly from our database to ensure variety and comprehensive coverage of each topic.',
        category: 'quizzes',
      },
      {
        id: 'q2',
        question: 'Can I retake quizzes?',
        answer: 'Absolutely! You can retake any quiz as many times as you want. Each time you retake a quiz, you may see different questions from our question pool. Your highest score is always saved.',
        category: 'quizzes',
      },
      {
        id: 'q3',
        question: 'What happens if I get a question wrong?',
        answer: 'Don\'t worry! When you answer incorrectly, we show you the correct answer along with a detailed explanation. This helps you learn from mistakes and understand the concept better.',
        category: 'quizzes',
      },
      {
        id: 'q4',
        question: 'How is my score calculated?',
        answer: 'Your score is based on the percentage of questions answered correctly. Speed doesn\'t affect your score, so take your time to think through each question carefully.',
        category: 'quizzes',
      },
    ],
  },
  {
    id: 'progress',
    title: 'Progress & Achievements',
    icon: '🏆',
    description: 'Tracking your learning journey',
    faqs: [
      {
        id: 'p1',
        question: 'How do learning streaks work?',
        answer: 'A learning streak counts consecutive days you\'ve completed at least one quiz. Streaks help build consistent learning habits. If you miss a day, your streak resets to zero, but don\'t worry - you can start building a new one immediately!',
        category: 'progress',
      },
      {
        id: 'p2',
        question: 'What are achievements?',
        answer: 'Achievements are badges you earn for reaching milestones like completing a certain number of quizzes, maintaining streaks, or mastering specific topics. They\'re displayed on your profile and help motivate continued learning.',
        category: 'progress',
      },
      {
        id: 'p3',
        question: 'Can I see my learning history?',
        answer: 'Yes! Go to your profile to view detailed statistics including total quizzes completed, average scores, topics mastered, and a timeline of your learning activity.',
        category: 'progress',
      },
      {
        id: 'p4',
        question: 'How do I improve my ranking?',
        answer: 'Your ranking is based on total points earned from completing quizzes. Higher scores and completing more quizzes will improve your ranking. Focus on understanding the material rather than rushing through quizzes.',
        category: 'progress',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Support',
    icon: '🔧',
    description: 'Troubleshooting common issues',
    faqs: [
      {
        id: 't1',
        question: 'The app is running slowly. What can I do?',
        answer: 'Try these steps: 1) Close and reopen the app, 2) Check your internet connection, 3) Clear the app cache in your device settings, 4) Make sure you have the latest version installed. If issues persist, please send us feedback.',
        category: 'technical',
      },
      {
        id: 't2',
        question: 'I can\'t sign in to my account',
        answer: 'First, ensure you\'re using the correct email address. If you\'ve forgotten your password, use the "Forgot Password" link on the sign-in screen. If you signed up with Google, make sure to use the "Sign in with Google" button.',
        category: 'technical',
      },
      {
        id: 't3',
        question: 'My progress isn\'t syncing',
        answer: 'Make sure you have a stable internet connection and are signed in to your account. Pull down to refresh on the home screen to force a sync. If the problem continues, try signing out and back in.',
        category: 'technical',
      },
      {
        id: 't4',
        question: 'Which devices are supported?',
        answer: 'CivicSense works on iOS 13+ and Android 6.0+. We recommend using the latest version of your operating system for the best experience. A tablet or phone with at least 2GB of RAM is recommended.',
        category: 'technical',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: '🔒',
    description: 'Your data and privacy',
    faqs: [
      {
        id: 'pr1',
        question: 'What data does CivicSense collect?',
        answer: 'We collect only essential data: your email (for account creation), learning progress, and quiz responses. We never sell your data to third parties. See our full privacy policy for details.',
        category: 'privacy',
      },
      {
        id: 'pr2',
        question: 'Is my learning data private?',
        answer: 'Yes! By default, your detailed learning data is private. You can choose to make your profile public in privacy settings, which would show only your achievements and overall stats, never individual quiz answers.',
        category: 'privacy',
      },
      {
        id: 'pr3',
        question: 'Can I delete my account?',
        answer: 'Yes, you can delete your account at any time from the Privacy Settings. This will permanently remove all your data from our servers. This action cannot be undone.',
        category: 'privacy',
      },
      {
        id: 'pr4',
        question: 'Do you use cookies or tracking?',
        answer: 'We use minimal analytics to improve the app experience. You can opt out of all analytics in Privacy Settings. We never use tracking for advertising purposes.',
        category: 'privacy',
      },
    ],
  },
];

// ============================================================================
// COMPONENTS
// ============================================================================

const ExpandableFAQItem: React.FC<{
  item: FAQItem;
  theme: any;
}> = ({ item, theme }) => {
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useSharedValue(0);
  const rotation = useSharedValue(0);

  const toggleExpanded = () => {
    setExpanded(!expanded);
    animatedHeight.value = withTiming(expanded ? 0 : 1, { duration: 300 });
    rotation.value = withTiming(expanded ? 0 : 180, { duration: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(animatedHeight.value, [0, 1], [0, 500]),
    opacity: animatedHeight.value,
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Card style={[styles.faqCard, { backgroundColor: theme.card }]} variant="outlined">
      <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.7}>
        <View style={styles.faqHeader}>
          <Text variant="callout" weight="500" style={styles.faqQuestion}>
            {item.question}
          </Text>
          <Animated.Text style={[styles.expandArrow, arrowStyle, { color: theme.foregroundSecondary }]}>
            ⌄
          </Animated.Text>
        </View>
      </TouchableOpacity>
      
      <Animated.View style={[styles.faqAnswerContainer, animatedStyle]}>
        <View style={styles.divider} />
        <Text variant="body" color="secondary" style={styles.faqAnswer}>
          {item.answer}
        </Text>
      </Animated.View>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HelpScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQs based on category and search
  const getFilteredFAQs = () => {
    let faqs: FAQItem[] = [];
    
    if (selectedCategory) {
      const category = helpCategories.find(c => c.id === selectedCategory);
      faqs = category?.faqs || [];
    } else {
      faqs = helpCategories.flatMap(c => c.faqs);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      faqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }

    return faqs;
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@civicsense.com?subject=Help Request');
  };

  const handleVisitWebsite = () => {
    Linking.openURL('https://civicsense.com/help');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader 
        title="Help & FAQ"
        subtitle="Find answers to common questions"
        showBack
        onBack={() => router.back()}
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: theme.foreground }]}
              placeholder="Search help articles..."
              placeholderTextColor={theme.foregroundTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Category Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
              !selectedCategory && { backgroundColor: theme.primary }
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryChipText,
              !selectedCategory && styles.categoryChipTextActive
            ]}>
              All Topics
            </Text>
          </TouchableOpacity>

          {helpCategories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
                selectedCategory === category.id && { backgroundColor: theme.primary }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryEmoji}>{category.icon}</Text>
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category.id && { color: '#FFFFFF' }
              ]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ Items */}
        <View style={styles.faqSection}>
          {selectedCategory && (
            <View style={styles.categoryHeader}>
              <Text variant="title2" weight="600" style={styles.categoryTitle}>
                {helpCategories.find(c => c.id === selectedCategory)?.title}
              </Text>
              <Text variant="body" color="secondary" style={styles.categoryDescription}>
                {helpCategories.find(c => c.id === selectedCategory)?.description}
              </Text>
            </View>
          )}

          {getFilteredFAQs().length > 0 ? (
            getFilteredFAQs().map(faq => (
              <ExpandableFAQItem key={faq.id} item={faq} theme={theme} />
            ))
          ) : (
            <Card style={[styles.emptyCard, { backgroundColor: theme.card }]} variant="outlined">
              <Text variant="body" color="secondary" style={styles.emptyText}>
                No results found for "{searchQuery}"
              </Text>
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text variant="callout" color="primary" style={styles.clearSearch}>
                  Clear search
                </Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>

        {/* Contact Section */}
        <Card style={[styles.contactCard, { backgroundColor: theme.card }]} variant="elevated">
          <Text variant="title3" weight="600" style={styles.contactTitle}>
            Still need help?
          </Text>
          <Text variant="body" color="secondary" style={styles.contactDescription}>
            Can't find what you're looking for? Our support team is here to help.
          </Text>
          
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.primary }]}
              onPress={handleContactSupport}
            >
              <Text style={styles.contactButtonText}>📧 Email Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.contactButton, { 
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: theme.border
              }]}
              onPress={handleVisitWebsite}
            >
              <Text style={[styles.contactButtonText, { color: theme.foreground }]}>
                🌐 Visit Help Center
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

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

  // Search
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.text,
    fontSize: 16,
  },

  // Categories
  categoryScroll: {
    marginBottom: spacing.md,
  },
  categoryScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: '#F3F4F6',
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  categoryChipText: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },

  // FAQ Section
  faqSection: {
    paddingHorizontal: spacing.lg,
  },
  categoryHeader: {
    marginBottom: spacing.md,
  },
  categoryTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
  },
  categoryDescription: {
    fontFamily: fontFamily.text,
  },

  // FAQ Cards
  faqCard: {
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: fontFamily.text,
    marginRight: spacing.sm,
  },
  expandArrow: {
    fontSize: 18,
    fontWeight: '300',
  },
  faqAnswerContainer: {
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: spacing.md,
  },
  faqAnswer: {
    fontFamily: fontFamily.text,
    padding: spacing.md,
    lineHeight: 20,
  },

  // Empty State
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.md,
  },
  clearSearch: {
    fontFamily: fontFamily.text,
  },

  // Contact Section
  contactCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  contactTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
  },
  contactDescription: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  contactButtons: {
    width: '100%',
    gap: spacing.sm,
  },
  contactButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  contactButtonText: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  bottomSpacer: {
    height: spacing.xl * 2,
  },
}); 