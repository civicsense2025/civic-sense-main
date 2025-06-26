/**
 * CivicSense AI News Agent
 * 
 * Intelligent news processing system that:
 * - Monitors civic/political news sources
 * - Analyzes content for civic education value
 * - Generates quiz questions from news articles
 * - Creates engaging civic content with CivicSense voice
 * - Tracks and updates developing stories
 */

import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'
import { BaseAITool } from './base-ai-tool'

// Create service role client for admin operations that need to bypass RLS
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// ============================================================================
// NEWS AGENT TYPES
// ============================================================================ 