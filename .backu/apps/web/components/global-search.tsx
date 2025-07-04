"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  Search, 
  BookOpen, 
  Target, 
  CheckCircle, 
  Folder,
  Clock,
  Star,
  ChevronRight
} from "lucide-react"

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
}

interface Topic {
  topic_id: string
  topic_title: string
  description: string
  emoji: string
  date: string | null
  categories: string[]
}

interface GlobalSearchProps {
  trigger?: React.ReactNode
  placeholder?: string
}

export function GlobalSearch({ 
  trigger,
  placeholder = "Search categories, skills, and topics..." 
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const ITEMS_PER_PAGE = 10

  // Load initial search data when dialog opens
  useEffect(() => {
    if (open && categories.length === 0) {
      loadSearchData()
    }
  }, [open, categories.length])

  // Handle infinite scroll
  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const handleScroll = () => {
      if (loadingMore || !hasMore) return

      const { scrollTop, scrollHeight, clientHeight } = list
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMoreItems()
      }
    }

    list.addEventListener('scroll', handleScroll)
    return () => list.removeEventListener('scroll', handleScroll)
  }, [loadingMore, hasMore])

  const loadSearchData = async () => {
    setIsLoading(true)
    try {
      // Load categories, skills, and topics for search
      const [categoriesRes, skillsRes, topicsRes] = await Promise.all([
        fetch('/api/categories').then(res => res.json()),
        fetch('/api/skills').then(res => res.json()),
        fetch('/api/topics').then(res => res.json())
      ])

      if (categoriesRes.categories) setCategories(categoriesRes.categories)
      if (skillsRes.skills) setSkills(skillsRes.skills)
      if (topicsRes.topics) setTopics(topicsRes.topics)
      
      // Reset pagination
      setPage(1)
      setHasMore(true)
    } catch (error) {
      console.error('Error loading search data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreItems = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    
    try {
      // Simulate loading more items (in real app, fetch from API)
      await new Promise(resolve => setTimeout(resolve, 500))
      setPage(prev => prev + 1)
      
      // Check if we've loaded all items
      if (page * ITEMS_PER_PAGE >= filteredItems.length) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more items:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Filter items based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(search.toLowerCase()) ||
    category.description?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredSkills = skills.filter(skill =>
    skill.skill_name.toLowerCase().includes(search.toLowerCase()) ||
    skill.description?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredTopics = topics.filter(topic =>
    topic.topic_title.toLowerCase().includes(search.toLowerCase()) ||
    topic.description.toLowerCase().includes(search.toLowerCase())
  )

  // Combine all filtered items for pagination
  const filteredItems = [
    ...filteredCategories.map(item => ({ type: 'category', ...item })),
    ...filteredSkills.map(item => ({ type: 'skill', ...item })),
    ...filteredTopics.map(item => ({ type: 'topic', ...item }))
  ]

  // Get current page items
  const currentItems = filteredItems.slice(0, page * ITEMS_PER_PAGE)

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = useCallback((value: string) => {
    setOpen(false)
    setSearch("")
    
    // Parse the value to determine navigation
    const [type, id] = value.split(":")
    
    switch (type) {
      case "category":
        const category = categories.find(c => c.id === id)
        if (category) {
          const slug = category.name.toLowerCase().replace(/\s+/g, '-')
          router.push(`/categories/${slug}`)
        }
        break
      case "skill":
        const skill = skills.find(s => s.id === id)
        if (skill) {
          router.push(`/skills/${skill.skill_slug}`)
        }
        break
      case "topic":
        router.push(`/quiz/${id}`)
        break
    }
  }, [categories, skills, router])

  const getDifficultyLabel = (level: number | null) => {
    if (!level) return "Beginner"
    switch (level) {
      case 1: return "Beginner"
      case 2: return "Intermediate" 
      case 3: return "Advanced"
      case 4: return "Expert"
      case 5: return "Master"
      default: return "Beginner"
    }
  }

  const getDifficultyColor = (level: number | null) => {
    if (!level) return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    switch (level) {
      case 1: return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case 2: return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case 3: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case 4: return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case 5: return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default: return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    }
  }

  return (
    <>
      {/* Trigger button */}
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 gap-2"
        >
          <span className="text-lg">🔍</span>
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs font-mono border">
            ⌘K
          </kbd>
        </Button>
      )}

      {/* Search Dialog */}
      <CommandDialog 
        open={open} 
        onOpenChange={setOpen}
        title="Search categories, skills, and topics"
      >
        <Command className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
            aria-label="Search categories, skills, and topics"
          />
          <CommandList 
            ref={listRef} 
            className="max-h-[400px] overflow-y-auto"
            role="listbox"
            aria-label="Search results"
          >
            {isLoading ? (
              <div className="text-center py-6" role="status" aria-label="Loading search results">
                <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-2"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading...</p>
              </div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="text-center py-6" role="status" aria-label="No results found">
                    <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-slate-600 dark:text-slate-400">No results found</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                      Try searching for different keywords
                    </p>
                  </div>
                </CommandEmpty>

                {currentItems.map((item, index) => {
                  if (item.type === 'category') {
                    const category = item as Category & { type: 'category' }
                    return (
                      <CommandItem
                        key={`${category.type}-${category.id}`}
                        value={`category:${category.id}`}
                        onSelect={handleSelect}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 group"
                        role="option"
                        aria-label={`Category: ${category.name}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center" aria-hidden="true">
                            <span className="text-lg">{category.emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {category.name}
                              </span>
                              <Folder className="w-4 h-4 text-slate-400" aria-hidden="true" />
                            </div>
                            {category.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                {category.description}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                        </div>
                      </CommandItem>
                    )
                  }

                  if (item.type === 'skill') {
                    const skill = item as Skill & { type: 'skill' }
                    return (
                      <CommandItem
                        key={`${skill.type}-${skill.id}`}
                        value={`skill:${skill.id}`}
                        onSelect={handleSelect}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 group"
                        role="option"
                        aria-label={`Skill: ${skill.skill_name}${skill.is_core_skill ? ' (Core Skill)' : ''}, Difficulty: ${getDifficultyLabel(skill.difficulty_level)}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center" aria-hidden="true">
                            <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                                {skill.skill_name}
                              </span>
                              {skill.is_core_skill && (
                                <Star className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                              )}
                              <Badge 
                                className={`text-xs font-light ${getDifficultyColor(skill.difficulty_level)}`}
                                variant="secondary"
                              >
                                {getDifficultyLabel(skill.difficulty_level)}
                              </Badge>
                            </div>
                            {skill.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                {skill.description}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                        </div>
                      </CommandItem>
                    )
                  }

                  if (item.type === 'topic') {
                    const topic = item as Topic & { type: 'topic' }
                    return (
                      <CommandItem
                        key={`${topic.type}-${topic.topic_id}`}
                        value={`topic:${topic.topic_id}`}
                        onSelect={handleSelect}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 group"
                        role="option"
                        aria-label={`Topic: ${topic.topic_title}${topic.date ? `, Date: ${new Date(topic.date).toLocaleDateString()}` : ''}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center" aria-hidden="true">
                            <span className="text-lg">{topic.emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {topic.topic_title}
                              </span>
                              {topic.date && (
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <Clock className="w-3 h-3" aria-hidden="true" />
                                  {new Date(topic.date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {topic.categories.slice(0, 2).map((cat, i) => (
                                <Badge key={i} variant="outline" className="text-xs font-light">
                                  {cat}
                                </Badge>
                              ))}
                              {topic.categories.length > 2 && (
                                <Badge variant="outline" className="text-xs font-light">
                                  +{topic.categories.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                        </div>
                      </CommandItem>
                    )
                  }
                })}

                {loadingMore && (
                  <div className="text-center py-4" role="status" aria-label="Loading more results">
                    <div className="animate-spin w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto"></div>
                  </div>
                )}

                {!loadingMore && hasMore && filteredItems.length > 0 && (
                  <div className="text-center py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMoreItems}
                      className="text-slate-600 dark:text-slate-400"
                      aria-label="Load more search results"
                    >
                      Load more results
                    </Button>
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
} 