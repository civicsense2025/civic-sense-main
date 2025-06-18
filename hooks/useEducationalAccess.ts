import { useState, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/hooks/use-toast'

interface EducationalAccessResult {
  isChecking: boolean
  hasAccess: boolean | null
  lastChecked: Date | null
  error: string | null
}

export function useEducationalAccess() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [result, setResult] = useState<EducationalAccessResult>({
    isChecking: false,
    hasAccess: null,
    lastChecked: null,
    error: null
  })

  const checkEducationalAccess = useCallback(async (userEmail?: string) => {
    if (!user) {
      setResult(prev => ({ ...prev, error: 'User not authenticated' }))
      return false
    }

    const emailToCheck = userEmail || user.email
    if (!emailToCheck) {
      setResult(prev => ({ ...prev, error: 'No email address available' }))
      return false
    }

    // Only check .edu emails to reduce unnecessary calls
    if (!emailToCheck.toLowerCase().includes('.edu')) {
      setResult(prev => ({ 
        ...prev, 
        hasAccess: false, 
        error: 'Educational access is only available for .edu email addresses',
        lastChecked: new Date()
      }))
      return false
    }

    setResult(prev => ({ ...prev, isChecking: true, error: null }))

    try {
      console.log(`🎓 Checking educational access for ${emailToCheck}`)
      
      const response = await fetch('/api/auth/grant-educational-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: emailToCheck,
          emailConfirmed: true
        })
      })

      const responseData = await response.json()

      if (response.ok) {
        console.log('✅ Educational access check completed:', responseData.message)
        setResult(prev => ({ 
          ...prev, 
          isChecking: false, 
          hasAccess: true, 
          lastChecked: new Date(),
          error: null
        }))
        
        toast({
          title: "Educational Access Granted! 🎓",
          description: responseData.message || 'Your educational institution email has been verified.',
          variant: "default",
        })
        
        return true
      } else {
        console.log(`⚠️ Educational access check failed:`, responseData.error)
        setResult(prev => ({ 
          ...prev, 
          isChecking: false, 
          hasAccess: false, 
          lastChecked: new Date(),
          error: responseData.error || 'Educational access verification failed'
        }))
        
        return false
      }
    } catch (error) {
      console.error('❌ Error checking educational access:', error)
      const errorMessage = 'Failed to check educational access. Please try again.'
      setResult(prev => ({ 
        ...prev, 
        isChecking: false, 
        hasAccess: false, 
        lastChecked: new Date(),
        error: errorMessage
      }))
      
      toast({
        title: "Educational Access Check Failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      return false
    }
  }, [user, toast])

  const reset = useCallback(() => {
    setResult({
      isChecking: false,
      hasAccess: null,
      lastChecked: null,
      error: null
    })
  }, [])

  return {
    ...result,
    checkEducationalAccess,
    reset,
    canCheck: !!user?.email && user.email.toLowerCase().includes('.edu')
  }
} 