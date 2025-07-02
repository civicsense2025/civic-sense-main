"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@civicsense/ui-web/components/auth/auth-provider"
import { usePremium } from "@civicsense/shared/hooks/usePremium"
import { useRouter } from "next/navigation"
import { SkillDetailModal } from "@civicsense/ui-web/components/skill-detail-modal"
import { SkillRelationshipMap } from "@civicsense/ui-web/components/skill-relationship-map"
import { Card, CardContent } from "@civicsense/ui-web"
import { Button } from "@civicsense/ui-web"
import { Badge } from "@civicsense/ui-web"
import { Progress } from "@civicsense/ui-web"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@civicsense/ui-web"
import { 
  BookOpen, 
  Target, 
  Brain, 
  Network,
  Filter,
  Search,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import Link from "next/link"
import { Header } from '@civicsense/ui-web'
import { Skeleton } from "@civicsense/ui-web"

// Category data with emojis
const CIVIC_CATEGORIES = [
  { name: "Government", emoji: "🏛️" },
  { name: "Elections", emoji: "🗳️" },
  { name: "Economy", emoji: "💰" },
  { name: "Foreign Policy", emoji: "🌐" },
  { name: "Justice", emoji: "⚖️" },
  { name: "Civil Rights", emoji: "✊" },
  { name: "Environment", emoji: "🌱" },
  { name: "Local Issues", emoji: "🏙️" },
  { name: "Constitutional Law", emoji: "📜" },
  { name: "National Security", emoji: "🛡️" },
  { name: "Public Policy", emoji: "📋" },
  { name: "Historical Precedent", emoji: "📚" },
  { name: "Civic Action", emoji: "🤝" },
  { name: "Media Literacy", emoji: "📰" },
  { name: "AI Governance", emoji: "🤖" },
  { name: "Digital Literacy", emoji: "💻" },
  { name: "Healthcare Literacy", emoji: "🏥" },
  { name: "Financial Literacy", emoji: "💵" }
] as const

// Define a simplified Skill type for this component
interface Skill {
  id: string
  skill_name: string
  skill_slug: string
  category_name: string
  description: string
  difficulty_level: number
  is_core_skill: boolean
  mastery_level?: string
  progress_percentage?: number
  questions_attempted?: number
  questions_correct?: number
  last_practiced_at?: string
}

// Skill Card Skeleton Component
function SkillCardSkeleton() {
  return (
    <Card className="group relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with emoji and category */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24 rounded-full" />
                </div>
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>

          {/* Progress section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-1">
                <Skeleton className="h-5 w-8 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>

          {/* Action button */}
          <div className="pt-4">
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skills Loading Grid
function SkillsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <SkillCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Categories Filter Loading
function CategoriesFilterSkeleton() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Skeleton className="h-8 w-24 rounded-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 rounded-full" />
      ))}
    </div>
  )
}

export default function SkillsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { isPremium } = usePremium()
  const [skills, setSkills] = useState<Skill[]>([])
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  
  // Redirect unauthenticated users to login page
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])
  
  // Load skills data
  useEffect(() => {
    const loadSkills = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        
        // Add timeout protection to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000) // 10 second timeout
        )
        
        // Load skills from API endpoint
        const skillPromise = fetch('/api/skills/user-skills')
          .then(response => {
            if (!response.ok) {
              throw new Error(`API returned ${response.status}: ${response.statusText}`)
            }
            return response.json()
          })
          .then(data => data.data)
        
        const userSkills = await Promise.race([skillPromise, timeoutPromise]) as Skill[]
        
        if (userSkills && userSkills.length > 0) {
          setSkills(userSkills)
          setFilteredSkills(userSkills)
        } else {
          // Use fallback skills if no skills returned
          throw new Error('No skills returned')
        }
      } catch (error) {
        console.error('Error loading skills:', error)
        
        // Fallback to realistic default skills with better categories and descriptions
        const defaultSkills: Skill[] = [
          {
            id: '1',
            skill_name: 'Understand Government Budgets',
            skill_slug: 'understand-budgets',
            category_name: 'Government',
            description: 'Analyze public spending and interpret how tax money is allocated based on priorities',
            difficulty_level: 2,
            is_core_skill: true,
            mastery_level: 'novice',
            progress_percentage: 15,
            questions_attempted: 4,
            questions_correct: 3,
            last_practiced_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
          },
          {
            id: '2',
            skill_name: 'Research Political Candidates',
            skill_slug: 'research-candidates',
            category_name: 'Elections',
            description: 'Find and evaluate candidates\' backgrounds, positions, voting records, and campaign funding',
            difficulty_level: 2,
            is_core_skill: true,
            mastery_level: 'beginner',
            progress_percentage: 35,
            questions_attempted: 15,
            questions_correct: 12,
            last_practiced_at: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
          },
          {
            id: '3',
            skill_name: 'Verify Information Sources',
            skill_slug: 'verify-sources',
            category_name: 'Media Literacy',
            description: 'Evaluate credibility of news sources using fact-checking techniques and identifying primary sources',
            difficulty_level: 1,
            is_core_skill: true,
            mastery_level: 'intermediate',
            progress_percentage: 65,
            questions_attempted: 28,
            questions_correct: 24,
            last_practiced_at: new Date(Date.now() - 86400000 * 1).toISOString() // 1 day ago
          },
          {
            id: '4',
            skill_name: 'Navigate Voting Procedures',
            skill_slug: 'voting-procedures',
            category_name: 'Elections',
            description: 'Understand registration requirements, voting methods, and deadlines across different jurisdictions',
            difficulty_level: 1,
            is_core_skill: true,
            mastery_level: 'beginner',
            progress_percentage: 40,
            questions_attempted: 12,
            questions_correct: 9,
            last_practiced_at: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
          },
          {
            id: '5',
            skill_name: 'Analyze Policy Impacts',
            skill_slug: 'policy-impact',
            category_name: 'Public Policy',
            description: 'Identify how legislation and regulations affect different communities, economies, and social issues',
            difficulty_level: 3,
            is_core_skill: true,
            mastery_level: 'novice',
            progress_percentage: 10,
            questions_attempted: 8,
            questions_correct: 5,
            last_practiced_at: new Date(Date.now() - 86400000 * 7).toISOString() // 7 days ago
          },
          {
            id: '6',
            skill_name: 'Understand Constitutional Rights',
            skill_slug: 'constitutional-rights',
            category_name: 'Constitutional Law',
            description: 'Know your civil liberties, how they apply in different contexts, and their historical development',
            difficulty_level: 2,
            is_core_skill: true,
            mastery_level: 'intermediate',
            progress_percentage: 70,
            questions_attempted: 35,
            questions_correct: 30,
            last_practiced_at: new Date(Date.now() - 86400000 * 4).toISOString() // 4 days ago
          },
          {
            id: '7',
            skill_name: 'Engage in Civil Discourse',
            skill_slug: 'civil-discourse',
            category_name: 'Civic Action',
            description: 'Discuss contentious issues respectfully while focusing on facts and shared values',
            difficulty_level: 2,
            is_core_skill: false,
            mastery_level: 'beginner',
            progress_percentage: 25,
            questions_attempted: 10,
            questions_correct: 7,
            last_practiced_at: new Date(Date.now() - 86400000 * 10).toISOString() // 10 days ago
          }
        ]
        
        setSkills(defaultSkills)
        setFilteredSkills(defaultSkills)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSkills()
  }, [user])
  
  // Filter skills based on category, search, and tab
  useEffect(() => {
    if (skills.length === 0) return
    
    let filtered = [...skills]
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(skill => skill.category_name === selectedCategory)
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(skill => 
        skill.skill_name.toLowerCase().includes(query) || 
        skill.description.toLowerCase().includes(query) ||
        skill.category_name.toLowerCase().includes(query)
      )
    }
    
    // Filter by tab
    if (activeTab === 'mastered') {
      filtered = filtered.filter(skill => 
        skill.mastery_level === 'advanced' || skill.mastery_level === 'expert'
      )
    } else if (activeTab === 'in-progress') {
      filtered = filtered.filter(skill => 
        skill.mastery_level === 'beginner' || skill.mastery_level === 'intermediate'
      )
    } else if (activeTab === 'not-started') {
      filtered = filtered.filter(skill => skill.mastery_level === 'novice')
    } else if (activeTab === 'core') {
      filtered = filtered.filter(skill => skill.is_core_skill)
    }
    
    setFilteredSkills(filtered)
  }, [skills, selectedCategory, searchQuery, activeTab])
  
  // Helper functions
  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'novice': return 'text-slate-500 dark:text-slate-400'
      case 'beginner': return 'text-blue-500 dark:text-blue-400'
      case 'intermediate': return 'text-green-500 dark:text-green-400'
      case 'advanced': return 'text-purple-500 dark:text-purple-400'
      case 'expert': return 'text-amber-500 dark:text-amber-400'
      default: return 'text-slate-500 dark:text-slate-400'
    }
  }

  const getMasteryBadgeColor = (level: string) => {
    switch (level) {
      case 'novice': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
      case 'beginner': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'intermediate': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'expert': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
    }
  }
  
  // Get category emoji
  const getCategoryEmoji = (categoryName: string) => {
    const category = CIVIC_CATEGORIES.find(c => c.name === categoryName)
    return category?.emoji || '📚'
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header onSignInClick={() => {}} />
        <main className="w-full py-8">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
            {/* Header skeleton */}
            <div className="text-center space-y-4">
              <Skeleton className="h-12 w-48 mx-auto" />
              <Skeleton className="h-6 w-96 mx-auto" />
              <Skeleton className="h-10 w-32 mx-auto rounded-full" />
            </div>

            {/* Filters skeleton */}
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <Skeleton className="h-8 w-32 mx-auto" />
                <CategoriesFilterSkeleton />
              </div>
            </div>

            {/* Tabs skeleton */}
            <div className="space-y-8">
              <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 flex-1 rounded-md" />
                ))}
              </div>

              {/* Skills grid skeleton */}
              <SkillsLoadingSkeleton />
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  // Add an empty state when no skills are found
  if (filteredSkills.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header onSignInClick={() => {}} />
        <main className="w-full py-8">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
                Civic Skills
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
                Track and develop your civic knowledge and abilities
              </p>
              <div className="pt-4">
                <Button variant="ghost" asChild className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <Link href="/dashboard">
                    ← Back to Dashboard
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-12 text-center">
              <div className="text-4xl mb-6">🔍</div>
              <h2 className="text-2xl font-light text-slate-900 dark:text-white mb-4">No Skills Found</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto font-light mb-8">
                {searchQuery ? (
                  <>No skills match your search for "<strong>{searchQuery}</strong>"</>
                ) : selectedCategory ? (
                  <>No skills found in the "<strong>{selectedCategory}</strong>" category</>
                ) : (
                  <>Try adjusting your filters or check back later as we add more skills</>
                )}
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('')
                  setActiveTab('all')
                }}
                variant="outline"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => {}} />
      <main className="w-full py-8">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          {/* Clean header with lots of whitespace - matching dashboard */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
              Civic Skills
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
              Track and develop your civic knowledge and abilities
            </p>
            <div className="pt-4">
              <Button variant="ghost" asChild className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <Link href="/dashboard">
                  ← Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Clean search and filters - matching dashboard style */}
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search skills..."
                className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-10 py-3 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-slate-400 dark:focus:border-slate-500 focus:outline-none transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setSearchQuery("")}
                >
                  <span className="sr-only">Clear search</span>
                  <span className="text-xs">✕</span>
                </Button>
              )}
            </div>
            
            {/* Category filters */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button 
                variant={selectedCategory === null ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="rounded-full font-light"
              >
                All Categories
              </Button>
              {Array.from(new Set(skills.map(s => s.category_name)))
                .sort()
                .slice(0, 5)
                .map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="rounded-full font-light flex items-center gap-1"
                  >
                    <span>{getCategoryEmoji(category)}</span>
                    <span>{category}</span>
                  </Button>
                ))
              }
            </div>
          </div>
          
          {/* Clean tabs - matching dashboard style */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 bg-slate-50 dark:bg-slate-900 border-0 rounded-full p-1">
              <TabsTrigger value="all" className="rounded-full font-light">All</TabsTrigger>
              <TabsTrigger value="core" className="rounded-full font-light">Core</TabsTrigger>
              <TabsTrigger value="in-progress" className="rounded-full font-light">Learning</TabsTrigger>
              <TabsTrigger value="mastered" className="rounded-full font-light">Mastered</TabsTrigger>
              <TabsTrigger value="not-started" className="rounded-full font-light">New</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-8">
              {filteredSkills.length > 0 ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  {filteredSkills.map((skill) => (
                    <div key={skill.id} className="group">
                      <div className="flex items-center justify-between py-6 border-b border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{getCategoryEmoji(skill.category_name)}</span>
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-slate-900 dark:text-white">{skill.skill_name}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                <Badge 
                                  className={`${getMasteryBadgeColor(skill.mastery_level || 'novice')} font-light border-0`}
                                >
                                  {skill.mastery_level || 'novice'}
                                </Badge>
                                <span className="text-sm text-slate-500 dark:text-slate-400">{skill.category_name}</span>
                                {skill.is_core_skill && (
                                  <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 font-light">
                                    Core
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 font-light ml-12">
                            {skill.description}
                          </p>
                          {skill.questions_attempted && skill.questions_attempted > 0 && (
                            <div className="text-sm text-slate-500 dark:text-slate-500 ml-12">
                              {skill.questions_correct}/{skill.questions_attempted} questions correct
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-lg font-light text-slate-900 dark:text-white">
                              {skill.progress_percentage || 0}%
                            </div>
                            <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1">
                              <div 
                                className="bg-slate-900 dark:bg-white h-1 rounded-full transition-all duration-500"
                                style={{ width: `${skill.progress_percentage || 0}%` }}
                              />
                            </div>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-light"
                            onClick={() => {
                              setSelectedSkill(skill.skill_slug)
                              setIsSkillModalOpen(true)
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-6">🔍</div>
                  <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">No skills found</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-light">
                    Try adjusting your filters or search query
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Skill progression visualization (for premium users) */}
          {isPremium && (
            <div className="space-y-8 pt-16 border-t border-slate-100 dark:border-slate-800">
              <div className="text-center">
                <h2 className="text-2xl font-light text-slate-900 dark:text-white mb-2">
                  Skill Relationships
                </h2>
                <p className="text-slate-600 dark:text-slate-400 font-light">
                  Visualize how your skills connect and build upon each other
                </p>
              </div>
              {user && (
                <SkillRelationshipMap 
                  userId={user.id} 
                  selectedCategory={selectedCategory || undefined}
                />
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Skill detail modal */}
      <SkillDetailModal 
        isOpen={isSkillModalOpen} 
        onClose={() => setIsSkillModalOpen(false)} 
        skillSlug={selectedSkill || undefined}
      />
    </div>
  )
} 