// Web-specific implementation of Learning Export Service
// Provides fallback functionality for browsers where native modules aren't available

import { Alert } from 'react-native';

// Mock implementations for web
const mockPrint = {
  printToFileAsync: async (options: any) => {
    console.log('Web: Mock PDF generation with options:', options);
    // On web, we could use libraries like jsPDF or html2canvas
    return { uri: 'mock://pdf-export.pdf' };
  }
};

const mockSharing = {
  isAvailableAsync: async () => false,
  shareAsync: async (uri: string, options: any) => {
    console.log('Web: Mock sharing:', uri, options);
  }
};

const mockFileSystem = {
  documentDirectory: 'mock://documents/',
  moveAsync: async (options: any) => {
    console.log('Web: Mock file move:', options);
  }
};

// Re-export the main service with web-compatible implementations
export class LearningExportService {
  // ... (copy all the static methods from the main service but replace expo imports with mocks)
  
  static async exportToPDF(userId: string): Promise<{ success: boolean; uri?: string; error?: string }> {
    try {
      console.log('🌐 Web: Generating learning analytics for user:', userId);
      
      // For web, we'll show a coming soon message for now
      Alert.alert(
        '🌐 Web Export Coming Soon',
        'PDF export is currently available on mobile apps. Web support with in-browser PDF generation is coming soon!\n\nFor now, you can view your progress in the app and take screenshots.',
        [{ text: 'Got it!' }]
      );
      
      return { 
        success: false, 
        error: 'Web export not yet implemented - mobile apps only' 
      };
    } catch (error) {
      console.error('❌ Web export error:', error);
      return { 
        success: false, 
        error: 'Web export not available' 
      };
    }
  }

  static async shareWithPod(userId: string, podId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🌐 Web: Sharing progress with pod for user:', userId, 'pod:', podId);
      
      Alert.alert(
        '🌐 Web Sharing Coming Soon',
        'Pod sharing is currently available on mobile apps. Web support is coming soon!',
        [{ text: 'Got it!' }]
      );
      
      return { 
        success: false, 
        error: 'Web sharing not yet implemented - mobile apps only' 
      };
    } catch (error) {
      console.error('❌ Web sharing error:', error);
      return { 
        success: false, 
        error: 'Web sharing not available' 
      };
    }
  }

  static async sharePDF(pdfUri: string): Promise<void> {
    console.log('🌐 Web: PDF sharing not available:', pdfUri);
    Alert.alert(
      '🌐 Web Sharing',
      'PDF sharing is available on mobile devices. On web, you can download and share manually.',
      [{ text: 'OK' }]
    );
  }

  // Mock the generateLearningHistory method for web as well
  static async generateLearningHistory(userId: string): Promise<any> {
    console.log('🌐 Web: Mock learning history generation for:', userId);
    
    // Return a mock data structure for web
    return {
      user: {
        name: 'Web User',
        email: 'user@civicsense.one',
        joinDate: new Date().toISOString(),
        membershipTier: 'Free',
      },
      stats: {
        totalQuizzes: 0,
        averageScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        hoursSpent: 0,
        rank: 0,
        achievementsUnlocked: 0,
        totalTopicsCompleted: 0,
        xpEarned: 0,
        level: 1,
        masteryCategories: [],
      },
      recentActivity: [],
      topicProgress: [],
      achievements: [],
      learningPods: [],
      strengths: [],
      improvementAreas: [],
      monthlyProgress: [],
      assessmentHistory: [],
      learningInsights: {
        processingSpeed: 'moderate' as const,
        preferredDifficulty: 'medium' as const,
        optimalStudyTime: 'evening' as const,
        learningStyle: 'analytical' as const,
        retentionRate: 0,
        consistencyScore: 0,
        engagementLevel: 'medium' as const,
      },
    };
  }
} 