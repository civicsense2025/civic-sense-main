"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './ui/carousel'
import { CheckCircle, Clock, ChevronRight, ArrowRight, Play } from "lucide-react"

interface Topic {
  topic_id: string
  topic_title: string
  description: string
  emoji: string
  date: string | null
  categories: string[]
}

interface TopicsCarouselProps {
  topicsByCategory: Record<string, Topic[]>
}

export function TopicsCarousel({ topicsByCategory }: TopicsCarouselProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const categories = Object.keys(topicsByCategory)
  const displayTopics = selectedCategory 
    ? topicsByCategory[selectedCategory] || []
    : Object.values(topicsByCategory).flat().slice(0, 12) // Show first 12 topics across all categories

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return null
    }
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          No Topics Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Quiz topics will appear here as they become available.
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
          All Topics
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
            <Badge variant="secondary" className="ml-2 font-light rounded-lg">
              {topicsByCategory[category].length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Topics Carousel */}
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {displayTopics.map((topic) => (
            <CarouselItem key={topic.topic_id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <Link href={`/quiz/${topic.topic_id}`}>
                <Card className="h-full border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 group cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{topic.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-medium text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                          {topic.topic_title}
                        </CardTitle>
                        {topic.date && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3" />
                            {formatDate(topic.date)}
                          </div>
                        )}
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
                      
                      <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                        <Play className="w-3 h-3" />
                        <span className="font-medium">Take Quiz</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
          
          {/* Show more card if there are more topics */}
          {!selectedCategory && Object.values(topicsByCategory).flat().length > 12 && (
            <CarouselItem className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <Link href="/topics/search">
                <Card className="h-full border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 group cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                      <ArrowRight className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                      View All Topics
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                      {Object.values(topicsByCategory).flat().length - 12} more topics available
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
        <Link href="/topics/search">
          <Button variant="outline" className="font-light">
            Browse All Topics
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
} 