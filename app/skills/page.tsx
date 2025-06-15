"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { SkillDetailModal } from "@/components/skill-detail-modal"
import { SkillRelationshipMap } from "@/components/skill-relationship-map"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function SkillsPage() {
  const { user } = useAuth()
  const { isPremium } = usePremium()
  const [skills, setSkills] = useState<Skill[]>([])
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  
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
        
        // Import skill operations with timeout
        const skillPromise = (async () => {
          const { skillOperations } = await import('@/lib/skill-operations')
          return await skillOperations.getUserSkills(user.id)
        })()
        
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
        
        // Fallback to default skills if there's an error or timeout
        const defaultSkills: Skill[] = [
          {
            id: '1',
            skill_name: 'Read Government Budgets',
            skill_slug: 'read-budgets',
            category_name: 'Government',
            description: 'Understand where tax money goes and what governments prioritize',
            difficulty_level: 2,
            is_core_skill: true,
            mastery_level: 'novice',
            progress_percentage: 0
          },
          {
            id: '2',
            skill_name: 'Research Candidates',
            skill_slug: 'research-candidates',
            category_name: 'Elections',
            description: 'Look up candidates\' backgrounds, positions, and track records',
            difficulty_level: 2,
            is_core_skill: true,
            mastery_level: 'novice',
            progress_percentage: 0
          },
          {
            id: '3',
            skill_name: 'Check Sources',
            skill_slug: 'check-sources',
            category_name: 'Media Literacy',
            description: 'Verify whether news sources and websites are trustworthy',
            difficulty_level: 1,
            is_core_skill: true,
            mastery_level: 'novice',
            progress_percentage: 0
          },
          {
            id: '4',
            skill_name: 'Understand Voting Process',
            skill_slug: 'understand-voting',
            category_name: 'Elections',
            description: 'Learn how elections work and how to participate effectively',
            difficulty_level: 1,
            is_core_skill: true,
            mastery_level: 'novice',
            progress_percentage: 0
          },
          {
            id: '5',
            skill_name: 'Analyze Policy Impact',
            skill_slug: 'analyze-policy',
            category_name: 'Public Policy',
            description: 'Evaluate how policies affect different communities and stakeholders',
            difficulty_level: 3,
            is_core_skill: true,
            mastery_level: 'novice',
            progress_percentage: 0
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
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading your skills...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Clean header with lots of whitespace */}
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
        
        {/* Clean search and filters */}
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
        
        {/* Clean tabs */}
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
      
      {/* Skill detail modal */}
      <SkillDetailModal 
        isOpen={isSkillModalOpen} 
        onClose={() => setIsSkillModalOpen(false)} 
        skillSlug={selectedSkill || undefined}
      />
    </div>
  )
} 