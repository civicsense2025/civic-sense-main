/**
 * Smart Scheduling Service for CivicSense
 * 
 * AI-powered study time optimization based on:
 * - User quiz performance patterns
 * - Time of day effectiveness
 * - Learning retention curves
 * - Calendar availability
 */

import React from 'react';
import { GoogleCalendarService } from './google-calendar-service';
import { supabase } from '../supabase';
import * as SecureStore from 'expo-secure-store';
import { SessionType } from '../database-constants';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface StudyPattern {
  userId: string;
  bestPerformanceHour: number; // 0-23
  averageSessionDuration: number; // minutes
  optimalGapBetweenSessions: number; // hours
  weekdayPreference: number[]; // 0-6 (Sun-Sat)
  retentionCurve: {
    day1: number;
    day3: number;
    day7: number;
    day14: number;
    day30: number;
  };
}

interface SmartScheduleRecommendation {
  recommendedTime: Date;
  confidence: number; // 0-1
  reasoning: string[];
  alternativeTimes: Date[];
  estimatedRetention: number;
  suggestedDuration: number;
}

interface PerformanceMetrics {
  timeOfDay: number;
  dayOfWeek: number;
  score: number;
  completionTime: number;
  streakDay: number;
  previousGap: number;
}

interface CalendarAvailability {
  date: Date;
  freeSlots: Array<{
    start: Date;
    end: Date;
    duration: number;
  }>;
}

// ============================================================================
// SMART SCHEDULING SERVICE CLASS
// ============================================================================

class SmartSchedulingServiceClass {
  private static instance: SmartSchedulingServiceClass;
  private userPattern: StudyPattern | null = null;
  private performanceHistory: PerformanceMetrics[] = [];

  constructor() {
    this.loadUserPattern();
  }

  public static getInstance(): SmartSchedulingServiceClass {
    if (!SmartSchedulingServiceClass.instance) {
      SmartSchedulingServiceClass.instance = new SmartSchedulingServiceClass();
    }
    return SmartSchedulingServiceClass.instance;
  }

  // ============================================================================
  // PATTERN ANALYSIS
  // ============================================================================

  /**
   * Analyze user's quiz performance to identify patterns
   */
  async analyzeUserPatterns(userId: string): Promise<StudyPattern> {
    try {
      // Fetch user's quiz history
      const { data: quizHistory, error } = await supabase
        .from('user_quiz_attempts')
        .select(`
          score,
          time_taken,
          completed_at,
          quiz_topic_id,
          question_responses
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Analyze performance by time of day
      const timePerformance = this.analyzeTimeOfDayPerformance(quizHistory || []);
      
      // Analyze performance by day of week
      const dayPreference = this.analyzeDayOfWeekPreference(quizHistory || []);
      
      // Calculate retention patterns
      const retentionCurve = await this.calculateRetentionCurve(userId);
      
      // Determine optimal session duration
      const avgDuration = this.calculateAverageSessionDuration(quizHistory || []);

      const pattern: StudyPattern = {
        userId,
        bestPerformanceHour: timePerformance.bestHour,
        averageSessionDuration: avgDuration,
        optimalGapBetweenSessions: 24, // Start with daily
        weekdayPreference: dayPreference,
        retentionCurve,
      };

      // Store pattern for future use
      await this.saveUserPattern(pattern);
      this.userPattern = pattern;

      return pattern;
    } catch (error) {
      console.error('Error analyzing user patterns:', error);
      // Return default pattern
      return this.getDefaultPattern(userId);
    }
  }

  /**
   * Analyze performance by time of day
   */
  private analyzeTimeOfDayPerformance(quizHistory: any[]): { bestHour: number; scores: Record<number, number[]> } {
    const hourlyScores: Record<number, number[]> = {};

    quizHistory.forEach(attempt => {
      const hour = new Date(attempt.completed_at).getHours();
      if (!hourlyScores[hour]) {
        hourlyScores[hour] = [];
      }
      hourlyScores[hour].push(attempt.score);
    });

    // Calculate average score for each hour
    let bestHour = 19; // Default to 7 PM
    let bestAverage = 0;

    Object.entries(hourlyScores).forEach(([hour, scores]) => {
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (average > bestAverage) {
        bestAverage = average;
        bestHour = parseInt(hour);
      }
    });

    return { bestHour, scores: hourlyScores };
  }

  /**
   * Analyze performance by day of week
   */
  private analyzeDayOfWeekPreference(quizHistory: any[]): number[] {
    const dayScores: Record<number, { total: number; count: number }> = {};

    quizHistory.forEach(attempt => {
      const day = new Date(attempt.completed_at).getDay();
      if (!dayScores[day]) {
        dayScores[day] = { total: 0, count: 0 };
      }
      dayScores[day].total += attempt.score;
      dayScores[day].count += 1;
    });

    // Sort days by average score
    const sortedDays = Object.entries(dayScores)
      .map(([day, stats]) => ({
        day: parseInt(day),
        average: stats.total / stats.count,
      }))
      .sort((a, b) => b.average - a.average)
      .map(item => item.day);

    // Ensure all days are represented
    for (let i = 0; i < 7; i++) {
      if (!sortedDays.includes(i)) {
        sortedDays.push(i);
      }
    }

    return sortedDays;
  }

  /**
   * Calculate retention curve based on spaced repetition
   */
  private async calculateRetentionCurve(userId: string): Promise<StudyPattern['retentionCurve']> {
    try {
      // Fetch quiz attempts with gaps
      const { data: attempts } = await supabase
        .from('user_quiz_attempts')
        .select('quiz_topic_id, score, completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: true });

      const topicAttempts: Record<string, Array<{ score: number; date: Date }>> = {};

      attempts?.forEach(attempt => {
        if (!attempt?.quiz_topic_id || typeof attempt.score !== 'number' || !attempt.completed_at) {
          return;
        }
        
        if (!topicAttempts[attempt.quiz_topic_id]) {
          topicAttempts[attempt.quiz_topic_id] = [];
        }
        topicAttempts[attempt.quiz_topic_id]?.push({
          score: attempt.score,
          date: new Date(attempt.completed_at),
        });
      });

      // Calculate retention for different intervals
      const retentionData: {
        day1: number[];
        day3: number[];
        day7: number[];
        day14: number[];
        day30: number[];
      } = {
        day1: [],
        day3: [],
        day7: [],
        day14: [],
        day30: [],
      };

      Object.values(topicAttempts).forEach(attempts => {
        for (let i = 1; i < attempts.length; i++) {
          const currentAttempt = attempts[i];
          const previousAttempt = attempts[i - 1];
          
          if (!currentAttempt?.date || !previousAttempt?.date || 
              typeof currentAttempt.score !== 'number' || typeof previousAttempt.score !== 'number') {
            continue;
          }
          
          const gap = Math.floor((currentAttempt.date.getTime() - previousAttempt.date.getTime()) / (1000 * 60 * 60 * 24));
          const retention = currentAttempt.score / previousAttempt.score;

          if (gap === 1) retentionData.day1.push(retention);
          else if (gap === 3) retentionData.day3.push(retention);
          else if (gap === 7) retentionData.day7.push(retention);
          else if (gap === 14) retentionData.day14.push(retention);
          else if (gap === 30) retentionData.day30.push(retention);
        }
      });

      // Calculate averages
      return {
        day1: this.average(retentionData.day1) || 0.9,
        day3: this.average(retentionData.day3) || 0.8,
        day7: this.average(retentionData.day7) || 0.7,
        day14: this.average(retentionData.day14) || 0.6,
        day30: this.average(retentionData.day30) || 0.5,
      };
    } catch (error) {
      console.error('Error calculating retention curve:', error);
      return {
        day1: 0.9,
        day3: 0.8,
        day7: 0.7,
        day14: 0.6,
        day30: 0.5,
      };
    }
  }

  /**
   * Calculate average session duration
   */
  private calculateAverageSessionDuration(quizHistory: any[]): number {
    const durations = quizHistory.map(attempt => attempt.time_taken).filter(Boolean);
    if (durations.length === 0) return 15; // Default to 15 minutes

    const avgSeconds = this.average(durations);
    return Math.min(Math.max(Math.round(avgSeconds / 60), 10), 30); // Between 10-30 minutes
  }

  // ============================================================================
  // SMART RECOMMENDATIONS
  // ============================================================================

  /**
   * Generate smart schedule recommendations
   */
  async generateRecommendations(
    userId: string,
    targetDate: Date = new Date(),
    options: {
      considerCalendar?: boolean;
      preferredDuration?: number;
      flexibilityHours?: number;
    } = {}
  ): Promise<SmartScheduleRecommendation> {
    // Get or analyze user pattern
    if (!this.userPattern || this.userPattern.userId !== userId) {
      this.userPattern = await this.analyzeUserPatterns(userId);
    }

    // Get calendar availability if requested
    let availability: CalendarAvailability[] = [];
    if (options.considerCalendar) {
      availability = await this.getCalendarAvailability(targetDate, 7);
    }

    // Calculate optimal time based on patterns
    const optimalTime = await this.calculateOptimalTime(
      targetDate,
      this.userPattern,
      availability,
      options.flexibilityHours || 2
    );

    // Generate alternative times
    const alternatives = this.generateAlternativeTimes(
      optimalTime.recommendedTime,
      this.userPattern,
      availability
    );

    // Estimate retention based on timing
    const retention = this.estimateRetention(
      optimalTime.recommendedTime,
      this.userPattern
    );

    return {
      recommendedTime: optimalTime.recommendedTime,
      confidence: optimalTime.confidence,
      reasoning: optimalTime.reasoning,
      alternativeTimes: alternatives,
      estimatedRetention: retention,
      suggestedDuration: options.preferredDuration || this.userPattern.averageSessionDuration,
    };
  }

  /**
   * Calculate optimal study time
   */
  private async calculateOptimalTime(
    targetDate: Date,
    pattern: StudyPattern,
    availability: CalendarAvailability[],
    flexibilityHours: number
  ): Promise<{ recommendedTime: Date; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    let confidence = 0;

    // Start with user's best performance hour
    const baseTime = new Date(targetDate);
    baseTime.setHours(pattern.bestPerformanceHour, 0, 0, 0);
    
    reasoning.push(`Based on your past performance, you typically do best at ${pattern.bestPerformanceHour}:00`);
    confidence += 0.3;

    // Check if it's a preferred day
    const dayOfWeek = targetDate.getDay();
    const dayPreferenceIndex = pattern.weekdayPreference.indexOf(dayOfWeek);
    if (dayPreferenceIndex < 3) {
      reasoning.push(`${this.getDayName(dayOfWeek)} is one of your most productive days`);
      confidence += 0.2;
    }

    // Check calendar conflicts
    if (availability.length > 0) {
      const dayAvailability = availability.find(a => 
        a.date.toDateString() === targetDate.toDateString()
      );

      if (dayAvailability) {
        const requestedSlot = {
          start: baseTime,
          end: new Date(baseTime.getTime() + pattern.averageSessionDuration * 60000),
        };

        const hasConflict = !dayAvailability.freeSlots.some(slot => 
          slot.start <= requestedSlot.start && slot.end >= requestedSlot.end
        );

        if (hasConflict) {
          // Find nearest available slot
          const nearestSlot = this.findNearestAvailableSlot(
            requestedSlot,
            dayAvailability.freeSlots,
            flexibilityHours
          );

          if (nearestSlot) {
            baseTime.setHours(nearestSlot.start.getHours(), nearestSlot.start.getMinutes());
            reasoning.push(`Adjusted time to avoid calendar conflicts`);
            confidence -= 0.1;
          }
        } else {
          reasoning.push(`No calendar conflicts at this time`);
          confidence += 0.2;
        }
      }
    }

    // Consider retention curve
    const lastAttempt = await this.getLastStudyTime(pattern.userId);
    if (lastAttempt) {
      const hoursSince = (baseTime.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60);
      if (hoursSince >= 20 && hoursSince <= 28) {
        reasoning.push(`Perfect timing for spaced repetition (${Math.round(hoursSince)} hours since last session)`);
        confidence += 0.3;
      }
    }

    return {
      recommendedTime: baseTime,
      confidence: Math.min(confidence, 1),
      reasoning,
    };
  }

  /**
   * Get calendar availability from Google Calendar
   */
  private async getCalendarAvailability(
    startDate: Date,
    days: number
  ): Promise<CalendarAvailability[]> {
    try {
      // This would integrate with Google Calendar API
      // For now, return mock data
      const availability: CalendarAvailability[] = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        // Mock free slots (in production, fetch from Google Calendar)
        const freeSlots = [
          {
            start: new Date(date.setHours(7, 0, 0, 0)),
            end: new Date(date.setHours(9, 0, 0, 0)),
            duration: 120,
          },
          {
            start: new Date(date.setHours(12, 0, 0, 0)),
            end: new Date(date.setHours(13, 0, 0, 0)),
            duration: 60,
          },
          {
            start: new Date(date.setHours(18, 0, 0, 0)),
            end: new Date(date.setHours(22, 0, 0, 0)),
            duration: 240,
          },
        ];

        availability.push({ date, freeSlots });
      }

      return availability;
    } catch (error) {
      console.error('Error fetching calendar availability:', error);
      return [];
    }
  }

  // ============================================================================
  // PROGRESS-BASED ADJUSTMENTS
  // ============================================================================

  /**
   * Adjust schedule based on quiz performance
   */
  async adjustScheduleBasedOnPerformance(
    userId: string,
    recentPerformance: {
      topicId: string;
      score: number;
      timeSpent: number;
      mistakes: string[];
    }
  ): Promise<void> {
    try {
      // Load user pattern
      if (!this.userPattern || this.userPattern.userId !== userId) {
        this.userPattern = await this.analyzeUserPatterns(userId);
      }

      // Analyze performance
      const needsMorePractice = recentPerformance.score < 70;
      const tookTooLong = recentPerformance.timeSpent > this.userPattern.averageSessionDuration * 60 * 1.5;
      const hasRecurringMistakes = await this.checkRecurringMistakes(userId, recentPerformance.mistakes);

      // Generate adjusted schedule
      if (needsMorePractice || hasRecurringMistakes) {
        // Schedule follow-up session sooner
        const followUpTime = new Date();
        followUpTime.setHours(followUpTime.getHours() + 6); // 6 hours later

        await this.scheduleAdaptiveSession({
          userId,
          topicId: recentPerformance.topicId,
          sessionType: 'reinforcement',
          suggestedTime: followUpTime,
          duration: 10, // Shorter reinforcement session
          focus: recentPerformance.mistakes,
        });
      }

      if (tookTooLong) {
        // Adjust future session durations
        this.userPattern.averageSessionDuration = Math.max(
          this.userPattern.averageSessionDuration - 5,
          10
        );
        await this.saveUserPattern(this.userPattern);
      }
    } catch (error) {
      console.error('Error adjusting schedule:', error);
    }
  }

  /**
   * Schedule adaptive learning session
   */
  private async scheduleAdaptiveSession(params: {
    userId: string;
    topicId: string;
    sessionType: SessionType;
    suggestedTime: Date;
    duration: number;
    focus?: string[];
  }): Promise<void> {
    const event = {
      title: this.getSessionTitle(params.sessionType),
      description: this.getSessionDescription(params.sessionType, params.focus),
      startTime: params.suggestedTime,
      duration: params.duration,
      metadata: {
        type: 'adaptive',
        topicId: params.topicId,
        focusAreas: params.focus,
      },
    };

    // Create calendar event
    await GoogleCalendarService.createEvents([event]);

    // Store scheduled session
    await supabase.from('scheduled_sessions').insert({
      user_id: params.userId,
      topic_id: params.topicId,
      session_type: params.sessionType,
      scheduled_time: params.suggestedTime.toISOString(),
      duration_minutes: params.duration,
      focus_areas: params.focus,
      created_at: new Date().toISOString(),
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'Unknown';
  }

  private getDefaultPattern(userId: string): StudyPattern {
    return {
      userId,
      bestPerformanceHour: 19, // 7 PM
      averageSessionDuration: 15,
      optimalGapBetweenSessions: 24,
      weekdayPreference: [0, 6, 5, 4, 3, 2, 1], // Prefer weekends
      retentionCurve: {
        day1: 0.9,
        day3: 0.8,
        day7: 0.7,
        day14: 0.6,
        day30: 0.5,
      },
    };
  }

  private findNearestAvailableSlot(
    requested: { start: Date; end: Date },
    freeSlots: Array<{ start: Date; end: Date; duration: number }>,
    flexibilityHours: number
  ): { start: Date; end: Date } | null {
    const requestedDuration = requested.end.getTime() - requested.start.getTime();
    const flexibilityMs = flexibilityHours * 60 * 60 * 1000;

    let nearestSlot = null;
    let minDistance = Infinity;

    freeSlots.forEach(slot => {
      if (slot.duration * 60000 >= requestedDuration) {
        const distance = Math.abs(slot.start.getTime() - requested.start.getTime());
        if (distance <= flexibilityMs && distance < minDistance) {
          minDistance = distance;
          nearestSlot = slot;
        }
      }
    });

    return nearestSlot;
  }

  private async getLastStudyTime(userId: string): Promise<Date | null> {
    try {
      const { data } = await supabase
        .from('user_quiz_attempts')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      return data ? new Date(data.completed_at) : null;
    } catch {
      return null;
    }
  }

  private estimateRetention(studyTime: Date, pattern: StudyPattern): number {
    // Base retention
    let retention = 0.7;

    // Boost for optimal time
    const hour = studyTime.getHours();
    if (hour === pattern.bestPerformanceHour) {
      retention += 0.15;
    } else if (Math.abs(hour - pattern.bestPerformanceHour) <= 2) {
      retention += 0.1;
    }

    // Boost for preferred days
    const day = studyTime.getDay();
    const dayPreference = pattern.weekdayPreference.indexOf(day);
    if (dayPreference < 3) {
      retention += 0.1;
    }

    return Math.min(retention, 0.95);
  }

  private generateAlternativeTimes(
    primaryTime: Date,
    pattern: StudyPattern,
    availability: CalendarAvailability[]
  ): Date[] {
    const alternatives: Date[] = [];

    // Morning alternative
    const morning = new Date(primaryTime);
    morning.setHours(8, 0, 0, 0);
    alternatives.push(morning);

    // Lunch alternative
    const lunch = new Date(primaryTime);
    lunch.setHours(12, 30, 0, 0);
    alternatives.push(lunch);

    // Evening alternative
    const evening = new Date(primaryTime);
    evening.setHours(20, 0, 0, 0);
    alternatives.push(evening);

    // Filter based on availability
    return alternatives.filter(time => time.getTime() !== primaryTime.getTime());
  }

  private async checkRecurringMistakes(userId: string, mistakes: string[]): Promise<boolean> {
    // Check if similar mistakes occurred in recent attempts
    // This would analyze mistake patterns from the database
    return mistakes.length > 3;
  }

  private getSessionTitle(type: SessionType): string {
    switch (type) {
      case 'regular_quiz':
        return '📝 CivicSense Quiz Session';
      case 'reinforcement':
        return '🔧 CivicSense Reinforcement Session';
      case 'review':
        return '📖 CivicSense Review Session';
      case 'challenge':
        return '🎯 CivicSense Challenge Session';
      case 'assessment':
        return '📊 CivicSense Assessment Session';
    }
  }

  private getSessionDescription(type: SessionType, focus?: string[]): string {
    let description: string;
    
    switch (type) {
      case 'regular_quiz':
        description = 'Interactive quiz session to test your knowledge. ';
        break;
      case 'reinforcement':
        description = 'Adaptive learning session based on your recent performance. ';
        break;
      case 'review':
        description = 'Review session to strengthen your understanding. ';
        break;
      case 'challenge':
        description = 'Challenge session to push your knowledge limits. ';
        break;
      case 'assessment':
        description = 'Comprehensive assessment to evaluate your progress. ';
        break;
      default:
        description = 'Learning session. ';
    }
    
    if (focus && focus.length > 0) {
      description += `Focus areas: ${focus.join(', ')}`;
    }

    return description;
  }

  private async saveUserPattern(pattern: StudyPattern): Promise<void> {
    await SecureStore.setItemAsync(
      `user_pattern_${pattern.userId}`,
      JSON.stringify(pattern)
    );
  }

  private async loadUserPattern(): Promise<void> {
    // Load from secure storage if available
    // Implementation depends on current user context
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const SmartSchedulingService = SmartSchedulingServiceClass.getInstance();

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook for using smart scheduling in components
 */
export function useSmartScheduling(userId: string) {
  const [recommendations, setRecommendations] = React.useState<SmartScheduleRecommendation | null>(null);
  const [loading, setLoading] = React.useState(false);

  const generateSchedule = React.useCallback(async (options?: {
    targetDate?: Date;
    considerCalendar?: boolean;
    preferredDuration?: number;
  }) => {
    setLoading(true);
    try {
      const recs = await SmartSchedulingService.generateRecommendations(
        userId,
        options?.targetDate,
        options
      );
      setRecommendations(recs);
    } catch (error) {
      console.error('Error generating schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const adjustForPerformance = React.useCallback(async (performance: {
    topicId: string;
    score: number;
    timeSpent: number;
    mistakes: string[];
  }) => {
    await SmartSchedulingService.adjustScheduleBasedOnPerformance(userId, performance);
  }, [userId]);

  return {
    recommendations,
    loading,
    generateSchedule,
    adjustForPerformance,
  };
} 