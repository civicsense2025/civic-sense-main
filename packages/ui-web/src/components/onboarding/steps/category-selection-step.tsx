'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

interface Category {
  id: string
  name: string
  emoji: string
  description: string
  display_order: number
  question_count: number
}

interface CategorySelectionStepProps {
  onComplete: (data: { categories: Array<{ id: string; interest_level: number; priority_rank?: number }> }) => void
  onNext: () => void
  onBack: () => void
  onSkip: (reason: string) => void
  onboardingState: any
  initialData?: {
    categories?: Array<{ id: string; interest_level: number; priority_rank?: number }>
  }
}

export function CategorySelectionStep({
  onComplete,
  onNext,
  onBack,
  onSkip,
  onboardingState,
  initialData
}: CategorySelectionStepProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/onboarding/categories').then(res => res.json());
        // Handle the new API response format
        const categoriesData = response.data || [];
        setCategories(categoriesData);
        
        if (initialData?.categories) {
          const initialSelections = new Set(initialData.categories.map(cat => cat.id));
          setSelectedCategories(initialSelections);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Provide fallback categories if API fails
        setCategories([
          {
            id: '1',
            name: 'Government',
            emoji: '🏛️',
            description: 'How government works at local, state, and federal levels',
            display_order: 1,
            question_count: 25
          },
          {
            id: '2',
            name: 'Elections',
            emoji: '🗳️',
            description: 'Voting rights, election processes, and campaign finance',
            display_order: 2,
            question_count: 18
          },
          {
            id: '3',
            name: 'Civil Rights',
            emoji: '✊',
            description: 'Constitutional rights and civil liberties',
            display_order: 3,
            question_count: 15
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, [initialData]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(categoryId)) {
        newSelection.delete(categoryId)
      } else {
        newSelection.add(categoryId)
      }
      return newSelection
    })
  }

  const handleNext = () => {
    const categoriesData = Array.from(selectedCategories).map((id, index) => ({
      id,
      interest_level: 4, // Default high interest for selected items
      priority_rank: index + 1
    }))

    onComplete({ categories: categoriesData })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* More conversational heading */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-light text-slate-900 dark:text-white">
          What interests you most?
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
          Pick any topics that catch your attention. We'll focus on these areas first.
        </p>
      </div>

      {/* Simplified grid - less formal cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((category, index) => {
          const isSelected = selectedCategories.has(category.id)

          return (
            <div key={category.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left group hover:scale-105 ${
                    isSelected 
                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="text-3xl">{category.emoji}</div>
                    <div>
                      <h3 className={`font-medium ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>
                        {category.name}
                      </h3>
                      <p className={`text-sm font-light mt-1 ${
                        isSelected 
                          ? 'text-slate-200 dark:text-slate-700' 
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {category.description}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* Simple selected count - less formal */}
      {selectedCategories.size > 0 && (
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <Badge variant="outline" className="text-sm font-light">
                {selectedCategories.size} topic{selectedCategories.size !== 1 ? 's' : ''} selected
              </Badge>
            </div>
          </motion.div>
        </div>
      )}

      {/* Streamlined navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-light"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center space-x-4">
          {selectedCategories.size === 0 && (
            <Button 
              variant="ghost" 
              onClick={() => onSkip('no_categories_selected')}
              className="text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-light"
            >
              Skip for now
            </Button>
          )}
          
          <Button 
            onClick={handleNext}
            disabled={selectedCategories.size === 0}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-6 py-2 rounded-full font-light group"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  )
}