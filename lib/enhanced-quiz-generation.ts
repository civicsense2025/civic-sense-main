import { supabase } from './supabase'
import type { Database } from './database.types'
import type { QuizQuestion, QuestionType } from './quiz-data'

type Tables = Database['public']['Tables']
type PublicFigure = Tables['public_figures']['Row']
type Event = Tables['events']['Row']
type MediaOrganization = Tables['media_organizations']['Row']
type Skill = Tables['skills']['Row']
type FigureEvent = Tables['figure_events']['Row']
type FigureOrganization = Tables['figure_organizations']['Row']
type FigurePolicyPosition = Tables['figure_policy_positions']['Row']
type Organization = Tables['organizations']['Row']

export interface EnhancedQuestionGenerationOptions {
  gameMode: 'classic' | 'speed_round' | 'elimination' | 'learning_lab'
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  category: string
  count: number
  includeDataSources?: {
    figures?: boolean
    events?: boolean
    mediaOrgs?: boolean
    policies?: boolean
    organizations?: boolean
  }
}

export interface QuestionContext {
  figures?: PublicFigure[]
  events?: Event[]
  mediaOrgs?: MediaOrganization[]
  figureEvents?: FigureEvent[]
  figureOrgs?: FigureOrganization[]
  policies?: FigurePolicyPosition[]
  organizations?: Organization[]
}

export class EnhancedQuizGenerator {
  /**
   * Generate enhanced questions for multiplayer games using rich database context
   */
  static async generateContextualQuestions(
    options: EnhancedQuestionGenerationOptions
  ): Promise<QuizQuestion[]> {
    // 1. Gather contextual data from multiple tables
    const context = await this.gatherQuestionContext(options)
    
    // 2. Generate questions based on game mode and available context
    const questions = await this.createQuestionsFromContext(context, options)
    
    return questions
  }

  /**
   * Gather rich contextual data from multiple database tables
   */
  private static async gatherQuestionContext(
    options: EnhancedQuestionGenerationOptions
  ): Promise<QuestionContext> {
    const context: QuestionContext = {}
    const { includeDataSources = {} } = options

    try {
      // Get relevant public figures for the category
      if (includeDataSources.figures !== false) {
        const { data: figures } = await supabase
          .from('public_figures')
          .select('*')
          .eq('is_active', true)
          .limit(20)
        context.figures = figures || []
      }

      // Get recent events related to the category
      if (includeDataSources.events !== false) {
        const { data: events } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: false })
          .limit(15)
        context.events = events || []
      }

      // Get media organizations for bias-related questions
      if (includeDataSources.mediaOrgs !== false) {
        const { data: mediaOrgs } = await supabase
          .from('media_organizations')
          .select('*')
          .eq('is_active', true)
          .limit(10)
        context.mediaOrgs = mediaOrgs || []
      }

      // Get figure-event relationships
      if (context.figures && includeDataSources.events !== false) {
        const figureIds = context.figures.map(f => f.id)
        const { data: figureEvents } = await supabase
          .from('figure_events')
          .select('*')
          .in('figure_id', figureIds)
          .order('event_date', { ascending: false })
          .limit(20)
        context.figureEvents = figureEvents || []
      }

      // Get figure-organization relationships
      if (context.figures && includeDataSources.organizations !== false) {
        const figureIds = context.figures.map(f => f.id)
        const { data: figureOrgs } = await supabase
          .from('figure_organizations')
          .select('*')
          .in('figure_id', figureIds)
          .eq('is_active', true)
          .limit(25)
        context.figureOrgs = figureOrgs || []
      }

      // Get policy positions
      if (context.figures && includeDataSources.policies !== false) {
        const figureIds = context.figures.map(f => f.id)
        const { data: policies } = await supabase
          .from('figure_policy_positions')
          .select('*')
          .in('figure_id', figureIds)
          .limit(30)
        context.policies = policies || []
      }

    } catch (error) {
      console.error('Error gathering question context:', error)
    }

    return context
  }

  /**
   * Create questions from gathered context based on game mode
   */
  private static async createQuestionsFromContext(
    context: QuestionContext,
    options: EnhancedQuestionGenerationOptions
  ): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = []

    switch (options.gameMode) {
      case 'classic':
        questions.push(...await this.generateClassicModeQuestions(context, options))
        break
      case 'speed_round':
        questions.push(...await this.generateSpeedRoundQuestions(context, options))
        break
      case 'elimination':
        questions.push(...await this.generateEliminationQuestions(context, options))
        break
      case 'learning_lab':
        questions.push(...await this.generateLearningLabQuestions(context, options))
        break
    }

    return questions.slice(0, options.count)
  }

  /**
   * Generate Classic Mode questions with rich context
   */
  private static async generateClassicModeQuestions(
    context: QuestionContext,
    options: EnhancedQuestionGenerationOptions
  ): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = []

    // Figure-Organization Multiple Choice Questions
    if (context.figures && context.figureOrgs) {
      for (const figureOrg of context.figureOrgs.slice(0, 3)) {
        const figure = context.figures.find(f => f.id === figureOrg.figure_id)
        if (figure && figureOrg.role_title) {
          questions.push({
            topic_id: `figure_org_${figureOrg.id}`,
            question_number: questions.length + 1,
            question_type: 'multiple_choice',
            category: options.category,
            question: `What role did ${figure.full_name} hold in their career?`,
            option_a: figureOrg.role_title,
            option_b: this.generateDistractorRole(),
            option_c: this.generateDistractorRole(),
            option_d: this.generateDistractorRole(),
            correct_answer: 'option_a',
            hint: `Look for ${figure.full_name}'s career history`,
            explanation: `${figure.full_name} served as ${figureOrg.role_title} during their career.`,
            tags: ['figures', 'organizations', 'careers'],
            sources: (figureOrg.sources as any) || []
          })
        }
      }
    }

          // Event-Figure True/False Questions (simplified for now)
      if (context.events && context.figureEvents) {
        for (const event of context.events.slice(0, 2)) {
          questions.push({
            topic_id: `event_${event.topic_id}`,
            question_number: questions.length + 1,
            question_type: 'true_false',
            category: options.category,
            question: `The ${event.topic_title} event occurred in ${new Date(event.date).getFullYear()}.`,
            correct_answer: 'true',
            hint: 'Consider recent political events',
            explanation: `Yes, the ${event.topic_title} occurred on ${event.date}.`,
            tags: ['events', 'timeline'],
            sources: event.sources as any || []
          })
        }
      }

    return questions
  }

  /**
   * Generate Speed Round questions for quick recognition
   */
  private static async generateSpeedRoundQuestions(
    context: QuestionContext,
    options: EnhancedQuestionGenerationOptions
  ): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = []

    // Quick figure recognition
    if (context.figures) {
      for (const figure of context.figures.slice(0, 5)) {
        const currentPosition = figure.current_positions?.[0] || 'a government official'
        questions.push({
          topic_id: `speed_figure_${figure.id}`,
          question_number: questions.length + 1,
          question_type: 'true_false',
          category: options.category,
          question: `${figure.full_name} currently serves as ${currentPosition}.`,
          correct_answer: figure.current_positions && figure.current_positions.length > 0 ? 'true' : 'false',
          hint: 'Think about current government positions',
          explanation: `${figure.full_name} ${figure.current_positions && figure.current_positions.length > 0 ? 'does' : 'does not'} currently hold this position.`,
          tags: ['figures', 'current-events', 'speed'],
          sources: []
        })
      }
    }

    // Quick event dates
    if (context.events) {
      for (const event of context.events.slice(0, 5)) {
        const eventYear = new Date(event.date).getFullYear()
        questions.push({
          topic_id: `speed_event_${event.topic_id}`,
          question_number: questions.length + 1,
          question_type: 'multiple_choice',
          category: options.category,
          question: `In what year did the ${event.topic_title} occur?`,
          option_a: eventYear.toString(),
          option_b: (eventYear - 1).toString(),
          option_c: (eventYear + 1).toString(),
          option_d: (eventYear - 2).toString(),
          correct_answer: 'option_a',
          hint: 'Consider recent political timeline',
          explanation: `The ${event.topic_title} occurred in ${eventYear}.`,
          tags: ['events', 'timeline', 'speed'],
          sources: event.sources as any || []
        })
      }
    }

    return questions
  }

  /**
   * Generate Elimination questions with progressive difficulty
   */
  private static async generateEliminationQuestions(
    context: QuestionContext,
    options: EnhancedQuestionGenerationOptions
  ): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = []

    // Start easy: Basic figure identification
    if (context.figures) {
      const popularFigures = context.figures.filter(f => f.popularity_score && f.popularity_score > 70)
      for (const figure of popularFigures.slice(0, 3)) {
        questions.push({
          topic_id: `elimination_easy_${figure.id}`,
          question_number: questions.length + 1,
          question_type: 'multiple_choice',
          category: options.category,
          question: `What political party is ${figure.name} affiliated with?`,
          option_a: figure.party_affiliation || 'Independent',
          option_b: this.generateDistractorParty(figure.party_affiliation),
          option_c: this.generateDistractorParty(figure.party_affiliation),
          option_d: this.generateDistractorParty(figure.party_affiliation),
          correct_answer: 'option_a',
          hint: 'Consider their recent political activities',
          explanation: `${figure.name} is affiliated with the ${figure.party_affiliation || 'Independent'} party.`,
          tags: ['figures', 'parties', 'easy'],
          sources: []
        })
      }
    }

    // Medium: Complex policy connections
    if (context.policies && context.figures) {
      for (const policy of context.policies.slice(0, 3)) {
        const figure = context.figures.find(f => f.id === policy.figure_id)
        if (figure) {
          questions.push({
            topic_id: `elimination_medium_${policy.id}`,
            question_number: questions.length + 1,
            question_type: 'short_answer',
            category: options.category,
            question: `What is ${figure.name}'s position on ${policy.policy_area}?`,
            correct_answer: policy.position_description.split('.')[0], // First sentence
            hint: 'Consider their public statements and voting record',
            explanation: `${figure.name}'s position: ${policy.position_description}`,
            tags: ['policy', 'figures', 'medium'],
            sources: policy.sources as any || []
          })
        }
      }
    }

    // Hard: Multi-layered organization relationships
    if (context.figureOrgs && context.figures) {
      for (const figureOrg of context.figureOrgs.slice(0, 2)) {
        const figure = context.figures.find(f => f.id === figureOrg.figure_id)
        if (figure && figureOrg.organizations) {
          questions.push({
            topic_id: `elimination_hard_${figureOrg.id}`,
            question_number: questions.length + 1,
            question_type: 'ordering',
            category: options.category,
            question: `Order these career positions of ${figure.name} chronologically:`,
            correct_answer: 'See ordering items',
            hint: 'Consider the typical career progression in politics',
            explanation: `This reflects ${figure.name}'s actual career timeline.`,
            tags: ['figures', 'careers', 'hard'],
            sources: [],
            ordering_items: this.generateCareerOrderingItems(figure, context.figureOrgs)
          })
        }
      }
    }

    return questions
  }

  /**
   * Generate Learning Lab questions for collaborative learning
   */
  private static async generateLearningLabQuestions(
    context: QuestionContext,
    options: EnhancedQuestionGenerationOptions
  ): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = []

    // Complex crossword connecting figures, events, and organizations
    if (context.figures && context.events && context.figureOrgs) {
      questions.push({
        topic_id: `learning_crossword_${Date.now()}`,
        question_number: questions.length + 1,
        question_type: 'crossword',
        category: options.category,
        question: 'Complete this crossword connecting political figures, events, and organizations:',
        correct_answer: 'See crossword data',
        hint: 'Think about how these elements connect in recent political history',
        explanation: 'This crossword explores the interconnected nature of political actors and events.',
        tags: ['figures', 'events', 'organizations', 'connections'],
        sources: [],
        crossword_data: this.generatePoliticalCrossword(context)
      })
    }

    // Complex drag-and-drop timeline
    if (context.events && context.figureEvents) {
      questions.push({
        topic_id: `learning_timeline_${Date.now()}`,
        question_number: questions.length + 1,
        question_type: 'drag_and_drop',
        category: options.category,
        question: 'Arrange these political events in chronological order:',
        correct_answer: 'See drag items',
        hint: 'Consider the cause-and-effect relationships',
        explanation: 'Understanding the sequence of events helps reveal political patterns and causation.',
        tags: ['events', 'timeline', 'analysis'],
        sources: [],
        drag_items: this.generateTimelineDragItems(context.events, context.figureEvents)
      })
    }

    return questions
  }

  // Helper methods for generating distractors and complex question components

  private static generateDistractorRole(): string {
    const roles = ['Chief Executive Officer', 'Senior Advisor', 'Board Member', 'Consultant', 'Director']
    return roles[Math.floor(Math.random() * roles.length)]
  }

  private static generateDistractorParty(actualParty: string | null): string {
    const parties = ['Democratic', 'Republican', 'Independent', 'Green', 'Libertarian']
    const options = parties.filter(p => p !== actualParty)
    return options[Math.floor(Math.random() * options.length)]
  }

  private static generateCareerOrderingItems(figure: PublicFigure, figureOrgs: any[]): any[] {
    const figureCareers = figureOrgs.filter(fo => fo.figure_id === figure.id)
    return figureCareers.map((career, index) => ({
      id: career.id,
      content: `${career.role_title} at ${career.organizations?.name}`,
      correct_order: index + 1
    }))
  }

  private static generatePoliticalCrossword(context: QuestionContext): any {
    // Simplified crossword structure - in practice, this would be much more sophisticated
    return {
      size: { rows: 10, cols: 10 },
      layout: [
        "..........",
        "..........",
        "..........",
        "..........",
        "..........",
        "..........",
        "..........",
        "..........",
        "..........",
        ".........."
      ],
      words: [
        {
          number: 1,
          word: "PRESIDENT",
          clue: "Head of the executive branch",
          position: { row: 0, col: 0 },
          direction: "across" as const
        },
        {
          number: 2,
          word: "SENATE",
          clue: "Upper chamber of Congress",
          position: { row: 0, col: 0 },
          direction: "down" as const
        }
      ]
    }
  }

  private static generateTimelineDragItems(events: Event[], figureEvents: FigureEvent[]): any[] {
    const combined = [
      ...events.slice(0, 3).map(e => ({ type: 'event', data: e, date: e.date })),
      ...figureEvents.slice(0, 3).map(fe => ({ type: 'figure_event', data: fe, date: fe.event_date }))
    ]
    
    return combined
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item, index) => ({
        id: item.data.id || `${item.type}_${index}`,
        content: item.type === 'event' 
          ? item.data.topic_title 
          : item.data.event_title,
        category: item.type
      }))
  }
}

export default EnhancedQuizGenerator 