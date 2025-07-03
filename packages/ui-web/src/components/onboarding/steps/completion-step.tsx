'use client'

import React, { useEffect } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ArrowRight, Sparkles, Check, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useToast } from "../components/ui/use-toast"

interface CompletionStepProps {
  onComplete: (data: any) => void
  onNext: () => void
  onboardingState: any
}

export function CompletionStep({ onComplete, onboardingState }: CompletionStepProps) {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Subtle celebration - less overwhelming
    const sparkle = () => {
      const colors = ['#1E3A8A', '#DC2626', '#059669']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const sparkleEl = document.createElement('div')
          sparkleEl.innerHTML = '✨'
          sparkleEl.style.position = 'fixed'
          sparkleEl.style.left = Math.random() * window.innerWidth + 'px'
          sparkleEl.style.top = Math.random() * window.innerHeight + 'px'
          sparkleEl.style.fontSize = '24px'
          sparkleEl.style.pointerEvents = 'none'
          sparkleEl.style.zIndex = '9999'
          sparkleEl.style.animation = 'fadeInOut 2s ease-out forwards'
          
          document.body.appendChild(sparkleEl)
          
          setTimeout(() => {
            if (sparkleEl.parentNode) {
              sparkleEl.parentNode.removeChild(sparkleEl)
            }
          }, 2000)
        }, i * 200)
      }
    }
    
    sparkle()
    const interval = setInterval(sparkle, 3000)
    
    return () => clearInterval(interval)
  }, [])

  const handleGetStarted = () => {
    // Complete onboarding
    onComplete({
      onboardingCompleted: true,
      completedAt: Date.now(),
      readyToStart: true
    })
    
    // Show success toast when redirected to dashboard
    toast({
      title: "Onboarding complete!",
      description: "Your CivicSense experience has been personalized.",
      variant: "default",
    })
    
    // Navigate to dashboard
    router.push('/dashboard')
  }

  // Extract data for personalization
  let selectedCategories = onboardingState?.categories?.categories || [];
  // If categories are just IDs, try to map to full objects
  if (selectedCategories.length > 0 && typeof selectedCategories[0] === 'string') {
    // Try to get all categories from onboardingState or fallback
    const allCategories = onboardingState?.allCategories || [];
    selectedCategories = selectedCategories.map((id: string) => {
      const found = allCategories.find((cat: any) => cat.id === id);
      return found || { id, name: id, emoji: '🧠' };
    });
  }
  const assessmentScore = onboardingState?.assessment?.assessmentResults?.score || 0
  const learningStyle = onboardingState?.preferences?.preferences?.learningStyle || 'mixed'

  const getPersonalizedMessage = () => {
    if (assessmentScore >= 80) {
      return "You clearly know your stuff! We've got challenging content that will keep you engaged."
    } else if (assessmentScore >= 60) {
      return "Nice foundation! We'll build on what you know and introduce new concepts."
    } else {
      return "Perfect starting point! We'll begin with the basics and gradually introduce more complex topics."
    }
  }

  const getLearningStyleMessage = () => {
    switch (learningStyle) {
      case 'bite_sized':
        return "We'll keep things quick and digestible - perfect for learning on the go."
      case 'deep_dive':
        return "We'll provide detailed explanations and context to really dig into topics."
      case 'mixed':
        return "We'll mix short questions with deeper dives based on your mood and time."
      default:
        return "We'll adapt to how you like to learn as we go."
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-16">
      {/* Minimal, clean header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center">
          <div className="text-7xl mb-8">🎉</div>
          <h2 className="text-4xl font-light text-slate-900 dark:text-white mb-4">
            You're all set
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-md mx-auto">
            We've personalized your experience based on your preferences
          </p>
        </div>
      </motion.div>

      {/* Clean, minimalist learning plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-12">
          {/* Your plan */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-slate-900 dark:text-white">
              <Check className="h-5 w-5 text-green-500" />
              <h3 className="text-xl font-light">Your Learning Plan</h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 font-light text-center max-w-lg mx-auto">
              {getPersonalizedMessage()}
            </p>
          </div>
          
          {/* Category highlights */}
          {selectedCategories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-slate-900 dark:text-white">
                <Rocket className="h-5 w-5 text-blue-500" />
                <h3 className="text-xl font-light">Focus Areas</h3>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedCategories.slice(0, 5).map((cat: any, index: number) => (
                  <Badge key={index} variant="outline" className="text-sm px-3 py-1 flex items-center gap-2">
                    <span className="text-lg">{cat.emoji || '🧠'}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{cat.name ? cat.name : cat.id}</span>
                  </Badge>
                ))}
                {selectedCategories.length > 5 && (
                  <Badge variant="outline" className="text-sm px-3 py-1 font-medium text-slate-700 dark:text-slate-200">
                    +{selectedCategories.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Learning style */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-slate-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-xl font-light">Your Learning Style</h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 font-light text-center max-w-lg mx-auto">
              {getLearningStyleMessage()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Simple, encouraging action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="text-center space-y-6 pt-4">
          <Button 
            onClick={handleGetStarted}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white text-lg px-10 py-6 h-auto rounded-full font-light group"
          >
            Go to dashboard
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="text-sm text-slate-500 dark:text-slate-500 font-light">
            You can adjust your preferences anytime in settings
          </p>
        </div>
      </motion.div>

      {/* Add CSS for sparkle animation */}
      <style jsx global>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(20px) scale(0.8); }
          50% { opacity: 1; transform: translateY(-10px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-30px) scale(0.8); }
        }
      `}</style>
    </div>
  )
}