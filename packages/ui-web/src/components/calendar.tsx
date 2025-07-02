"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { cn } from "@civicsense/ui-web"
import type { TopicMetadata } from "@civicsense/shared/lib/quiz-data"
import Link from "next/link"
// TEMPORARILY DISABLED: Web app specific component during monorepo migration
// import { EventSubmissionDialog } from '@/components/events/event-submission-dialog'

// Temporary stub component
const EventSubmissionDialog = ({ isOpen, onClose, selectedDate }: any) => null

interface CalendarProps {
  topics: TopicMetadata[]
  onDateSelect?: (date: Date) => void
  selectedDate?: Date
  className?: string
}

export function Calendar({ topics, onDateSelect, selectedDate: propSelectedDate, className }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [topicsByDate, setTopicsByDate] = useState<Record<string, TopicMetadata[]>>({})
  const [localSelectedDate, setLocalSelectedDate] = useState<Date | null>(propSelectedDate || null)
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)

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

  // Update local state when prop changes
  useEffect(() => {
    setLocalSelectedDate(propSelectedDate || null)
  }, [propSelectedDate])

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
    const dateToCheck = propSelectedDate || localSelectedDate
    return dateToCheck && date.toDateString() === dateToCheck.toDateString()
  }

  const hasTopics = (date: Date) => {
    return topicsByDate[date.toDateString()]?.length > 0
  }

  const handleDateClick = (date: Date) => {
    if (!hasTopics(date)) {
      setLocalSelectedDate(date)
      setIsEventDialogOpen(true)
      if (onDateSelect) {
        onDateSelect(date)
      }
    }
  }

  const handleDateNavigate = (date: Date) => {
    if (hasTopics(date)) {
      const formattedDate = date.toISOString().split('T')[0]
      window.location.href = `/topics/${formattedDate}`
    }
  }

  const days = getDaysInMonth(currentDate)

  return (
    <>
      <div className={cn("bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700", className)}>
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4 px-4 border-b border-slate-200 dark:border-slate-700 pb-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigateMonth('prev')}
            className="h-12 w-12 p-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <h3 className="font-semibold text-2xl">
            {formatMonthYear(currentDate)}
          </h3>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigateMonth('next')}
            className="h-12 w-12 p-0"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-0 mb-0 border-b border-slate-200 dark:border-slate-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-base font-medium text-slate-500 dark:text-slate-400 py-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-700">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-24 bg-slate-50 dark:bg-slate-900/50" />
            }

            const topicsForDate = topicsByDate[date.toDateString()] || []
            
            return (
              <Popover key={date.toDateString()}>
                <PopoverTrigger asChild>
                  <div
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      "h-24 w-full text-base font-medium transition-colors relative group",
                      "border-b border-slate-200 dark:border-slate-700",
                      "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      isToday(date) && "bg-blue-50/50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100",
                      isSelected(date) && "bg-primary/10 text-primary",
                      !hasTopics(date) && "text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-900/20"
                    )}
                  >
                    <span className="absolute top-1 left-2 text-sm">{date.getDate()}</span>
                    {topicsForDate.length > 0 && (
                      <>
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                          {topicsForDate.slice(0, 3).map((topic, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                topic.is_breaking ? "bg-red-500" :
                                topic.is_featured ? "bg-blue-500" :
                                "bg-primary"
                              )}
                              title={topic.topic_title}
                            />
                          ))}
                          {topicsForDate.length > 3 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          )}
                        </div>
                        {hasTopics(date) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDateNavigate(date)
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 bg-primary/5 flex items-center justify-center text-sm font-medium text-primary transition-opacity"
                          >
                            View Topics →
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </PopoverTrigger>
                {hasTopics(date) && (
                  <PopoverContent className="w-80 p-4" align="center">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <h4 className="font-medium text-lg">
                          {date.toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </h4>
                        <span className="text-sm text-muted-foreground">
                          {topicsForDate.length} topic{topicsForDate.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {topicsForDate.map(topic => (
                          <Link 
                            key={topic.topic_id} 
                            href={`/quiz/${topic.topic_id}`}
                            className="block p-2 -mx-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{topic.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {topic.topic_title}
                                </div>
                                {topic.categories.length > 0 && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {topic.categories.join(' • ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                )}
              </Popover>
            )
          })}
        </div>
      </div>

      <EventSubmissionDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        selectedDate={localSelectedDate}
      />
    </>
  )
} 