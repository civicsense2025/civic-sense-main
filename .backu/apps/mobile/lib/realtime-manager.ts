import { RealtimeChannel } from '@supabase/supabase-js';
import { ensureSupabaseInitialized } from './supabase';
import { performanceMonitor } from './performance-monitor';

export interface ChannelConfig {
  userId: string;
  userName?: string;
  [key: string]: any;
}

export interface DebugLog {
  timestamp: number;
  channel: string;
  event: string;
  payload: any;
  type: 'realtime';
}

export interface QuizPresence {
  userId: string;
  status: 'active' | 'away' | 'offline';
  lastActive: number;
  currentQuestion: number;
  score: number;
}

export interface LiveQuizStats {
  totalParticipants: number;
  averageScore: number;
  fastestTime: number;
  currentRank?: number;
}

export class RealtimeManager {
  private channels = new Map<string, RealtimeChannel>();
  private subscriptionCounts = new Map<string, number>();
  private clientPromise: Promise<any> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscriptions: Map<string, any> = new Map();

  // Lazy-load the supabase client to prevent accessing it before initialization
  private async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = ensureSupabaseInitialized();
    }
    return this.clientPromise;
  }

  async subscribe(channelName: string, config: ChannelConfig): Promise<RealtimeChannel> {
    // Reuse existing channels to prevent memory leaks
    if (this.channels.has(channelName)) {
      const count = this.subscriptionCounts.get(channelName) || 0;
      this.subscriptionCounts.set(channelName, count + 1);
      return this.channels.get(channelName)!;
    }

    const client = await this.getClient();
    const channel = client.channel(channelName, {
      config: { presence: { key: config.userId } }
    });

    this.channels.set(channelName, channel);
    this.subscriptionCounts.set(channelName, 1);
    
    // Subscribe to the channel
    channel.subscribe();
    
    this.debugLog(channelName, 'subscribe', config);
    return channel;
  }

  unsubscribe(channelName: string): void {
    const currentCount = this.subscriptionCounts.get(channelName) || 0;
    
    if (currentCount <= 1) {
      // Last subscriber, clean up channel
      const channel = this.channels.get(channelName);
      if (channel) {
        channel.unsubscribe();
        this.channels.delete(channelName);
        this.subscriptionCounts.delete(channelName);
        this.debugLog(channelName, 'unsubscribe_cleanup', {});
      }
    } else {
      this.subscriptionCounts.set(channelName, currentCount - 1);
      this.debugLog(channelName, 'unsubscribe_decrement', { remaining: currentCount - 1 });
    }
  }

  cleanup(): void {
    this.channels.forEach((channel, channelName) => {
      channel.unsubscribe();
      this.debugLog(channelName, 'cleanup', {});
    });
    this.channels.clear();
    this.subscriptionCounts.clear();
  }

  async handleConnectionLoss(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached, switching to offline mode');
      return;
    }

    this.reconnectAttempts++;
    
    // Exponential backoff
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(async () => {
      try {
        await this.reconnect();
        this.reconnectAttempts = 0;
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.handleConnectionLoss();
      }
    }, delay);
  }

  private async reconnect(): Promise<void> {
    const client = await this.getClient();
    // Test connection with lightweight query
    const { error } = await client.from('health_check').select('id').limit(1);
    if (error) throw error;

    // Reestablish real-time connections
    await this.reestablishRealTimeConnections();
  }

  private async reestablishRealTimeConnections(): Promise<void> {
    // Reconnect all channels
    for (const [channelName, channel] of this.channels) {
      if (channel.state === 'closed') {
        await channel.subscribe();
        this.debugLog(channelName, 'reconnect', {});
      }
    }
  }

  private debugLog(channel: string, event: string, payload: any): void {
    if (__DEV__) {
      console.log(`[REALTIME] ${channel}:${event}`, payload);
    }
  }

  // Get channel by name (for direct access if needed)
  getChannel(channelName: string): RealtimeChannel | undefined {
    return this.channels.get(channelName);
  }

  // Get connection status
  async getConnectionStatus(): Promise<string> {
    try {
      const client = await this.getClient();
      return client.realtime.isConnected() ? 'connected' : 'disconnected';
    } catch {
      return 'disconnected';
    }
  }

  // Get active channels count
  getActiveChannelsCount(): number {
    return this.channels.size;
  }

  async subscribeToPresence(
    sessionId: string,
    onPresenceChange: (presenceList: QuizPresence[]) => void,
    initialPresence: QuizPresence
  ) {
    const client = await this.getClient();
    const channel = client.channel(`presence:${sessionId}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const presenceList = Object.values(presenceState).flat() as QuizPresence[];
        onPresenceChange(presenceList);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(initialPresence);
        }
      });

    this.subscriptions.set(`presence:${sessionId}`, channel);
    return {
      unsubscribe: () => {
        channel.unsubscribe();
        this.subscriptions.delete(`presence:${sessionId}`);
      }
    };
  }

  async subscribeToStats(
    sessionId: string,
    onStatsChange: (stats: LiveQuizStats) => void
  ) {
    const client = await this.getClient();
    const channel = client.channel(`stats:${sessionId}`)
      .on('broadcast', { event: 'stats' }, ({ payload }: { payload: any }) => {
        onStatsChange(payload as LiveQuizStats);
      })
      .subscribe();

    this.subscriptions.set(`stats:${sessionId}`, channel);
    return {
      unsubscribe: () => {
        channel.unsubscribe();
        this.subscriptions.delete(`stats:${sessionId}`);
      }
    };
  }

  unsubscribeAll() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
}

export const realtimeManager = new RealtimeManager(); 