import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from '@civicsense/ui-web'
import { Badge } from '@civicsense/ui-web'
import { Button } from '@civicsense/ui-web'
import { Header } from '@civicsense/ui-web'
import { BookOpen, Target, Clock, CheckCircle, ArrowLeft, Play, Users } from "lucide-react"

interface SkillPageProps {
  params: Promise<{
    skillSlug: string
  }>
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
  category_name: string
  category_emoji: string
}

interface Topic {
  topic_id: string
  topic_title: string
  description: string
  emoji: string
  date: string | null
  categories: string[]
}

interface SkillData {
  skill: Skill
  topics: Topic[]
  relatedSkills: Skill[]
}

async function getSkillData(skillSlug: string): Promise<SkillData | null> {
  // Get skill by slug with category info
  const { data: skill, error: skillError } = await supabase
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
      categories!inner(
        name,
        emoji
      )
    `)
    .eq('skill_slug', skillSlug)
    .eq('is_active', true)
    .single()

  if (skillError || !skill) {
    console.error('Skill not found:', skillError)
    return null
  }

  const skillWithCategory = {
    ...skill,
    category_name: (skill as any).categories?.name || 'Unknown',
    category_emoji: (skill as any).categories?.emoji || '📚'
  }

  // Get topics related to this skill's category
  // First try junction table approach
  let topics: Topic[] = []
  
  try {
    const { data: junctionExists } = await supabase
      .from('question_topic_categories')
      .select('category_id')
      .limit(1)
    
    if (junctionExists && junctionExists.length > 0) {
      // Use optimized junction table approach
      const { data: junctionData, error: junctionError } = await supabase
        .from('question_topic_categories')
        .select(`
          question_topics!inner(
            topic_id,
            topic_title,
            description,
            emoji,
            date,
            categories,
            is_active
          )
        `)
        .eq('category_id', skill.category_id)
        .eq('question_topics.is_active', true)
        .order('question_topics.date', { ascending: false })
        .limit(20)
      
      if (!junctionError && junctionData) {
        topics = junctionData.map(row => ({
          ...(row as any).question_topics,
          categories: Array.isArray((row as any).question_topics.categories) 
            ? (row as any).question_topics.categories as string[] 
            : []
        }))
      }
    }
    
    // Fallback to JSONB approach if junction table not available or empty
    if (topics.length === 0) {
      const { data: topicsData, error: topicsError } = await supabase
        .from('question_topics')
        .select('topic_id, topic_title, description, emoji, date, categories')
        .eq('is_active', true)
        .order('date', { ascending: false })
        .limit(50)

      if (!topicsError && topicsData) {
        // Filter topics that include this skill's category
        topics = topicsData
          .filter(topic => {
            const categories = topic.categories
            if (Array.isArray(categories)) {
              return (categories as string[]).includes(skillWithCategory.category_name)
            }
            return false
          })
          .map(topic => ({
            ...topic,
            categories: Array.isArray(topic.categories) ? topic.categories as string[] : []
          }))
          .slice(0, 20)
      }
    }
  } catch (error) {
    console.error('Error fetching topics:', error)
  }

  // Get related skills from the same category
  const { data: relatedSkills, error: relatedError } = await supabase
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
      categories!inner(
        name,
        emoji
      )
    `)
    .eq('category_id', skill.category_id)
    .eq('is_active', true)
    .neq('id', skill.id) // Exclude current skill
    .order('is_core_skill', { ascending: false })
    .order('display_order', { ascending: true })
    .limit(6)

  const relatedSkillsWithCategory = (relatedSkills || []).map(relatedSkill => ({
    ...relatedSkill,
    category_name: (relatedSkill as any).categories?.name || 'Unknown',
    category_emoji: (relatedSkill as any).categories?.emoji || '📚'
  }))

  return {
    skill: skillWithCategory,
    topics,
    relatedSkills: relatedSkillsWithCategory
  }
}

export async function generateMetadata({ params }: SkillPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const skillData = await getSkillData(resolvedParams.skillSlug)
  
  if (!skillData) {
    return {
      title: "Skill Not Found | CivicSense",
      description: "The requested skill could not be found."
    }
  }

  const { skill } = skillData
  return {
    title: `${skill.skill_name} | CivicSense`,
    description: skill.description || `Learn about ${skill.skill_name} - a civic skill in ${skill.category_name}. Build your democratic participation capabilities.`,
  }
}

export default async function SkillPage({ params }: SkillPageProps) {
  const resolvedParams = await params
  const skillData = await getSkillData(resolvedParams.skillSlug)
  
  if (!skillData) {
    notFound()
  }

  const { skill, topics, relatedSkills } = skillData

  const getDifficultyLabel = (level: number | null) => {
    const safeLevel = level ?? 1
    switch (safeLevel) {
      case 1: return 'Beginner'
      case 2: return 'Intermediate'
      case 3: return 'Advanced'
      case 4: return 'Expert'
      case 5: return 'Master'
      default: return 'Beginner'
    }
  }

  const getDifficultyColor = (level: number | null) => {
    const safeLevel = level ?? 1
    switch (safeLevel) {
      case 1: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 3: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 4: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 5: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    }
  }

  const categorySlug = skill.category_name.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-8">
          <Link href="/skills" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Skills
          </Link>
          <span>→</span>
          <Link 
            href={`/categories/${categorySlug}`} 
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {skill.category_name}
          </Link>
          <span>→</span>
          <span className="text-slate-900 dark:text-white">{skill.skill_name}</span>
        </div>

        {/* Skill Header */}
        <div className="space-y-8 mb-12">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{skill.category_emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white tracking-tight">
                    {skill.skill_name}
                  </h1>
                  {skill.is_core_skill && (
                    <Badge variant="outline" className="border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400 font-light">
                      Core Skill
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Link href={`/categories/${categorySlug}`}>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
                      {skill.category_emoji} {skill.category_name}
                    </Badge>
                  </Link>
                  <Badge 
                    className={`font-light ${getDifficultyColor(skill.difficulty_level)}`}
                    variant="secondary"
                  >
                    {getDifficultyLabel(skill.difficulty_level)}
                  </Badge>
                </div>
                
                {skill.description && (
                  <p className="text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                    {skill.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-12">
          {/* Practice Topics Section */}
          {topics.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Play className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-2xl font-medium text-slate-900 dark:text-white">
                  Practice Topics
                </h2>
                <Badge variant="outline" className="font-light">
                  {topics.length} available
                </Badge>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light mb-6">
                Quiz topics where you can practice and develop this skill.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topics.slice(0, 6).map(topic => (
                  <Link key={topic.topic_id} href={`/quiz/${topic.topic_id}`}>
                    <Card className="border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors group cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <span className="text-xl" role="img" aria-label={topic.topic_title}>
                            {topic.emoji}
                          </span>
                          <div className="flex-1">
                            <CardTitle className="text-lg font-medium text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2">
                              {topic.topic_title}
                            </CardTitle>
                            {topic.date && (
                              <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
                                <Clock className="w-4 h-4" />
                                {new Date(topic.date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-4 line-clamp-3">
                          {topic.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {topic.categories.slice(0, 2).map(cat => (
                              <Badge key={cat} variant="outline" className="text-xs font-light">
                                {cat}
                              </Badge>
                            ))}
                            {topic.categories.length > 2 && (
                              <Badge variant="outline" className="text-xs font-light">
                                +{topic.categories.length - 2} more
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-slate-400 dark:text-slate-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                            Take quiz →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              
              {topics.length > 6 && (
                <div className="text-center mt-6">
                  <Button variant="outline" className="font-light">
                    View All {topics.length} Topics
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Related Skills Section */}
          {relatedSkills.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-2xl font-medium text-slate-900 dark:text-white">
                  Related Skills
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light mb-6">
                Other skills in {skill.category_name} that complement this one.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedSkills.map(relatedSkill => (
                  <Link key={relatedSkill.id} href={`/skills/${relatedSkill.skill_slug}`}>
                    <Card className="border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors group cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg font-medium text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {relatedSkill.skill_name}
                              </CardTitle>
                              {relatedSkill.is_core_skill && (
                                <Badge variant="outline" className="text-xs font-light border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400 mt-1">
                                  Core
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge 
                            className={`text-xs font-light ${getDifficultyColor(relatedSkill.difficulty_level)}`}
                            variant="secondary"
                          >
                            {getDifficultyLabel(relatedSkill.difficulty_level)}
                          </Badge>
                        </div>
                      </CardHeader>
                      {relatedSkill.description && (
                        <CardContent className="pt-0">
                          <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed line-clamp-2">
                            {relatedSkill.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800">
            <Link href="/skills">
              <Button variant="outline" className="font-light">
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Skills
              </Button>
            </Link>
            <Link href={`/categories/${categorySlug}`}>
              <Button variant="outline" className="font-light">
                View {skill.category_name} Category
                <Target className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 