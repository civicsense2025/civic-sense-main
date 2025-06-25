/**
 * Base AI Tool Class with Enhanced Error Handling
 * 
 * Features:
 * - Robust JSON parsing with automatic repair
 * - Output validation and cleaning
 * - Reliable Supabase saves with retry logic
 * - Comprehensive error tracking
 */

import { createClient } from '@/lib/supabase/server'
import { jsonrepair } from 'jsonrepair'
import { z } from 'zod'

// ============================================================================
// CORE TYPES
// ============================================================================

export interface AIToolConfig {
  name: string
  type: 'content_generator' | 'bias_analyzer' | 'fact_checker' | 'summarizer' | 'translator' | 'moderator'
  provider: 'openai' | 'anthropic' | 'google' | 'perplexity'
  model: string
  maxRetries?: number
  retryDelay?: number
  timeout?: number
}

export interface AIToolResult<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata: {
    toolName: string
    provider: string
    model: string
    processingTime: number
    retryCount: number
    cost?: number
  }
}

export interface ParsedContent {
  isValid: boolean
  content: any
  errors: string[]
  repaired: boolean
}

// ============================================================================
// BASE AI TOOL CLASS
// ============================================================================

export abstract class BaseAITool<TInput = any, TOutput = any> {
  protected config: AIToolConfig
  protected supabase: any
  
  constructor(config: AIToolConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      ...config
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Main entry point for processing with comprehensive error handling
   */
  public async process(input: TInput): Promise<AIToolResult<TOutput>> {
    const startTime = Date.now()
    let retryCount = 0
    let lastError: Error | null = null

    while (retryCount <= (this.config.maxRetries || 3)) {
      try {
        // Initialize Supabase client
        this.supabase = await createClient()

        // Step 1: Validate input
        const validatedInput = await this.validateInput(input)

        // Step 2: Process with AI
        const rawOutput = await this.processWithAI(validatedInput)

        // Step 3: Parse and clean output
        const parsedOutput = await this.parseAndCleanOutput(rawOutput)

        // Step 4: Validate quality
        const validatedOutput = await this.validateOutput(parsedOutput)

        // Step 5: Save to Supabase
        const savedData = await this.saveToSupabase(validatedOutput)

        // Success!
        return {
          success: true,
          data: savedData,
          metadata: {
            toolName: this.config.name,
            provider: this.config.provider,
            model: this.config.model,
            processingTime: Date.now() - startTime,
            retryCount
          }
        }

      } catch (error) {
        lastError = error as Error
        console.error(`[${this.config.name}] Attempt ${retryCount + 1} failed:`, error)
        
        if (retryCount < (this.config.maxRetries || 3)) {
          await this.delay(this.config.retryDelay || 1000)
          retryCount++
        } else {
          break
        }
      }
    }

    // All retries failed
    return {
      success: false,
      error: lastError?.message || 'Unknown error occurred',
      metadata: {
        toolName: this.config.name,
        provider: this.config.provider,
        model: this.config.model,
        processingTime: Date.now() - startTime,
        retryCount
      }
    }
  }

  // ============================================================================
  // JSON PARSING WITH REPAIR
  // ============================================================================

  /**
   * Parse JSON with automatic repair for common AI formatting issues
   */
  protected async parseJSON(rawContent: string): Promise<ParsedContent> {
    const errors: string[] = []
    let repaired = false

    try {
      // First, try to parse as-is
      const parsed = JSON.parse(rawContent)
      return {
        isValid: true,
        content: parsed,
        errors: [],
        repaired: false
      }
    } catch (firstError) {
      errors.push(`Initial parse failed: ${firstError}`)
      
      try {
        // Clean common AI response issues
        let cleanedContent = rawContent
          .replace(/^```json\s*/i, '') // Remove markdown code blocks
          .replace(/```\s*$/i, '')
          .replace(/^```\s*/i, '')
          .trim()

        // Check if the content starts with explanation text
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        if (jsonMatch) {
          cleanedContent = jsonMatch[0]
        }

        // Try parsing cleaned content
        try {
          const parsed = JSON.parse(cleanedContent)
          return {
            isValid: true,
            content: parsed,
            errors,
            repaired: true
          }
        } catch (cleanError) {
          errors.push(`Clean parse failed: ${cleanError}`)
          
          // Use jsonrepair as last resort
          const repairedContent = jsonrepair(cleanedContent)
          const parsed = JSON.parse(repairedContent)
          
          return {
            isValid: true,
            content: parsed,
            errors,
            repaired: true
          }
        }
      } catch (repairError) {
        errors.push(`JSON repair failed: ${repairError}`)
        
        // Final fallback: try to extract JSON from the content
        try {
          const fallbackParsed = await this.extractJSONFromText(rawContent)
          if (fallbackParsed) {
            return {
              isValid: true,
              content: fallbackParsed,
              errors,
              repaired: true
            }
          }
        } catch (extractError) {
          errors.push(`JSON extraction failed: ${extractError}`)
        }
        
        return {
          isValid: false,
          content: null,
          errors,
          repaired: false
        }
      }
    }
  }

  /**
   * Extract JSON from mixed text content
   */
  private async extractJSONFromText(text: string): Promise<any | null> {
    // Try to find JSON-like structures in the text
    const patterns = [
      /\{[\s\S]*\}/,  // Object
      /\[[\s\S]*\]/,  // Array
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        try {
          return JSON.parse(match[0])
        } catch {
          // Try with jsonrepair
          try {
            const repaired = jsonrepair(match[0])
            return JSON.parse(repaired)
          } catch {
            continue
          }
        }
      }
    }

    return null
  }

  // ============================================================================
  // OUTPUT CLEANING
  // ============================================================================

  /**
   * Clean and normalize AI output
   */
  protected cleanOutput(output: any): any {
    if (typeof output === 'string') {
      return this.cleanString(output)
    }
    
    if (Array.isArray(output)) {
      return output.map(item => this.cleanOutput(item))
    }
    
    if (output && typeof output === 'object') {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(output)) {
        cleaned[key] = this.cleanOutput(value)
      }
      return cleaned
    }
    
    return output
  }

  /**
   * Clean string output
   */
  private cleanString(str: string): string {
    return str
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/�/g, '') // Remove replacement characters
  }

  // ============================================================================
  // SUPABASE OPERATIONS
  // ============================================================================

  /**
   * Save to Supabase with retry logic and batch processing
   */
  protected async saveToSupabase(data: TOutput): Promise<TOutput> {
    // Default implementation - override in subclasses
    return data
  }

  /**
   * Batch save to Supabase for multiple items
   */
  protected async batchSaveToSupabase<T extends Record<string, any>>(
    tableName: string,
    items: T[],
    batchSize: number = 10
  ): Promise<{ saved: T[], failed: Array<{ item: T, error: string }> }> {
    const saved: T[] = []
    const failed: Array<{ item: T, error: string }> = []

    // Process in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .insert(batch)
          .select()

        if (error) {
          // Try individual saves for this batch
          for (const item of batch) {
            try {
              const { data: singleData, error: singleError } = await this.supabase
                .from(tableName)
                .insert(item)
                .select()
                .single()

              if (singleError) {
                failed.push({ item, error: singleError.message })
              } else if (singleData) {
                saved.push(singleData)
              }
            } catch (err) {
              failed.push({ item, error: err instanceof Error ? err.message : 'Unknown error' })
            }
          }
        } else if (data) {
          saved.push(...data)
        }
      } catch (err) {
        // Handle batch error
        for (const item of batch) {
          failed.push({ item, error: err instanceof Error ? err.message : 'Batch save failed' })
        }
      }

      // Add delay between batches to avoid rate limits
      if (i + batchSize < items.length) {
        await this.delay(100)
      }
    }

    return { saved, failed }
  }

  // ============================================================================
  // ABSTRACT METHODS - MUST BE IMPLEMENTED BY SUBCLASSES
  // ============================================================================

  /**
   * Validate input before processing
   */
  protected abstract validateInput(input: TInput): Promise<TInput>

  /**
   * Process with AI provider
   */
  protected abstract processWithAI(input: TInput): Promise<string>

  /**
   * Parse and clean the raw AI output
   */
  protected abstract parseAndCleanOutput(rawOutput: string): Promise<TOutput>

  /**
   * Validate output quality
   */
  protected abstract validateOutput(output: TOutput): Promise<TOutput>

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Delay helper for retries
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Log tool activity
   */
  protected async logActivity(
    action: string,
    details: Record<string, any>,
    success: boolean = true
  ): Promise<void> {
    try {
      await this.supabase
        .from('ai_tool_logs')
        .insert({
          tool_name: this.config.name,
          tool_type: this.config.type,
          provider: this.config.provider,
          model: this.config.model,
          action,
          details,
          success,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.warn(`Failed to log activity for ${this.config.name}:`, error)
    }
  }
} 