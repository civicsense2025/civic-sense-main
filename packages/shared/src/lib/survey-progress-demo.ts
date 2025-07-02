/**
 * Survey Progress Storage Demo
 * 
 * This file demonstrates how to use the centralized progress storage system for surveys.
 * It shows the integration patterns and usage examples for different scenarios.
 */

import { 
  useProgressStorage,
  createSurveyProgress,
  convertSurveyStateToBaseSurvey,
  convertBaseSurveyStateToSurvey,
  type SurveyResponse,
  type BaseSurveyState
} from './progress-storage'

// Example survey state structure
interface SurveyState {
  currentQuestionIndex: number
  responses: Record<string, SurveyResponse>
  questions: any[]
  startTime: number
  sessionId?: string
}

/**
 * Demo: Basic Survey Progress Storage
 */
export function basicSurveyProgressDemo() {
  console.log('📋 Survey Progress Storage Demo')
  
  // Example survey data
  const surveyId = 'civic-engagement-survey'
  const sessionId = 'survey-session-123'
  const userId = 'user-456'
  
  // Create progress manager
  const progressManager = createSurveyProgress(surveyId, sessionId, userId)
  
  // Example survey state
  const surveyState: SurveyState = {
    currentQuestionIndex: 2,
    responses: {
      'q1': {
        question_id: 'q1',
        answer: 'Very interested',
        answered_at: new Date().toISOString()
      },
      'q2': {
        question_id: 'q2',
        answer: ['Local elections', 'Federal elections'],
        answered_at: new Date().toISOString()
      },
      'q3': {
        question_id: 'q3',
        answer: 4,
        answered_at: new Date().toISOString()
      }
    },
    questions: [
      { id: 'q1', question: 'How interested are you in politics?' },
      { id: 'q2', question: 'Which elections do you participate in?' },
      { id: 'q3', question: 'Rate your civic knowledge (1-5)' },
      { id: 'q4', question: 'What motivates your civic engagement?' }
    ],
    startTime: Date.now(),
    sessionId
  }
  
  // Convert to base state for storage
  const baseSurveyState = convertSurveyStateToBaseSurvey(surveyState)
  
  // Save progress
  const saved = progressManager.save(baseSurveyState)
  console.log('✅ Survey progress saved:', saved)
  
  // Load progress
  const loaded = progressManager.load()
  if (loaded) {
    const restoredState = convertBaseSurveyStateToSurvey(loaded)
    console.log('✅ Survey progress loaded:', {
      questionIndex: restoredState.currentQuestionIndex + 1,
      totalQuestions: restoredState.questions.length,
      answeredQuestions: Object.keys(restoredState.responses).length
    })
  }
  
  // Clear progress
  progressManager.clear()
  console.log('🗑️ Survey progress cleared')
}

/**
 * Demo: Using the useProgressStorage Hook
 */
export function useProgressStorageDemo() {
  console.log('🪝 useProgressStorage Hook Demo')
  
  // This would be used inside a React component
  const exampleUsage = `
    function SurveyComponent({ surveyId, sessionId }) {
      const progressStorage = useProgressStorage()
      const [surveyState, setSurveyState] = useState(initialState)
      
      // Create progress manager
      const progressManager = progressStorage.createSurveyProgress(surveyId, sessionId)
      
      // Load progress on mount
      useEffect(() => {
        const saved = progressManager.load()
        if (saved) {
          const restored = convertBaseSurveyStateToSurvey(saved)
          setSurveyState(restored)
          toast({ title: "Progress restored" })
        }
      }, [])
      
      // Save progress when state changes
      useEffect(() => {
        if (surveyState.responses && Object.keys(surveyState.responses).length > 0) {
          const baseState = convertSurveyStateToBaseSurvey(surveyState)
          progressManager.save(baseState)
        }
      }, [surveyState])
      
      // Clear progress on completion
      const handleComplete = async (responses) => {
        await onComplete(responses)
        progressManager.clear()
      }
    }
  `
  
  console.log('📖 Example React component usage:', exampleUsage)
}

/**
 * Demo: Survey vs Quiz Progress Storage
 */
export function surveyVsQuizStorageDemo() {
  console.log('⚖️ Survey vs Quiz Storage Comparison')
  
  const comparisons = [
    {
      aspect: 'State Structure',
      quiz: 'answers: { [questionId]: string }',
      survey: 'responses: { [questionId]: SurveyResponse }'
    },
    {
      aspect: 'Storage Key',
      quiz: 'quiz-progress-regular-topicId-userId',
      survey: 'quiz-progress-survey-surveyId-sessionId-userId'
    },
    {
      aspect: 'Session Handling',
      quiz: 'User-based or guest-based',
      survey: 'Session-based with user/guest fallback'
    },
    {
      aspect: 'Data Complexity',
      quiz: 'Simple string answers',
      survey: 'Complex answers with metadata'
    },
    {
      aspect: 'Progress Validation',
      quiz: 'Checks answers object',
      survey: 'Checks responses object'
    }
  ]
  
  console.table(comparisons)
}

/**
 * Demo: Survey Progress Storage Integration Patterns
 */
export function surveyIntegrationPatternsDemo() {
  console.log('🔗 Survey Integration Patterns')
  
  const patterns = {
    'SurveyForm Component': {
      description: 'Main survey form with auto-save',
      keyFeatures: [
        'Auto-restore progress on mount',
        'Auto-save on every response change',
        'Clear progress on completion',
        'Fallback to API responses'
      ],
      code: `
        // In SurveyForm component
        const progressStorage = useProgressStorage()
        const progressManager = progressStorage.createSurveyProgress(surveyId, sessionId)
        
        // Restore progress
        useEffect(() => {
          const saved = progressManager.load()
          if (saved) {
            const restored = convertBaseSurveyStateToSurvey(saved)
            setResponses(restored.responses)
            setCurrentQuestionIndex(restored.currentQuestionIndex)
          }
        }, [])
        
        // Auto-save progress
        useEffect(() => {
          if (Object.keys(responses).length > 0) {
            const state = convertSurveyStateToBaseSurvey({
              currentQuestionIndex,
              responses,
              questions,
              startTime: startTime.getTime(),
              sessionId
            })
            progressManager.save(state)
          }
        }, [responses, currentQuestionIndex])
      `
    },
    
    'SurveyTaker Component': {
      description: 'Survey wrapper with session management',
      keyFeatures: [
        'Generate unique session IDs',
        'Pass session ID to SurveyForm',
        'Handle API-based progress loading',
        'Coordinate localStorage and API storage'
      ],
      code: `
        // In SurveyTaker component
        const [sessionId] = useState(() => 
          \`survey-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`
        )
        
        return (
          <SurveyForm
            survey={survey}
            sessionId={sessionId}
            existingResponses={existingResponses}
            onComplete={handleComplete}
            onSaveProgress={handleSaveProgress}
          />
        )
      `
    },
    
    'API Integration': {
      description: 'Coordinate localStorage with server storage',
      keyFeatures: [
        'Primary storage in localStorage',
        'Backup storage via API',
        'Sync on page load',
        'Conflict resolution'
      ],
      code: `
        // Hybrid storage approach
        const handleSaveProgress = async (responses) => {
          // Save to localStorage immediately
          const state = convertSurveyStateToBaseSurvey({...})
          progressManager.save(state)
          
          // Also save to API
          try {
            await fetch('/api/surveys/responses', {
              method: 'POST',
              body: JSON.stringify({ responses, save_progress: true })
            })
          } catch (error) {
            // LocalStorage ensures no data loss
            console.warn('API save failed, localStorage preserved')
          }
        }
      `
    }
  }
  
  Object.entries(patterns).forEach(([name, pattern]) => {
    console.log(`\n📋 ${name}:`)
    console.log(`Description: ${pattern.description}`)
    console.log('Key Features:')
    pattern.keyFeatures.forEach(feature => console.log(`  • ${feature}`))
    console.log('Code Example:', pattern.code)
  })
}

/**
 * Demo: Survey Progress Storage Best Practices
 */
export function surveyStorageBestPracticesDemo() {
  console.log('✨ Survey Progress Storage Best Practices')
  
  const bestPractices = [
    {
      category: 'Session Management',
      practices: [
        'Generate unique session IDs for each survey attempt',
        'Include session ID in storage keys for isolation',
        'Handle anonymous and authenticated users consistently',
        'Use session ID as primary identifier, user ID as secondary'
      ]
    },
    {
      category: 'Data Integrity',
      practices: [
        'Validate restored state before applying',
        'Handle schema changes gracefully',
        'Provide fallbacks for corrupted data',
        'Log all restoration attempts for debugging'
      ]
    },
    {
      category: 'Performance',
      practices: [
        'Auto-save progress on response changes',
        'Debounce save operations if needed',
        'Clean up expired entries periodically',
        'Use efficient serialization for complex answers'
      ]
    },
    {
      category: 'User Experience',
      practices: [
        'Show progress restoration notifications',
        'Provide manual save options for important surveys',
        'Clear progress on successful completion',
        'Handle page refresh gracefully'
      ]
    },
    {
      category: 'Error Handling',
      practices: [
        'Graceful degradation when localStorage fails',
        'Fallback to API storage when available',
        'User feedback for save/restore operations',
        'Recovery options for lost progress'
      ]
    }
  ]
  
  bestPractices.forEach(({ category, practices }) => {
    console.log(`\n🎯 ${category}:`)
    practices.forEach(practice => console.log(`  • ${practice}`))
  })
}

/**
 * Run all survey progress demos
 */
export function runSurveyProgressDemos() {
  console.log('🚀 Running Survey Progress Storage Demos\n')
  
  basicSurveyProgressDemo()
  console.log('\n' + '='.repeat(60) + '\n')
  
  useProgressStorageDemo()
  console.log('\n' + '='.repeat(60) + '\n')
  
  surveyVsQuizStorageDemo()
  console.log('\n' + '='.repeat(60) + '\n')
  
  surveyIntegrationPatternsDemo()
  console.log('\n' + '='.repeat(60) + '\n')
  
  surveyStorageBestPracticesDemo()
  
  console.log('\n🎉 Survey Progress Storage Demos Complete!')
}

// Export for easy testing
if (typeof window !== 'undefined' && (window as any).runSurveyProgressDemos) {
  (window as any).runSurveyProgressDemos = runSurveyProgressDemos
} 