/**
 * Calendar Analytics Service
 * 
 * Tracks and analyzes study patterns from calendar data:
 * - Study time tracking across calendar events
 * - Performance correlation with study habits
 * - Insights and recommendations
 * - Progress visualization data
 */

import React from 'react';
import { GoogleCalendarService } from './google-calendar-service';
import { supabase } from '../supabase';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInMinutes, format } from 'date-fns';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface StudyTimeAnalytics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalMinutes: number;
  averageSessionLength: number;
  sessionsCompleted: number;
  sessionsScheduled: number;
  completionRate: number;
  topicBreakdown: TopicStudyTime[];
  dailyDistribution: DailyStudyTime[];
  hourlyHeatmap: HourlyHeatmap;
  insights: StudyInsight[];
}

interface TopicStudyTime {
  topicId: string;
  topicName: string;
  totalMinutes: number;
  sessionCount: number;
  averageScore?: number;
  improvement?: number;
}

interface DailyStudyTime {
  date: string;
  minutes: number;
  sessions: number;
  completed: boolean;
  score?: number;
}

interface HourlyHeatmap {
  data: Array<{
    hour: number;
    dayOfWeek: number;
    intensity: number; // 0-1
    minutes: number;
  }>;
  mostProductiveHour: number;
  mostProductiveDay: number;
}

interface StudyInsight {
  type: 'achievement' | 'suggestion' | 'warning' | 'trend';
  title: string;
  description: string;
  metric?: {
    value: number;
    unit: string;
    change?: number;
  };
  actionable?: {
    action: string;
    link?: string;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  attendees?: string[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  eventType: 'quiz' | 'study' | 'review' | 'group' | 'other';
}

interface StudyGoal {
  userId: string;
  type: 'daily' | 'weekly' | 'monthly';
  targetMinutes: number;
  currentMinutes: number;
  progress: number;
  streakDays?: number;
  lastCompletedDate?: Date;
}

// ============================================================================
// CALENDAR ANALYTICS SERVICE CLASS
// ============================================================================

class CalendarAnalyticsServiceClass {
  private static instance: CalendarAnalyticsServiceClass;
  private cachedAnalytics: Map<string, StudyTimeAnalytics> = new Map();

  constructor() {}

  public static getInstance(): CalendarAnalyticsServiceClass {
    if (!CalendarAnalyticsServiceClass.instance) {
      CalendarAnalyticsServiceClass.instance = new CalendarAnalyticsServiceClass();
    }
    return CalendarAnalyticsServiceClass.instance;
  }

  // ============================================================================
  // ANALYTICS GENERATION
  // ============================================================================

  /**
   * Generate comprehensive study time analytics
   */
  async generateAnalytics(
    userId: string,
    period: StudyTimeAnalytics['period'] = 'weekly',
    customRange?: { start: Date; end: Date }
  ): Promise<StudyTimeAnalytics> {
    try {
      // Determine date range
      const { startDate, endDate } = customRange || this.getDateRange(period);

      // Check cache
      const cacheKey = `${userId}-${period}-${startDate.toISOString()}`;
      const cached = this.cachedAnalytics.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        return cached;
      }

      // Fetch calendar events
      const events = await this.fetchCalendarEvents(userId, startDate, endDate);

      // Fetch quiz performance data
      const performance = await this.fetchQuizPerformance(userId, startDate, endDate);

      // Calculate analytics
      const analytics: StudyTimeAnalytics = {
        userId,
        period,
        startDate,
        endDate,
        totalMinutes: this.calculateTotalMinutes(events),
        averageSessionLength: this.calculateAverageSessionLength(events),
        sessionsCompleted: events.filter(e => e.status === 'confirmed').length,
        sessionsScheduled: events.length,
        completionRate: this.calculateCompletionRate(events),
        topicBreakdown: await this.analyzeTopicBreakdown(events, performance),
        dailyDistribution: this.analyzeDailyDistribution(events, startDate, endDate),
        hourlyHeatmap: this.generateHourlyHeatmap(events),
        insights: await this.generateInsights(userId, events, performance),
      };

      // Cache results
      this.cachedAnalytics.set(cacheKey, analytics);

      return analytics;
    } catch (error) {
      console.error('Error generating analytics:', error);
      throw error;
    }
  }

  /**
   * Track study goals and progress
   */
  async trackStudyGoals(userId: string): Promise<StudyGoal[]> {
    try {
      // Fetch user's study goals
      const { data: goals } = await supabase
        .from('study_goals')
        .select('*')
        .eq('user_id', userId);

      if (!goals || goals.length === 0) {
        // Create default goals
        return this.createDefaultGoals(userId);
      }

      // Update progress for each goal
      const updatedGoals: StudyGoal[] = [];

      for (const goal of goals) {
        const analytics = await this.generateAnalytics(userId, goal.type);
        
        const updatedGoal: StudyGoal = {
          ...goal,
          currentMinutes: analytics.totalMinutes,
          progress: Math.min((analytics.totalMinutes / goal.targetMinutes) * 100, 100),
          streakDays: await this.calculateStreak(userId),
          lastCompletedDate: analytics.totalMinutes >= goal.targetMinutes ? new Date() : goal.lastCompletedDate,
        };

        updatedGoals.push(updatedGoal);

        // Update in database
        await supabase
          .from('study_goals')
          .update({
            current_minutes: updatedGoal.currentMinutes,
            progress: updatedGoal.progress,
            streak_days: updatedGoal.streakDays,
            last_completed_date: updatedGoal.lastCompletedDate,
          })
          .eq('id', goal.id);
      }

      return updatedGoals;
    } catch (error) {
      console.error('Error tracking study goals:', error);
      return [];
    }
  }

  /**
   * Get study time trends over time
   */
  async getStudyTrends(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
    data: Array<{ period: string; minutes: number; sessions: number }>;
    forecast: Array<{ period: string; predictedMinutes: number }>;
  }> {
    try {
      const periods = this.getPeriodRanges(timeframe);
      const data: Array<{ period: string; minutes: number; sessions: number }> = [];

      // Collect historical data
      for (const period of periods) {
        const events = await this.fetchCalendarEvents(userId, period.start, period.end);
        data.push({
          period: format(period.start, 'MMM d'),
          minutes: this.calculateTotalMinutes(events),
          sessions: events.length,
        });
      }

      // Calculate trend
      const trend = this.calculateTrend(data.map(d => d.minutes));
      const changePercent = this.calculateChangePercent(data);

      // Generate forecast
      const forecast = this.generateForecast(data);

      return {
        trend,
        changePercent,
        data,
        forecast,
      };
    } catch (error) {
      console.error('Error getting study trends:', error);
      throw error;
    }
  }

  // ============================================================================
  // CORRELATION ANALYSIS
  // ============================================================================

  /**
   * Analyze correlation between study time and performance
   */
  async analyzeStudyPerformanceCorrelation(userId: string): Promise<{
    correlation: number;
    optimalStudyTime: number;
    diminishingReturnsPoint: number;
    recommendations: string[];
  }> {
    try {
      // Fetch study sessions and quiz scores over past 3 months
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const events = await this.fetchCalendarEvents(userId, startDate, new Date());
      const performance = await this.fetchQuizPerformance(userId, startDate, new Date());

      // Group by week and calculate correlation
      const weeklyData = this.groupByWeek(events, performance);
      const correlation = this.calculateCorrelation(
        weeklyData.map(w => w.studyMinutes),
        weeklyData.map(w => w.averageScore)
      );

      // Find optimal study time
      const optimalStudyTime = this.findOptimalStudyTime(weeklyData);
      const diminishingReturnsPoint = this.findDiminishingReturns(weeklyData);

      // Generate recommendations
      const recommendations = this.generateStudyRecommendations(
        correlation,
        optimalStudyTime,
        diminishingReturnsPoint,
        weeklyData
      );

      return {
        correlation,
        optimalStudyTime,
        diminishingReturnsPoint,
        recommendations,
      };
    } catch (error) {
      console.error('Error analyzing correlation:', error);
      throw error;
    }
  }

  // ============================================================================
  // EXPORT AND REPORTING
  // ============================================================================

  /**
   * Export analytics data for external use
   */
  async exportAnalytics(
    userId: string,
    format: 'json' | 'csv' | 'pdf',
    dateRange: { start: Date; end: Date }
  ): Promise<Blob> {
    try {
      const analytics = await this.generateAnalytics(userId, 'monthly', dateRange);

      switch (format) {
        case 'json':
          return new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
        
        case 'csv':
          return this.generateCSV(analytics);
        
        case 'pdf':
          return this.generatePDFReport(analytics);
        
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async fetchCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    // In production, this would fetch from Google Calendar API
    // For now, fetch from our database
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    return (data || []).map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      description: event.description,
      status: event.status,
      eventType: this.categorizeEvent(event.title, event.description),
    }));
  }

  private async fetchQuizPerformance(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: Date; score: number; topicId: string }>> {
    const { data } = await supabase
      .from('user_quiz_attempts')
      .select('completed_at, score, quiz_topic_id')
      .eq('user_id', userId)
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString());

    return (data || []).map(attempt => ({
      date: new Date(attempt.completed_at),
      score: attempt.score,
      topicId: attempt.quiz_topic_id,
    }));
  }

  private calculateTotalMinutes(events: CalendarEvent[]): number {
    return events.reduce((total, event) => {
      if (event.status === 'confirmed') {
        return total + differenceInMinutes(event.end, event.start);
      }
      return total;
    }, 0);
  }

  private calculateAverageSessionLength(events: CalendarEvent[]): number {
    const confirmedEvents = events.filter(e => e.status === 'confirmed');
    if (confirmedEvents.length === 0) return 0;

    const totalMinutes = this.calculateTotalMinutes(confirmedEvents);
    return Math.round(totalMinutes / confirmedEvents.length);
  }

  private calculateCompletionRate(events: CalendarEvent[]): number {
    if (events.length === 0) return 0;
    const completed = events.filter(e => e.status === 'confirmed').length;
    return Math.round((completed / events.length) * 100);
  }

  private async analyzeTopicBreakdown(
    events: CalendarEvent[],
    performance: Array<{ date: Date; score: number; topicId: string }>
  ): Promise<TopicStudyTime[]> {
    const topicMap = new Map<string, TopicStudyTime>();

    // Aggregate study time by topic
    for (const event of events) {
      const topicId = this.extractTopicId(event);
      if (!topicId) continue;

      const existing = topicMap.get(topicId) || {
        topicId,
        topicName: await this.getTopicName(topicId),
        totalMinutes: 0,
        sessionCount: 0,
      };

      existing.totalMinutes += differenceInMinutes(event.end, event.start);
      existing.sessionCount += 1;
      topicMap.set(topicId, existing);
    }

    // Add performance data
    for (const [topicId, data] of topicMap) {
      const topicScores = performance.filter(p => p.topicId === topicId);
      if (topicScores.length > 0) {
        data.averageScore = Math.round(
          topicScores.reduce((sum, p) => sum + p.score, 0) / topicScores.length
        );
        
        // Calculate improvement (first vs last score)
        if (topicScores.length > 1) {
          data.improvement = topicScores[topicScores.length - 1].score - topicScores[0].score;
        }
      }
    }

    return Array.from(topicMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }

  private analyzeDailyDistribution(
    events: CalendarEvent[],
    startDate: Date,
    endDate: Date
  ): DailyStudyTime[] {
    const daily: DailyStudyTime[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayEvents = events.filter(e => 
        format(e.start, 'yyyy-MM-dd') === format(current, 'yyyy-MM-dd')
      );

      daily.push({
        date: format(current, 'yyyy-MM-dd'),
        minutes: this.calculateTotalMinutes(dayEvents),
        sessions: dayEvents.length,
        completed: dayEvents.some(e => e.status === 'confirmed'),
      });

      current.setDate(current.getDate() + 1);
    }

    return daily;
  }

  private generateHourlyHeatmap(events: CalendarEvent[]): HourlyHeatmap {
    const heatmapData: Array<{
      hour: number;
      dayOfWeek: number;
      intensity: number;
      minutes: number;
    }> = [];

    // Initialize grid
    for (let hour = 0; hour < 24; hour++) {
      for (let day = 0; day < 7; day++) {
        heatmapData.push({
          hour,
          dayOfWeek: day,
          intensity: 0,
          minutes: 0,
        });
      }
    }

    // Populate with event data
    let maxMinutes = 0;
    events.forEach(event => {
      const hour = event.start.getHours();
      const day = event.start.getDay();
      const minutes = differenceInMinutes(event.end, event.start);

      const cell = heatmapData.find(d => d.hour === hour && d.dayOfWeek === day);
      if (cell) {
        cell.minutes += minutes;
        maxMinutes = Math.max(maxMinutes, cell.minutes);
      }
    });

    // Normalize intensity
    heatmapData.forEach(cell => {
      cell.intensity = maxMinutes > 0 ? cell.minutes / maxMinutes : 0;
    });

    // Find most productive time
    const sorted = [...heatmapData].sort((a, b) => b.minutes - a.minutes);
    const mostProductiveHour = sorted[0]?.hour || 19;
    const mostProductiveDay = sorted[0]?.dayOfWeek || 0;

    return {
      data: heatmapData,
      mostProductiveHour,
      mostProductiveDay,
    };
  }

  private async generateInsights(
    userId: string,
    events: CalendarEvent[],
    performance: any[]
  ): Promise<StudyInsight[]> {
    const insights: StudyInsight[] = [];

    // Study streak insight
    const streak = await this.calculateStreak(userId);
    if (streak >= 7) {
      insights.push({
        type: 'achievement',
        title: `${streak} Day Study Streak! 🔥`,
        description: 'You\'ve been studying consistently. Keep up the great work!',
        metric: {
          value: streak,
          unit: 'days',
        },
      });
    }

    // Completion rate insight
    const completionRate = this.calculateCompletionRate(events);
    if (completionRate < 70) {
      insights.push({
        type: 'warning',
        title: 'Low Session Completion Rate',
        description: `You're only completing ${completionRate}% of scheduled sessions. Try shorter sessions or adjusting your schedule.`,
        metric: {
          value: completionRate,
          unit: '%',
        },
        actionable: {
          action: 'Adjust Schedule',
          link: '/settings/schedule',
        },
      });
    }

    // Optimal time insight
    const heatmap = this.generateHourlyHeatmap(events);
    insights.push({
      type: 'suggestion',
      title: 'Optimal Study Time',
      description: `You're most productive at ${heatmap.mostProductiveHour}:00 on ${this.getDayName(heatmap.mostProductiveDay)}s`,
      actionable: {
        action: 'Schedule More Sessions',
      },
    });

    // Performance trend
    if (performance.length > 5) {
      const trend = this.calculateTrend(performance.map(p => p.score));
      if (trend === 'increasing') {
        insights.push({
          type: 'trend',
          title: 'Performance Improving! 📈',
          description: 'Your quiz scores are trending upward. Your study routine is working!',
        });
      }
    }

    return insights;
  }

  private calculateStreak(userId: string): Promise<number> {
    // In production, calculate actual streak from database
    return Promise.resolve(Math.floor(Math.random() * 30));
  }

  private getDateRange(period: StudyTimeAnalytics['period']): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'monthly':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
    }

    return { startDate, endDate };
  }

  private isCacheValid(cached: StudyTimeAnalytics): boolean {
    // Cache is valid for 1 hour
    const age = Date.now() - cached.endDate.getTime();
    return age < 60 * 60 * 1000;
  }

  private categorizeEvent(title: string, description?: string): CalendarEvent['eventType'] {
    const text = `${title} ${description || ''}`.toLowerCase();
    
    if (text.includes('quiz')) return 'quiz';
    if (text.includes('study') || text.includes('session')) return 'study';
    if (text.includes('review')) return 'review';
    if (text.includes('group') || text.includes('pod')) return 'group';
    
    return 'other';
  }

  private extractTopicId(event: CalendarEvent): string | null {
    // Extract topic ID from event metadata or description
    // In production, this would parse structured data
    return null;
  }

  private async getTopicName(topicId: string): Promise<string> {
    const { data } = await supabase
      .from('question_topics')
      .select('topic_title')
      .eq('topic_id', topicId)
      .single();

    return data?.topic_title || 'Unknown Topic';
  }

  private getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }

  private createDefaultGoals(userId: string): StudyGoal[] {
    return [
      {
        userId,
        type: 'daily',
        targetMinutes: 15,
        currentMinutes: 0,
        progress: 0,
      },
      {
        userId,
        type: 'weekly',
        targetMinutes: 120,
        currentMinutes: 0,
        progress: 0,
      },
    ];
  }

  private getPeriodRanges(timeframe: string): Array<{ start: Date; end: Date }> {
    // Generate period ranges for trend analysis
    const ranges: Array<{ start: Date; end: Date }> = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const start = new Date(now);
      const end = new Date(now);

      switch (timeframe) {
        case 'week':
          start.setDate(start.getDate() - (i + 1) * 7);
          end.setDate(end.getDate() - i * 7);
          break;
        case 'month':
          start.setMonth(start.getMonth() - (i + 1));
          end.setMonth(end.getMonth() - i);
          break;
        // Add other timeframes
      }

      ranges.unshift({ start, end });
    }

    return ranges;
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  private calculateChangePercent(data: Array<{ minutes: number }>): number {
    if (data.length < 2) return 0;
    
    const first = data[0].minutes;
    const last = data[data.length - 1].minutes;
    
    if (first === 0) return 100;
    return Math.round(((last - first) / first) * 100);
  }

  private generateForecast(
    historicalData: Array<{ period: string; minutes: number }>
  ): Array<{ period: string; predictedMinutes: number }> {
    // Simple linear forecast
    const forecast: Array<{ period: string; predictedMinutes: number }> = [];
    
    // Calculate average growth rate
    let totalGrowth = 0;
    for (let i = 1; i < historicalData.length; i++) {
      const growth = historicalData[i].minutes - historicalData[i - 1].minutes;
      totalGrowth += growth;
    }
    const avgGrowth = totalGrowth / (historicalData.length - 1);

    // Project forward
    const lastValue = historicalData[historicalData.length - 1].minutes;
    for (let i = 1; i <= 4; i++) {
      forecast.push({
        period: `Week +${i}`,
        predictedMinutes: Math.max(0, Math.round(lastValue + avgGrowth * i)),
      });
    }

    return forecast;
  }

  private groupByWeek(events: CalendarEvent[], performance: any[]): any[] {
    // Group events and performance by week
    // Implementation details...
    return [];
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    // Pearson correlation coefficient
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

    const correlation = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return Math.round(correlation * 100) / 100;
  }

  private findOptimalStudyTime(weeklyData: any[]): number {
    // Find the study time that correlates with best performance
    let optimal = 0;
    let bestScore = 0;

    weeklyData.forEach(week => {
      if (week.averageScore > bestScore) {
        bestScore = week.averageScore;
        optimal = week.studyMinutes;
      }
    });

    return optimal;
  }

  private findDiminishingReturns(weeklyData: any[]): number {
    // Find point where additional study time yields minimal improvement
    // Implementation...
    return 180; // 3 hours
  }

  private generateStudyRecommendations(
    correlation: number,
    optimal: number,
    diminishing: number,
    data: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (correlation > 0.7) {
      recommendations.push('Strong positive correlation between study time and performance. Keep it up!');
    } else if (correlation < 0.3) {
      recommendations.push('Consider adjusting your study methods - time alone isn\'t improving scores.');
    }

    const currentAvg = data[data.length - 1]?.studyMinutes || 0;
    if (currentAvg < optimal) {
      recommendations.push(`Try increasing study time to ${optimal} minutes per week for optimal results.`);
    } else if (currentAvg > diminishing) {
      recommendations.push(`You may be experiencing diminishing returns. Focus on quality over quantity.`);
    }

    return recommendations;
  }

  private generateCSV(analytics: StudyTimeAnalytics): Blob {
    // Generate CSV from analytics data
    const rows: string[] = ['Date,Minutes,Sessions,Score'];
    
    analytics.dailyDistribution.forEach(day => {
      rows.push(`${day.date},${day.minutes},${day.sessions},${day.score || ''}`);
    });

    return new Blob([rows.join('\n')], { type: 'text/csv' });
  }

  private generatePDFReport(analytics: StudyTimeAnalytics): Blob {
    // In production, use a PDF generation library
    // For now, return a placeholder
    const content = JSON.stringify(analytics, null, 2);
    return new Blob([content], { type: 'application/pdf' });
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const CalendarAnalyticsService = CalendarAnalyticsServiceClass.getInstance();

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook for using calendar analytics in components
 */
export function useCalendarAnalytics(userId: string) {
  const [analytics, setAnalytics] = React.useState<StudyTimeAnalytics | null>(null);
  const [goals, setGoals] = React.useState<StudyGoal[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchAnalytics = React.useCallback(async (
    period?: StudyTimeAnalytics['period'],
    customRange?: { start: Date; end: Date }
  ) => {
    setLoading(true);
    try {
      const data = await CalendarAnalyticsService.generateAnalytics(userId, period, customRange);
      setAnalytics(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchGoals = React.useCallback(async () => {
    const data = await CalendarAnalyticsService.trackStudyGoals(userId);
    setGoals(data);
  }, [userId]);

  React.useEffect(() => {
    fetchAnalytics('weekly');
    fetchGoals();
  }, [fetchAnalytics, fetchGoals]);

  return {
    analytics,
    goals,
    loading,
    refetch: fetchAnalytics,
  };
} 