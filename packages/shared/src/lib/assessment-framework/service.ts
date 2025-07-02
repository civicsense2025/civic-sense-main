import { supabase } from '../lib/supabase';
import type {
  AssessmentFramework,
  Indicator,
  IndicatorSource,
  IndicatorStatus,
  TopicIndicatorMapping,
  IndicatorUpdate,
  IndicatorCategory
} from './types';

export class AssessmentFrameworkService {
  /**
   * Get the current assessment framework with all indicators and mappings
   */
  async getCurrentFramework(slug: string = 'civicsense_authoritarianism'): Promise<AssessmentFramework | null> {
    try {
      // Get framework
      const { data: framework, error: frameworkError } = await supabase
        .from('assessment_frameworks')
        .select('*')
        .eq('framework_slug', slug)
        .eq('is_active', true)
        .single();

      if (frameworkError || !framework) {
        console.warn('Framework not found:', frameworkError);
        return null;
      }

      // Get categories
      const { data: categories, error: categoriesError } = await supabase
        .from('indicator_categories')
        .select('*')
        .eq('framework_id', framework.id)
        .order('display_order');

      if (categoriesError) {
        console.warn('Categories error:', categoriesError);
      }

      // Get indicators
      const { data: indicators, error: indicatorsError } = await supabase
        .from('indicators')
        .select('*')
        .eq('framework_id', framework.id)
        .eq('is_active', true)
        .order('display_order');

      if (indicatorsError) {
        console.warn('Indicators error:', indicatorsError);
      }

      // Get content links (topic mappings)
      const { data: contentLinks, error: linksError } = await supabase
        .from('indicator_content_links')
        .select('*')
        .in('indicator_id', indicators?.map(i => i.id) || [])
        .eq('content_type', 'question_topic');

      if (linksError) {
        console.warn('Content links error:', linksError);
      }

      // Transform data to match our types
      const transformedFramework: AssessmentFramework = {
        id: framework.id,
        name: framework.framework_name,
        slug: framework.framework_slug,
        description: framework.description,
        frameworkType: framework.framework_type,
        scoringSystem: framework.scoring_system,
        methodologyUrl: framework.methodology_url,
        academicSources: framework.academic_sources,
        createdBy: framework.created_by,
        lastUpdated: framework.updated_at,
        categories: (categories || []).map(c => ({
          id: c.id,
          frameworkId: c.framework_id,
          name: c.category_name,
          slug: c.category_slug,
          description: c.description || '',
          severityLevel: c.severity_level || 1,
          thresholdDescription: c.threshold_description || '',
          displayOrder: c.display_order || 1
        })),
        indicators: (indicators || []).map(i => ({
          id: i.id,
          frameworkId: i.framework_id,
          categoryId: i.category_id,
          name: i.indicator_name,
          slug: i.indicator_slug,
          description: i.description,
          evidenceThreshold: i.evidence_threshold || '',
          measurementType: i.measurement_type as 'binary' | 'scale',
          measurementConfig: i.measurement_config,
          weight: i.weight || 1.0,
          displayOrder: i.display_order || 1,
          historicalContext: i.historical_context || '',
          civicEducationAngle: i.civic_education_angle || '',
          status: i.status as IndicatorStatus,
          currentStatus: i.current_status || '',
          lastUpdated: i.updated_at,
          sources: [] // TODO: Add sources when available
        })),
        topicMappings: (contentLinks || []).map(link => ({
          id: link.id,
          topicId: link.content_id,
          indicatorId: link.indicator_id,
          relevanceScore: link.relevance_score || 0,
          evidenceStrength: 'moderate' as const, // Default value
          notes: '',
          lastUpdated: link.created_at
        })),
        metadata: {
          totalIndicators: indicators?.length || 0,
          triggeredCount: indicators?.filter(i => i.status === 'TRIGGERED').length || 0,
          partialCount: indicators?.filter(i => i.status === 'PARTIAL').length || 0,
          notYetCount: indicators?.filter(i => i.status === 'NOT_YET').length || 0,
          overallThreatLevel: this.calculateThreatLevel(indicators || [])
        }
      };

      return transformedFramework;
    } catch (error) {
      console.error('Error fetching framework:', error);
      return null;
    }
  }

  /**
   * Get all available frameworks
   */
  async getAllFrameworks(): Promise<AssessmentFramework[]> {
    try {
      const { data: frameworks, error } = await supabase
        .from('assessment_frameworks')
        .select('*')
        .eq('is_active', true)
        .order('framework_name');

      if (error || !frameworks) {
        console.warn('Error fetching frameworks:', error);
        return [];
      }

      // For now, return basic framework info without full details
      return frameworks.map(f => ({
        id: f.id,
        name: f.framework_name,
        slug: f.framework_slug,
        description: f.description,
        frameworkType: f.framework_type,
        scoringSystem: f.scoring_system,
        methodologyUrl: f.methodology_url,
        academicSources: f.academic_sources,
        createdBy: f.created_by,
        lastUpdated: f.updated_at,
        categories: [],
        indicators: [],
        topicMappings: [],
        metadata: {
          totalIndicators: 0,
          triggeredCount: 0,
          partialCount: 0,
          notYetCount: 0,
          overallThreatLevel: 0
        }
      }));
    } catch (error) {
      console.error('Error fetching all frameworks:', error);
      return [];
    }
  }

  /**
   * Get a single indicator with its details
   */
  async getIndicator(indicatorId: string): Promise<Indicator | null> {
    try {
      const { data: indicator, error } = await supabase
        .from('indicators')
        .select('*')
        .eq('id', indicatorId)
        .single();

      if (error || !indicator) {
        console.warn('Indicator not found:', error);
        return null;
      }

      return {
        id: indicator.id,
        frameworkId: indicator.framework_id,
        categoryId: indicator.category_id,
        name: indicator.indicator_name,
        slug: indicator.indicator_slug,
        description: indicator.description,
        evidenceThreshold: indicator.evidence_threshold || '',
        measurementType: indicator.measurement_type as 'binary' | 'scale',
        measurementConfig: indicator.measurement_config,
        weight: indicator.weight || 1.0,
        displayOrder: indicator.display_order || 1,
        historicalContext: indicator.historical_context || '',
        civicEducationAngle: indicator.civic_education_angle || '',
        status: indicator.status as IndicatorStatus,
        currentStatus: indicator.current_status || '',
        lastUpdated: indicator.updated_at,
        sources: [] // TODO: Add sources when available
      };
    } catch (error) {
      console.error('Error fetching indicator:', error);
      return null;
    }
  }

  /**
   * Update an indicator's status with evidence
   */
  async updateIndicatorStatus(update: IndicatorUpdate): Promise<void> {
    try {
      const { error } = await supabase
        .from('indicators')
        .update({
          status: update.newStatus,
          current_status: update.reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.indicatorId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating indicator status:', error);
      throw error;
    }
  }

  /**
   * Map a topic to an indicator with relevance score
   */
  async mapTopicToIndicator(mapping: TopicIndicatorMapping): Promise<void> {
    try {
      const { error } = await supabase
        .from('indicator_content_links')
        .upsert({
          id: mapping.id,
          indicator_id: mapping.indicatorId,
          content_type: 'question_topic',
          content_id: mapping.topicId,
          relationship_type: 'explanation',
          relevance_score: Math.min(5, Math.max(1, Math.round(mapping.relevanceScore / 20))), // Convert 0-100 to 1-5
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error mapping topic to indicator:', error);
      throw error;
    }
  }

  /**
   * Get all topics related to an indicator
   */
  async getRelatedTopics(indicatorId: string): Promise<any[]> {
    try {
      const { data: contentLinks, error } = await supabase
        .from('indicator_content_links')
        .select('content_id, relevance_score')
        .eq('indicator_id', indicatorId)
        .eq('content_type', 'question_topic')
        .order('relevance_score', { ascending: false });

      if (error || !contentLinks) {
        console.warn('Error fetching related topics:', error);
        return [];
      }

      // Get topic details from question_topics table
      const topicIds = contentLinks.map(link => link.content_id);
      if (topicIds.length === 0) return [];

      const { data: topics, error: topicsError } = await supabase
        .from('question_topics')
        .select('topic_id, topic_title, description, emoji')
        .in('topic_id', topicIds);

      if (topicsError || !topics) {
        console.warn('Error fetching topic details:', topicsError);
        return [];
      }

      // Combine data
      return topics.map(topic => {
        const link = contentLinks.find(l => l.content_id === topic.topic_id);
        return {
          id: topic.topic_id,
          title: topic.topic_title,
          description: topic.description,
          emoji: topic.emoji,
          relevanceScore: (link?.relevance_score || 1) * 20, // Convert 1-5 back to 0-100
          slug: topic.topic_id // Use topic_id as slug for now
        };
      });
    } catch (error) {
      console.error('Error fetching related topics:', error);
      return [];
    }
  }

  /**
   * Get indicator update history (placeholder for now)
   */
  async getIndicatorHistory(indicatorId: string): Promise<IndicatorUpdate[]> {
    // TODO: Implement when we add indicator history tracking
    return [];
  }

  /**
   * Add a new source to an indicator (placeholder for now)
   */
  async addIndicatorSource(indicatorId: string, source: Omit<IndicatorSource, 'id' | 'indicatorId'>): Promise<void> {
    // TODO: Implement when we add indicator sources
    console.log('Adding source to indicator:', indicatorId, source);
  }

  /**
   * Calculate overall threat level based on triggered indicators
   */
  private calculateThreatLevel(indicators: any[]): number {
    if (indicators.length === 0) return 0;
    
    const triggeredCount = indicators.filter(i => i.status === 'TRIGGERED').length;
    const partialCount = indicators.filter(i => i.status === 'PARTIAL').length;
    
    // Calculate percentage with partial indicators counting as 0.5
    const effectiveTriggered = triggeredCount + (partialCount * 0.5);
    const percentage = (effectiveTriggered / indicators.length) * 100;
    
    return Math.round(percentage);
  }
}

// Export singleton instance
export const assessmentFrameworkService = new AssessmentFrameworkService(); 