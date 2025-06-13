"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, Target, Calendar, TrendingUp, BookOpen, Award, 
  Zap, Star, Brain, Clock, Plus, Settings, Flame,
  CheckCircle, PlayCircle, BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { 
  EnhancedUserProgress, 
  CategorySkill, 
  Achievement, 
  CustomDeck, 
  LearningGoal 
} from "@/lib/enhanced-gamification"

interface EnhancedProgressDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export function EnhancedProgressDashboard({ isOpen, onClose }: EnhancedProgressDashboardProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [progress, setProgress] = useState<EnhancedUserProgress | null>(null)
  const [skills, setSkills] = useState<CategorySkill[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>([])
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user && isOpen) {
      loadProgressData()
    }
  }, [user, isOpen])

  const loadProgressData = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, these would be actual API calls
      // For now, showing the structure
      
      const mockProgress: EnhancedUserProgress = {
        currentStreak: 7,
        longestStreak: 15,
        totalQuizzesCompleted: 23,
        totalQuestionsAnswered: 460,
        totalCorrectAnswers: 368,
        totalXp: 2850,
        currentLevel: 8,
        xpToNextLevel: 1150,
        weeklyGoal: 5,
        weeklyCompleted: 3,
        weekStartDate: new Date().toISOString().split('T')[0],
        preferredCategories: ["Government", "Elections", "Civil Rights"],
        adaptiveDifficulty: true,
        learningStyle: "mixed",
        accuracyPercentage: 80,
        categoriesMastered: 2,
        categoriesAttempted: 6,
        activeGoals: 2,
        customDecksCount: 3,
        achievementsThisWeek: 2
      }

      const mockSkills: CategorySkill[] = [
        {
          category: "Government",
          skillLevel: 95,
          questionsAttempted: 45,
          questionsCorrect: 42,
          lastPracticed: new Date().toISOString(),
          masteryLevel: "expert",
          accuracyPercentage: 93,
          progressToNextLevel: 100
        },
        {
          category: "Elections",
          skillLevel: 78,
          questionsAttempted: 32,
          questionsCorrect: 26,
          lastPracticed: new Date().toISOString(),
          masteryLevel: "advanced",
          accuracyPercentage: 81,
          progressToNextLevel: 40
        },
        {
          category: "Civil Rights",
          skillLevel: 65,
          questionsAttempted: 28,
          questionsCorrect: 20,
          lastPracticed: new Date().toISOString(),
          masteryLevel: "intermediate",
          accuracyPercentage: 71,
          progressToNextLevel: 65
        }
      ]

      const mockAchievements: Achievement[] = [
        {
          type: "streak_7",
          data: { streakLength: 7 },
          earnedAt: new Date().toISOString(),
          isMilestone: true,
          title: "Week Warrior",
          description: "Maintain a 7-day learning streak",
          emoji: "⚡"
        },
        {
          type: "category_mastery",
          data: { category: "Government" },
          earnedAt: new Date(Date.now() - 86400000).toISOString(),
          isMilestone: true,
          title: "Government Expert",
          description: "Reach expert level in Government",
          emoji: "🎓"
        }
      ]

      setProgress(mockProgress)
      setSkills(mockSkills)
      setAchievements(mockAchievements)
      setCustomDecks([])
      setLearningGoals([])
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  const getMasteryColor = (level: CategorySkill['masteryLevel']) => {
    switch (level) {
      case 'expert': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span>Enhanced Learning Dashboard</span>
          </DialogTitle>
          <DialogDescription>
            Track your civic education journey with detailed analytics and personalized learning paths
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="decks">Custom Decks</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Level and XP */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Level {progress?.currentLevel}</span>
                  </CardTitle>
                  <CardDescription>
                    {progress?.totalXp.toLocaleString()} total XP • {progress?.xpToNextLevel.toLocaleString()} XP to next level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={getLevelProgress()} className="h-3" />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>Level {progress?.currentLevel}</span>
                    <span>Level {(progress?.currentLevel || 1) + 1}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                        <p className="text-3xl font-bold text-orange-600 flex items-center">
                          {progress?.currentStreak}
                          <Flame className="h-5 w-5 ml-1" />
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-orange-600/70" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
                        <p className="text-3xl font-bold text-green-600">
                          {progress?.accuracyPercentage}%
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-green-600/70" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Weekly Progress</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {progress?.weeklyCompleted}/{progress?.weeklyGoal}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-600/70" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Categories Mastered</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {progress?.categoriesMastered}
                        </p>
                      </div>
                      <Trophy className="h-8 w-8 text-purple-600/70" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Goal Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Weekly Goal Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Quizzes this week</span>
                      <span>{progress?.weeklyCompleted} / {progress?.weeklyGoal}</span>
                    </div>
                    <Progress 
                      value={(progress?.weeklyCompleted || 0) / (progress?.weeklyGoal || 1) * 100} 
                      className="h-2" 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Recent Achievements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {achievements.slice(0, 3).map((achievement, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                        <span className="text-2xl">{achievement.emoji}</span>
                        <div className="flex-1">
                          <p className="font-medium">{achievement.title}</p>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                        {achievement.isMilestone && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Milestone
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Category Skills</h3>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Skill Settings
                </Button>
              </div>

              <div className="grid gap-4">
                {skills.map((skill, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{skill.category}</h4>
                          <Badge 
                            className={cn("capitalize", getMasteryColor(skill.masteryLevel))}
                          >
                            {skill.masteryLevel}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{Math.round(skill.skillLevel)}</p>
                          <p className="text-sm text-muted-foreground">Skill Level</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress to next level</span>
                            <span>{skill.progressToNextLevel}%</span>
                          </div>
                          <Progress value={skill.progressToNextLevel} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Accuracy</p>
                            <p className="font-semibold">{skill.accuracyPercentage}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Questions Attempted</p>
                            <p className="font-semibold">{skill.questionsAttempted}</p>
                          </div>
                        </div>

                        {skill.lastPracticed && (
                          <p className="text-xs text-muted-foreground">
                            Last practiced: {new Date(skill.lastPracticed).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Achievements ({achievements.length})</h3>
                <div className="flex space-x-2">
                  <Badge variant="secondary">
                    {achievements.filter(a => a.isMilestone).length} Milestones
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                  <Card key={index} className={cn(
                    "transition-all hover:shadow-md",
                    achievement.isMilestone && "ring-2 ring-yellow-200 dark:ring-yellow-800"
                  )}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-3">
                        <span className="text-3xl">{achievement.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold">{achievement.title}</h4>
                            {achievement.isMilestone && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                Milestone
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Earned: {new Date(achievement.earnedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="decks" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Custom Learning Decks</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Deck
                </Button>
              </div>

              {customDecks.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No Custom Decks Yet</h4>
                    <p className="text-muted-foreground mb-4">
                      Create personalized learning decks based on your interests and learning goals.
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Deck
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {customDecks.map((deck, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{deck.name}</h4>
                          <Badge variant="outline">{deck.type}</Badge>
                        </div>
                        {deck.description && (
                          <p className="text-sm text-muted-foreground mb-3">{deck.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {deck.contentCount} questions
                          </span>
                          <Button size="sm" variant="outline">
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

            <TabsContent value="goals" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Learning Goals</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Set Goal
                </Button>
              </div>

              {learningGoals.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No Learning Goals Set</h4>
                    <p className="text-muted-foreground mb-4">
                      Set specific learning goals to guide your civic education journey.
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Set Your First Goal
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {learningGoals.map((goal, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold capitalize">{goal.goalType.replace('_', ' ')}</h4>
                          <Badge variant={goal.isActive ? "default" : "secondary"}>
                            {goal.isActive ? "Active" : "Completed"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Target: {goal.targetValue} {goal.category && `in ${goal.category}`}
                        </p>
                        {goal.progress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{goal.progress}%</span>
                            </div>
                            <Progress value={goal.progress} className="h-2" />
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
      </DialogContent>
    </Dialog>
  )
} 