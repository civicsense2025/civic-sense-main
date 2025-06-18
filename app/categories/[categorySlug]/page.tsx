import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { topicOperations } from "@/lib/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CategoryPageHeader } from "@/components/category-page-header"
import { BookOpen, Target, Clock, CheckCircle } from "lucide-react"

interface CategoryPageProps {
  params: Promise<{
    categorySlug: string
  }>
}

interface Category {
  id: string
  name: string
  emoji: string
  description: string | null
  display_order: number | null
}

interface Skill {
  id: string
  skill_name: string
  skill_slug: string
  description: string | null
  difficulty_level: number | null
  is_core_skill: boolean | null
  display_order: number | null
}

interface Topic {
  topic_id: string
  topic_title: string
  description: string
  emoji: string
  date: string | null
  categories: string[]
}

interface CategoryData {
  category: Category
  skills: Skill[]
  topics: Topic[]
}

// Convert slug back to category name for lookup
function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function getCategoryData(categorySlug: string): Promise<CategoryData | null> {
  const categoryName = slugToName(categorySlug)
  
  // Get category by name
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .ilike('name', categoryName)
    .eq('is_active', true)
    .single()

  if (categoryError || !category) {
    console.error('Category not found:', categoryError)
    return null
  }

  // Get skills for this category
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('*')
    .eq('category_id', category.id)
    .eq('is_active', true)
    .order('is_core_skill', { ascending: false })
    .order('display_order', { ascending: true })
    .order('skill_name', { ascending: true })

  if (skillsError) {
    console.error('Error fetching skills:', skillsError)
  }

  // Get topics that include this category
  const topics = await topicOperations.getByCategory(category.name)

  return {
    category,
    skills: skills || [],
    topics: topics.map(topic => topicOperations.toTopicAppFormat(topic)) || []
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const categoryData = await getCategoryData(resolvedParams.categorySlug)
  
  if (!categoryData) {
    return {
      title: "Category Not Found | CivicSense",
      description: "The requested category could not be found."
    }
  }

  const { category } = categoryData
  return {
    title: `${category.name} | CivicSense`,
    description: category.description || `Explore ${category.name} in civic education - skills, topics, and knowledge for effective civic participation.`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params
  const categoryData = await getCategoryData(resolvedParams.categorySlug)
  
  if (!categoryData) {
    notFound()
  }

  const { category, skills, topics } = categoryData
  const coreSkills = skills.filter(skill => skill.is_core_skill === true)
  const additionalSkills = skills.filter(skill => skill.is_core_skill !== true)

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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <CategoryPageHeader
        categoryName={category.name}
        categoryEmoji={category.emoji}
        categoryDescription={category.description}
        skillCount={skills.length}
        topicCount={topics.length}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        {/* Content sections */}
        <div className="space-y-12">
          {/* Core Skills Section */}
          {coreSkills.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-medium text-slate-900 dark:text-white">
                  Core Skills
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light mb-6">
                Essential skills that form the foundation of understanding in {category.name}.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coreSkills.map(skill => (
                  <Card key={skill.id} className="border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">
                          {skill.skill_name}
                        </CardTitle>
                        <Badge 
                          className={`font-light ${getDifficultyColor(skill.difficulty_level)}`}
                          variant="secondary"
                        >
                          {getDifficultyLabel(skill.difficulty_level)}
                        </Badge>
                      </div>
                    </CardHeader>
                    {skill.description && (
                      <CardContent className="pt-0">
                        <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                          {skill.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Additional Skills Section */}
          {additionalSkills.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h2 className="text-2xl font-medium text-slate-900 dark:text-white">
                  Additional Skills
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light mb-6">
                Build deeper expertise and specialized knowledge in {category.name}.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {additionalSkills.map(skill => (
                  <Card key={skill.id} className="border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">
                          {skill.skill_name}
                        </CardTitle>
                        <Badge 
                          className={`font-light ${getDifficultyColor(skill.difficulty_level)}`}
                          variant="secondary"
                        >
                          {getDifficultyLabel(skill.difficulty_level)}
                        </Badge>
                      </div>
                    </CardHeader>
                    {skill.description && (
                      <CardContent className="pt-0">
                        <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                          {skill.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Topics Section */}
          {topics.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-2xl font-medium text-slate-900 dark:text-white">
                  Practice Topics
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light mb-6">
                Quiz topics available for practicing {category.name} concepts.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topics.map(topic => (
                  <Link key={topic.topic_id} href={`/quiz/${topic.topic_id}`}>
                    <Card className="border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors group cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <span className="text-xl" role="img" aria-label={topic.topic_title}>
                            {topic.emoji}
                          </span>
                          <div className="flex-1">
                            <CardTitle className="text-lg font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                        <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                          {topic.description}
                        </p>
                        <div className="flex items-center justify-between mt-4">
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
                          <span className="text-sm text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Take quiz →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {skills.length === 0 && topics.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">{category.emoji}</div>
              <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
                Content Coming Soon
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-light max-w-md mx-auto">
                We're working on adding skills and topics for {category.name}. 
                Check back soon for new content!
              </p>
              <div className="mt-6">
                <Link href="/categories">
                  <Button variant="outline">
                    Explore Other Categories
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 