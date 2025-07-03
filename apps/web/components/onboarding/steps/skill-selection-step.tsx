'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle2, Circle, Star, Target, Clock, Brain, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  // Collapsed state for each category
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  // Expanded state for each skill card
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [autoOpened, setAutoOpened] = useState<Set<string>>(new Set());
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
        
        const response = await fetch(`/api/onboarding/skills${queryParams}`).then(res => res.json());
        // Handle the new API response format
        const skillsData = response.data || [];
        setSkills(skillsData);
        
        // Group skills by category
        const grouped = new Map<string, Skill[]>();
        skillsData.forEach((skill: Skill) => {
          if (!grouped.has(skill.category_name)) {
            grouped.set(skill.category_name, []);
          }
          grouped.get(skill.category_name)!.push(skill);
        });
        // Sort skills alphabetically within each category
        grouped.forEach((arr, key) => {
          grouped.set(key, [...arr].sort((a, b) => a.skill_name.localeCompare(b.skill_name)));
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
        // Provide fallback skills if API fails
        const fallbackSkills = [
          {
            id: '1',
            skill_name: 'Read Government Budgets',
            skill_slug: 'read-budgets',
            category_id: '1',
            category_name: 'Government',
            description: 'Understand where tax money goes and what governments prioritize',
            difficulty_level: 2,
            is_core_skill: true
          },
          {
            id: '2',
            skill_name: 'Research Candidates',
            skill_slug: 'research-candidates',
            category_id: '2',
            category_name: 'Elections',
            description: 'Look up candidates\' backgrounds, positions, and track records',
            difficulty_level: 2,
            is_core_skill: true
          },
          {
            id: '3',
            skill_name: 'Check Sources',
            skill_slug: 'check-sources',
            category_id: '4',
            category_name: 'Media Literacy',
            description: 'Verify whether news sources and websites are trustworthy',
            difficulty_level: 1,
            is_core_skill: true
          }
        ];
        setSkills(fallbackSkills);
        
        // Group fallback skills by category
        const grouped = new Map<string, Skill[]>();
        fallbackSkills.forEach((skill: any) => {
          if (!grouped.has(skill.category_name)) {
            grouped.set(skill.category_name, []);
          }
          grouped.get(skill.category_name)!.push(skill);
        });
        setGroupedSkills(grouped);
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [initialData]);

  // Always open the first category by default
  useEffect(() => {
    if (groupedSkills.size > 0) {
      const firstCategory = Array.from(groupedSkills.keys())[0];
      setCollapsedCategories(prev => ({ ...prev, [firstCategory]: false }));
      setAutoOpened(new Set([firstCategory]));
    }
  }, [groupedSkills]);

  // Auto-open category when scrolled into view
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const cat = entry.target.getAttribute('data-category');
            if (cat && !autoOpened.has(cat)) {
              setCollapsedCategories(prev => ({ ...prev, [cat]: false }));
              setAutoOpened(prev => new Set(prev).add(cat));
            }
          }
        });
      },
      { threshold: 0.2 }
    );
    Object.entries(categoryRefs.current).forEach(([cat, ref]) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, [groupedSkills, autoOpened]);

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

  // Filtered grouped skills by difficulty
  const getFilteredGroupedSkills = () => {
    if (difficultyFilter === 'all') return groupedSkills;
    const filterFn = (level: number) => {
      if (difficultyFilter === 'beginner') return level === 1;
      if (difficultyFilter === 'intermediate') return level === 2;
      return level >= 3;
    };
    const filtered = new Map<string, Skill[]>();
    groupedSkills.forEach((skills, cat) => {
      const filteredSkills = skills.filter(skill => filterFn(skill.difficulty_level));
      if (filteredSkills.length > 0) filtered.set(cat, filteredSkills);
    });
    return filtered;
  };

  // Toggle collapse for category
  const toggleCategoryCollapse = (categoryName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Toggle expand for skill card (only by clicking header)
  const handleSkillHeaderClick = (skillId: string) => {
    setExpandedSkill(prev => (prev === skillId ? null : skillId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative max-w-5xl mx-auto flex flex-col gap-8">
      {/* Main skill selection area */}
      <div className="flex-1 space-y-6">
        <div className="text-center space-y-4">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-light tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
                  Choose Your Learning Goals
                </h2>
                <p className="text-lg text-gray-500 dark:text-slate-400 max-w-3xl mx-auto font-light">
                  Select the specific civic skills you want to develop. We'll create a personalized learning path based on your interests and goals.
                </p>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400 dark:text-slate-500">
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

          {/* Difficulty Filter Controls */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button size="sm" variant={difficultyFilter === 'all' ? 'default' : 'outline'} onClick={() => setDifficultyFilter('all')}>All</Button>
            <Button size="sm" variant={difficultyFilter === 'beginner' ? 'default' : 'outline'} onClick={() => setDifficultyFilter('beginner')}>Beginner</Button>
            <Button size="sm" variant={difficultyFilter === 'intermediate' ? 'default' : 'outline'} onClick={() => setDifficultyFilter('intermediate')}>Intermediate</Button>
            <Button size="sm" variant={difficultyFilter === 'advanced' ? 'default' : 'outline'} onClick={() => setDifficultyFilter('advanced')}>Advanced</Button>
          </div>
        </div>

        {/* Skills grouped by category, collapsible */}
        <div className="space-y-8">
          {Array.from(getFilteredGroupedSkills().entries()).map(([categoryName, categorySkills], idx) => (
            <div
              key={categoryName}
              ref={(el: HTMLDivElement | null) => { categoryRefs.current[categoryName] = el; }}
              data-category={categoryName}
              className="border rounded-2xl bg-white dark:bg-slate-950 shadow-sm"
            >
              <button
                className="w-full flex items-center justify-between px-6 py-4 focus:outline-none group"
                onClick={() => toggleCategoryCollapse(categoryName)}
                aria-expanded={!collapsedCategories[categoryName]}
                aria-controls={`skills-${categoryName}`}
              >
                <div className="flex items-center gap-2">
                  {/* Use category emoji if available, fallback to icon */}
                  <span className="text-2xl mr-1">{categorySkills[0]?.category_name && onboardingState?.categories?.categories?.find?.((c: any) => c.name === categoryName)?.emoji || '🧠'}</span>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white font-light tracking-tight">{categoryName}</h3>
                  <Badge variant="outline">
                    {categorySkills.filter(skill => selectedSkills.has(skill.id)).length} / {categorySkills.length} selected
                  </Badge>
                </div>
                <span className="ml-2">
                  {collapsedCategories[categoryName] ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </span>
              </button>
              <div
                id={`skills-${categoryName}`}
                className={`transition-all duration-300 overflow-hidden ${collapsedCategories[categoryName] ? 'max-h-0' : 'max-h-[2000px]'}`}
                aria-hidden={collapsedCategories[categoryName]}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  {categorySkills.map((skill, index) => {
                    const isSelected = selectedSkills.has(skill.id);
                    const preferences = selectedSkills.get(skill.id);
                    const isExpanded = expandedSkill === skill.id;
                    return (
                      <div key={skill.id} className="h-full flex flex-col">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card
                            className={`relative flex flex-col justify-between h-full min-h-[220px] max-h-full cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isSelected
                                ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {/* Card header only toggles expand */}
                            <CardHeader
                              className="pb-3 cursor-pointer select-none"
                              onClick={() => handleSkillHeaderClick(skill.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <CardTitle className="text-lg font-medium">{skill.skill_name}</CardTitle>
                                    {skill.is_core_skill && (
                                      <Badge variant="secondary" className="text-xs">
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
                            {/* Card content only expands if expandedSkill === skill.id */}
                            {isExpanded && (
                              <CardContent className="pt-0" onClick={e => e.stopPropagation()}>
                                <div>
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                  >
                                    <div className="space-y-4 pt-3 border-t border-gray-200">
                                      {/* Interest Level */}
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Interest Level</label>
                                        <div className="flex space-x-1">
                                          {[1, 2, 3, 4, 5].map((level) => (
                                            <button
                                              key={level}
                                              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                                                level <= (preferences?.interest_level || 4)
                                                  ? 'bg-blue-600 text-white'
                                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                              }`}
                                              onClick={e => {
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
                                            value={preferences?.target_mastery_level || 'intermediate'}
                                            onChange={e => {
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
                                            value={preferences?.learning_timeline || 'flexible'}
                                            onChange={e => {
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
                                        <Badge className={getMasteryLevelColor(preferences?.target_mastery_level || 'intermediate')}>
                                          <Target className="w-3 h-3 mr-1" />
                                          {preferences?.target_mastery_level || 'intermediate'}
                                        </Badge>
                                        <Badge className={getTimelineColor(preferences?.learning_timeline || 'flexible')}>
                                          <Clock className="w-3 h-3 mr-1" />
                                          {preferences?.learning_timeline || 'flexible'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </motion.div>
                                </div>
                              </CardContent>
                            )}
                            {/* Card click toggles selection, but not if clicking header or expanded content */}
                            <button
                              className="absolute inset-0 z-0 opacity-0 cursor-pointer"
                              tabIndex={-1}
                              aria-label={isSelected ? 'Deselect skill' : 'Select skill'}
                              onClick={e => {
                                e.stopPropagation();
                                toggleSkill(skill.id);
                              }}
                            />
                          </Card>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Floating learning plan summary overlay */}
      <div
        className="fixed top-8 right-6 z-50 max-w-xs w-full"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 backdrop-blur-lg" style={{ boxShadow: '0 8px 32px rgba(30,58,138,0.10)' }}>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 tracking-tight" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
            Learning Plan Summary ({selectedSkills.size} skills selected)
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {Array.from(selectedSkills.entries()).map(([skillId, preferences]) => {
              const skill = skills.find(s => s.id === skillId);
              if (!skill) return null;
              return (
                <div key={skillId} className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 space-y-2 flex flex-col shadow-sm">
                  <div className="font-medium text-sm text-gray-900 dark:text-white font-light tracking-tight">{skill.skill_name}</div>
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
          <Button
            onClick={handleNext}
            disabled={selectedSkills.size === 0}
            className="w-full mt-6 font-semibold text-base rounded-full h-12 transition-all duration-200 bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md hover:bg-blue-700 dark:hover:bg-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            style={{ letterSpacing: '-0.01em' }}
          >
            Continue ({selectedSkills.size} skills selected)
          </Button>
        </div>
      </div>
      {/* Mobile floating summary */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-lg p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900 dark:text-white">
            {selectedSkills.size} skills selected
          </span>
          <Button
            onClick={handleNext}
            disabled={selectedSkills.size === 0}
            className="font-semibold rounded-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md hover:bg-blue-700 dark:hover:bg-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            Continue
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from(selectedSkills.entries()).map(([skillId, preferences]) => {
            const skill = skills.find(s => s.id === skillId);
            if (!skill) return null;
            return (
              <Badge key={skillId} variant="outline" className="text-xs">
                {skill.skill_name}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 