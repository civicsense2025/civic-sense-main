import { supabase } from '../supabase';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import type { FeedbackData, FeedbackResponse } from '../types/feedback';

export class FeedbackService {
  /**
   * Submit feedback
   */
  static async submitFeedback(feedback: FeedbackData): Promise<FeedbackResponse> {
    try {
      // Add device info if not provided
      if (!feedback.device_info) {
        feedback.device_info = {
          platform: Platform.OS,
          version: Platform.Version.toString(),
          browser: 'React Native'
        };
      }

      // Add additional device details
      const extendedFeedback = {
        ...feedback,
        device_details: {
          brand: Device.brand,
          model: Device.modelName,
          os_version: Device.osVersion,
          device_type: Device.deviceType,
          is_device: Device.isDevice
        },
        submitted_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('feedback')
        .insert(extendedFeedback)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Thank you for your feedback! We\'ll review it soon.',
        feedbackId: data.id
      };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit feedback'
      };
    }
  }

  /**
   * Submit accessibility feedback
   */
  static async submitAccessibilityFeedback(
    feedback: FeedbackData & { accessibility_details: Required<FeedbackData>['accessibility_details'] }
  ): Promise<FeedbackResponse> {
    try {
      // Mark as accessibility feedback with proper priority type
      const priority: FeedbackData['priority'] = 
        feedback.accessibility_details.severity === 'critical' ? 'urgent' : 
        feedback.accessibility_details.severity === 'severe' ? 'high' : 'medium';

      const accessibilityFeedback: FeedbackData = {
        ...feedback,
        type: 'accessibility',
        priority
      };

      return await this.submitFeedback(accessibilityFeedback);
    } catch (error) {
      console.error('Error submitting accessibility feedback:', error);
      return {
        success: false,
        error: 'Failed to submit accessibility feedback'
      };
    }
  }

  /**
   * Get user's feedback history
   */
  static async getUserFeedbackHistory(userId: string): Promise<FeedbackData[]> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feedback history:', error);
      return [];
    }
  }

  /**
   * Check feedback status
   */
  static async checkFeedbackStatus(feedbackId: string): Promise<{
    status: 'pending' | 'in_review' | 'resolved' | 'closed';
    response?: string;
    updated_at?: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('status, admin_response, updated_at')
        .eq('id', feedbackId)
        .single();

      if (error) throw error;

      return {
        status: data.status,
        response: data.admin_response,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error checking feedback status:', error);
      return null;
    }
  }

  /**
   * Upload screenshot for feedback
   */
  static async uploadScreenshot(
    feedbackId: string,
    imageData: string
  ): Promise<string | null> {
    try {
      const fileName = `feedback/${feedbackId}/screenshot_${Date.now()}.jpg`;
      
      // Convert base64 to blob
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const { data, error } = await supabase.storage
        .from('feedback-screenshots')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('feedback-screenshots')
        .getPublicUrl(fileName);

      // Update feedback record with screenshot URL
      await supabase
        .from('feedback')
        .update({ screenshot: publicUrl })
        .eq('id', feedbackId);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      return null;
    }
  }
} 