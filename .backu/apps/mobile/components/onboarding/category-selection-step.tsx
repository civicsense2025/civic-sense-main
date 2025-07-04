import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { EnhancedOnboardingService } from '../../lib/services/onboarding-service'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface CategorySelectionStepProps {
  onNext: (data: any) => void
  onBack?: () => void
  data?: any
  userId: string
}

interface Category {
  id: string
  name: string
  emoji: string
  description?: string
  question_count?: number
}

// Fallback categories when database fails
const FALLBACK_CATEGORIES: Category[] = [
  {
    id: 'civil-rights',
    name: 'Civil Rights',
    emoji: '✊',
    description: 'Learn about equality and justice for all citizens',
    question_count: 25
  },
  {
    id: 'government',
    name: 'Government',
    emoji: '🏛️',
    description: 'Understand how government systems work',
    question_count: 30
  },
  {
    id: 'economics',
    name: 'Economics',
    emoji: '💰',
    description: 'Learn about economic policy and its impact',
    question_count: 20
  },
  {
    id: 'elections',
    name: 'Elections',
    emoji: '🗳️',
    description: 'Understanding the democratic voting process',
    question_count: 18
  },
  {
    id: 'law',
    name: 'Law & Justice',
    emoji: '⚖️',
    description: 'Learn about legal systems and justice',
    question_count: 22
  },
  {
    id: 'environment',
    name: 'Environment',
    emoji: '🌍',
    description: 'Environmental policy and civic responsibility',
    question_count: 15
  }
]

export function CategorySelectionStep({ onNext, onBack, data, userId }: CategorySelectionStepProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(data?.categories?.map((c: any) => c.id) || [])
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    loadCategoriesAndProgress()
  }, [userId])

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()
  }, [categories])

  const loadCategoriesAndProgress = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Try to fetch categories from database
      let categoriesData: Category[] = []
      try {
        categoriesData = await EnhancedOnboardingService.getOnboardingCategories()
        console.log('Loaded categories from database:', categoriesData)
      } catch (err) {
        console.warn('Failed to fetch categories from database, using fallback data')
        categoriesData = FALLBACK_CATEGORIES
        setError('Using offline content. Some features may be limited.')
      }
      
      setCategories(categoriesData)
      
      // Load any previously selected categories
      try {
        const savedCategories = await EnhancedOnboardingService.getSelectedCategories(userId)
        if (savedCategories.length > 0) {
          const savedIds = new Set(savedCategories.map((c: any) => c.id))
          setSelectedCategories(savedIds)
        }
      } catch (err) {
        console.warn('Failed to load saved categories')
      }
      
    } catch (error) {
      console.error('Error loading categories:', error)
      setError('Failed to load categories. Using default content.')
      setCategories(FALLBACK_CATEGORIES)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategory = async (categoryId: string) => {
    const newSelected = new Set(selectedCategories)

    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId)
    } else {
      newSelected.add(categoryId)
    }

    setSelectedCategories(newSelected)
    
    // Save selection immediately for use in next step
    const selectedData = categories
      .filter(c => newSelected.has(c.id))
      .map((c, index) => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        interest_level: 5, // Default high interest
        priority_rank: index + 1,
      }))
      
    try {
      await EnhancedOnboardingService.saveSelectedCategories(userId, selectedData)
    } catch (err) {
      console.warn('Failed to save selected categories:', err)
    }
  }

  const handleContinue = () => {
    const selectedData = {
      categories: categories
        .filter(c => selectedCategories.has(c.id))
        .map((c, index) => ({
          id: c.id,
          name: c.name,
          emoji: c.emoji,
          interest_level: 5, // Default high interest
          priority_rank: index + 1,
        }))
    }
    
    onNext(selectedData)
  }

  const renderErrorBanner = () => {
    if (!error) return null
    
    return (
      <View style={styles.errorBanner}>
        <Ionicons name="information-circle" size={16} color="#F59E0B" />
        <View style={styles.errorTextContainer}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      </View>
    )
  }

  const renderCategoryCard = (category: Category, index: number) => {
    const isSelected = selectedCategories.has(category.id)
    
    return (
      <Animated.View
        key={category.id}
        style={[
          styles.categoryWrapper,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30 * (index % 2 + 1), 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.categoryCard,
            isSelected && styles.categoryCardSelected,
          ]}
          onPress={() => toggleCategory(category.id)}
          activeOpacity={0.8}
        >
          <View style={styles.categoryContent}>
            <Text style={styles.categoryEmoji}>
              {category.emoji || '📚'}
            </Text>
            
            <Text 
              style={[
                styles.categoryName,
                isSelected && styles.categoryNameSelected
              ]}
              numberOfLines={2}
            >
              {category.name || 'Unknown Topic'}
            </Text>
            
            {category.description ? (
              <Text style={styles.categoryDescription} numberOfLines={3}>
                {category.description}
              </Text>
            ) : null}
            
            {category.question_count && category.question_count > 0 ? (
              <Text style={styles.questionCount}>
                {category.question_count} question{category.question_count !== 1 ? 's' : ''}
              </Text>
            ) : null}
            
            {isSelected ? (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const renderEmptyState = () => {
    if (categories.length > 0 || isLoading) return null
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No topics available</Text>
        <Text style={styles.emptyText}>
          Please check your connection and try again.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={loadCategoriesAndProgress}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderFooterHint = () => {
    if (selectedCategories.size > 0) return null
    
    return (
      <Text style={styles.footerHint}>
        Select at least one topic to continue
      </Text>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading topics...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.title}>What interests you?</Text>
        <Text style={styles.subtitle}>
          Select topics you'd like to learn about. Choose as many as you like.
        </Text>
        <Text style={styles.selectionCount}>
          {selectedCategories.size} topic{selectedCategories.size !== 1 ? 's' : ''} selected
        </Text>
        
        {renderErrorBanner()}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.categoriesContainer, { opacity: fadeAnim }]}>
          {categories.map((category, index) => renderCategoryCard(category, index))}
        </Animated.View>

        {renderEmptyState()}
      </ScrollView>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedCategories.size === 0 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedCategories.size === 0}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            selectedCategories.size === 0 && styles.continueButtonTextDisabled
          ]}>
            Continue
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={selectedCategories.size === 0 ? "#94A3B8" : "#FFFFFF"} 
          />
        </TouchableOpacity>
        
        {renderFooterHint()}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  selectionCount: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#A16207',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryWrapper: {
    width: (SCREEN_WIDTH - 56) / 2, // Account for padding and space
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    minHeight: 140,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowColor: '#000000',
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  categoryCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowColor: '#3B82F6',
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 8px rgba(59, 130, 246, 0.15)',
      },
    }),
  },
  categoryContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 12,
    textAlign: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  categoryNameSelected: {
    color: '#1E40AF',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  questionCount: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowColor: '#000000',
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowColor: '#3B82F6',
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 8px rgba(59, 130, 246, 0.25)',
      },
    }),
  },
  continueButtonDisabled: {
    backgroundColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
      web: {
        boxShadow: 'none',
      },
    }),
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
  continueButtonTextDisabled: {
    color: '#94A3B8',
  },
  footerHint: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
}) 