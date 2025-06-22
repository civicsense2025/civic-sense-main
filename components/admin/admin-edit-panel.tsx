'use client'

import { useState } from 'react'
import { Draggable } from '@/components/ui/draggable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase/client'
import type { QuestionTopic, Question } from '@/lib/types'

interface AdminEditPanelProps {
  question?: Question
  topic?: QuestionTopic
  onUpdate?: () => void
  onClose?: () => void
}

export function AdminEditPanel({ 
  question,
  topic,
  onUpdate,
  onClose 
}: AdminEditPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedQuestion, setEditedQuestion] = useState<Question | undefined>(question)
  const [editedTopic, setEditedTopic] = useState<QuestionTopic | undefined>(topic)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      if (editedQuestion) {
        const { error } = await supabase
          .from('questions')
          .update({
            text: editedQuestion.text,
            options: editedQuestion.options,
            correct_answer: editedQuestion.correct_answer,
            explanation: editedQuestion.explanation,
            hint: editedQuestion.hint,
            difficulty: editedQuestion.difficulty,
            category: editedQuestion.category,
            tags: editedQuestion.tags
          })
          .eq('id', editedQuestion.id)

        if (error) throw error
      }

      if (editedTopic) {
        const { error } = await supabase
          .from('question_topics')
          .update({
            topic_title: editedTopic.topic_title,
            description: editedTopic.description,
            emoji: editedTopic.emoji,
            categories: editedTopic.categories,
            difficulty: editedTopic.difficulty,
            is_published: editedTopic.is_published
          })
          .eq('topic_id', editedTopic.topic_id)

        if (error) throw error
      }

      onUpdate?.()
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving changes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Draggable>
      <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Admin Edit Panel
          </h3>
          <div className="flex gap-2">
            <Switch
              checked={isEditing}
              onCheckedChange={setIsEditing}
              aria-label="Toggle edit mode"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            {editedQuestion && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Question Text
                  </label>
                  <Textarea
                    value={editedQuestion.text}
                    onChange={(e) => setEditedQuestion({
                      ...editedQuestion,
                      text: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Options
                  </label>
                  {editedQuestion.options.map((option: string, index: number) => (
                    <Input
                      key={index}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editedQuestion.options]
                        newOptions[index] = e.target.value
                        setEditedQuestion({
                          ...editedQuestion,
                          options: newOptions
                        })
                      }}
                      className="mb-2"
                    />
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Explanation
                  </label>
                  <Textarea
                    value={editedQuestion.explanation}
                    onChange={(e) => setEditedQuestion({
                      ...editedQuestion,
                      explanation: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Difficulty
                  </label>
                  <Select
                    value={editedQuestion.difficulty}
                    onValueChange={(value) => setEditedQuestion({
                      ...editedQuestion,
                      difficulty: value as 'easy' | 'medium' | 'hard'
                    })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                </div>
              </>
            )}

            {editedTopic && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Topic Title
                  </label>
                  <Input
                    value={editedTopic.topic_title}
                    onChange={(e) => setEditedTopic({
                      ...editedTopic,
                      topic_title: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Textarea
                    value={editedTopic.description}
                    onChange={(e) => setEditedTopic({
                      ...editedTopic,
                      description: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Published
                  </label>
                  <Switch
                    checked={editedTopic.is_published}
                    onCheckedChange={(checked) => setEditedTopic({
                      ...editedTopic,
                      is_published: checked
                    })}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditedQuestion(question)
                  setEditedTopic(topic)
                  setIsEditing(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {question && (
              <>
                <div>
                  <span className="text-sm font-medium">Question Text:</span>
                  <p className="mt-1">{question.text}</p>
                </div>

                <div>
                  <span className="text-sm font-medium">Options:</span>
                  <ul className="mt-1 space-y-1">
                    {question.options.map((option: string, index: number) => (
                      <li key={index} className={
                        index === question.correct_answer ? 'text-green-600' : ''
                      }>
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>

                {question.explanation && (
                  <div>
                    <span className="text-sm font-medium">Explanation:</span>
                    <p className="mt-1">{question.explanation}</p>
                  </div>
                )}
              </>
            )}

            {topic && (
              <>
                <div>
                  <span className="text-sm font-medium">Topic:</span>
                  <p className="mt-1">{topic.topic_title}</p>
                </div>

                <div>
                  <span className="text-sm font-medium">Description:</span>
                  <p className="mt-1">{topic.description}</p>
                </div>

                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <p className="mt-1">
                    {topic.is_published ? 'Published' : 'Draft'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Draggable>
  )
} 