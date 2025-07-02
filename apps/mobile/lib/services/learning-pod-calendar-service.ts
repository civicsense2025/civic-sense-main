/**
 * Learning Pod Calendar Service
 * 
 * Enables collaborative study sessions through:
 * - Shared calendar events for learning pods
 * - Group study session scheduling
 * - Pod member availability coordination
 * - Achievement celebrations with pod members
 */

import React from 'react';
import { GoogleCalendarService } from './google-calendar-service';
import { supabase } from '../supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface LearningPod {
  id: string;
  name: string;
  description: string;
  members: PodMember[];
  created_by: string;
  created_at: string;
  settings: PodSettings;
}

interface PodMember {
  user_id: string;
  full_name: string;
  email: string;
  role: 'owner' | 'moderator' | 'member';
  joined_at: string;
  calendar_sync_enabled: boolean;
  availability?: MemberAvailability;
}

interface PodSettings {
  visibility: 'public' | 'private' | 'invite-only';
  max_members: number;
  study_schedule: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    preferred_days: number[]; // 0-6 (Sun-Sat)
    preferred_times: string[]; // HH:MM format
    duration_minutes: number;
  };
  calendar_integration: {
    enabled: boolean;
    create_shared_calendar: boolean;
    sync_individual_calendars: boolean;
    reminder_minutes: number;
  };
}

interface SharedStudySession {
  id: string;
  pod_id: string;
  title: string;
  description: string;
  topic_id?: string;
  scheduled_time: Date;
  duration_minutes: number;
  attendees: SessionAttendee[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  meeting_link?: string;
  calendar_event_id?: string;
}

interface SessionAttendee {
  user_id: string;
  status: 'invited' | 'accepted' | 'declined' | 'maybe';
  calendar_synced: boolean;
  reminder_sent: boolean;
}

interface MemberAvailability {
  user_id: string;
  timezone: string;
  available_slots: AvailableSlot[];
  blocked_times: BlockedTime[];
}

interface AvailableSlot {
  day_of_week: number;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

interface BlockedTime {
  start: Date;
  end: Date;
  reason?: string;
}

// ============================================================================
// LEARNING POD CALENDAR SERVICE CLASS
// ============================================================================

class LearningPodCalendarServiceClass {
  private static instance: LearningPodCalendarServiceClass;
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();

  constructor() {}

  public static getInstance(): LearningPodCalendarServiceClass {
    if (!LearningPodCalendarServiceClass.instance) {
      LearningPodCalendarServiceClass.instance = new LearningPodCalendarServiceClass();
    }
    return LearningPodCalendarServiceClass.instance;
  }

  // ============================================================================
  // POD MANAGEMENT
  // ============================================================================

  /**
   * Create a new learning pod with calendar integration
   */
  async createLearningPod(params: {
    name: string;
    description: string;
    created_by: string;
    settings: PodSettings;
  }): Promise<LearningPod> {
    try {
      // Create pod in database
      const { data: pod, error } = await supabase
        .from('learning_pods')
        .insert({
          name: params.name,
          description: params.description,
          created_by: params.created_by,
          settings: params.settings,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      await this.addPodMember({
        pod_id: pod.id,
        user_id: params.created_by,
        role: 'owner',
      });

      // Create shared calendar if enabled
      if (params.settings.calendar_integration.create_shared_calendar) {
        await this.createSharedPodCalendar(pod);
      }

      // Set up real-time sync
      this.setupRealtimeSync(pod.id);

      return pod;
    } catch (error) {
      console.error('Error creating learning pod:', error);
      throw error;
    }
  }

  /**
   * Add member to learning pod
   */
  async addPodMember(params: {
    pod_id: string;
    user_id: string;
    role: PodMember['role'];
  }): Promise<void> {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', params.user_id)
        .single();

      // Add to pod members
      await supabase
        .from('pod_members')
        .insert({
          pod_id: params.pod_id,
          user_id: params.user_id,
          role: params.role,
          full_name: profile?.full_name,
          email: profile?.email,
        });

      // Send calendar invitation if pod has shared calendar
      const pod = await this.getPod(params.pod_id);
      if (pod?.settings.calendar_integration.create_shared_calendar) {
        await this.inviteToSharedCalendar(params.pod_id, params.user_id);
      }

    } catch (error) {
      console.error('Error adding pod member:', error);
      throw error;
    }
  }

  // ============================================================================
  // SHARED STUDY SESSIONS
  // ============================================================================

  /**
   * Schedule a group study session
   */
  async scheduleGroupSession(params: {
    pod_id: string;
    title: string;
    description: string;
    topic_id?: string;
    scheduled_time: Date;
    duration_minutes: number;
    meeting_link?: string;
  }): Promise<SharedStudySession> {
    try {
      // Get pod details
      const pod = await this.getPod(params.pod_id);
      if (!pod) throw new Error('Pod not found');

      // Create session in database
      const { data: session, error } = await supabase
        .from('shared_study_sessions')
        .insert({
          pod_id: params.pod_id,
          title: params.title,
          description: params.description,
          topic_id: params.topic_id,
          scheduled_time: params.scheduled_time.toISOString(),
          duration_minutes: params.duration_minutes,
          meeting_link: params.meeting_link,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;

      // Invite all pod members
      const attendees = await this.invitePodMembers(session.id, pod.members);

      // Create calendar events for members with sync enabled
      await this.createSessionCalendarEvents(session, pod, attendees);

      // Broadcast to real-time channel
      this.broadcastSessionUpdate(pod.id, 'session_scheduled', session);

      return { ...session, attendees };
    } catch (error) {
      console.error('Error scheduling group session:', error);
      throw error;
    }
  }

  /**
   * Find optimal time for group session based on member availability
   */
  async findOptimalSessionTime(params: {
    pod_id: string;
    duration_minutes: number;
    date_range: { start: Date; end: Date };
    preferred_times?: string[];
  }): Promise<Array<{ time: Date; availability_score: number; available_members: string[] }>> {
    try {
      const pod = await this.getPod(params.pod_id);
      if (!pod) throw new Error('Pod not found');

      // Get member availability
      const memberAvailability = await this.getMemberAvailability(pod.members.map(m => m.user_id));

      // Generate time slots
      const slots = this.generateTimeSlots(
        params.date_range.start,
        params.date_range.end,
        params.duration_minutes
      );

      // Score each slot based on member availability
      const scoredSlots = slots.map(slot => {
        const available = this.checkMemberAvailability(slot, params.duration_minutes, memberAvailability);
        return {
          time: slot,
          availability_score: available.length / pod.members.length,
          available_members: available,
        };
      });

      // Sort by score and return top options
      return scoredSlots
        .filter(slot => slot.availability_score >= 0.5) // At least 50% available
        .sort((a, b) => b.availability_score - a.availability_score)
        .slice(0, 5);
    } catch (error) {
      console.error('Error finding optimal session time:', error);
      throw error;
    }
  }

  /**
   * Update attendee status for a session
   */
  async updateAttendeeStatus(params: {
    session_id: string;
    user_id: string;
    status: SessionAttendee['status'];
  }): Promise<void> {
    try {
      await supabase
        .from('session_attendees')
        .update({ status: params.status })
        .match({ session_id: params.session_id, user_id: params.user_id });

      // Update calendar event if user accepted/declined
      if (params.status === 'accepted' || params.status === 'declined') {
        await this.updateCalendarAttendance(params.session_id, params.user_id, params.status);
      }

      // Broadcast update
      const session = await this.getSession(params.session_id);
      if (session) {
        this.broadcastSessionUpdate(session.pod_id, 'attendee_update', {
          session_id: params.session_id,
          user_id: params.user_id,
          status: params.status,
        });
      }
    } catch (error) {
      console.error('Error updating attendee status:', error);
      throw error;
    }
  }

  // ============================================================================
  // CALENDAR INTEGRATION
  // ============================================================================

  /**
   * Create shared calendar for pod
   */
  private async createSharedPodCalendar(pod: LearningPod): Promise<void> {
    try {
      // This would create a shared Google Calendar
      // In production, this would use Google Calendar API to create a calendar
      // and share it with pod members
      console.log(`Creating shared calendar for pod: ${pod.name}`);
      
      // Store calendar ID in pod settings
      await supabase
        .from('learning_pods')
        .update({
          settings: {
            ...pod.settings,
            calendar_id: `pod-${pod.id}-calendar`,
          },
        })
        .eq('id', pod.id);
    } catch (error) {
      console.error('Error creating shared calendar:', error);
    }
  }

  /**
   * Create calendar events for session attendees
   */
  private async createSessionCalendarEvents(
    session: SharedStudySession,
    pod: LearningPod,
    attendees: SessionAttendee[]
  ): Promise<void> {
    try {
      const calendarEvent = {
        title: `📚 ${pod.name}: ${session.title}`,
        description: this.formatSessionDescription(session, pod),
        startTime: new Date(session.scheduled_time),
        duration: session.duration_minutes,
        location: session.meeting_link,
        reminderMinutes: pod.settings.calendar_integration.reminder_minutes,
      };

      // Create events for members with calendar sync enabled
      const syncEnabledMembers = attendees.filter(a => {
        const member = pod.members.find(m => m.user_id === a.user_id);
        return member?.calendar_sync_enabled;
      });

      for (const attendee of syncEnabledMembers) {
        try {
          // Create individual calendar event
          const eventToCreate: any = {
            title: calendarEvent.title,
            description: calendarEvent.description,
            startTime: calendarEvent.startTime,
            duration: calendarEvent.duration,
            reminderMinutes: calendarEvent.reminderMinutes,
            attendees: this.getAttendeeEmails(attendees, pod.members),
          };
          
          // Only include location if it exists
          if (calendarEvent.location) {
            eventToCreate.location = calendarEvent.location;
          }
          
          await GoogleCalendarService.createEvents([eventToCreate]);

          // Mark as synced
          await supabase
            .from('session_attendees')
            .update({ calendar_synced: true })
            .match({ session_id: session.id, user_id: attendee.user_id });
        } catch (error) {
          console.error(`Failed to create calendar event for user ${attendee.user_id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error creating session calendar events:', error);
    }
  }

  /**
   * Format session description for calendar
   */
  private formatSessionDescription(session: SharedStudySession, pod: LearningPod): string {
    let description = session.description + '\n\n';
    
    if (session.meeting_link) {
      description += `📹 Join meeting: ${session.meeting_link}\n\n`;
    }

    description += `👥 Learning Pod: ${pod.name}\n`;
    description += `⏱️ Duration: ${session.duration_minutes} minutes\n`;
    
    if (session.topic_id) {
      description += `📖 Topic: Quiz preparation\n`;
    }

    description += '\n---\nCreated by CivicSense Learning Pods';

    return description;
  }

  // ============================================================================
  // ACHIEVEMENT CELEBRATIONS
  // ============================================================================

  /**
   * Schedule achievement celebration with pod
   */
  async scheduleAchievementCelebration(params: {
    pod_id: string;
    user_id: string;
    achievement: {
      type: string;
      title: string;
      description: string;
    };
    celebrate_at?: Date;
  }): Promise<void> {
    try {
      const pod = await this.getPod(params.pod_id);
      if (!pod) throw new Error('Pod not found');

      const celebrationTime = params.celebrate_at || new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create celebration session
      await this.scheduleGroupSession({
        pod_id: params.pod_id,
        title: `🎉 Celebrating ${params.achievement.title}`,
        description: `Join us in celebrating ${params.user_id}'s achievement: ${params.achievement.description}`,
        scheduled_time: celebrationTime,
        duration_minutes: 30,
      });

      // Send notifications to pod members
      await this.notifyPodMembers(params.pod_id, {
        type: 'achievement_celebration',
        user_id: params.user_id,
        achievement: params.achievement,
      });
    } catch (error) {
      console.error('Error scheduling achievement celebration:', error);
      throw error;
    }
  }

  // ============================================================================
  // REAL-TIME SYNC
  // ============================================================================

  /**
   * Set up real-time synchronization for pod
   */
  private setupRealtimeSync(podId: string): void {
    const channel = supabase
      .channel(`pod-${podId}`)
      .on('presence', { event: 'sync' }, () => {
        console.log(`Presence sync for pod ${podId}`);
      })
      .on('broadcast', { event: 'session_update' }, (payload) => {
        console.log(`Session update for pod ${podId}:`, payload);
      })
      .subscribe();

    this.realtimeChannels.set(podId, channel);
  }

  /**
   * Broadcast session updates to pod members
   */
  private broadcastSessionUpdate(podId: string, event: string, data: any): void {
    const channel = this.realtimeChannels.get(podId);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'session_update',
        payload: { event, data },
      });
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async getPod(podId: string): Promise<LearningPod | null> {
    try {
      const { data } = await supabase
        .from('learning_pods')
        .select(`
          *,
          members:pod_members(*)
        `)
        .eq('id', podId)
        .single();

      return data;
    } catch (error) {
      console.error('Error fetching pod:', error);
      return null;
    }
  }

  private async getSession(sessionId: string): Promise<SharedStudySession | null> {
    try {
      const { data } = await supabase
        .from('shared_study_sessions')
        .select(`
          *,
          attendees:session_attendees(*)
        `)
        .eq('id', sessionId)
        .single();

      return data;
    } catch (error) {
      console.error('Error fetching session:', error);
      return null;
    }
  }

  private async invitePodMembers(sessionId: string, members: PodMember[]): Promise<SessionAttendee[]> {
    const attendees = members.map(member => ({
      session_id: sessionId,
      user_id: member.user_id,
      status: 'invited' as const,
      calendar_synced: false,
      reminder_sent: false,
    }));

    await supabase.from('session_attendees').insert(attendees);
    return attendees;
  }

  private async getMemberAvailability(userIds: string[]): Promise<MemberAvailability[]> {
    // In production, this would fetch from user preferences and calendar
    // For now, return mock data
    return userIds.map(userId => ({
      user_id: userId,
      timezone: 'America/New_York',
      available_slots: [
        { day_of_week: 1, start_time: '18:00', end_time: '22:00' },
        { day_of_week: 3, start_time: '18:00', end_time: '22:00' },
        { day_of_week: 5, start_time: '18:00', end_time: '22:00' },
      ],
      blocked_times: [],
    }));
  }

  private generateTimeSlots(start: Date, end: Date, duration: number): Date[] {
    const slots: Date[] = [];
    const current = new Date(start);
    
    while (current < end) {
      // Only consider reasonable hours (8 AM - 10 PM)
      const hour = current.getHours();
      if (hour >= 8 && hour <= 22) {
        slots.push(new Date(current));
      }
      current.setMinutes(current.getMinutes() + 30); // 30-minute increments
    }

    return slots;
  }

  private checkMemberAvailability(
    slot: Date,
    duration: number,
    availability: MemberAvailability[]
  ): string[] {
    return availability
      .filter(member => {
        const day = slot.getDay();
        const time = `${slot.getHours().toString().padStart(2, '0')}:${slot.getMinutes().toString().padStart(2, '0')}`;
        
        return member.available_slots.some(avail => 
          avail.day_of_week === day &&
          avail.start_time <= time &&
          avail.end_time >= time
        );
      })
      .map(member => member.user_id);
  }

  private formatAttendeeList(attendees: SessionAttendee[], members: PodMember[]): any[] {
    return attendees.map(attendee => {
      const member = members.find(m => m.user_id === attendee.user_id);
      return {
        email: member?.email,
        displayName: member?.full_name,
        responseStatus: attendee.status === 'accepted' ? 'accepted' : 'needsAction',
      };
    });
  }

  private getAttendeeEmails(attendees: SessionAttendee[], members: PodMember[]): string[] {
    return attendees
      .map(attendee => {
        const member = members.find(m => m.user_id === attendee.user_id);
        return member?.email;
      })
      .filter((email): email is string => Boolean(email));
  }

  private async inviteToSharedCalendar(podId: string, userId: string): Promise<void> {
    // In production, this would use Google Calendar API to share calendar
    console.log(`Inviting user ${userId} to pod ${podId} shared calendar`);
  }

  private async updateCalendarAttendance(
    sessionId: string,
    userId: string,
    status: 'accepted' | 'declined'
  ): Promise<void> {
    // In production, update the calendar event attendance
    console.log(`Updating calendar attendance for user ${userId} in session ${sessionId}: ${status}`);
  }

  private async notifyPodMembers(podId: string, notification: any): Promise<void> {
    // Send notifications to pod members
    console.log(`Notifying pod ${podId} members:`, notification);
  }

  /**
   * Clean up real-time subscriptions
   */
  cleanup(): void {
    this.realtimeChannels.forEach((channel, podId) => {
      supabase.removeChannel(channel);
    });
    this.realtimeChannels.clear();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const LearningPodCalendarService = LearningPodCalendarServiceClass.getInstance();

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook for managing learning pod calendar features
 */
export function useLearningPodCalendar(podId: string) {
  const [sessions, setSessions] = React.useState<SharedStudySession[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`pod-${podId}-component`)
      .on('broadcast', { event: 'session_update' }, (payload) => {
        // Update local state based on event
        console.log('Session update received:', payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [podId]);

  const scheduleSession = React.useCallback(async (params: Parameters<typeof LearningPodCalendarService.scheduleGroupSession>[0]) => {
    setLoading(true);
    try {
      const session = await LearningPodCalendarService.scheduleGroupSession(params);
      setSessions(prev => [...prev, session]);
      return session;
    } finally {
      setLoading(false);
    }
  }, []);

  const findOptimalTime = React.useCallback(async (params: Omit<Parameters<typeof LearningPodCalendarService.findOptimalSessionTime>[0], 'pod_id'>) => {
    return LearningPodCalendarService.findOptimalSessionTime({ ...params, pod_id: podId });
  }, [podId]);

  return {
    sessions,
    loading,
    scheduleSession,
    findOptimalTime,
  };
} 