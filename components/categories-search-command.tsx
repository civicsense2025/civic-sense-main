"use client"

import { useState, useEffect, useCallback } from "react"
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
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  BookOpen, 
  Target, 
  CheckCircle, 
  Folder,
  Clock,
  Star
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

interface CategoriesSearchCommandProps {
  categories: Category[]
  skills: Skill[]
  topics: Topic[]
}

export function CategoriesSearchCommand({ 
  categories, 
  skills, 
  topics 
}: CategoriesSearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const router = useRouter()

  // Filter items based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(search.toLowerCase()) ||
    category.description?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredSkills = skills.filter(skill =>
    skill.skill_name.toLowerCase().includes(search.toLowerCase()) ||
    skill.description?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10) // Limit for performance

  const filteredTopics = topics.filter(topic =>
    topic.topic_title.toLowerCase().includes(search.toLowerCase()) ||
    topic.description.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10) // Limit for performance

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
        // For now, navigate to the skill's category
        const skill = skills.find(s => s.id === id)
        if (skill) {
          // You might want to implement skill-specific pages later
          console.log("Navigate to skill:", skill.skill_name)
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
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput 
          placeholder="Search categories, skills, and topics..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            <div className="text-center py-6">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 dark:text-slate-400">No results found</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Try searching for different keywords
              </p>
            </div>
          </CommandEmpty>
          
          {/* Categories */}
          {filteredCategories.length > 0 && (
            <CommandGroup heading="Categories">
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={`category:${category.id}`}
                  onSelect={handleSelect}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="text-lg">{category.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {category.name}
                        </span>
                        <Folder className="w-4 h-4 text-slate-400" />
                      </div>
                      {category.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Skills */}
          {filteredSkills.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Skills">
                {filteredSkills.map((skill) => (
                  <CommandItem
                    key={skill.id}
                    value={`skill:${skill.id}`}
                    onSelect={handleSelect}
                    className="flex items-center gap-3 p-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {skill.skill_name}
                          </span>
                          {skill.is_core_skill && (
                            <Star className="w-3 h-3 text-yellow-500" />
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
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Topics */}
          {filteredTopics.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Quiz Topics">
                {filteredTopics.map((topic) => (
                  <CommandItem
                    key={topic.topic_id}
                    value={`topic:${topic.topic_id}`}
                    onSelect={handleSelect}
                    className="flex items-center gap-3 p-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                        <span className="text-lg">{topic.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {topic.topic_title}
                          </span>
                          <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate flex-1">
                            {topic.description}
                          </p>
                          {topic.date && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              {new Date(topic.date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
} 