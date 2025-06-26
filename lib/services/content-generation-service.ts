/**
 * AI-Powered Content Generation Service for CivicSense
 * 
 * Generates high-quality civic education content including:
 * - Quiz questions with CivicSense voice and values
 * - Topic explanations that reveal power dynamics
 * - News analysis with uncomfortable truths
 * - Action-oriented educational content
 * 
 * All content follows CivicSense standards:
 * - Truth over comfort
 * - Clarity over politeness
 * - Action over passive consumption
 * - Evidence over opinion
 */

import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'
import { BaseAITool } from '@/lib/ai/base-ai-tool'

// Create service role client for admin operations that need to bypass RLS
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// ============================================================================
// CONTENT GENERATION TYPES
// ============================================================================ 