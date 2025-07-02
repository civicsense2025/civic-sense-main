'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { cn } from '@civicsense/shared/lib/utils'
import { BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface RelatedTopicsProps {
  topics: Array<{
    id: string
    title: string
    description: string
    questionCount: number
    relevanceScore: number
    slug?: string
  }>
  className?: string
  compact?: boolean
}

export function RelatedTopics({ topics, className, compact = false }: RelatedTopicsProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Related Topics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topics.map(topic => (
            <Link 
              key={topic.id}
              href={`/topics/${topic.slug || topic.id}`}
              className="block"
            >
              <div className="group relative p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {topic.title}
                    </h3>
                    {!compact && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {topic.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        <BookOpen className="mr-1 h-3 w-3" />
                        {topic.questionCount} questions
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          topic.relevanceScore >= 80 ? "text-green-600" :
                          topic.relevanceScore >= 50 ? "text-yellow-600" :
                          "text-slate-600"
                        )}
                      >
                        {topic.relevanceScore}% relevant
                      </Badge>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 