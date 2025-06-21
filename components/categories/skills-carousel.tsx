"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Target, Star, ChevronRight, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface SkillsCarouselProps {
  skillsByCategory: Record<string, Skill[]>
}

export function SkillsCarousel({ skillsByCategory }: SkillsCarouselProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const categories = Object.keys(skillsByCategory)
  const displaySkills = selectedCategory 
    ? skillsByCategory[selectedCategory] || []
    : Object.values(skillsByCategory).flat().slice(0, 12) // Show first 12 skills across all categories

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

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          No Skills Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Skills will appear here as they become available.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="font-light"
        >
          All Skills
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="font-light"
          >
            {category}
            <Badge variant="secondary" className="ml-2 font-light">
              {skillsByCategory[category].length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Skills Carousel */}
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {displaySkills.map((skill) => (
            <CarouselItem key={skill.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <Link href={`/skills/${skill.skill_slug}`} className="block h-full">
                <Card className="h-full border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 group cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                          <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        {skill.is_core_skill && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <Badge 
                        className={`text-xs font-light ${getDifficultyColor(skill.difficulty_level)}`}
                        variant="secondary"
                      >
                        {getDifficultyLabel(skill.difficulty_level)}
                      </Badge>
                    </div>
                    
                    <CardTitle className="text-lg font-medium text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {skill.skill_name}
                    </CardTitle>
                  </CardHeader>
                  
                  {skill.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-4 line-clamp-3">
                        {skill.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {skill.is_core_skill && (
                            <Badge variant="outline" className="text-xs font-light border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400">
                              Core Skill
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                          <span className="font-medium">Learn more</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            </CarouselItem>
          ))}
          
          {/* Show more card if there are more skills */}
          {!selectedCategory && Object.values(skillsByCategory).flat().length > 12 && (
            <CarouselItem className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <Link href="/skills" className="block h-full">
                <Card className="h-full border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 group cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                      <ArrowRight className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                      View All Skills
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                      {Object.values(skillsByCategory).flat().length - 12} more skills available
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          )}
        </CarouselContent>
        
        <CarouselPrevious className="-left-12" />
        <CarouselNext className="-right-12" />
      </Carousel>
      
      {/* View All Link */}
      <div className="text-center">
        <Link href="/skills">
          <Button variant="outline" className="font-light">
            View All Skills
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
} 