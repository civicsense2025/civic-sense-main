import { Metadata } from "next"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CategoriesPageHeader } from "@/components/categories-page-header"

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

  // Get topic counts for each category (topics have categories as array)
  const { data: topics, error: topicsError } = await supabase
    .from('question_topics')
    .select('categories')
    .eq('is_active', true)

  if (skillError || topicsError) {
    console.error('Error fetching counts:', { skillError, topicsError })
  }

  // Count skills per category
  const skillCountMap = new Map<string, number>()
  if (skillCounts) {
    skillCounts.forEach(skill => {
      const count = skillCountMap.get(skill.category_id) || 0
      skillCountMap.set(skill.category_id, count + 1)
    })
  }

  // Count topics per category
  const topicCountMap = new Map<string, number>()
  if (topics) {
    topics.forEach(topic => {
      if (Array.isArray(topic.categories)) {
        (topic.categories as string[]).forEach(categoryName => {
          const count = topicCountMap.get(categoryName) || 0
          topicCountMap.set(categoryName, count + 1)
        })
      }
    })
  }

  // Combine categories with their stats
  return (categories || []).map(category => ({
    ...category,
    skillCount: skillCountMap.get(category.id) || 0,
    topicCount: topicCountMap.get(category.name) || 0,
  }))
}



export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <CategoriesPageHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        {/* Page header - more dynamic */}
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

        {/* Categories - More organic layout */}
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
          <div className="space-y-8">
            {/* Create rows with varied layouts */}
            {Array.from({ length: Math.ceil(categories.length / 3) }).map((_, rowIndex) => {
              const startIndex = rowIndex * 3
              const rowCategories = categories.slice(startIndex, startIndex + 3)
              const isEvenRow = rowIndex % 2 === 0
              
              return (
                <div key={rowIndex} className={`grid gap-6 ${
                  rowCategories.length === 3 
                    ? (isEvenRow ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3') 
                    : rowCategories.length === 2 
                    ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' 
                    : 'grid-cols-1 max-w-md mx-auto'
                }`}>
                  {rowCategories.map((category, index) => {
                    const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-')
                    const hasContent = category.skillCount > 0 || category.topicCount > 0
                    
                    // Vary the styling for each position
                    const isLarge = isEvenRow && index === 0 && rowCategories.length === 3
                    const cardClasses = isLarge 
                      ? "md:row-span-1 md:col-span-1" 
                      : ""
                    
                    return (
                      <Link 
                        href={`/categories/${categorySlug}`} 
                        key={category.id} 
                        className={`group block ${cardClasses}`}
                      >
                        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 hover:-translate-y-1 ${
                          isLarge ? 'p-8' : 'p-6'
                        }`}>
                          {/* Background pattern */}
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/30 dark:to-slate-800/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          <div className="relative space-y-4">
                            {/* Category header with more dynamic spacing */}
                            <div className="flex items-start gap-4">
                              <div className={`flex-shrink-0 ${isLarge ? 'text-4xl' : 'text-3xl'} transform group-hover:scale-110 transition-transform duration-300`}>
                                {category.emoji}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h2 className={`${isLarge ? 'text-2xl' : 'text-xl'} font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2`}>
                                  {category.name}
                                </h2>
                                
                                {/* Content stats moved up */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  {category.skillCount > 0 && (
                                    <Badge variant="secondary" className="text-xs font-light bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">
                                      {category.skillCount} skill{category.skillCount !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                  {category.topicCount > 0 && (
                                    <Badge variant="outline" className="text-xs font-light border-slate-200 dark:border-slate-600">
                                      {category.topicCount} topic{category.topicCount !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                  {!hasContent && (
                                    <Badge variant="secondary" className="text-xs font-light text-slate-500 bg-slate-100 dark:bg-slate-800">
                                      Coming soon
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Description */}
                            {category.description && (
                              <p className={`text-slate-600 dark:text-slate-400 font-light leading-relaxed ${isLarge ? 'text-base' : 'text-sm'}`}>
                                {category.description}
                              </p>
                            )}
                            
                            {/* Explore indicator */}
                            <div className="flex items-center justify-end pt-2">
                              <span className="text-sm text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-medium">
                                Explore →
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 