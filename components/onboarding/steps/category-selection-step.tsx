'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Star, BookOpen, Users, Globe, CheckCircle2, Circle, Heart, Brain, Scale } from 'lucide-react'
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
  const [selectedCategories, setSelectedCategories] = useState<Map<string, { interest_level: number; priority_rank?: number }>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        // This would call your Supabase function
        const { data } = await fetch('/api/onboarding/categories').then(res => res.json())
        setCategories(data || [])
        
        // Load initial selections if provided
        if (initialData?.categories) {
          const initialSelections = new Map()
          initialData.categories.forEach(cat => {
            initialSelections.set(cat.id, { 
              interest_level: cat.interest_level, 
              priority_rank: cat.priority_rank 
            })
          })
          setSelectedCategories(initialSelections)
        }
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [initialData])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSelection = new Map(prev)
      if (newSelection.has(categoryId)) {
        newSelection.delete(categoryId)
      } else {
        newSelection.set(categoryId, { interest_level: 4 }) // Default high interest
      }
      return newSelection
    })
  }

  const updateInterestLevel = (categoryId: string, level: number) => {
    setSelectedCategories(prev => {
      const newSelection = new Map(prev)
      const existing = newSelection.get(categoryId) || { interest_level: level }
      newSelection.set(categoryId, { ...existing, interest_level: level })
      return newSelection
    })
  }

  const getInterestLabel = (level: number) => {
    switch (level) {
      case 1: return 'Low Interest'
      case 2: return 'Some Interest'
      case 3: return 'Moderate Interest'
      case 4: return 'High Interest'
      case 5: return 'Very High Interest'
      default: return 'Moderate Interest'
    }
  }

  const getInterestColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-gray-100 text-gray-700'
      case 2: return 'bg-blue-100 text-blue-700'
      case 3: return 'bg-green-100 text-green-700'
      case 4: return 'bg-orange-100 text-orange-700'
      case 5: return 'bg-red-100 text-red-700'
      default: return 'bg-green-100 text-green-700'
    }
  }

  const handleNext = () => {
    const categoriesData = Array.from(selectedCategories.entries()).map(([id, data], index) => ({
      id,
      interest_level: data.interest_level,
      priority_rank: index + 1
    }))

    onComplete({ categories: categoriesData })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-bold text-gray-900">Choose Your Civic Interests</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the areas of civic knowledge you're most interested in learning about. 
            We'll personalize your experience based on your choices.
          </p>
        </motion.div>

        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Circle className="w-4 h-4" />
            <span>Not Selected</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Selected</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category, index) => {
          const isSelected = selectedCategories.has(category.id)
          const selection = selectedCategories.get(category.id)
          const interestLevel = selection?.interest_level || 3

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleCategory(category.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{category.emoji}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {category.question_count} questions available
                    </div>
                    
                    {isSelected && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Interest:</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <button
                              key={level}
                              className={`w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                                level <= interestLevel
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                updateInterestLevel(category.id, level)
                              }}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-gray-200"
                    >
                      <Badge className={getInterestColor(interestLevel)}>
                        {getInterestLabel(interestLevel)}
                      </Badge>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Selection Summary */}
      {selectedCategories.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <h4 className="font-medium text-gray-900 mb-2">
            Selected Categories ({selectedCategories.size})
          </h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedCategories.entries()).map(([categoryId, selection]) => {
              const category = categories.find(c => c.id === categoryId)
              if (!category) return null
              
              return (
                <Badge 
                  key={categoryId}
                  variant="secondary" 
                  className="text-sm"
                >
                  {category.emoji} {category.name} ({getInterestLabel(selection.interest_level)})
                </Badge>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={selectedCategories.size === 0}
        >
          Continue ({selectedCategories.size} selected)
        </Button>
      </div>
    </div>
  )
} 