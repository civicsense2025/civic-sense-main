"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { PremiumGate } from "@/components/premium-gate"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, Target, Calendar, TrendingUp, BookOpen, Award, 
  Zap, Star, Brain, Clock, Plus, Settings, Flame,
  CheckCircle, PlayCircle, BarChart3, Sparkles, Crown,
  ChevronRight, Activity, Users, Lightbulb
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { 
  EnhancedUserProgress, 
  CategorySkill, 
  Achievement, 
  CustomDeck, 
  LearningGoal 
} from "@/lib/enhanced-gamification"
import { enhancedProgressOperations, skillTrackingOperations, achievementOperations, learningGoalOperations } from "@/lib/enhanced-gamification"

interface EnhancedProgressDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export function EnhancedProgressDashboard({ isOpen, onClose }: EnhancedProgressDashboardProps) {
  const { user } = useAuth()
  const { hasFeatureAccess, isPremium, isPro } = usePremium()
  const [activeTab, setActiveTab] = useState("overview")
  const [progress, setProgress] = useState<EnhancedUserProgress | null>(null)
  const [skills, setSkills] = useState<CategorySkill[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>([])
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const [premiumFeature, setPremiumFeature] = useState<'advanced_analytics' | 'historical_progress' | 'custom_decks'>('advanced_analytics')

  useEffect(() => {
    if (user && isOpen) {
      loadProgressData()
    }
  }, [user, isOpen])

  const loadProgressData = async () => {
    setIsLoading(true)
    try {
      if (!user) return

      // Load real progress data from the enhanced gamification system
      const [progressData, skillsData, achievementsData, goalsData] = await Promise.all([
        enhancedProgressOperations.getComprehensiveStats(user.id),
        skillTrackingOperations.getCategorySkills(user.id),
        achievementOperations.getUserAchievements(user.id),
        learningGoalOperations.getByUser(user.id)
      ])

      setProgress(progressData)
      setSkills(skillsData)
      setAchievements(achievementsData)
      setLearningGoals(goalsData)
      
      // Custom decks would be loaded here when implemented
      setCustomDecks([])
      
    } catch (error) {
      console.error('Error loading progress data:', error)
      
      // Fallback to mock data if real data fails
      const mockProgress: EnhancedUserProgress = {
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
        weekStartDate: new Date().toISOString().split('T')[0],
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
      }

      setProgress(mockProgress)
      setSkills([])
      setAchievements([])
      setLearningGoals([])
      setCustomDecks([])
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  const getMasteryColor = (level: CategorySkill['masteryLevel']) => {
    switch (level) {
      case 'expert': return 'text-indigo-700 bg-indigo-100 dark:bg-indigo-900/20'
      case 'advanced': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'intermediate': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'beginner': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getLevelProgress = () => {
    if (!progress) return 0
    const totalXpForCurrentLevel = Math.floor(100 * Math.pow(1.5, progress.currentLevel - 1))
    const xpAtStartOfLevel = progress.currentLevel > 1 
      ? Math.floor(100 * Math.pow(1.5, progress.currentLevel - 2))
      : 0
    const xpIntoCurrentLevel = progress.totalXp - xpAtStartOfLevel
    const xpNeededForLevel = totalXpForCurrentLevel - xpAtStartOfLevel
    return Math.round((xpIntoCurrentLevel / xpNeededForLevel) * 100)
  }

  const handlePremiumFeatureClick = (feature: 'advanced_analytics' | 'historical_progress' | 'custom_decks') => {
    if (!hasFeatureAccess(feature)) {
      setPremiumFeature(feature)
      setShowPremiumGate(true)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-8 pt-8 pb-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <DialogTitle className="flex items-center space-x-3 text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            <div className="relative">
              <TrendingUp className="h-8 w-8 text-blue-600" />
                              <Sparkles className="h-4 w-4 text-indigo-600 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span>Learning Dashboard</span>
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-2 leading-relaxed">
            Track your civic education journey with detailed analytics and personalized learning paths
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-pulse"></div>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 pt-6">
              <TabsList className="grid w-full grid-cols-5 h-14 p-1 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="skills" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Skills
                </TabsTrigger>
                <TabsTrigger 
                  value="achievements" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Achievements
                </TabsTrigger>
                <TabsTrigger 
                  value="decks" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
                  onClick={() => handlePremiumFeatureClick('custom_decks')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Decks
                  {!hasFeatureAccess('custom_decks') && (
                    <Crown className="h-3 w-3 ml-1 text-yellow-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="goals" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Goals
                </TabsTrigger>
              </TabsList>

            <TabsContent value="overview" className="space-y-8 animate-in fade-in-50 duration-500">
              {/* Level & XP Card */}
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="relative">
                      <Crown className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="font-bold">Level Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-3xl font-bold text-blue-600">Level {progress?.currentLevel || 1}</span>
                                                 <p className="text-sm text-muted-foreground">
                           {(progress?.currentLevel || 1) >= 50 ? "Legendary Scholar" :
                            (progress?.currentLevel || 1) >= 20 ? "Civic Champion" :
                            (progress?.currentLevel || 1) >= 10 ? "Dedicated Learner" :
                            (progress?.currentLevel || 1) >= 5 ? "Rising Star" : "Civic Learner"}
                         </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">{progress?.totalXp || 0} XP</span>
                        <p className="text-sm text-muted-foreground">Total Experience</p>
                      </div>
                    </div>
                    <Progress 
                      value={progress ? ((progress.totalXp % 100) / 100) * 100 : 0} 
                      className="h-3" 
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress to next level</span>
                      <span>{progress?.xpToNextLevel || 100} XP needed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Goal Card */}
              <Card className="border border-indigo-200 dark:border-indigo-800">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="relative">
                      <Target className="h-6 w-6 text-indigo-600" />
                    </div>
                    <span className="font-bold">Weekly Goal Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-medium">Quizzes this week</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        {progress?.weeklyCompleted} / {progress?.weeklyGoal}
                      </span>
                    </div>
                    <Progress 
                      value={(progress?.weeklyCompleted || 0) / (progress?.weeklyGoal || 1) * 100} 
                      className="h-3" 
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Keep going!</span>
                      <span>{Math.max(0, (progress?.weeklyGoal || 3) - (progress?.weeklyCompleted || 0))} more to go</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Achievements */}
              <Card className="border border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xl">
                      <div className="relative">
                        <Award className="h-6 w-6 text-amber-600" />
                        <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                      </div>
                      <span className="font-bold">Recent Achievements</span>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                      {achievements.length} Total
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {achievements.slice(0, 3).map((achievement, index) => (
                      <div key={index} className="group flex items-center space-x-4 p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/30 hover:shadow-md transition-all duration-200">
                        <div className="relative">
                          <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{achievement.emoji}</span>
                          {achievement.isMilestone && (
                            <div className="absolute -inset-1 bg-yellow-400/30 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg text-amber-900 dark:text-amber-100 truncate">{achievement.title}</p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">{achievement.description}</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            {new Date(achievement.earnedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {achievement.isMilestone && (
                          <Badge className="bg-yellow-500 text-white border-0 shadow-sm">
                            <Crown className="h-3 w-3 mr-1" />
                            Milestone
                          </Badge>
                        )}
                      </div>
                    ))}
                    {achievements.length > 3 && (
                      <Button variant="ghost" className="w-full mt-4 text-amber-700 hover:text-amber-800 hover:bg-amber-50">
                        View All Achievements
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-8 animate-in fade-in-50 duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Category Skills</h3>
                  <p className="text-muted-foreground mt-1">Track your mastery across different civic topics</p>
                </div>
                <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300 transition-colors">
                  <Settings className="h-4 w-4 mr-2" />
                  Skill Settings
                </Button>
              </div>

              <div className="grid gap-6">
                {skills.map((skill, index) => (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="space-y-2">
                          <h4 className="font-bold text-2xl text-foreground">{skill.category}</h4>
                          <Badge 
                            className={cn("capitalize text-sm font-semibold px-3 py-1", getMasteryColor(skill.masteryLevel))}
                          >
                            <Crown className="h-3 w-3 mr-1" />
                            {skill.masteryLevel}
                          </Badge>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                            {Math.round(skill.skillLevel)}
                          </p>
                          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Skill Level</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Progress to next level</span>
                            <span className="text-lg font-bold text-blue-600">{skill.progressToNextLevel}%</span>
                          </div>
                          <Progress 
                            value={skill.progressToNextLevel} 
                            className="h-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/20 dark:to-purple-950/20" 
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Accuracy</p>
                            <p className="text-2xl font-bold text-green-600">{skill.accuracyPercentage}%</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Questions Attempted</p>
                            <p className="text-2xl font-bold text-blue-600">{skill.questionsAttempted}</p>
                          </div>
                        </div>

                        {skill.lastPracticed && (
                          <div className="pt-4 border-t border-muted/50">
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              Last practiced: {new Date(skill.lastPracticed).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-8 animate-in fade-in-50 duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">Achievement Gallery</h3>
                  <p className="text-muted-foreground mt-1">Celebrate your learning milestones and accomplishments</p>
                </div>
                <div className="flex space-x-3">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 px-3 py-1">
                    <Crown className="h-3 w-3 mr-1" />
                    {achievements.filter(a => a.isMilestone).length} Milestones
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    <Trophy className="h-3 w-3 mr-1" />
                    {achievements.length} Total
                  </Badge>
                </div>
              </div>

              {/* Achievement Categories */}
              {achievements.length > 0 ? (
                <div className="space-y-8">
                  {/* Milestone Achievements */}
                  {achievements.filter(a => a.isMilestone).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Crown className="h-5 w-5 text-yellow-600" />
                          <span>Milestone Achievements</span>
                          <Badge className="bg-yellow-500 text-white">
                            {achievements.filter(a => a.isMilestone).length}
                          </Badge>
                        </CardTitle>
                        <CardDescription>Major accomplishments that mark significant progress</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {achievements.filter(a => a.isMilestone).map((achievement, index) => (
                            <div key={index} className="p-6 rounded-lg border-2 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10 hover:shadow-lg transition-all">
                              <div className="flex items-start space-x-4">
                                <div className="relative">
                                  <span className="text-4xl block">{achievement.emoji}</span>
                                  <div className="absolute -inset-2 bg-yellow-400/20 rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-xl text-foreground leading-tight">{achievement.title}</h4>
                                    <Badge className="bg-yellow-500 text-white border-0 shadow-sm ml-2 flex-shrink-0">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      Milestone
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                    {achievement.description}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground flex items-center">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {new Date(achievement.earnedAt).toLocaleDateString()}
                                    </p>
                                    <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 font-medium">
                                      <Crown className="h-3 w-3 mr-1" />
                                      Major Achievement
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Regular Achievements by Category */}
                  {achievements.filter(a => !a.isMilestone).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Star className="h-5 w-5 text-blue-600" />
                          <span>All Achievements</span>
                          <Badge variant="outline">
                            {achievements.filter(a => !a.isMilestone).length}
                          </Badge>
                        </CardTitle>
                        <CardDescription>Your complete collection of learning achievements</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {achievements.filter(a => !a.isMilestone).map((achievement, index) => (
                            <div key={index} className="p-4 rounded-lg border hover:shadow-md transition-all hover:border-blue-300">
                              <div className="flex items-start space-x-3">
                                <span className="text-3xl">{achievement.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm">{achievement.title}</h4>
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{achievement.description}</p>
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
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h4 className="text-xl font-bold mb-2">No Achievements Yet</h4>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Complete quizzes and maintain learning streaks to unlock your first achievements!
                    </p>
                    <Button onClick={onClose}>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Start Learning
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="decks" className="space-y-8 animate-in fade-in-50 duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Custom Learning Decks</h3>
                  <p className="text-muted-foreground mt-1">Create personalized study collections tailored to your interests</p>
                </div>
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Deck
                </Button>
              </div>

              {customDecks.length === 0 ? (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-green-950/10 dark:via-background dark:to-blue-950/10">
                  <CardContent className="p-16 text-center">
                    <div className="relative mb-6">
                      <BookOpen className="h-20 w-20 mx-auto text-green-500/60" />
                      <div className="absolute -inset-4 bg-green-400/10 rounded-full animate-pulse"></div>
                    </div>
                    <h4 className="text-2xl font-bold mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      No Custom Decks Yet
                    </h4>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                      Create personalized learning decks based on your interests and learning goals. 
                      Mix and match topics to create the perfect study experience.
                    </p>
                    <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Deck
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {customDecks.map((deck, index) => (
                    <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-xl">{deck.name}</h4>
                          <Badge variant="outline" className="capitalize px-3 py-1">
                            {deck.type}
                          </Badge>
                        </div>
                        {deck.description && (
                          <p className="text-muted-foreground mb-4 leading-relaxed">{deck.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            {deck.contentCount} questions
                          </span>
                          <Button size="sm" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Practice
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="goals" className="space-y-8 animate-in fade-in-50 duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Learning Goals</h3>
                  <p className="text-muted-foreground mt-1">Set and track specific objectives for your civic education journey</p>
                </div>
                <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Set Goal
                </Button>
              </div>

              {learningGoals.length === 0 ? (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-indigo-950/10 dark:via-background dark:to-blue-950/10">
                  <CardContent className="p-16 text-center">
                    <div className="relative mb-6">
                      <Target className="h-20 w-20 mx-auto text-indigo-500/60" />
                                              <div className="absolute -inset-4 bg-indigo-400/10 rounded-full animate-pulse"></div>
                    </div>
                                          <h4 className="text-2xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      No Learning Goals Set
                    </h4>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                      Set specific learning goals to guide your civic education journey. 
                      Track your progress and stay motivated with clear objectives.
                    </p>
                    <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Set Your First Goal
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {learningGoals.map((goal, index) => (
                    <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-xl capitalize">{goal.goalType.replace('_', ' ')}</h4>
                          <Badge 
                            variant={goal.isActive ? "default" : "secondary"}
                            className={cn(
                              "px-3 py-1",
                              goal.isActive 
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            )}
                          >
                            {goal.isActive ? "Active" : "Completed"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                          Target: <span className="font-semibold">{goal.targetValue}</span> 
                          {goal.category && <span> in {goal.category}</span>}
                        </p>
                        {goal.progress !== undefined && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Progress</span>
                              <span className="text-lg font-bold text-indigo-700">{goal.progress}%</span>
                            </div>
                            <Progress 
                              value={goal.progress} 
                              className="h-3 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-950/20 dark:to-blue-950/20" 
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
                      </Tabs>
          )}
        </div>
      </DialogContent>
      
      <PremiumGate
        feature={premiumFeature}
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        title={
          premiumFeature === 'custom_decks' ? 'Custom Learning Decks' :
          premiumFeature === 'historical_progress' ? 'Historical Progress' :
          'Advanced Analytics'
        }
        description={
          premiumFeature === 'custom_decks' ? 'Create unlimited personalized study collections' :
          premiumFeature === 'historical_progress' ? 'View your learning progress over time' :
          'Access detailed performance analytics and insights'
        }
      />
    </Dialog>
  )
} 