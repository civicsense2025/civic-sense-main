export interface FeedbackCategory {
  id: string;
  value: string;
  label: string;
  description?: string;
}

export interface FeedbackData {
  type: 'bug' | 'feature' | 'content' | 'other' | 'accessibility';
  category?: string;
  subject: string;
  message: string;
  email?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  device_info?: {
    platform: string;
    version: string;
    browser?: string;
  };
  accessibility_details?: AccessibilityFeedbackDetails;
  user_id?: string;
  guest_token?: string;
  url?: string;
  screenshot?: string;
}

export interface AccessibilityFeedbackDetails {
  assistive_technology?: string;
  issue_type: 'screen_reader' | 'keyboard_nav' | 'color_contrast' | 'motion' | 'cognitive' | 'other';
  affected_features: string[];
  wcag_criteria?: string[];
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  suggested_fix?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message?: string;
  feedbackId?: string;
  error?: string;
}

export interface FeedbackOptions {
  includeDeviceInfo?: boolean;
  includeUrl?: boolean;
  allowScreenshot?: boolean;
  requireEmail?: boolean;
  showAccessibilityOptions?: boolean;
} 