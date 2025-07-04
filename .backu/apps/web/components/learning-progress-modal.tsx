"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { dataService } from '@civicsense/business-logic/services'
import type { TopicMetadata } from '@civicsense/types/quiz'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { 
  CheckCircle, Award, Calendar, TrendingUp, Target, BookOpen, 
  Trophy, Star, Flame, Crown, Zap, Brain, Clock, Users,
  ChevronRight, BarChart3, Settings, Plus, Lightbulb
} from "lucide-react"
import { useCanonicalCategories } from '@civicsense/business-logic/hooks/useCanonicalCategories'
import { cn } from '@civicsense/business-logic/utils'
import { 
  enhancedProgressOperations, 
  skillTrackingOperations, 
  achievementOperations,
  learningGoalOperations,
  type EnhancedUserProgress,
  type CategorySkill,
  type Achievement,
  type LearningGoal
} from '@civicsense/business-logic/services/gamification'

interface LearningProgressModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LearningProgressModal({ isOpen, onClose }: LearningProgressModalProps) {
  const { user } = useAuth()
  const { getCategoryInfo } = useCanonicalCategories()
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  
  // Real data states
  const [enhancedProgress, setEnhancedProgress] = useState<EnhancedUserProgress | null>(null)
  const [categorySkills, setCategorySkills] = useState<CategorySkill[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([])
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    if (user && isOpen) {
      loadProgressData()
    }
  }, [user, isOpen])

  const loadProgressData = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Load real data from enhanced gamification system
      const [progressData, skillsData, achievementsData, goalsData] = await Promise.all([
        enhancedProgressOperations.getComprehensiveStats(user.id),
        skillTrackingOperations.getCategorySkills(user.id),
        achievementOperations.getUserAchievements(user.id),
        learningGoalOperations.getByUser(user.id)
      ])

      setEnhancedProgress(progressData)
      setCategorySkills(skillsData)
      setAchievements(achievementsData)
      setLearningGoals(goalsData)
      
      // Get recent achievements (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recent = achievementsData.filter(a => new Date(a.earnedAt) > weekAgo)
      setRecentAchievements(recent)

    } catch (error) {
      console.error('Error loading progress data:', error)
      // Set fallback data
      setEnhancedProgress({
        currentStreak: 0,
        longestStreak: 0,
        totalQuizzesCompleted: 0,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        totalXp: 0,
        currentLevel: 1,
        xpToNextLevel: 100,
        weeklyGoal: 3,
        weeklyCompleted: 0,
        preferredCategories: [],
        adaptiveDifficulty: true,
        learningStyle: "mixed",
        accuracyPercentage: 0,
        categoriesMastered: 0,
        categoriesAttempted: 0,
        activeGoals: 0,
        customDecksCount: 0,
        achievementsThisWeek: 0,
        availableXpForBoosts: 0,
        totalBoostsPurchased: 0,
        activeBoosts: []
      })
      setCategorySkills([])
      setAchievements([])
      setLearningGoals([])
      setRecentAchievements([])
    } finally {
      setIsLoading(false)
    }
  }

  const createLearningGoal = async (goalType: LearningGoal['goalType'], targetValue: number, category?: string) => {
    if (!user) return
    
    try {
      await learningGoalOperations.create(user.id, {
        goalType,
        targetValue,
        category,
        isActive: true
      })
      await loadProgressData() // Refresh data
    } catch (error) {
      console.error('Error creating learning goal:', error)
    }
  }

  const getUserTitle = () => {
    if (!enhancedProgress) return "Civic Learner"
    const level = enhancedProgress.currentLevel
    if (level >= 50) return "Legendary Scholar"
    if (level >= 20) return "Civic Champion"
    if (level >= 10) return "Dedicated Learner"
    if (level >= 5) return "Rising Star"
    return "Civic Learner"
  }

  const getLevelColor = () => {
    if (!enhancedProgress) return "text-gray-600"
    const level = enhancedProgress.currentLevel
    if (level >= 50) return "text-indigo-700"
    if (level >= 20) return "text-yellow-600"
    if (level >= 10) return "text-blue-600"
    if (level >= 5) return "text-green-600"
    return "text-gray-600"
  }

  const getAchievementsByCategory = () => {
    const categories = {
      onboarding: achievements.filter(a => a.type.includes('first') || a.type.includes('quiz')),
      consistency: achievements.filter(a => a.type.includes('streak')),
      progress: achievements.filter(a => a.type.includes('quizzes_')),
      performance: achievements.filter(a => a.type.includes('perfect') || a.type.includes('accuracy')),
      speed: achievements.filter(a => a.type.includes('speed') || a.type.includes('lightning')),
      mastery: achievements.filter(a => a.type.includes('category_') || a.type.includes('master')),
      exploration: achievements.filter(a => a.type.includes('sampler') || a.type.includes('rounded')),
      engagement: achievements.filter(a => a.type.includes('bird') || a.type.includes('owl') || a.type.includes('weekend')),
      special: achievements.filter(a => a.type.includes('day')),
      levels: achievements.filter(a => a.type.includes('level_'))
    }
    return categories
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-2xl">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <span>Learning Progress Dashboard</span>
          </DialogTitle>
          <DialogDescription>
            Track your civic education journey, achievements, and learning goals
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* User Level & Title */}
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Crown className={cn("h-8 w-8", getLevelColor())} />
                        </div>
                        <Badge className="absolute -bottom-1 -right-1 bg-blue-600 text-white">
                          {enhancedProgress?.currentLevel || 1}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{getUserTitle()}</h3>
                        <p className="text-muted-foreground">Level {enhancedProgress?.currentLevel || 1}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Progress 
                            value={enhancedProgress ? ((enhancedProgress.totalXp % 100) / 100) * 100 : 0} 
                            className="w-32 h-2" 
                          />
                          <span className="text-sm text-muted-foreground">
                            {enhancedProgress?.totalXp || 0} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {enhancedProgress?.totalQuizzesCompleted || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Quizzes Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-orange-200 dark:border-orange-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Flame className="h-8 w-8 text-orange-600" />
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">
                          {enhancedProgress?.currentStreak || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Day Streak</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Target className="h-8 w-8 text-green-600" />
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {enhancedProgress?.accuracyPercentage.toFixed(0) || 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Accuracy</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-indigo-200 dark:border-indigo-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Brain className="h-8 w-8 text-indigo-700" />
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-700">
                          {enhancedProgress?.categoriesMastered || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Mastered</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Award className="h-8 w-8 text-yellow-600" />
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-600">
                          {achievements.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Achievements</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Weekly Goal Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Quizzes this week</span>
                      <span className="text-xl font-bold">
                        {enhancedProgress?.weeklyCompleted || 0} / {enhancedProgress?.weeklyGoal || 3}
                      </span>
                    </div>
                    <Progress 
                      value={enhancedProgress ? (enhancedProgress.weeklyCompleted / enhancedProgress.weeklyGoal) * 100 : 0} 
                      className="h-3" 
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Keep going!</span>
                      <span>
                        {Math.max(0, (enhancedProgress?.weeklyGoal || 3) - (enhancedProgress?.weeklyCompleted || 0))} more to go
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5" />
                      <span>Recent Achievements</span>
                    </div>
                    <Badge variant="secondary">
                      {recentAchievements.length} This Week
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentAchievements.length > 0 ? (
                    <div className="space-y-3">
                      {recentAchievements.slice(0, 3).map((achievement, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border">
                          <span className="text-2xl">{achievement.emoji}</span>
                          <div className="flex-1">
                            <div className="font-semibold">{achievement.title}</div>
                            <div className="text-sm text-muted-foreground">{achievement.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(achievement.earnedAt).toLocaleDateString()}
                            </div>
                          </div>
                          {achievement.isMilestone && (
                            <Badge className="bg-yellow-500 text-white">
                              <Crown className="h-3 w-3 mr-1" />
                              Milestone
                            </Badge>
                          )}
                        </div>
                      ))}
                      {recentAchievements.length > 3 && (
                        <Button variant="ghost" className="w-full" onClick={() => setActiveTab("achievements")}>
                          View All Achievements
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">No recent achievements</p>
                      <p className="text-sm text-muted-foreground">Complete more quizzes to earn achievements!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Achievement Gallery</h3>
                  <p className="text-muted-foreground">Celebrate your learning milestones</p>
                </div>
                <div className="flex space-x-2">
                  <Badge variant="secondary">
                    {achievements.filter(a => a.isMilestone).length} Milestones
                  </Badge>
                  <Badge variant="outline">
                    {achievements.length} Total
                  </Badge>
                </div>
              </div>

              {Object.entries(getAchievementsByCategory()).map(([category, categoryAchievements]) => (
                categoryAchievements.length > 0 && (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="capitalize">{category} Achievements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryAchievements.map((achievement, index) => (
                          <div 
                            key={index} 
                            className={cn(
                              "p-4 rounded-lg border transition-all hover:shadow-md",
                              achievement.isMilestone 
                                ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10" 
                                : "border-gray-200 dark:border-gray-700"
                            )}
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-3xl">{achievement.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-semibold text-sm">{achievement.title}</h4>
                                  {achievement.isMilestone && (
                                    <Badge className="bg-yellow-500 text-white text-xs">
                                      <Zap className="h-2 w-2 mr-1" />
                                      Milestone
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(achievement.earnedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}

              {achievements.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h4 className="text-xl font-bold mb-2">No Achievements Yet</h4>
                    <p className="text-muted-foreground mb-6">
                      Complete quizzes and maintain learning streaks to unlock achievements!
                    </p>
                    <Button onClick={onClose}>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Start Learning
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="skills" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Category Skills</h3>
                  <p className="text-muted-foreground">Track your mastery across civic topics</p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Skill Settings
                </Button>
              </div>

              {categorySkills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categorySkills.map((skill, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getCategoryInfo(skill.category)?.emoji || '📚'}</span>
                            <div>
                              <h4 className="font-semibold">{skill.category}</h4>
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  skill.masteryLevel === 'expert' && "bg-purple-100 text-purple-800",
                                  skill.masteryLevel === 'advanced' && "bg-blue-100 text-blue-800",
                                  skill.masteryLevel === 'intermediate' && "bg-green-100 text-green-800",
                                  skill.masteryLevel === 'beginner' && "bg-yellow-100 text-yellow-800",
                                  skill.masteryLevel === 'novice' && "bg-gray-100 text-gray-800"
                                )}
                              >
                                {skill.masteryLevel}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{skill.accuracyPercentage.toFixed(0)}%</div>
                            <div className="text-sm text-muted-foreground">Accuracy</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress to next level</span>
                            <span>{skill.progressToNextLevel.toFixed(0)}%</span>
                          </div>
                          <Progress value={skill.progressToNextLevel} className="h-2" />
                        </div>
                        
                        <div className="flex justify-between text-sm text-muted-foreground mt-4">
                          <span>{skill.questionsCorrect}/{skill.questionsAttempted} correct</span>
                          <span>Level {skill.skillLevel}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Brain className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h4 className="text-xl font-bold mb-2">No Skills Tracked Yet</h4>
                    <p className="text-muted-foreground mb-6">
                      Complete quizzes in different categories to start tracking your skills!
                    </p>
                    <Button onClick={onClose}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Take a Quiz
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="goals" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Learning Goals</h3>
                  <p className="text-muted-foreground">Set and track your civic education objectives</p>
                </div>
                <Button onClick={() => createLearningGoal('weekly_target', 5)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Set Goal
                </Button>
              </div>

              {learningGoals.length > 0 ? (
                <div className="space-y-4">
                  {learningGoals.map((goal, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold capitalize">{goal.goalType.replace('_', ' ')}</h4>
                          <Badge variant={goal.isActive ? "default" : "secondary"}>
                            {goal.isActive ? "Active" : "Completed"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Target: <span className="font-semibold">{goal.targetValue}</span>
                          {goal.category && <span> in {goal.category}</span>}
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{goal.progress || 0}/{goal.targetValue}</span>
                          </div>
                          <Progress value={((goal.progress || 0) / goal.targetValue) * 100} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Target className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h4 className="text-xl font-bold mb-2">No Learning Goals Set</h4>
                    <p className="text-muted-foreground mb-6">
                      Set specific objectives to guide your civic education journey!
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button variant="outline" onClick={() => createLearningGoal('weekly_target', 5)}>
                        Weekly Quiz Goal
                      </Button>
                      <Button variant="outline" onClick={() => createLearningGoal('streak_target', 7)}>
                        Streak Goal
                      </Button>
                      <Button variant="outline" onClick={() => createLearningGoal('category_mastery', 1)}>
                        Master a Category
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
} 