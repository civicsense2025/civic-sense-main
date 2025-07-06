import { Metadata } from "next"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { SkillsCarousel } from "@/components/categories/skills-carousel"
import { BookOpen, Target, CheckCircle, Search } from "lucide-react"

export const metadata: Metadata = {
  title: "Categories | CivicSense",
  description: "Explore civic education topics organized by category - from government and elections to civil rights and media literacy.",
}

interface Category {
  id: string
  name: string
  emoji: string
  description: string | null
  display_order: number | null
}

interface CategoryWithStats extends Category {
  skillCount: number
  topicCount: number
}

interface Skill {
  id: string
  skill_name: string
  skill_slug: string
  description: string | null
  difficulty_level: number | null
  is_core_skill: boolean | null
  display_order: number | null
  category_id: string
}

interface Topic {
  topic_id: string
  topic_title: string
  description: string
  emoji: string
  date: string | null
  categories: string[]
}

async function getCategories(): Promise<CategoryWithStats[]> {
  // Get all active categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError)
    return []
  }

  // Get skill counts for each category
  const { data: skillCounts, error: skillError } = await supabase
    .from('skills')
    .select('category_id')
    .eq('is_active', true)

  // Count topics per category using junction table (much faster!)
  let topicCountMap = new Map<string, number>()
  
  try {
    // First check if junction table exists and has data
    const { data: junctionExists } = await supabase
      .from('question_topic_categories')
      .select('category_id')
      .limit(1)
    
    if (junctionExists && junctionExists.length > 0) {
      // Use optimized junction table approach
      const { data: junctionCounts, error: junctionError } = await supabase
        .from('question_topic_categories')
        .select('category_id')
        .not('category_id', 'is', null)
      
      if (!junctionError && junctionCounts) {
        junctionCounts.forEach(row => {
          const count = topicCountMap.get(row.category_id) || 0
          topicCountMap.set(row.category_id, count + 1)
        })
      }
    } else {
      // Fallback to JSONB approach if junction table not populated yet
      const { data: topics, error: topicsError } = await supabase
        .from('question_topics')
        .select('categories')
        .eq('is_active', true)

      if (!topicsError && topics) {
        topics.forEach(topic => {
          if (Array.isArray(topic.categories)) {
            (topic.categories as string[]).forEach(categoryName => {
              const count = topicCountMap.get(categoryName) || 0
              topicCountMap.set(categoryName, count + 1)
            })
          }
        })
      }
    }
  } catch (error) {
    console.warn('Error counting topics by category:', error)
  }

  if (skillError) {
    console.error('Error fetching counts:', { skillError })
  }

  // Count skills per category
  const skillCountMap = new Map<string, number>()
  if (skillCounts) {
    skillCounts.forEach(skill => {
      const count = skillCountMap.get(skill.category_id) || 0
      skillCountMap.set(skill.category_id, count + 1)
    })
  }

  // Combine categories with their stats
  return (categories || []).map(category => ({
    ...category,
    skillCount: skillCountMap.get(category.id) || 0,
    topicCount: topicCountMap.get(category.name) || 0,
  }))
}

async function getSkillsByCategory(): Promise<Record<string, Skill[]>> {
  const { data: skills, error } = await supabase
    .from('skills')
    .select(`
      id,
      skill_name,
      skill_slug,
      description,
      difficulty_level,
      is_core_skill,
      display_order,
      category_id,
      categories!inner(name, emoji)
    `)
    .eq('is_active', true)
    .order('is_core_skill', { ascending: false })
    .order('display_order', { ascending: true })
    .limit(50) // Limit for performance

  if (error) {
    console.error('Error fetching skills:', error)
    return {}
  }

  // Group skills by category name
  const skillsByCategory: Record<string, Skill[]> = {}
  skills?.forEach(skill => {
    const categoryName = (skill as any).categories?.name
    if (categoryName) {
      if (!skillsByCategory[categoryName]) {
        skillsByCategory[categoryName] = []
      }
      skillsByCategory[categoryName].push(skill)
    }
  })

  return skillsByCategory
}

async function getEvergreenTopics(): Promise<Topic[]> {
  try {
    const { data: topics, error } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, description, emoji, date, categories')
      .eq('is_active', true)
      .is('date', null) // Evergreen topics have no date
      .order('topic_title', { ascending: true })
      .limit(50)

    if (error) {
      console.error('Error fetching evergreen topics:', error)
      return []
    }

    return (topics || []).map(topic => ({
      ...topic,
      categories: Array.isArray(topic.categories) ? topic.categories as string[] : []
    }))
  } catch (error) {
    console.error('Error in getEvergreenTopics:', error)
    return []
  }
}

export default async function CategoriesPage() {
  const [categories, skillsByCategory, evergreenTopics] = await Promise.all([
    getCategories(),
    getSkillsByCategory(),
    getEvergreenTopics()
  ])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        {/* Page header with search hint */}
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800/50">
              <span className="text-2xl">🗂️</span>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Civic Knowledge Categories</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-white tracking-tight">
              Explore by <span className="text-blue-600 dark:text-blue-400 font-medium">Category</span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
              Navigate the foundations of civic knowledge. Each category connects skills, topics, and real-world applications to help you understand how democracy actually works.
            </p>
          </div>
          
          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>{categories.length} Categories</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>{categories.reduce((sum, cat) => sum + cat.skillCount, 0)} Skills</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>{categories.reduce((sum, cat) => sum + cat.topicCount, 0)} Topics</span>
            </div>
          </div>
        </div>

        {/* Categories Overview */}
        {categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-light text-slate-900 dark:text-white mb-3">
              Categories Coming Soon
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-light">
              We're organizing civic knowledge into meaningful categories.
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Categories Grid */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="text-2xl">🗂️</div>
                <h2 className="text-3xl font-light text-slate-900 dark:text-white">
                  All Categories
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                  const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-')
                  const hasContent = category.skillCount > 0 || category.topicCount > 0
                  
                  return (
                    <Link 
                      href={`/categories/${categorySlug}`} 
                      key={category.id} 
                      className="group block"
                    >
                      <Card className="h-full border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 hover:-translate-y-1">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
                                {category.emoji}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-xl font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                                  {category.name}
                                </h3>
                                
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  {category.skillCount > 0 && (
                                    <Badge variant="secondary" className="text-xs font-light bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 rounded-lg">
                                      {category.skillCount} skill{category.skillCount !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                  {category.topicCount > 0 && (
                                    <Badge variant="outline" className="text-xs font-light border-slate-200 dark:border-slate-600 rounded-lg">
                                      {category.topicCount} topic{category.topicCount !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                  {!hasContent && (
                                    <Badge variant="secondary" className="text-xs font-light text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                      Coming soon
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {category.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                                {category.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-end pt-2">
                              <span className="text-sm text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-medium">
                                Explore →
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* Core Civic Knowledge Section - Already above skills */}
            {evergreenTopics.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-3xl font-light text-slate-900 dark:text-white">
                    Core Civic Knowledge
                  </h2>
                  <Badge variant="outline" className="font-light rounded-lg">
                    {evergreenTopics.length} topics
                  </Badge>
                </div>
                
                <p className="text-slate-600 dark:text-slate-400 font-light mb-8 max-w-3xl">
                  Essential civic knowledge that remains relevant regardless of current events. Build your foundation in democratic processes, constitutional rights, and government structure.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {evergreenTopics.slice(0, 9).map((topic) => (
                    <Link key={topic.topic_id} href={`/quiz/${topic.topic_id}`}>
                      <Card className="h-full border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 group cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg">{topic.emoji}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                {topic.topic_title}
                              </CardTitle>
                              <div className="flex items-center gap-1 mt-2">
                                <Badge variant="secondary" className="text-xs font-light bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg">
                                  Core Knowledge
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-4 line-clamp-3">
                            {topic.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {topic.categories.slice(0, 2).map(cat => (
                                <Badge key={cat} variant="outline" className="text-xs font-light rounded-lg">
                                  {cat}
                                </Badge>
                              ))}
                              {topic.categories.length > 2 && (
                                <Badge variant="outline" className="text-xs font-light rounded-lg">
                                  +{topic.categories.length - 2}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                              <CheckCircle className="w-3 h-3" />
                              <span className="font-medium">Study</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                
                {/* View More Link */}
                <div className="text-center mt-8">
                  <Button variant="outline" className="font-light">
                    View All Core Topics
                    <BookOpen className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </section>
            )}

            {/* Skills Section - Now below core civic knowledge */}
            {Object.keys(skillsByCategory).length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <h2 className="text-3xl font-light text-slate-900 dark:text-white">
                    Featured Skills
                  </h2>
                  <Badge variant="outline" className="font-light">
                    {Object.values(skillsByCategory).flat().length} total
                  </Badge>
                </div>
                
                <p className="text-slate-600 dark:text-slate-400 font-light mb-8 max-w-3xl">
                  Essential civic skills organized by category. Master these to build a strong foundation in democratic participation.
                </p>
                
                <SkillsCarousel skillsByCategory={skillsByCategory} />
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 