// Assessment Framework Types

export type IndicatorLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';
export type IndicatorStatus = 'NOT_YET' | 'PARTIAL' | 'TRIGGERED';

export interface IndicatorCategory {
  id: string;
  frameworkId: string;
  name: string;
  slug: string;
  description: string;
  severityLevel: number;
  thresholdDescription: string;
  displayOrder: number;
}

export interface Indicator {
  id: string;
  frameworkId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  evidenceThreshold: string;
  measurementType: 'binary' | 'scale';
  measurementConfig: {
    options: string[];
  };
  weight: number;
  displayOrder: number;
  historicalContext: string;
  civicEducationAngle: string;
  status: IndicatorStatus;
  currentStatus: string;
  lastUpdated: string;
  sources: IndicatorSource[];
}

export interface IndicatorSource {
  id: string;
  indicatorId: string;
  title: string;
  url: string;
  type: 'news' | 'academic' | 'government' | 'legal' | 'other';
  publicationDate: string;
  relevanceScore: number;
  summary: string;
}

export interface TopicIndicatorMapping {
  id: string;
  topicId: string;
  indicatorId: string;
  relevanceScore: number; // 0-100
  evidenceStrength: 'strong' | 'moderate' | 'weak';
  notes: string;
  lastUpdated: string;
}

export interface AssessmentFramework {
  id: string;
  name: string;
  slug: string;
  description: string;
  frameworkType: string;
  scoringSystem: {
    type: string;
    scale: string;
  };
  methodologyUrl?: string;
  academicSources?: string[];
  createdBy: string;
  lastUpdated: string;
  categories: IndicatorCategory[];
  indicators: Indicator[];
  topicMappings: TopicIndicatorMapping[];
  metadata: {
    totalIndicators: number;
    triggeredCount: number;
    partialCount: number;
    notYetCount: number;
    overallThreatLevel: number; // 0-100
  };
}

export interface IndicatorUpdate {
  indicatorId: string;
  oldStatus: IndicatorStatus;
  newStatus: IndicatorStatus;
  reason: string;
  sources: IndicatorSource[];
  date: string;
} 