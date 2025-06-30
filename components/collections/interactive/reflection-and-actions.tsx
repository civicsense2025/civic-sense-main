import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, MessageSquare, CheckSquare, Mail } from 'lucide-react'
import type { 
  ReflectionConfig, 
  ActionChecklistConfig, 
  ContactFormConfig,
  CompletionCallback 
} from './types'

// Reflection Component
export function Reflection({ config, onComplete }: { config: ReflectionConfig; onComplete: CompletionCallback }) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  
  const handleAnswerChange = (promptIndex: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [promptIndex]: answer }))
  }

  const handleSubmit = () => {
    onComplete(true, { reflections: answers })
  }

  const completedQuestions = Object.keys(answers).filter(idx => answers[parseInt(idx)].trim().length > 0).length
  const progress = (completedQuestions / config.prompts.length) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <MessageSquare className="h-5 w-5 inline mr-2" />
          Reflection
        </CardTitle>
        <Progress value={progress} className="h-2" />
        {config.guidance && (
          <p className="text-sm text-gray-600">{config.guidance}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {config.prompts.map((prompt, index) => (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {index + 1}. {prompt}
            </label>
            <Textarea
              placeholder="Share your thoughts..."
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        ))}

        <Button 
          onClick={handleSubmit}
          disabled={completedQuestions === 0}
          className="w-full"
        >
          Complete Reflection
        </Button>
      </CardContent>
    </Card>
  )
}

// Action Checklist Component
export function ActionChecklist({ config, onComplete }: { config: ActionChecklistConfig; onComplete: CompletionCallback }) {
  const [primaryCompleted, setPrimaryCompleted] = useState(false)
  const [bonusCompleted, setBonusCompleted] = useState<Set<number>>(new Set())
  const [verificationData, setVerificationData] = useState<string>('')

  const handlePrimaryComplete = () => {
    if (config.primary_action.verification === 'text_input' && !verificationData.trim()) {
      return // Require text input
    }
    setPrimaryCompleted(true)
    
    // Check if everything is complete
    const totalActions = 1 + (config.bonus_actions?.length || 0)
    const completedCount = 1 + bonusCompleted.size
    
    if (completedCount === totalActions) {
      onComplete(true, { primaryCompleted: true, bonusCompleted: Array.from(bonusCompleted), verificationData })
    }
  }

  const handleBonusToggle = (index: number) => {
    setBonusCompleted(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const totalActions = 1 + (config.bonus_actions?.length || 0)
  const completedCount = (primaryCompleted ? 1 : 0) + bonusCompleted.size
  const progress = (completedCount / totalActions) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <CheckSquare className="h-5 w-5 inline mr-2" />
          Action Checklist
        </CardTitle>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-gray-600">
          {completedCount} of {totalActions} actions completed
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Primary Action */}
        <div className={`p-4 rounded-lg border ${
          primaryCompleted ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center ${
              primaryCompleted ? 'bg-green-500 border-green-500' : 'border-blue-300'
            }`}>
              {primaryCompleted && <CheckCircle className="h-4 w-4 text-white" />}
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{config.primary_action.task}</h4>
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span>⏱️ {config.primary_action.time_needed}</span>
                <span>📊 {config.primary_action.difficulty}</span>
              </div>
              
              {config.primary_action.verification === 'text_input' && !primaryCompleted && (
                <div className="mt-3">
                  <Input
                    placeholder={config.primary_action.placeholder || 'Describe what you did...'}
                    value={verificationData}
                    onChange={(e) => setVerificationData(e.target.value)}
                    className="mb-2"
                  />
                  <Button 
                    onClick={handlePrimaryComplete}
                    disabled={!verificationData.trim()}
                    size="sm"
                  >
                    Mark Complete
                  </Button>
                </div>
              )}
              
              {config.primary_action.verification === 'checkbox' && !primaryCompleted && (
                <Button 
                  onClick={handlePrimaryComplete}
                  size="sm"
                  className="mt-2"
                >
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bonus Actions */}
        {config.bonus_actions && config.bonus_actions.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium text-gray-700">Bonus Actions</h5>
            {config.bonus_actions.map((action, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  bonusCompleted.has(index)
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => handleBonusToggle(index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    bonusCompleted.has(index)
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300'
                  }`}>
                    {bonusCompleted.has(index) && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-800">{action}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resources */}
        {config.resources && config.resources.length > 0 && (
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-700 mb-2">Helpful Resources</h5>
            <div className="space-y-1">
              {config.resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  📎 {resource.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Contact Form Component
export function ContactForm({ config, onComplete }: { config: ContactFormConfig; onComplete: CompletionCallback }) {
  const [selectedContact, setSelectedContact] = useState<number | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [contacted, setContacted] = useState<Set<number>>(new Set())

  const handleContactSelect = (contactIndex: number) => {
    setSelectedContact(contactIndex)
  }

  const handleTemplateSelect = (templateIndex: number) => {
    setSelectedTemplate(templateIndex)
  }

  const handleMarkContacted = (contactIndex: number) => {
    setContacted(prev => {
      const newSet = new Set(prev)
      newSet.add(contactIndex)
      
      if (newSet.size === config.contacts.length) {
        onComplete(true, { contactedAll: true, contacted: Array.from(newSet) })
      }
      
      return newSet
    })
  }

  const generateEmailLink = (contact: any, template: any) => {
    const email = contact.email
    const subject = encodeURIComponent(template.subject)
    const body = encodeURIComponent(template.body)
    return `mailto:${email}?subject=${subject}&body=${body}`
  }

  const progress = (contacted.size / config.contacts.length) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Mail className="h-5 w-5 inline mr-2" />
          Contact Your Representatives
        </CardTitle>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-gray-600">
          {contacted.size} of {config.contacts.length} contacts reached
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Contacts List */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Who to Contact</h4>
          <div className="space-y-2">
            {config.contacts.map((contact, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedContact === index
                    ? 'border-blue-300 bg-blue-50'
                    : contacted.has(index)
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => handleContactSelect(index)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">{contact.name}</h5>
                    <p className="text-sm text-gray-600">{contact.role}</p>
                  </div>
                  {contacted.has(index) && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                
                {contact.email && (
                  <p className="text-sm text-blue-600 mt-1">{contact.email}</p>
                )}
                {contact.phone && (
                  <p className="text-sm text-gray-600 mt-1">📞 {contact.phone}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Templates */}
        {config.templates && config.templates.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Message Templates</h4>
            <div className="space-y-2">
              {config.templates.map((template, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedTemplate === index
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleTemplateSelect(index)}
                >
                  <h5 className="font-medium text-gray-900">{template.name}</h5>
                  <p className="text-sm text-gray-600 mt-1">Subject: {template.subject}</p>
                  {selectedTemplate === index && (
                    <div className="mt-2 p-2 bg-white rounded border">
                      <p className="text-sm text-gray-800">{template.body}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Actions */}
        {selectedContact !== null && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">
              Contact {config.contacts[selectedContact].name}
            </h5>
            
            <div className="space-y-2">
              {config.contacts[selectedContact].email && (
                <div>
                  <strong>Email:</strong>
                  {selectedTemplate !== null ? (
                    <a
                      href={generateEmailLink(config.contacts[selectedContact], config.templates[selectedTemplate])}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      Send with template
                    </a>
                  ) : (
                    <a
                      href={`mailto:${config.contacts[selectedContact].email}`}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      {config.contacts[selectedContact].email}
                    </a>
                  )}
                </div>
              )}
              
              {config.contacts[selectedContact].phone && (
                <div>
                  <strong>Phone:</strong>
                  <a
                    href={`tel:${config.contacts[selectedContact].phone}`}
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    {config.contacts[selectedContact].phone}
                  </a>
                </div>
              )}
              
              {config.contacts[selectedContact].website && (
                <div>
                  <strong>Website:</strong>
                  <a
                    href={config.contacts[selectedContact].website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    Visit website →
                  </a>
                </div>
              )}
            </div>
            
            <Button
              onClick={() => handleMarkContacted(selectedContact)}
              disabled={contacted.has(selectedContact)}
              className="mt-3"
              size="sm"
            >
              {contacted.has(selectedContact) ? 'Already Contacted' : 'Mark as Contacted'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 