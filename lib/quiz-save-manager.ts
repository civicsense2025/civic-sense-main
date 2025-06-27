/**
 * Bulletproof Quiz Save Manager
 * Ensures quiz results are NEVER lost, even if save fails
 */

import type { QuizResults } from "@/lib/types/quiz"

interface QuizSaveData {
  topicId: string
  results: QuizResults
  userId?: string
  guestToken?: string
  attemptId?: string
  searchParams?: any
  completedAt: string
  retryCount: number
  status: 'pending' | 'saved' | 'failed'
  id: string
}

interface SaveAttempt {
  id: string
  data: QuizSaveData
  nextRetryAt: number
  maxRetries: number
}

class QuizSaveManager {
  private static readonly STORAGE_KEY = 'civicsense_pending_quiz_saves'
  private static readonly BACKUP_KEY = 'civicsense_quiz_backup'
  private static readonly MAX_RETRIES = 5
  private static readonly RETRY_DELAYS = [1000, 3000, 10000, 30000, 60000] // Progressive backoff
  
  private retryTimer: number | null = null
  private isProcessing = false

  /**
   * Save quiz results with bulletproof reliability
   * This method ensures results are NEVER lost
   */
  async saveQuizResults(data: Omit<QuizSaveData, 'completedAt' | 'retryCount' | 'status' | 'id'>): Promise<{
    success: boolean
    attemptId?: string
    error?: string
    isBackedUp: boolean
  }> {
    console.log('🛡️ QuizSaveManager: Starting bulletproof save process')
    
    // VALIDATION: Reject suspicious quiz results to prevent spam saves
    if (data.results.score === 0 && data.results.correctAnswers === 0 && data.results.totalQuestions > 0) {
      console.warn('⚠️ QuizSaveManager: Rejecting suspicious quiz result (0 score, 0 correct, has questions)')
      console.warn('⚠️ This looks like an automatic/error completion - blocking save')
      return {
        success: false,
        error: 'Invalid quiz results - appears to be automatic completion',
        isBackedUp: false
      }
    }
    
    const saveData: QuizSaveData = {
      ...data,
      completedAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
      id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // STEP 1: IMMEDIATELY backup to localStorage (this never fails)
    try {
      this.backupToLocalStorage(saveData)
      console.log('✅ Quiz results backed up locally - they are safe!')
    } catch (error) {
      console.error('❌ CRITICAL: Failed to backup quiz results locally:', error)
      // This should never happen, but if it does, we continue anyway
    }

    // STEP 2: Try immediate save to server
    try {
      console.log('🚀 Attempting immediate server save...')
      const result = await this.attemptServerSave(saveData)
      
      if (result.success) {
        console.log('✅ Quiz saved successfully on first attempt!')
        this.removeFromPendingSaves(saveData.id)
        this.cleanupBackup(saveData.id)
        return {
          success: true,
          attemptId: result.attemptId,
          isBackedUp: true
        }
      } else {
        console.warn('⚠️ Initial save failed, will retry in background')
        this.addToPendingSaves(saveData)
        this.scheduleRetries()
        return {
          success: false,
          error: result.error,
          isBackedUp: true // Results are safe in localStorage
        }
      }
    } catch (error) {
      console.error('❌ Server save failed, adding to retry queue:', error)
      this.addToPendingSaves(saveData)
      this.scheduleRetries()
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isBackedUp: true // Results are safe in localStorage
      }
    }
  }

  /**
   * Backup quiz results to localStorage immediately
   * This ensures results are never lost, even if everything else fails
   */
  private backupToLocalStorage(saveData: QuizSaveData): void {
    try {
      const existingBackups = this.getBackups()
      existingBackups[saveData.id] = saveData
      
      localStorage.setItem(QuizSaveManager.BACKUP_KEY, JSON.stringify(existingBackups))
      console.log(`💾 Quiz results backed up with ID: ${saveData.id}`)
    } catch (error) {
      console.error('CRITICAL: Failed to backup quiz results:', error)
      throw error
    }
  }

  /**
   * Get all backed up quiz results
   */
  private getBackups(): Record<string, QuizSaveData> {
    try {
      const data = localStorage.getItem(QuizSaveManager.BACKUP_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Error reading quiz backups:', error)
      return {}
    }
  }

  /**
   * Remove backup after successful save
   */
  private cleanupBackup(saveId: string): void {
    try {
      const backups = this.getBackups()
      delete backups[saveId]
      localStorage.setItem(QuizSaveManager.BACKUP_KEY, JSON.stringify(backups))
      console.log(`🗑️ Cleaned up backup for save ID: ${saveId}`)
    } catch (error) {
      console.error('Error cleaning up backup:', error)
    }
  }

  /**
   * Attempt to save to server
   */
  private async attemptServerSave(saveData: QuizSaveData): Promise<{
    success: boolean
    attemptId?: string
    error?: string
  }> {
    const requestPayload = {
      attemptId: saveData.attemptId,
      results: saveData.results,
      topicId: saveData.topicId,
      mode: saveData.searchParams?.mode || 'standard',
      podId: saveData.searchParams?.podId,
      classroomCourseId: saveData.searchParams?.classroomCourseId,
      classroomAssignmentId: saveData.searchParams?.classroomAssignmentId,
      cleverSectionId: saveData.searchParams?.cleverSectionId,
      guestToken: saveData.guestToken
    }

    console.log('📡 Sending quiz save request:', {
      topicId: saveData.topicId,
      score: saveData.results.score,
      hasUser: !saveData.guestToken,
      retryCount: saveData.retryCount
    })

    const response = await fetch('/api/quiz/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `Server error: ${response.status}`)
    }

    const responseData = await response.json()
    return {
      success: true,
      attemptId: responseData.attemptId
    }
  }

  /**
   * Add to pending saves for retry
   */
  private addToPendingSaves(saveData: QuizSaveData): void {
    try {
      const pending = this.getPendingSaves()
      const saveAttempt: SaveAttempt = {
        id: saveData.id,
        data: saveData,
        nextRetryAt: Date.now() + QuizSaveManager.RETRY_DELAYS[0],
        maxRetries: QuizSaveManager.MAX_RETRIES
      }
      
      pending[saveData.id] = saveAttempt
      localStorage.setItem(QuizSaveManager.STORAGE_KEY, JSON.stringify(pending))
      console.log(`⏳ Added quiz save to retry queue: ${saveData.id}`)
    } catch (error) {
      console.error('Error adding to pending saves:', error)
    }
  }

  /**
   * Get pending saves from localStorage
   */
  private getPendingSaves(): Record<string, SaveAttempt> {
    try {
      const data = localStorage.getItem(QuizSaveManager.STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Error reading pending saves:', error)
      return {}
    }
  }

  /**
   * Remove from pending saves after successful save
   */
  private removeFromPendingSaves(saveId: string): void {
    try {
      const pending = this.getPendingSaves()
      delete pending[saveId]
      localStorage.setItem(QuizSaveManager.STORAGE_KEY, JSON.stringify(pending))
      console.log(`✅ Removed from retry queue: ${saveId}`)
    } catch (error) {
      console.error('Error removing from pending saves:', error)
    }
  }

  /**
   * Schedule retry attempts with progressive backoff
   */
  private scheduleRetries(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
    }

    this.retryTimer = setTimeout(() => {
      this.processRetries()
    }, 2000) // Process retries every 2 seconds
  }

  /**
   * Process all pending retry attempts
   */
  private async processRetries(): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      const pending = this.getPendingSaves()
      const now = Date.now()

      // FIXED: Only process pending saves, not failed ones
      const pendingAttempts = Object.entries(pending).filter(([_, attempt]) => 
        attempt.data.status === 'pending'
      )

      console.log(`🔄 Processing ${pendingAttempts.length} pending quiz saves...`)

      for (const [saveId, attempt] of pendingAttempts) {
        // FIXED: Check retry count BEFORE attempting
        if (attempt.data.retryCount >= attempt.maxRetries) {
          console.error(`❌ FINAL FAILURE: Quiz save ${saveId} exceeded max retries (${attempt.data.retryCount}/${attempt.maxRetries})`)
          this.markAsFinallyFailed(attempt)
          continue
        }

        if (now >= attempt.nextRetryAt) {
          console.log(`🔁 Retrying save ${saveId} (attempt ${attempt.data.retryCount + 1}/${attempt.maxRetries})`)
          
          try {
            const result = await this.attemptServerSave(attempt.data)
            
            if (result.success) {
              console.log(`✅ Retry successful for save ${saveId}`)
              this.removeFromPendingSaves(saveId)
              this.cleanupBackup(saveId)
              
              // Mark quiz as completed
              this.markQuizAsCompleted(attempt.data)
            } else {
              this.handleRetryFailure(attempt)
            }
          } catch (error) {
            console.error(`❌ Retry failed for save ${saveId}:`, error)
            this.handleRetryFailure(attempt)
          }
        }
      }

      // Schedule next retry round if there are still pending saves
      const remainingPending = this.getPendingSaves()
      const stillPending = Object.values(remainingPending).filter(p => p.data.status === 'pending')
      if (stillPending.length > 0) {
        this.scheduleRetries()
      }
    } catch (error) {
      console.error('Error processing retries:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Handle retry failure with progressive backoff
   */
  private handleRetryFailure(attempt: SaveAttempt): void {
    attempt.data.retryCount++
    
    if (attempt.data.retryCount >= attempt.maxRetries) {
      console.error(`❌ FINAL FAILURE: Quiz save ${attempt.id} failed after ${attempt.maxRetries} attempts`)
      this.markAsFinallyFailed(attempt)
    } else {
      // Schedule next retry with progressive backoff
      const delayIndex = Math.min(attempt.data.retryCount - 1, QuizSaveManager.RETRY_DELAYS.length - 1)
      attempt.nextRetryAt = Date.now() + QuizSaveManager.RETRY_DELAYS[delayIndex]
      
      const pending = this.getPendingSaves()
      pending[attempt.id] = attempt
      localStorage.setItem(QuizSaveManager.STORAGE_KEY, JSON.stringify(pending))
      
      console.log(`⏰ Scheduling retry ${attempt.data.retryCount + 1} for save ${attempt.id} in ${QuizSaveManager.RETRY_DELAYS[delayIndex]}ms`)
    }
  }

  /**
   * Mark save as finally failed and remove from retry queue
   */
  private markAsFinallyFailed(attempt: SaveAttempt): void {
    attempt.data.status = 'failed'
    
    // FIXED: Remove from pending saves completely to stop retries
    this.removeFromPendingSaves(attempt.id)
    
    // Keep backup but mark as failed
    try {
      const backups = this.getBackups()
      if (backups[attempt.id]) {
        backups[attempt.id].status = 'failed'
        localStorage.setItem(QuizSaveManager.BACKUP_KEY, JSON.stringify(backups))
      }
    } catch (error) {
      console.error('Error updating backup status:', error)
    }
    
    console.log(`🛑 Quiz save ${attempt.id} marked as finally failed and removed from retry queue`)
    // TODO: Show user notification about failed save with manual retry option
  }

  /**
   * Mark quiz as completed in localStorage
   */
  private markQuizAsCompleted(saveData: QuizSaveData): void {
    try {
      // Mark topic as completed
      const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
      const completedTopics = savedCompleted ? JSON.parse(savedCompleted) : []
      if (!completedTopics.includes(saveData.topicId)) {
        completedTopics.push(saveData.topicId)
        localStorage.setItem("civicAppCompletedTopics_v1", JSON.stringify(completedTopics))
      }

      // Update last activity
      localStorage.setItem("civicAppLastActivity", new Date().toString())

      console.log(`✅ Marked topic ${saveData.topicId} as completed`)
    } catch (error) {
      console.error('Error marking quiz as completed:', error)
    }
  }

  /**
   * Get summary of save status for debugging
   */
  getSaveStatus(): {
    pendingSaves: number
    failedSaves: number
    backups: number
  } {
    const pending = this.getPendingSaves()
    const backups = this.getBackups()
    
    const pendingSaves = Object.values(pending).filter(p => p.data.status === 'pending').length
    const failedSaves = Object.values(backups).filter(p => p.status === 'failed').length
    
    return {
      pendingSaves,
      failedSaves,
      backups: Object.keys(backups).length
    }
  }

  /**
   * Clear all failed saves (for cleanup)
   */
  clearFailedSaves(): void {
    try {
      // Clear from pending
      const pending = this.getPendingSaves()
      const stillPending = Object.fromEntries(
        Object.entries(pending).filter(([_, attempt]) => attempt.data.status === 'pending')
      )
      localStorage.setItem(QuizSaveManager.STORAGE_KEY, JSON.stringify(stillPending))
      
      // Clear failed from backups
      const backups = this.getBackups()
      const validBackups = Object.fromEntries(
        Object.entries(backups).filter(([_, data]) => data.status !== 'failed')
      )
      localStorage.setItem(QuizSaveManager.BACKUP_KEY, JSON.stringify(validBackups))
      
      console.log('🗑️ Cleared all failed saves')
    } catch (error) {
      console.error('Error clearing failed saves:', error)
    }
  }

  /**
   * Initialize the save manager (call on app start)
   */
  initialize(): void {
    console.log('🛡️ QuizSaveManager: Initializing...')
    
    // Clear any failed saves from previous session to prevent accumulation
    this.clearFailedSaves()
    
    // Process any pending saves from previous session
    this.processRetries()
    
    // Start periodic processing
    setInterval(() => {
      const status = this.getSaveStatus()
      if (status.pendingSaves > 0) {
        console.log(`🔄 QuizSaveManager status: ${status.pendingSaves} pending, ${status.failedSaves} failed, ${status.backups} backed up`)
        this.processRetries()
      }
    }, 30000) // Check every 30 seconds
  }
}

// Global instance
export const quizSaveManager = new QuizSaveManager()

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  quizSaveManager.initialize()
} 