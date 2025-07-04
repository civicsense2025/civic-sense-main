"use client"

import { useState, useEffect } from "react"
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Edit2, Save, X, Plus, Trash2, Pencil, Eye } from "lucide-react"
import { cn } from '@civicsense/business-logic/utils'
import { supabase } from "../lib/supabase/client"
import { toast } from "../../components/ui"
import type { QuizQuestion, BaseQuestion } from '@civicsense/types/quiz'

interface AdminEditPanelProps {
  question: QuizQuestion
  topicId: string
  onQuestionUpdate: (updatedQuestion: QuizQuestion) => void
  className?: string
}

export function AdminEditPanel({ question, topicId, onQuestionUpdate, className }: AdminEditPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedQuestion, setEditedQuestion] = useState(question)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 16, y: 16 })

  // Handle drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.drag-handle')) {
      setIsDragging(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top
      
      const handleMouseMove = (e: MouseEvent) => {
        setPosition({
          x: e.clientX - offsetX,
          y: e.clientY - offsetY
        })
      }
      
      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
  }

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          question: editedQuestion.question,
          correct_answer: editedQuestion.correct_answer,
          explanation: editedQuestion.explanation,
          hint: editedQuestion.hint,
          options: 'options' in editedQuestion ? editedQuestion.options : undefined,
          tags: editedQuestion.tags,
          difficulty: editedQuestion.difficulty,
          category: editedQuestion.category,
          type: editedQuestion.type
        })
        .eq('question_number', question.question_number)
        .eq('topic_id', topicId)

      if (error) throw error

      onQuestionUpdate(editedQuestion)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Question updated successfully",
      })
    } catch (error) {
      console.error('Error updating question:', error)
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive"
      })
    }
  }

  return (
    <div
      className={cn(
        "fixed z-50 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 w-96",
        isDragging && "cursor-grabbing",
        className
      )}
      style={{
        left: position.x,
        top: position.y
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 cursor-grab drag-handle">
        <div className="flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-900 dark:text-white">Admin Edit</span>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Question</label>
              <Textarea
                value={editedQuestion.question}
                onChange={(e) => setEditedQuestion({ ...editedQuestion, question: e.target.value })}
                rows={3}
              />
            </div>

            {'options' in editedQuestion && editedQuestion.type === 'multiple_choice' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Options</label>
                {editedQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editedQuestion.options]
                        newOptions[index] = e.target.value
                        setEditedQuestion({ ...editedQuestion, options: newOptions })
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newOptions = editedQuestion.options.filter((_, i) => i !== index)
                        setEditedQuestion({ ...editedQuestion, options: newOptions })
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newOptions = [...editedQuestion.options, '']
                    setEditedQuestion({ ...editedQuestion, options: newOptions })
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Correct Answer</label>
              <Input
                value={editedQuestion.correct_answer}
                onChange={(e) => setEditedQuestion({ ...editedQuestion, correct_answer: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Explanation</label>
              <Textarea
                value={editedQuestion.explanation || ''}
                onChange={(e) => setEditedQuestion({ ...editedQuestion, explanation: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hint</label>
              <Textarea
                value={editedQuestion.hint || ''}
                onChange={(e) => setEditedQuestion({ ...editedQuestion, hint: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select
                  value={editedQuestion.difficulty || 'medium'}
                  onValueChange={(value) => setEditedQuestion({ ...editedQuestion, difficulty: value as 'easy' | 'medium' | 'hard' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={editedQuestion.category || ''}
                  onChange={(e) => setEditedQuestion({ ...editedQuestion, category: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input
                value={editedQuestion.tags?.join(', ') || ''}
                onChange={(e) => setEditedQuestion({ ...editedQuestion, tags: e.target.value.split(',').map(t => t.trim()) })}
                placeholder="Comma-separated tags"
              />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-1">Question</div>
              <div className="text-slate-600 dark:text-slate-400">{question.question}</div>
            </div>

            {'options' in question && question.type === 'multiple_choice' && (
              <div>
                <div className="text-sm font-medium mb-1">Options</div>
                <div className="space-y-1">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className={cn(
                        "text-sm py-1 px-2 rounded",
                        option === question.correct_answer
                          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium mb-1">Correct Answer</div>
              <div className="text-green-600 dark:text-green-400">{question.correct_answer}</div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Explanation</div>
              <div className="text-slate-600 dark:text-slate-400">{question.explanation}</div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Hint</div>
              <div className="text-slate-600 dark:text-slate-400">{question.hint}</div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm font-medium mb-1">Difficulty</div>
                <Badge variant={
                  question.difficulty === 'easy' ? "default" :
                  question.difficulty === 'medium' ? "secondary" :
                  "destructive"
                }>
                  {question.difficulty || 'Medium'}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Category</div>
                <Badge variant="outline">{question.category || 'Uncategorized'}</Badge>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Tags</div>
              <div className="flex flex-wrap gap-1">
                {question.tags?.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 