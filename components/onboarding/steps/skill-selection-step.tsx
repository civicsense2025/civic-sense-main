'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Star, Target, Clock, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

// Using existing skills table structure
interface Skill {
  id: string;
  skill_name: string;
  skill_slug: string;
  category_id: string;
  category_name: string;
  description: string;
  difficulty_level: number;
  is_core_skill: boolean;
}

interface SkillSelectionStepProps {
  onComplete: (data: { skills: Array<{ id: string; interest_level: number; target_mastery_level: string; learning_timeline: string }> }) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: (reason: string) => void;
  onboardingState: any;
  initialData?: {
    categories?: Array<{ id: string; interest_level: number }>;
    skills?: Array<{ id: string; interest_level: number; target_mastery_level: string; learning_timeline: string }>;
  };
}

export function SkillSelectionStep({
  onComplete,
  onNext,
  onBack,
  onSkip,
  onboardingState,
  initialData
}: SkillSelectionStepProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Map<string, { 
    interest_level: number; 
    target_mastery_level: string; 
    learning_timeline: string 
  }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [groupedSkills, setGroupedSkills] = useState<Map<string, Skill[]>>(new Map());

  // Load skills from existing skills table, filtered by selected categories
  useEffect(() => {
    const loadSkills = async () => {
      try {
        // Get category IDs from previous step selections
        const selectedCategoryIds = initialData?.categories?.map(cat => cat.id) || [];
        
        // Build query parameters
        const queryParams = selectedCategoryIds.length > 0 
          ? `?category_ids=${JSON.stringify(selectedCategoryIds)}`
          : '';
        
        const { data } = await fetch(`/api/onboarding/skills${queryParams}`).then(res => res.json());
        setSkills(data || []);
        
        // Group skills by category
        const grouped = new Map<string, Skill[]>();
        (data || []).forEach((skill: Skill) => {
          if (!grouped.has(skill.category_name)) {
            grouped.set(skill.category_name, []);
          }
          grouped.get(skill.category_name)!.push(skill);
        });
        setGroupedSkills(grouped);
        
        // Load initial skill selections if provided
        if (initialData?.skills) {
          const initialSelections = new Map();
          initialData.skills.forEach(skill => {
            initialSelections.set(skill.id, {
              interest_level: skill.interest_level,
              target_mastery_level: skill.target_mastery_level,
              learning_timeline: skill.learning_timeline
            });
          });
          setSelectedSkills(initialSelections);
        }
      } catch (error) {
        console.error('Failed to load skills:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [initialData]);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => {
      const newSelection = new Map(prev);
      if (newSelection.has(skillId)) {
        newSelection.delete(skillId);
      } else {
        newSelection.set(skillId, { 
          interest_level: 4, 
          target_mastery_level: 'intermediate',
          learning_timeline: 'flexible'
        });
      }
      return newSelection;
    });
  };

  const updateSkillPreference = (skillId: string, field: string, value: any) => {
    setSelectedSkills(prev => {
      const newSelection = new Map(prev);
      const existing = newSelection.get(skillId) || { 
        interest_level: 4, 
        target_mastery_level: 'intermediate',
        learning_timeline: 'flexible' 
      };
      newSelection.set(skillId, { ...existing, [field]: value });
      return newSelection;
    });
  };

  const getDifficultyIcon = (level: number) => {
    switch (level) {
      case 1: return <Star className="w-4 h-4 text-green-500" />;
      case 2: return <Star className="w-4 h-4 text-yellow-500" />;
      case 3: return <Star className="w-4 h-4 text-orange-500" />;
      case 4: return <Star className="w-4 h-4 text-red-500" />;
      case 5: return <Star className="w-4 h-4 text-purple-500" />;
      default: return <Star className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Intermediate';
      case 3: return 'Advanced';
      case 4: return 'Expert';
      case 5: return 'Master';
      default: return 'Unknown';
    }
  };

  const getMasteryLevelColor = (level: string) => {
    switch (level) {
      case 'novice': return 'bg-gray-100 text-gray-700';
      case 'beginner': return 'bg-blue-100 text-blue-700';
      case 'intermediate': return 'bg-green-100 text-green-700';
      case 'advanced': return 'bg-orange-100 text-orange-700';
      case 'expert': return 'bg-red-100 text-red-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const getTimelineColor = (timeline: string) => {
    switch (timeline) {
      case 'immediate': return 'bg-red-100 text-red-700';
      case 'weeks': return 'bg-orange-100 text-orange-700';
      case 'months': return 'bg-blue-100 text-blue-700';
      case 'flexible': return 'bg-green-100 text-green-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const handleNext = () => {
    const skillsData = Array.from(selectedSkills.entries()).map(([id, preferences]) => ({
      id,
      interest_level: preferences.interest_level,
      target_mastery_level: preferences.target_mastery_level,
      learning_timeline: preferences.learning_timeline
    }));

    onComplete({ skills: skillsData });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-bold text-gray-900">Choose Your Learning Goals</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Select the specific civic skills you want to develop. We'll create a personalized 
            learning path based on your interests and goals.
          </p>
        </motion.div>

        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Circle className="w-4 h-4" />
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>Core Skill</span>
          </div>
        </div>
      </div>

      {/* Skills grouped by category */}
      <div className="space-y-8">
        {Array.from(groupedSkills.entries()).map(([categoryName, categorySkills]) => (
          <motion.div
            key={categoryName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
              <Brain className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">{categoryName}</h3>
              <Badge variant="outline">
                {categorySkills.filter(skill => selectedSkills.has(skill.id)).length} / {categorySkills.length} selected
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorySkills.map((skill, index) => {
                const isSelected = selectedSkills.has(skill.id);
                const preferences = selectedSkills.get(skill.id);

                return (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected 
                          ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleSkill(skill.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <CardTitle className="text-lg font-medium">{skill.skill_name}</CardTitle>
                              {skill.is_core_skill && (
                                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                  <Star className="w-3 h-3 mr-1" />
                                  Core
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                {getDifficultyIcon(skill.difficulty_level)}
                                <span>{getDifficultyLabel(skill.difficulty_level)}</span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {skill.description}
                            </p>
                          </div>
                          
                          {isSelected ? (
                            <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0 ml-3" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400 flex-shrink-0 ml-3" />
                          )}
                        </div>
                      </CardHeader>

                      {isSelected && preferences && (
                        <CardContent className="pt-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-4 pt-3 border-t border-gray-200"
                          >
                            {/* Interest Level */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Interest Level</label>
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <button
                                    key={level}
                                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                                      level <= preferences.interest_level
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateSkillPreference(skill.id, 'interest_level', level);
                                    }}
                                  >
                                    {level}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Target Mastery & Timeline */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Target Level</label>
                                <select
                                  value={preferences.target_mastery_level}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updateSkillPreference(skill.id, 'target_mastery_level', e.target.value);
                                  }}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="novice">Novice</option>
                                  <option value="beginner">Beginner</option>
                                  <option value="intermediate">Intermediate</option>
                                  <option value="advanced">Advanced</option>
                                  <option value="expert">Expert</option>
                                </select>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Timeline</label>
                                <select
                                  value={preferences.learning_timeline}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updateSkillPreference(skill.id, 'learning_timeline', e.target.value);
                                  }}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="immediate">Immediate</option>
                                  <option value="weeks">Few Weeks</option>
                                  <option value="months">Few Months</option>
                                  <option value="flexible">Flexible</option>
                                </select>
                              </div>
                            </div>

                            {/* Preview badges */}
                            <div className="flex flex-wrap gap-2">
                              <Badge className={getMasteryLevelColor(preferences.target_mastery_level)}>
                                <Target className="w-3 h-3 mr-1" />
                                {preferences.target_mastery_level}
                              </Badge>
                              <Badge className={getTimelineColor(preferences.learning_timeline)}>
                                <Clock className="w-3 h-3 mr-1" />
                                {preferences.learning_timeline}
                              </Badge>
                            </div>
                          </motion.div>
                        </CardContent>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selection Summary */}
      {selectedSkills.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <h4 className="font-semibold text-gray-900 mb-3">
            Learning Plan Summary ({selectedSkills.size} skills selected)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(selectedSkills.entries()).map(([skillId, preferences]) => {
              const skill = skills.find(s => s.id === skillId);
              if (!skill) return null;
              
              return (
                <div key={skillId} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="font-medium text-sm text-gray-900">{skill.skill_name}</div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      Level {preferences.interest_level}/5
                    </Badge>
                    <Badge className={getMasteryLevelColor(preferences.target_mastery_level) + ' text-xs'}>
                      {preferences.target_mastery_level}
                    </Badge>
                    <Badge className={getTimelineColor(preferences.learning_timeline) + ' text-xs'}>
                      {preferences.learning_timeline}
                    </Badge>
                  </div>
                </div>
              );
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
          disabled={selectedSkills.size === 0}
        >
          Continue ({selectedSkills.size} skills selected)
        </Button>
      </div>
    </div>
  );
}; 