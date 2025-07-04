import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { EnhancedOnboardingService, type OnboardingSkill, type SelectedSkill } from '../../lib/services/onboarding-service'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const DRAWER_MIN_HEIGHT = 70
const DRAWER_MAX_HEIGHT = SCREEN_HEIGHT * 0.5 // 50% of screen height

interface SkillSelectionStepProps {
  onComplete: (data: any) => void
  onSkip: (reason: string) => void
  onboardingState: any
  initialData?: any
  userId: string
}

// Fallback skills data when database fails
const FALLBACK_SKILLS: Record<string, OnboardingSkill[]> = {
  "Civil Rights": [
    {
      id: "civil-rights-1",
      skill_name: "Recognize Discrimination",
      emoji: "⚖️",
      description: "Spot unfair treatment based on race, gender, religion, or other factors.",
      difficulty_level: 2,
      is_core_skill: true,
      category_name: "Civil Rights",
      category_id: "civil-rights",
      display_order: 1
    },
    {
      id: "civil-rights-2", 
      skill_name: "Help Others with Rights",
      emoji: "🤝",
      description: "Teach others about their rights and how to protect themselves.",
      difficulty_level: 3,
      is_core_skill: false,
      category_name: "Civil Rights",
      category_id: "civil-rights",
      display_order: 2
    }
  ],
  "Government": [
    {
      id: "government-1",
      skill_name: "Read Government Budgets",
      emoji: "💰",
      description: "Understand where tax money goes and what governments prioritize.",
      difficulty_level: 4,
      is_core_skill: true,
      category_name: "Government",
      category_id: "government",
      display_order: 1
    },
    {
      id: "government-2",
      skill_name: "Legislative Process",
      emoji: "📜",
      description: "Understand how ideas become laws step-by-step.",
      difficulty_level: 3,
      is_core_skill: false,
      category_name: "Government",
      category_id: "government",
      display_order: 2
    }
  ],
  "Economics": [
    {
      id: "economics-1",
      skill_name: "Understand Economic Policy",
      emoji: "📈",
      description: "Learn how government decisions affect the economy and your wallet.",
      difficulty_level: 4,
      is_core_skill: false,
      category_name: "Economics",
      category_id: "economics",
      display_order: 1
    }
  ]
}

export function SkillSelectionStep({ 
  onComplete, 
  onSkip, 
  onboardingState, 
  initialData,
  userId 
}: SkillSelectionStepProps) {
  const [skills, setSkills] = useState<OnboardingSkill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<any[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadCategoriesAndSkills()
  }, [userId])

  const loadCategoriesAndSkills = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load selected categories from previous step
      let categories = []
      try {
        categories = await EnhancedOnboardingService.getSelectedCategories(userId)
        console.log('Loaded categories from storage:', categories)
      } catch (err) {
        console.warn('Failed to load categories, using fallback')
        categories = [{ id: 'civil-rights', name: 'Civil Rights', emoji: '✊' }]
      }
      
      setSelectedCategories(categories)

      // Try to fetch skills from database
      let skillsData: OnboardingSkill[] = []
      try {
        const categoryIds = categories.map((cat: any) => cat.id).filter(Boolean)
        console.log('Fetching skills for categories:', categoryIds)
        skillsData = await EnhancedOnboardingService.getOnboardingSkills(
          categoryIds.length > 0 ? categoryIds : undefined
        )
      } catch (err) {
        console.warn('Failed to fetch skills from database, using fallback data')
        // Use fallback skills based on selected categories
        skillsData = []
        categories.forEach((cat: any) => {
          const categorySkills = FALLBACK_SKILLS[cat.name] || []
          skillsData.push(...categorySkills)
        })
        
        // If no category matches, provide default skills
        if (skillsData.length === 0) {
          skillsData = Object.values(FALLBACK_SKILLS).flat()
        }
      }

      setSkills(skillsData)

      // Auto-expand first section
      if (skillsData.length > 0 && skillsData[0]?.category_name) {
        const firstCategory = skillsData[0].category_name
        setExpandedSections(new Set([firstCategory]))
      }

      // Load any previously selected skills from progress
      try {
        const progress = await EnhancedOnboardingService.loadProgress(userId)
        const savedSkills = progress.savedData?.skills?.skills || []
        setSelectedSkills(savedSkills)
      } catch (err) {
        console.warn('Failed to load saved skills progress')
      }

    } catch (err) {
      console.error('Error in loadCategoriesAndSkills:', err)
      setError('Failed to load skills. Using default content.')
      
      // Provide fallback data
      const defaultSkills = Object.values(FALLBACK_SKILLS).flat()
      setSkills(defaultSkills)
      setExpandedSections(new Set(['Civil Rights']))
    } finally {
      setLoading(false)
    }
  }

  const toggleSkillSelection = (skill: OnboardingSkill) => {
    const existingIndex = selectedSkills.findIndex(s => s.id === skill.id)
    
    if (existingIndex >= 0) {
      // Remove skill
      const newSelection = selectedSkills.filter(s => s.id !== skill.id)
      setSelectedSkills(newSelection)
      saveSkillsToStorage(newSelection)
    } else {
      // Add skill with default preferences
      const newSkill: SelectedSkill = {
        id: skill.id,
        skill_name: skill.skill_name,
        interest_level: 3,
        target_mastery_level: 'intermediate',
        learning_timeline: 'flexible'
      }
      const newSelection = [...selectedSkills, newSkill]
      setSelectedSkills(newSelection)
      saveSkillsToStorage(newSelection)
    }
  }

  const updateSkillPreferences = (skillId: string, updates: Partial<SelectedSkill>) => {
    const newSelection = selectedSkills.map(skill => 
      skill.id === skillId ? { ...skill, ...updates } : skill
    )
    setSelectedSkills(newSelection)
    saveSkillsToStorage(newSelection)
  }

  const saveSkillsToStorage = async (skills: SelectedSkill[]) => {
    try {
      await EnhancedOnboardingService.saveProgress(userId, 'skills', { skills })
    } catch (error) {
      console.warn('Error saving skills progress:', error)
    }
  }

  const handleContinue = () => {
    if (selectedSkills.length === 0) {
      // Don't automatically expand drawer - let user handle it manually
      // Could add a subtle shake animation or alert here instead
      return
    }

    try {
      console.log('Skills step continuing with:', { skills: selectedSkills })
      onComplete({ skills: selectedSkills })
    } catch (error) {
      console.error('Error in skills handleContinue:', error)
      onComplete({ skills: selectedSkills })
    }
  }

  const toggleSection = (categoryName: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedSections(newExpanded)
  }

  const groupedSkills = skills.reduce((groups, skill) => {
    const categoryName = skill.category_name
    if (!groups[categoryName]) {
      groups[categoryName] = []
    }
    groups[categoryName].push(skill)
    return groups
  }, {} as Record<string, OnboardingSkill[]>)

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading skills...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            🎯 Choose Your Learning Goals
          </Text>
          <Text style={styles.subtitle}>
            Based on your selected categories, here are skills you can develop. Select the ones that interest you most.
          </Text>
          
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="information-circle" size={16} color="#F59E0B" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Collapsible Category Sections */}
        {Object.entries(groupedSkills).map(([categoryName, categorySkills]) => {
          const isExpanded = expandedSections.has(categoryName)
          const selectedCount = categorySkills.filter(skill => 
            selectedSkills.some(s => s.id === skill.id)
          ).length
          
          return (
            <View key={categoryName} style={styles.categorySection}>
              <TouchableOpacity 
                style={styles.categoryHeader}
                onPress={() => toggleSection(categoryName)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryHeaderLeft}>
                  <Text style={styles.categoryTitle}>{categoryName}</Text>
                  <Text style={styles.categoryCount}>
                    {categorySkills.length} skill{categorySkills.length !== 1 ? 's' : ''}
                    {selectedCount > 0 && ` • ${selectedCount} selected`}
                  </Text>
                </View>
                <Ionicons 
                  name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={24} 
                  color="#64748B" 
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.skillsGrid}>
                  {categorySkills.map((skill) => {
                    const isSelected = selectedSkills.some(s => s.id === skill.id)
                    const selectedSkill = selectedSkills.find(s => s.id === skill.id)
                    
                    return (
                      <View key={skill.id} style={styles.skillContainer}>
                        <TouchableOpacity
                          style={[
                            styles.skillCard,
                            isSelected && styles.skillCardSelected,
                            skill.is_core_skill && styles.coreSkillCard
                          ]}
                          onPress={() => toggleSkillSelection(skill)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.skillHeader}>
                            <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                            {skill.is_core_skill && (
                              <View style={styles.coreSkillBadge}>
                                <Text style={styles.coreSkillText}>Core</Text>
                              </View>
                            )}
                            {isSelected && (
                              <View style={styles.selectedIndicator}>
                                <Text style={styles.selectedCheckmark}>✓</Text>
                              </View>
                            )}
                          </View>
                          
                          <Text style={styles.skillName}>{skill.skill_name}</Text>
                          
                          {skill.description && (
                            <Text style={styles.skillDescription} numberOfLines={2}>
                              {skill.description}
                            </Text>
                          )}
                          
                          <View style={styles.skillMeta}>
                            <View style={styles.difficultyIndicator}>
                              {[...Array(5)].map((_, i) => (
                                <View
                                  key={i}
                                  style={[
                                    styles.difficultyDot,
                                    i < skill.difficulty_level && styles.difficultyDotActive
                                  ]}
                                />
                              ))}
                            </View>
                          </View>
                        </TouchableOpacity>

                        {/* Skill preferences when selected */}
                        {isSelected && selectedSkill && (
                          <View style={styles.skillPreferences}>
                            <Text style={styles.preferencesTitle}>Learning Preferences</Text>
                            
                            {/* Interest Level */}
                            <View style={styles.preferenceGroup}>
                              <Text style={styles.preferenceLabel}>Interest Level</Text>
                              <View style={styles.interestButtons}>
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <TouchableOpacity
                                    key={level}
                                    style={[
                                      styles.interestButton,
                                      selectedSkill.interest_level === level && styles.interestButtonActive
                                    ]}
                                    onPress={() => updateSkillPreferences(skill.id, { interest_level: level })}
                                  >
                                    <Text style={[
                                      styles.interestButtonText,
                                      selectedSkill.interest_level === level && styles.interestButtonTextActive
                                    ]}>
                                      {level}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>

                            {/* Target Mastery Level */}
                            <View style={styles.preferenceGroup}>
                              <Text style={styles.preferenceLabel}>Target Level</Text>
                              <View style={styles.masteryButtons}>
                                {['beginner', 'intermediate', 'advanced'].map((level) => (
                                  <TouchableOpacity
                                    key={level}
                                    style={[
                                      styles.masteryButton,
                                      selectedSkill.target_mastery_level === level && styles.masteryButtonActive
                                    ]}
                                    onPress={() => updateSkillPreferences(skill.id, { target_mastery_level: level })}
                                  >
                                    <Text style={[
                                      styles.masteryButtonText,
                                      selectedSkill.target_mastery_level === level && styles.masteryButtonTextActive
                                    ]}>
                                      {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )
        })}

        {skills.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No skills available. Please try again later.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadCategoriesAndSkills}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom padding for floating buttons */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.floatingActions}>
        <TouchableOpacity
          style={styles.skipFloatingButton}
          onPress={() => onSkip('skip_skills')}
        >
          <Text style={styles.skipFloatingButtonText}>Skip</Text>
        </TouchableOpacity>

        {selectedSkills.length > 0 && (
          <TouchableOpacity
            style={styles.continueFloatingButton}
            onPress={handleContinue}
          >
            <View style={styles.continueFloatingButtonContent}>
              <Text style={styles.continueFloatingButtonText}>
                Continue with {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 16,
  },
  selectionCount: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  categorySection: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  skillsGrid: {
    gap: 16,
    padding: 16,
  },
  skillContainer: {
    marginBottom: 8,
  },
  skillCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  skillCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  coreSkillCard: {
    borderColor: '#F59E0B',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillEmoji: {
    fontSize: 20,
  },
  coreSkillBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coreSkillText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedIndicator: {
    backgroundColor: '#3B82F6',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  skillDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  skillMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyIndicator: {
    flexDirection: 'row',
    gap: 2,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  difficultyDotActive: {
    backgroundColor: '#3B82F6',
  },
  skillPreferences: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  preferencesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  preferenceGroup: {
    marginBottom: 12,
  },
  preferenceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  interestButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  interestButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestButtonActive: {
    backgroundColor: '#3B82F6',
  },
  interestButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  interestButtonTextActive: {
    color: '#FFFFFF',
  },
  masteryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  masteryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  masteryButtonActive: {
    backgroundColor: '#3B82F6',
  },
  masteryButtonText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  masteryButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButtons: {
    marginTop: 32,
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
  },

  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  categoryHeaderLeft: {
    flex: 1,
  },
  categoryCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  categoryFilter: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  filterText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  continueButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  continueButtonTextDisabled: {
    color: '#64748B',
  },
  errorBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#A16207',
    fontWeight: '500',
    flex: 1,
  },
  bottomPadding: {
    height: 120, // Space for floating buttons
  },
  
  // Floating action buttons
  floatingActions: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  skipFloatingButton: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skipFloatingButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  continueFloatingButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    flex: 1,
    maxWidth: 280,
  },
  continueFloatingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueFloatingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}) 