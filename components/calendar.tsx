"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TopicMetadata } from "@/lib/quiz-data"
import Link from "next/link"

interface CalendarProps {
  topics: TopicMetadata[]
  onDateSelect?: (date: Date) => void
  selectedDate?: Date
  className?: string
}

export function Calendar({ topics, onDateSelect, selectedDate, className }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [topicsByDate, setTopicsByDate] = useState<Record<string, TopicMetadata[]>>({})

  useEffect(() => {
    // Group topics by date
    const grouped = topics.reduce((acc, topic) => {
      const dateKey = new Date(topic.date).toDateString()
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(topic)
      return acc
    }, {} as Record<string, TopicMetadata[]>)
    
    setTopicsByDate(grouped)
  }, [topics])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const hasTopics = (date: Date) => {
    return topicsByDate[date.toDateString()]?.length > 0
  }

  const handleDateClick = (date: Date) => {
    if (hasTopics(date) && onDateSelect) {
      onDateSelect(date)
    }
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className={cn("bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h3 className="font-semibold text-lg">
          {formatMonthYear(currentDate)}
        </h3>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-10" />
          }

          const topicsForDate = topicsByDate[date.toDateString()] || []
          
          return (
            <button
              key={date.toDateString()}
              onClick={() => handleDateClick(date)}
              disabled={!hasTopics(date)}
              className={cn(
                "h-10 w-full rounded-md text-sm font-medium transition-colors relative",
                "hover:bg-slate-100 dark:hover:bg-slate-700",
                isToday(date) && "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100",
                isSelected(date) && "bg-primary text-primary-foreground",
                hasTopics(date) && "cursor-pointer",
                !hasTopics(date) && "text-slate-400 dark:text-slate-600 cursor-not-allowed"
              )}
            >
              {date.getDate()}
              {topicsForDate.length > 0 && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                  {topicsForDate.slice(0, 3).map((topic, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full bg-primary"
                      title={topic.topic_title}
                    />
                  ))}
                  {topicsForDate.length > 3 && (
                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected Date Topics */}
      {selectedDate && topicsByDate[selectedDate.toDateString()] && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-2">
            Topics for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}:
          </h4>
          <div className="space-y-1">
            {topicsByDate[selectedDate.toDateString()].map(topic => (
              <Link 
                key={topic.topic_id} 
                href={`/quiz/${topic.topic_id}`}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center transition-colors group"
              >
                <span className="mr-2">{topic.emoji}</span>
                <span className="truncate group-hover:underline">{topic.topic_title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 