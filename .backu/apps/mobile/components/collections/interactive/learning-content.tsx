import React, { useState } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { spacing, borderRadius, fontFamily } from '../../../lib/theme'
import type { 
  CompletionCallback,
  ConceptConfig,
  ExampleConfig,
  SummaryConfig,
  CaseStudyConfig,
  ComparisonConfig,
  ResearchConfig,
  DebateConfig
} from './types'

const { width } = Dimensions.get('window')

// ============================================================================
// CONCEPT COMPONENT
// ============================================================================

export function Concept({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: ConceptConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [currentPoint, setCurrentPoint] = useState(0)

  const handleNext = () => {
    if (currentPoint < config.key_points.length - 1) {
      setCurrentPoint(currentPoint + 1)
    } else {
      onComplete(true, { conceptUnderstood: true })
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#1E40AF']}
        style={styles.header}
      >
        <Ionicons name="bulb-outline" size={24} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Key Concept</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {config.definition && (
          <View style={styles.definitionCard}>
            <Text style={styles.definitionLabel}>Definition</Text>
            <Text style={styles.definitionText}>{config.definition}</Text>
          </View>
        )}

        <View style={styles.pointsContainer}>
          <Text style={styles.pointsTitle}>
            Key Point {currentPoint + 1} of {config.key_points.length}
          </Text>
          <Text style={styles.pointText}>
            {config.key_points[currentPoint]}
          </Text>
        </View>

        {config.importance && currentPoint === config.key_points.length - 1 && (
          <View style={styles.importanceCard}>
            <Text style={styles.importanceLabel}>Why This Matters</Text>
            <Text style={styles.importanceText}>{config.importance}</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentPoint < config.key_points.length - 1 ? 'Next Point' : 'Continue'}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  )
}

// ============================================================================
// EXAMPLE COMPONENT
// ============================================================================

export function Example({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: ExampleConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [currentExample, setCurrentExample] = useState(0)

  const handleNext = () => {
    if (currentExample < config.examples.length - 1) {
      setCurrentExample(currentExample + 1)
    } else {
      onComplete(true, { examplesReviewed: config.examples.length })
    }
  }

  const example = config.examples[currentExample]

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
      >
        <Ionicons name="book-outline" size={24} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Real-World Example</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.exampleCard}>
          <Text style={styles.exampleNumber}>
            Example {currentExample + 1} of {config.examples.length}
          </Text>
          <Text style={styles.exampleTitle}>{example.title}</Text>
          <Text style={styles.exampleDescription}>{example.description}</Text>
          
          {example.source && (
            <View style={styles.sourceContainer}>
              <Ionicons name="link-outline" size={16} color="#6B7280" />
              <Text style={styles.sourceText}>{example.source}</Text>
            </View>
          )}

          {example.highlight && (
            <View style={styles.highlightCard}>
              <Text style={styles.highlightText}>{example.highlight}</Text>
            </View>
          )}
        </View>

        {currentExample === config.examples.length - 1 && config.takeaway && (
          <View style={styles.takeawayCard}>
            <Text style={styles.takeawayLabel}>Key Takeaway</Text>
            <Text style={styles.takeawayText}>{config.takeaway}</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentExample < config.examples.length - 1 ? 'Next Example' : 'Continue'}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  )
}

// ============================================================================
// SUMMARY COMPONENT
// ============================================================================

export function Summary({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: SummaryConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [checkedPoints, setCheckedPoints] = useState<boolean[]>(
    new Array(config.key_points.length).fill(false)
  )

  const togglePoint = (index: number) => {
    const newChecked = [...checkedPoints]
    newChecked[index] = !newChecked[index]
    setCheckedPoints(newChecked)
  }

  const allChecked = checkedPoints.every(checked => checked)

  const handleComplete = () => {
    if (allChecked) {
      onComplete(true, { summaryReviewed: true })
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        style={styles.header}
      >
        <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Summary</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.summaryInstructions}>
          Review these key points by checking them off:
        </Text>

        {config.key_points.map((point, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.checklistItem,
              checkedPoints[index] && styles.checklistItemChecked
            ]}
            onPress={() => togglePoint(index)}
          >
            <View style={[
              styles.checkbox,
              checkedPoints[index] && styles.checkboxChecked
            ]}>
              {checkedPoints[index] && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
            <Text style={[
              styles.checklistText,
              checkedPoints[index] && styles.checklistTextChecked
            ]}>
              {point}
            </Text>
          </TouchableOpacity>
        ))}

        {config.next_steps && config.next_steps.length > 0 && (
          <View style={styles.nextStepsCard}>
            <Text style={styles.nextStepsTitle}>Next Steps</Text>
            {config.next_steps.map((step, index) => (
              <View key={index} style={styles.nextStepItem}>
                <Text style={styles.nextStepNumber}>{index + 1}</Text>
                <Text style={styles.nextStepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {allChecked && (
        <TouchableOpacity style={styles.nextButton} onPress={handleComplete}>
          <Text style={styles.nextButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  )
}

// ============================================================================
// CASE STUDY COMPONENT
// ============================================================================

export function CaseStudy({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: CaseStudyConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [currentSection, setCurrentSection] = useState(0)
  const [responses, setResponses] = useState<Record<number, string>>({})

  const sections = [
    { title: 'Background', content: config.background },
    { title: 'Challenge', content: config.challenge },
    ...(config.solution ? [{ title: 'Solution', content: config.solution }] : []),
    ...(config.outcome ? [{ title: 'Outcome', content: config.outcome }] : []),
  ]

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1)
    } else if (config.discussion_questions && config.discussion_questions.length > 0) {
      // Move to discussion questions
      setCurrentSection(sections.length)
    } else {
      onComplete(true, { caseStudyCompleted: true, responses })
    }
  }

  const handleQuestionResponse = (questionIndex: number, response: string) => {
    setResponses(prev => ({ ...prev, [questionIndex]: response }))
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <Ionicons name="document-text-outline" size={24} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Case Study</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentSection < sections.length ? (
          <View style={styles.caseStudySection}>
            <Text style={styles.sectionTitle}>{sections[currentSection].title}</Text>
            <Text style={styles.sectionContent}>{sections[currentSection].content}</Text>
          </View>
        ) : (
          <View style={styles.discussionSection}>
            <Text style={styles.discussionTitle}>Reflect & Discuss</Text>
            {config.discussion_questions?.map((question, index) => (
              <View key={index} style={styles.questionContainer}>
                <Text style={styles.questionText}>{question}</Text>
                <TextInput
                  style={styles.responseInput}
                  placeholder="Your thoughts..."
                  multiline
                  numberOfLines={3}
                  value={responses[index] || ''}
                  onChangeText={(text) => handleQuestionResponse(index, text)}
                />
              </View>
            ))}
          </View>
        )}

        {currentSection === sections.length && config.lessons_learned && (
          <View style={styles.lessonsCard}>
            <Text style={styles.lessonsTitle}>Key Lessons</Text>
            {config.lessons_learned.map((lesson, index) => (
              <View key={index} style={styles.lessonItem}>
                <View style={styles.lessonBullet} />
                <Text style={styles.lessonText}>{lesson}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentSection < sections.length - 1 ? 'Next Section' : 
           currentSection === sections.length - 1 && config.discussion_questions ? 'Reflect' : 
           'Continue'}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  )
}

// ============================================================================
// COMPARISON COMPONENT
// ============================================================================

export function Comparison({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: ComparisonConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setSelectedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleComplete = () => {
    onComplete(true, { comparisonReviewed: true, selectedItems })
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EF4444', '#DC2626']}
        style={styles.header}
      >
        <Ionicons name="git-compare-outline" size={24} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Compare & Contrast</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.comparisonInstructions}>
          Compare these options. Tap to highlight differences:
        </Text>

        {config.items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.comparisonCard,
              selectedItems.includes(index) && styles.comparisonCardSelected
            ]}
            onPress={() => toggleItem(index)}
          >
            <Text style={styles.comparisonTitle}>{item.name}</Text>
            {Object.entries(item.attributes).map(([key, value]) => (
              <View key={key} style={styles.attributeRow}>
                <Text style={styles.attributeKey}>{key}:</Text>
                <Text style={styles.attributeValue}>{String(value)}</Text>
              </View>
            ))}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.nextButton} onPress={handleComplete}>
        <Text style={styles.nextButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  )
}

// ============================================================================
// RESEARCH COMPONENT
// ============================================================================

export function Research({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: ResearchConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const handleNoteChange = (questionIndex: number, note: string) => {
    setNotes(prev => ({ ...prev, [questionIndex]: note }))
  }

  const handleNext = () => {
    if (currentQuestion < config.research_questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      onComplete(true, { researchCompleted: true, notes })
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#06B6D4', '#0891B2']}
        style={styles.header}
      >
        <Ionicons name="search-outline" size={24} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Research Activity</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.researchProgress}>
          Question {currentQuestion + 1} of {config.research_questions.length}
        </Text>

        <Text style={styles.researchQuestion}>
          {config.research_questions[currentQuestion]}
        </Text>

        <TextInput
          style={styles.notesInput}
          placeholder="Write your research notes here..."
          multiline
          numberOfLines={6}
          value={notes[currentQuestion] || ''}
          onChangeText={(text) => handleNoteChange(currentQuestion, text)}
        />

        {config.guided_questions && config.guided_questions.length > 0 && (
          <View style={styles.guidedSection}>
            <Text style={styles.guidedTitle}>Consider These Questions:</Text>
            {config.guided_questions.map((question, index) => (
              <Text key={index} style={styles.guidedQuestion}>
                • {question}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentQuestion < config.research_questions.length - 1 ? 'Next Question' : 'Complete Research'}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  )
}

// ============================================================================
// DEBATE COMPONENT
// ============================================================================

export function Debate({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: DebateConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [currentView, setCurrentView] = useState<'overview' | 'positions' | 'reflection'>('overview')
  const [reflectionResponses, setReflectionResponses] = useState<Record<number, string>>({})

  const handlePositionSelect = (index: number) => {
    setSelectedPosition(index)
    setCurrentView('positions')
  }

  const handleReflectionResponse = (questionIndex: number, response: string) => {
    setReflectionResponses(prev => ({ ...prev, [questionIndex]: response }))
  }

  const handleComplete = () => {
    onComplete(true, { 
      debateCompleted: true, 
      selectedPosition, 
      reflectionResponses 
    })
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        style={styles.header}
      >
        <Ionicons name="chatbubbles-outline" size={24} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Debate & Discuss</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentView === 'overview' && (
          <View style={styles.debateOverview}>
            <Text style={styles.debateTopic}>{config.topic}</Text>
            <Text style={styles.debateInstructions}>
              Choose a position to explore its arguments:
            </Text>
            {config.positions.map((position, index) => (
              <TouchableOpacity
                key={index}
                style={styles.positionCard}
                onPress={() => handlePositionSelect(index)}
              >
                <Text style={styles.positionStance}>{position.stance}</Text>
                <Text style={styles.positionPreview}>
                  {position.arguments[0]}...
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {currentView === 'positions' && selectedPosition !== null && (
          <View style={styles.positionDetail}>
            <Text style={styles.positionTitle}>
              {config.positions[selectedPosition].stance}
            </Text>
            
            <Text style={styles.argumentsTitle}>Arguments:</Text>
            {config.positions[selectedPosition].arguments.map((argument, index) => (
              <View key={index} style={styles.argumentItem}>
                <View style={styles.argumentBullet} />
                <Text style={styles.argumentText}>{argument}</Text>
              </View>
            ))}

            {config.positions[selectedPosition].evidence && (
              <>
                <Text style={styles.evidenceTitle}>Evidence:</Text>
                {config.positions[selectedPosition].evidence?.map((evidence, index) => (
                  <Text key={index} style={styles.evidenceText}>
                    • {evidence}
                  </Text>
                ))}
              </>
            )}

            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => setCurrentView('overview')}
            >
              <Text style={styles.exploreButtonText}>Explore Other Positions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reflectButton}
              onPress={() => setCurrentView('reflection')}
            >
              <Text style={styles.reflectButtonText}>Move to Reflection</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentView === 'reflection' && config.reflection_questions && (
          <View style={styles.reflectionSection}>
            <Text style={styles.reflectionTitle}>Reflect on the Debate</Text>
            {config.reflection_questions.map((question, index) => (
              <View key={index} style={styles.reflectionQuestion}>
                <Text style={styles.reflectionQuestionText}>{question}</Text>
                <TextInput
                  style={styles.reflectionInput}
                  placeholder="Your reflection..."
                  multiline
                  numberOfLines={3}
                  value={reflectionResponses[index] || ''}
                  onChangeText={(text) => handleReflectionResponse(index, text)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {currentView === 'reflection' && (
        <TouchableOpacity style={styles.nextButton} onPress={handleComplete}>
          <Text style={styles.nextButtonText}>Complete Debate</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  )
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: spacing.md,
    fontFamily: fontFamily.display,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  
  // Concept styles
  definitionCard: {
    backgroundColor: '#F3F4F6',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  definitionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  definitionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    fontFamily: fontFamily.text,
  },
  pointsContainer: {
    backgroundColor: '#EFF6FF',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  pointsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: spacing.md,
  },
  pointText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    fontFamily: fontFamily.text,
  },
  importanceCard: {
    backgroundColor: '#FEF3C7',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  importanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  importanceText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#92400E',
    fontFamily: fontFamily.text,
  },

  // Example styles
  exampleCard: {
    backgroundColor: '#F9FAFB',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  exampleNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: spacing.md,
    fontFamily: fontFamily.display,
  },
  exampleDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    marginBottom: spacing.md,
    fontFamily: fontFamily.text,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sourceText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: spacing.xs,
    fontStyle: 'italic',
  },
  highlightCard: {
    backgroundColor: '#DBEAFE',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  highlightText: {
    fontSize: 15,
    color: '#1E40AF',
    fontWeight: '500',
    fontFamily: fontFamily.text,
  },
  takeawayCard: {
    backgroundColor: '#ECFDF5',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  takeawayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  takeawayText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#047857',
    fontFamily: fontFamily.text,
  },

  // Summary styles
  summaryInstructions: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: spacing.lg,
    fontFamily: fontFamily.text,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#F9FAFB',
    marginBottom: spacing.md,
  },
  checklistItemChecked: {
    backgroundColor: '#ECFDF5',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checklistText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    fontFamily: fontFamily.text,
  },
  checklistTextChecked: {
    color: '#047857',
  },
  nextStepsCard: {
    backgroundColor: '#FEF3C7',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: spacing.md,
    fontFamily: fontFamily.display,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  nextStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: spacing.md,
  },
  nextStepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#92400E',
    fontFamily: fontFamily.text,
  },

  // Case study styles
  caseStudySection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: spacing.md,
    fontFamily: fontFamily.display,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    fontFamily: fontFamily.text,
  },
  discussionSection: {
    marginBottom: spacing.lg,
  },
  discussionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: spacing.lg,
    fontFamily: fontFamily.display,
  },
  questionContainer: {
    marginBottom: spacing.lg,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: spacing.md,
    fontFamily: fontFamily.text,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: fontFamily.text,
  },
  lessonsCard: {
    backgroundColor: '#F3E8FF',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  lessonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: spacing.md,
    fontFamily: fontFamily.display,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  lessonBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
    marginTop: 9,
    marginRight: spacing.md,
  },
  lessonText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#5B21B6',
    fontFamily: fontFamily.text,
  },

  // Comparison styles
  comparisonInstructions: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: spacing.lg,
    fontFamily: fontFamily.text,
  },
  comparisonCard: {
    backgroundColor: '#F9FAFB',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  comparisonCardSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: spacing.md,
    fontFamily: fontFamily.display,
  },
  attributeRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  attributeKey: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 100,
    fontFamily: fontFamily.mono,
  },
  attributeValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    fontFamily: fontFamily.text,
  },

  // Research styles
  researchProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0891B2',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  researchQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: spacing.lg,
    fontFamily: fontFamily.display,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
    fontFamily: fontFamily.text,
  },
  guidedSection: {
    backgroundColor: '#F0F9FF',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  guidedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: spacing.md,
    fontFamily: fontFamily.display,
  },
  guidedQuestion: {
    fontSize: 15,
    lineHeight: 22,
    color: '#0369A1',
    marginBottom: spacing.sm,
    fontFamily: fontFamily.text,
  },

  // Debate styles
  debateOverview: {
    marginBottom: spacing.lg,
  },
  debateTopic: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontFamily: fontFamily.display,
  },
  debateInstructions: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: spacing.lg,
    fontFamily: fontFamily.text,
  },
  positionCard: {
    backgroundColor: '#F9FAFB',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionStance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    fontFamily: fontFamily.display,
  },
  positionPreview: {
    fontSize: 14,
    color: '#6B7280',
    flex: 2,
    marginHorizontal: spacing.md,
    fontFamily: fontFamily.text,
  },
  positionDetail: {
    marginBottom: spacing.lg,
  },
  positionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: spacing.lg,
    fontFamily: fontFamily.display,
  },
  argumentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: spacing.md,
    fontFamily: fontFamily.display,
  },
  argumentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  argumentBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 9,
    marginRight: spacing.md,
  },
  argumentText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    fontFamily: fontFamily.text,
  },
  evidenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontFamily: fontFamily.display,
  },
  evidenceText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    marginBottom: spacing.sm,
    fontFamily: fontFamily.text,
  },
  exploreButton: {
    backgroundColor: '#F3F4F6',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    fontFamily: fontFamily.text,
  },
  reflectButton: {
    backgroundColor: '#DBEAFE',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  reflectButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E40AF',
    fontFamily: fontFamily.text,
  },
  reflectionSection: {
    marginBottom: spacing.lg,
  },
  reflectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: spacing.lg,
    fontFamily: fontFamily.display,
  },
  reflectionQuestion: {
    marginBottom: spacing.lg,
  },
  reflectionQuestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: spacing.md,
    fontFamily: fontFamily.text,
  },
  reflectionInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: fontFamily.text,
  },

  // Common button styles
  nextButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: spacing.sm,
    fontFamily: fontFamily.monoBold,
  },
}) 