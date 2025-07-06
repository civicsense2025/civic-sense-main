"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { Search, X, Calendar, Filter, SortAsc, SortDesc, ChevronDown, ChevronRight } from "lucide-react"

// Types
interface Category {
  id: string
  name: string
  emoji: string
  description: string | null
}

interface Skill {
  id: string
  skill_name: string
  skill_slug: string
  description: string | null
  difficulty_level: number | null
  is_core_skill: boolean | null
  category_name?: string
  mastery_level?: string
  progress_percentage?: number
}

interface Topic {
  topic_id: string
  topic_title: string
  description: string
  emoji: string
  date: string | null
  categories: string[]
}

interface EnhancedGlobalSearchProps {
  trigger?: React.ReactNode
  placeholder?: string
}

type FilterType = 'all' | 'categories' | 'skills' | 'topics'
type SortType = 'relevance' | 'alphabetical' | 'date-newest' | 'date-oldest' | 'difficulty'
type ContentFilter = 'all' | 'core-only' | 'beginner' | 'intermediate' | 'advanced'

export function EnhancedGlobalSearch({ 
  trigger,
  placeholder = "Search CivicSense..." 
}: EnhancedGlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('relevance')
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all')
  const [quickFilter, setQuickFilter] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  
  // Collapsible sidebar sections state
  const [collapsedSections, setCollapsedSections] = useState({
    contentType: false, // Open by default
    sortBy: true,
    contentFilter: true,
    quickFilters: true
  })

  // Intersection observer refs for sections
  const sectionRefs = {
    contentType: useRef<HTMLDivElement>(null),
    sortBy: useRef<HTMLDivElement>(null),
    contentFilter: useRef<HTMLDivElement>(null),
    quickFilters: useRef<HTMLDivElement>(null)
  }

  // Set up intersection observer for auto-collapse
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.getAttribute('data-section-id')
          if (sectionId && sectionId !== 'contentType') { // Don't auto-collapse content type
            setCollapsedSections(prev => ({
              ...prev,
              [sectionId]: !entry.isIntersecting
            }))
          }
        })
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }
    )

    // Observe all section refs except contentType
    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (key !== 'contentType' && ref.current) {
        observer.observe(ref.current)
      }
    })

    return () => observer.disconnect()
  }, [])
  
  const router = useRouter()

  // Mount check for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load initial search data when dialog opens
  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  // Group topics by week for date-based display
  const groupTopicsByWeek = (topics: Topic[]) => {
    const grouped: { [key: string]: Topic[] } = {}
    
    // First separate evergreen topics
    const evergreenTopics = topics.filter(topic => !topic.date)
    const datedTopics = topics.filter(topic => topic.date)
    
    // Sort dated topics by date descending (newest first)
    datedTopics.sort((a, b) => {
      const dateA = new Date(a.date || '').getTime()
      const dateB = new Date(b.date || '').getTime()
      return dateB - dateA
    })
    
    // Group dated topics by week
    datedTopics.forEach(topic => {
      const date = new Date(topic.date!)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6) // End of week (Saturday)
      
      // Include year in the key if it's not the current year
      const currentYear = new Date().getFullYear()
      const topicYear = date.getFullYear()
      const yearSuffix = topicYear !== currentYear ? ` ${topicYear}` : ''
      
      const weekKey = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${yearSuffix}`
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = []
      }
      grouped[weekKey].push(topic)
    })
    
    // Add evergreen topics at the end
    if (evergreenTopics.length > 0) {
      grouped['Evergreen'] = evergreenTopics
    }
    
    return grouped
  }

  // Progressive loading implementation
  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      // First load just categories - they're lightweight
      const categoriesRes = await fetch('/api/categories')
      if (categoriesRes.ok) {
        const categoriesText = await categoriesRes.text()
        if (categoriesText.trim()) {
          try {
            const categoriesData = JSON.parse(categoriesText)
            setCategories(categoriesData.categories || [])
          } catch (parseError) {
            console.warn('Failed to parse categories response:', parseError)
            setCategories([])
          }
        }
      }
      
      // Then load skills and topics in parallel
      // For topics, we'll load all of them without limit
      Promise.all([
        fetch('/api/skills').then(async res => {
          if (res.ok) {
            const text = await res.text()
            if (text.trim()) {
              try {
                return JSON.parse(text)
              } catch (parseError) {
                console.warn('Failed to parse skills response:', parseError)
                return { data: [] }
              }
            }
          }
          return { data: [] }
        }),
        fetch('/api/topics?limit=all').then(async res => {
          if (res.ok) {
            const text = await res.text()
            if (text.trim()) {
              try {
                return JSON.parse(text)
              } catch (parseError) {
                console.warn('Failed to parse topics response:', parseError)
                return { topics: [] }
              }
            }
          }
          return { topics: [] }
        })
      ]).then(([skillsData, topicsData]) => {
        setSkills(skillsData.data || [])
        setTopics(topicsData.topics || [])
        console.log(`Loaded ${topicsData.total || topicsData.topics?.length || 0} topics total`)
      }).catch(console.error)
      
    } catch (error) {
      console.error('Error loading initial data:', error)
      // Fallback to demo data if needed
      setCategories([
        { id: '1', name: 'Government', emoji: '🏛️', description: 'How government works and operates' },
        { id: '2', name: 'Elections', emoji: '🗳️', description: 'Electoral processes and voting' },
        { id: '3', name: 'Civil Rights', emoji: '⚖️', description: 'Individual rights and civil liberties' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Apply all filters and sorting
  const getFilteredAndSortedItems = () => {
    let filteredCategories = categories
    let filteredSkills = skills
    let filteredTopics = topics

    // Apply text search
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchLower) ||
        (category.description && category.description.toLowerCase().includes(searchLower))
      )

      filteredSkills = skills.filter(skill =>
        skill.skill_name.toLowerCase().includes(searchLower) ||
        (skill.description && skill.description.toLowerCase().includes(searchLower)) ||
        (skill.category_name && skill.category_name.toLowerCase().includes(searchLower))
      )

      filteredTopics = topics.filter(topic =>
        topic.topic_title.toLowerCase().includes(searchLower) ||
        topic.description.toLowerCase().includes(searchLower) ||
        topic.categories.some(cat => cat.toLowerCase().includes(searchLower))
      )
    }

    // Apply quick filter (keywords)
    if (quickFilter) {
      const quickFilterLower = quickFilter.toLowerCase()
      filteredTopics = filteredTopics.filter(topic =>
        topic.topic_title.toLowerCase().includes(quickFilterLower) ||
        topic.description.toLowerCase().includes(quickFilterLower)
      )
    }

    // Apply content filter
    if (contentFilter !== 'all') {
      switch (contentFilter) {
        case 'core-only':
          filteredSkills = filteredSkills.filter(skill => skill.is_core_skill)
          break
        case 'beginner':
          filteredSkills = filteredSkills.filter(skill => (skill.difficulty_level || 1) === 1)
          break
        case 'intermediate':
          filteredSkills = filteredSkills.filter(skill => (skill.difficulty_level || 1) === 2)
          break
        case 'advanced':
          filteredSkills = filteredSkills.filter(skill => (skill.difficulty_level || 1) === 3)
          break
      }
    }

    // Apply sorting
    const sortItems = <T extends { name?: string; skill_name?: string; topic_title?: string; date?: string | null; difficulty_level?: number | null }>(items: T[]) => {
      switch (sortBy) {
        case 'alphabetical':
          return items.sort((a, b) => {
            const nameA = a.name || a.skill_name || a.topic_title || ''
            const nameB = b.name || b.skill_name || b.topic_title || ''
            return nameA.localeCompare(nameB)
          })
        case 'date-newest':
          return items.sort((a, b) => {
            if (!a.date || !b.date) return 0
            return new Date(b.date).getTime() - new Date(a.date).getTime()
          })
        case 'date-oldest':
          return items.sort((a, b) => {
            if (!a.date || !b.date) return 0
            return new Date(a.date).getTime() - new Date(b.date).getTime()
          })
        case 'difficulty':
          return items.sort((a, b) => {
            const diffA = a.difficulty_level || 0
            const diffB = b.difficulty_level || 0
            return diffA - diffB
          })
        default:
          return items
      }
    }

    return {
      categories: sortItems(filteredCategories),
      skills: sortItems(filteredSkills),
      topics: sortItems(filteredTopics)
    }
  }

  const { categories: filteredCategories, skills: filteredSkills, topics: filteredTopics } = getFilteredAndSortedItems()
  const groupedTopics = groupTopicsByWeek(filteredTopics)

  const handleSelect = useCallback((value: string) => {
    setOpen(false)
    
    if (value.startsWith('topic:')) {
      const topicId = value.replace('topic:', '')
      router.push(`/quiz/${topicId}`)
    } else if (value.startsWith('category:')) {
      const categoryId = value.replace('category:', '')
      router.push(`/categories/${categoryId}`)
    } else if (value.startsWith('skill:')) {
      const skillId = value.replace('skill:', '')
      router.push(`/skills/${skillId}`)
    }
  }, [router])

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Toggle collapsed sections
  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Format date for display
  const formatTopicDate = (dateString: string | null) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    } catch {
      return null
    }
  }

  const quickFilters = ['trump', 'biden', 'congress', 'supreme court', 'election', 'democracy', 'constitution']

  if (!mounted) return null

  return (
    <>
      {/* Trigger Button */}
      {trigger || (
        <button
          onClick={() => setOpen(true)}
          className="relative flex items-center gap-2 w-full max-w-[200px] px-2 py-1 text-left text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Search className="w-3 h-3 flex-shrink-0" />
          <span className="flex-1 truncate text-xs">Search...</span>
          <kbd className="hidden lg:inline-flex items-center px-1 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-slate-400 dark:text-slate-500">
            ⌘K
          </kbd>
        </button>
      )}

      {/* Fullscreen Search Dialog */}
      {open && mounted && createPortal(
        <div className="enhanced-global-search fixed inset-0 z-[9999] bg-white dark:bg-slate-950 overflow-hidden">
          {/* Search input at top with generous padding and ESC key */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 lg:px-16 py-6 lg:py-8">
            <div className="flex items-center gap-4 max-w-4xl mx-auto">
              <Search className="w-6 h-6 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 h-12 text-xl lg:text-2xl border-0 focus:ring-0 bg-transparent px-0 placeholder:text-slate-400 font-light outline-none"
                autoFocus
              />
              <button
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">ESC</span>
              </button>
            </div>
          </div>

          {/* Main content area with sidebar */}
          <div className="flex h-[calc(100vh-140px)] lg:h-[calc(100vh-160px)]">
            {/* Left sidebar - larger on desktop, hidden on mobile when results shown */}
            <div className={`${search ? 'hidden lg:block' : 'block'} w-full lg:w-80 xl:w-96 border-r border-slate-200 dark:border-slate-800 p-4 sm:p-6 lg:p-8 overflow-y-auto`}>
              <nav className="space-y-6">
                {/* Content Type Section */}
                <div>
                  <button
                    onClick={() => toggleSection('contentType')}
                    className="flex items-center justify-between w-full text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    Content Type
                    {collapsedSections.contentType ? 
                      <ChevronRight className="w-4 h-4" /> : 
                      <ChevronDown className="w-4 h-4" />
                    }
                  </button>
                  {!collapsedSections.contentType && (
                    <div className="space-y-2">
                      {[
                        { key: 'all', label: 'All Content' },
                        { key: 'categories', label: 'Categories' },
                        { key: 'skills', label: 'Skills' },
                        { key: 'topics', label: 'Topics' }
                      ].map(filter => (
                        <button
                          key={filter.key}
                          onClick={() => setActiveFilter(filter.key as FilterType)}
                          className={`block w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                            activeFilter === filter.key
                              ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort By Section */}
                <div>
                  <button
                    onClick={() => toggleSection('sortBy')}
                    className="flex items-center justify-between w-full text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    Sort By
                    {collapsedSections.sortBy ? 
                      <ChevronRight className="w-4 h-4" /> : 
                      <ChevronDown className="w-4 h-4" />
                    }
                  </button>
                  {!collapsedSections.sortBy && (
                    <div className="space-y-2">
                      {[
                        { key: 'relevance', label: 'Relevance', icon: Filter },
                        { key: 'alphabetical', label: 'A-Z', icon: SortAsc },
                        { key: 'date-newest', label: 'Newest', icon: Calendar },
                        { key: 'date-oldest', label: 'Oldest', icon: Calendar },
                        { key: 'difficulty', label: 'Difficulty', icon: SortDesc }
                      ].map(sort => (
                        <button
                          key={sort.key}
                          onClick={() => setSortBy(sort.key as SortType)}
                          className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                            sortBy === sort.key
                              ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <sort.icon className="w-4 h-4" />
                          {sort.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Filter Section */}
                <div>
                  <button
                    onClick={() => toggleSection('contentFilter')}
                    className="flex items-center justify-between w-full text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    Content Filter
                    {collapsedSections.contentFilter ? 
                      <ChevronRight className="w-4 h-4" /> : 
                      <ChevronDown className="w-4 h-4" />
                    }
                  </button>
                  {!collapsedSections.contentFilter && (
                    <div className="space-y-2">
                      {[
                        { key: 'all', label: 'All Levels' },
                        { key: 'core-only', label: 'Core Only' },
                        { key: 'beginner', label: 'Beginner' },
                        { key: 'intermediate', label: 'Intermediate' },
                        { key: 'advanced', label: 'Advanced' }
                      ].map(filter => (
                        <button
                          key={filter.key}
                          onClick={() => setContentFilter(filter.key as ContentFilter)}
                          className={`block w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                            contentFilter === filter.key
                              ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Filters Section */}
                <div>
                  <button
                    onClick={() => toggleSection('quickFilters')}
                    className="flex items-center justify-between w-full text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    Quick Filters
                    {collapsedSections.quickFilters ? 
                      <ChevronRight className="w-4 h-4" /> : 
                      <ChevronDown className="w-4 h-4" />
                    }
                  </button>
                  {!collapsedSections.quickFilters && (
                    <div className="flex flex-wrap gap-2">
                      {quickFilters.map(filter => (
                        <button
                          key={filter}
                          onClick={() => setQuickFilter(quickFilter === filter ? '' : filter)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            quickFilter === filter
                              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Right content area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  {/* Mobile back button */}
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="lg:hidden mb-6 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      ← Back to filters
                    </button>
                  )}

                  {/* Results */}
                  {filteredCategories.length === 0 && filteredSkills.length === 0 && filteredTopics.length === 0 ? (
                    <div className="text-center py-16">
                      <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-2">
                        No results found
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-lg">
                        Try searching for constitution, voting, democracy, or government
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Categories */}
                      {filteredCategories.length > 0 && (
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                            Categories ({filteredCategories.length})
                          </h2>
                          <div className="space-y-3">
                            {filteredCategories.map((category) => (
                              <div
                                key={category.id}
                                onClick={() => handleSelect(`category:${category.id}`)}
                                className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
                              >
                                <span className="text-2xl flex-shrink-0">{category.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                                    {category.name}
                                  </h3>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                    {category.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {filteredSkills.length > 0 && (
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                            Skills ({filteredSkills.length})
                          </h2>
                          <div className="space-y-3">
                            {filteredSkills.map((skill) => (
                              <div
                                key={skill.id}
                                onClick={() => handleSelect(`skill:${skill.id}`)}
                                className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
                              >
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                                    {skill.difficulty_level || 1}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-slate-900 dark:text-slate-100">
                                      {skill.skill_name}
                                    </h3>
                                    {skill.is_core_skill && (
                                      <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg">
                                        Core
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                    {skill.description}
                                  </p>
                                  {skill.category_name && (
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                      {skill.category_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Topics - grouped by week when dates exist */}
                      {filteredTopics.length > 0 && (
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                            Topics ({filteredTopics.length})
                          </h2>
                          <div className="space-y-6">
                            {Object.entries(groupedTopics).map(([weekLabel, weekTopics]) => (
                              <div key={weekLabel}>
                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                                  {weekLabel}
                                </h3>
                                <div className="space-y-3">
                                  {weekTopics.map((topic) => (
                                    <div
                                      key={topic.topic_id}
                                      onClick={() => handleSelect(`topic:${topic.topic_id}`)}
                                      className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
                                    >
                                      <span className="text-2xl flex-shrink-0">{topic.emoji}</span>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-slate-900 dark:text-slate-100">
                                          {topic.topic_title}
                                        </h3>
                                        {topic.date && (
                                          <div className="font-space-mono text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
                                            {formatTopicDate(topic.date)}
                                          </div>
                                        )}
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                                          {topic.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {topic.categories.slice(0, 3).map(cat => (
                                            <span key={cat} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                                              {cat}
                                            </span>
                                          ))}
                                          {topic.categories.length > 3 && (
                                            <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                                              +{topic.categories.length - 3}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
} 