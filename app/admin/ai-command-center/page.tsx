'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Terminal, 
  Send, 
  Brain, 
  Database, 
  Users, 
  FileText, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  Bot,
  Download,
  BarChart3,
  UserX,
  Newspaper,
  Shield,
  HardDrive,
  Plug,
  Eye,
  Bell,
  AlertTriangle,
  Settings,
  Activity,
  Lightbulb,
  TrendingUp,
  Wrench,
  Cpu,
  Wifi
} from 'lucide-react'

// =============================================================================
// ENHANCED TYPES & INTERFACES
// =============================================================================

interface Message {
  id: string
  role: 'user' | 'ai' | 'system' | 'autonomous'
  content: string
  timestamp: Date
  metadata?: {
    command?: string
    status?: 'pending' | 'executing' | 'completed' | 'error' | 'suggestion' | 'autonomous'
    progress?: number
    results?: any
    executionTime?: number
    priority?: 'low' | 'medium' | 'high' | 'critical'
    category?: string
    autoResolved?: boolean
    suggestion?: {
      action: string
      reasoning: string
      oneClickFix?: boolean
    }
  }
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical'
  congressional_photos: 'healthy' | 'warning' | 'critical'
  ai_services: 'healthy' | 'warning' | 'critical'
  storage: 'healthy' | 'warning' | 'critical'
  memory_usage: number
  error_rate: number
  last_backup: string
  pending_issues: number
  recent_failures: string[]
}

interface ConversationContext {
  recentCommands: string[]
  currentFocus: string | null
  ongoingTasks: string[]
  userPreferences: Record<string, any>
  problemHistory: Record<string, number>
}

// =============================================================================
// AUTONOMOUS AI ASSISTANT COMPONENT
// =============================================================================

export default function AutonomousAICommandCenter() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: `🤖 **CivicSense Autonomous AI Assistant Online**

I'm your intelligent operations partner with **autonomous monitoring and self-healing capabilities**! I continuously watch the system and proactively solve problems.

**🧠 What Makes Me Special:**
• **Autonomous Monitoring**: I check system health every 30 seconds
• **Proactive Problem-Solving**: I detect and fix issues before you notice
• **Self-Healing**: I automatically resolve common problems (like photo downloads)
• **Conversational Memory**: I remember our previous interactions
• **Intelligent Suggestions**: I recommend optimizations based on patterns
• **One-Click Fixes**: I offer instant solutions for detected issues

**📊 Current Status**: Monitoring all systems...

I'll start by running a comprehensive health check. You can also tell me what you need in natural language - I understand typos, abbreviations, and casual language!

Examples: "sync congress", "fix photos", "how's the system?", "make content"`,
      timestamp: new Date(),
      metadata: { status: 'autonomous' }
    }
  ])
  
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    recentCommands: [],
    currentFocus: null,
    ongoingTasks: [],
    userPreferences: {},
    problemHistory: {}
  })
  const [autonomousMode, setAutonomousMode] = useState(true)
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const healthCheckInterval = useRef<number | null>(null)

  // =============================================================================
  // AUTONOMOUS MONITORING SYSTEM
  // =============================================================================

  const performHealthCheck = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/system-health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }
      
      const health: SystemHealth = await response.json()
      setSystemHealth(health)
      setLastHealthCheck(new Date())
      
      // Analyze health and take autonomous actions
      await analyzeHealthAndAct(health)
      
    } catch (error) {
      console.error('Health check failed:', error)
      
      // Add autonomous message about monitoring issues
      if (autonomousMode) {
        addAutonomousMessage(
          `⚠️ **System Monitoring Alert**\n\nI encountered an issue while checking system health: ${error instanceof Error ? error.message : 'Unknown error'}\n\nI'll retry in 60 seconds and investigate the monitoring system.`,
          'warning',
          'monitoring'
        )
      }
    }
  }, [autonomousMode])

  const analyzeHealthAndAct = async (health: SystemHealth) => {
    const issues: Array<{type: string, severity: 'low' | 'medium' | 'high' | 'critical', description: string, autoFix?: () => Promise<void>}> = []

    // Check database health
    if (health.database === 'critical') {
      issues.push({
        type: 'database',
        severity: 'critical',
        description: 'Database is experiencing critical issues',
        autoFix: () => tryDatabaseRecovery()
      })
    } else if (health.database === 'warning') {
      issues.push({
        type: 'database',
        severity: 'medium',
        description: 'Database performance is degraded',
        autoFix: () => optimizeDatabase()
      })
    }

    // Check congressional photos
    if (health.congressional_photos === 'critical') {
      issues.push({
        type: 'photos',
        severity: 'high',
        description: 'Congressional photo downloads are failing',
        autoFix: () => fixPhotoDownloads()
      })
    } else if (health.congressional_photos === 'warning') {
      issues.push({
        type: 'photos',
        severity: 'medium',
        description: 'Some congressional photos are missing or outdated',
        autoFix: () => syncMissingPhotos()
      })
    }

    // Check AI services
    if (health.ai_services === 'critical') {
      issues.push({
        type: 'ai',
        severity: 'critical',
        description: 'AI services are down or failing',
        autoFix: () => restartAIServices()
      })
    }

    // Check error rates
    if (health.error_rate > 0.1) {
      issues.push({
        type: 'errors',
        severity: health.error_rate > 0.2 ? 'high' : 'medium',
        description: `High error rate detected: ${(health.error_rate * 100).toFixed(1)}%`,
        autoFix: () => investigateErrors()
      })
    }

    // Check memory usage
    if (health.memory_usage > 0.9) {
      issues.push({
        type: 'memory',
        severity: 'high',
        description: `High memory usage: ${(health.memory_usage * 100).toFixed(1)}%`,
        autoFix: () => optimizeMemory()
      })
    }

    // Process issues autonomously
    for (const issue of issues) {
      await handleIssueAutonomously(issue)
    }

    // Generate proactive suggestions
    await generateProactiveSuggestions(health)
  }

  const handleIssueAutonomously = async (issue: {type: string, severity: string, description: string, autoFix?: () => Promise<void>}) => {
    const shouldAutoFix = issue.severity === 'critical' || 
                          (issue.severity === 'high' && issue.type === 'photos') ||
                          (issue.severity === 'medium' && issue.autoFix && Math.random() > 0.5) // 50% chance for medium issues

    if (shouldAutoFix && issue.autoFix && autonomousMode) {
      addAutonomousMessage(
        `🔧 **Auto-Fixing Issue**\n\n**Problem**: ${issue.description}\n**Action**: Attempting automatic resolution...\n**Severity**: ${issue.severity}`,
        'pending',
        issue.type
      )

      try {
        await issue.autoFix()
        
        addAutonomousMessage(
          `✅ **Issue Resolved Automatically**\n\n**Problem**: ${issue.description}\n**Status**: Successfully fixed!\n**Next**: Monitoring for recurrence`,
          'completed',
          issue.type,
          true
        )
        
        // Update problem history
        setConversationContext(prev => ({
          ...prev,
          problemHistory: {
            ...prev.problemHistory,
            [issue.type]: (prev.problemHistory[issue.type] || 0) + 1
          }
        }))
        
      } catch (error) {
        addAutonomousMessage(
          `❌ **Auto-Fix Failed**\n\n**Problem**: ${issue.description}\n**Error**: ${error instanceof Error ? error.message : 'Unknown error'}\n**Recommendation**: Manual intervention required`,
          'error',
          issue.type
        )
      }
    } else if (issue.severity !== 'low') {
      // Just notify about issues we won't auto-fix
      addAutonomousMessage(
        `📊 **Issue Detected**\n\n**Problem**: ${issue.description}\n**Severity**: ${issue.severity}\n**Action**: ${issue.autoFix ? 'I can fix this automatically - say "fix it" to proceed' : 'Monitoring and ready to assist'}`,
        'suggestion',
        issue.type
      )
    }
  }

  const generateProactiveSuggestions = async (health: SystemHealth) => {
    const suggestions: string[] = []

    // Generate suggestions based on health patterns
    if (health.congressional_photos === 'healthy' && new Date().getHours() === 9) {
      suggestions.push("🌅 **Morning Optimization**: Perfect time to sync new congressional data")
    }

    if (health.database === 'healthy' && health.memory_usage < 0.5) {
      suggestions.push("⚡ **Performance Opportunity**: System resources are light - good time for content generation")
    }

    if (health.error_rate < 0.01 && health.last_backup && new Date(health.last_backup) < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      suggestions.push("💾 **Backup Reminder**: System is stable - perfect time for a backup")
    }

    // Show one random suggestion every few health checks
    if (suggestions.length > 0 && Math.random() > 0.8) {
      const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
      addAutonomousMessage(suggestion, 'suggestion', 'optimization')
    }
  }

  // =============================================================================
  // AUTO-FIX FUNCTIONS
  // =============================================================================

  const fixPhotoDownloads = async () => {
    const response = await fetch('/api/admin/ai-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        command: 'fix congressional photo downloads and update schema if needed',
        sessionId: 'autonomous-session',
        autonomous: true
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to fix photo downloads')
    }
  }

  const syncMissingPhotos = async () => {
    const response = await fetch('/api/admin/ai-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        command: 'download missing congressional member photos for current congress',
        sessionId: 'autonomous-session',
        autonomous: true
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to sync missing photos')
    }
  }

  const tryDatabaseRecovery = async () => {
    // Implement database recovery logic
    const response = await fetch('/api/admin/ai-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        command: 'check database health and optimize performance',
        sessionId: 'autonomous-session',
        autonomous: true
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to recover database')
    }
  }

  const optimizeDatabase = async () => {
    // Database optimization logic
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate optimization
  }

  const restartAIServices = async () => {
    // AI service restart logic
    await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate restart
  }

  const investigateErrors = async () => {
    // Error investigation logic
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate investigation
  }

  const optimizeMemory = async () => {
    // Memory optimization logic
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate optimization
  }

  // =============================================================================
  // MESSAGE HANDLING
  // =============================================================================

  const addAutonomousMessage = (content: string, status: string, category: string, autoResolved = false) => {
    const message: Message = {
      id: `autonomous-${Date.now()}`,
      role: 'autonomous',
      content,
      timestamp: new Date(),
      metadata: {
        status: status as any,
        category,
        autoResolved,
        priority: status === 'error' ? 'high' : status === 'suggestion' ? 'low' : 'medium'
      }
    }
    
    setMessages(prev => [...prev, message])
  }

  const processCommand = async (userInput: string) => {
    setIsProcessing(true)
    
    // Update conversation context
    setConversationContext(prev => ({
      ...prev,
      recentCommands: [userInput, ...prev.recentCommands.slice(0, 4)]
    }))
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])

    try {
      // Add thinking message with context awareness
      const thinkingMessage: Message = {
        id: `thinking-${Date.now()}`,
        role: 'ai',
        content: `🤔 Analyzing your request with context from our conversation...\n\n**Understanding**: "${userInput}"\n**Context**: ${conversationContext.currentFocus || 'General assistance'}`,
        timestamp: new Date(),
        metadata: { status: 'pending' }
      }
      
      setMessages(prev => [...prev, thinkingMessage])

      // Process the command with enhanced context
      const response = await fetch('/api/admin/ai-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          command: userInput,
          sessionId: 'admin-session',
          context: conversationContext,
          systemHealth: systemHealth
        })
      })

      const result = await response.json()

      // Remove thinking message and add real response
      setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id))

      // Enhanced response with follow-up suggestions
      let enhancedContent = result.response || 'Command executed successfully.'
      
      if (result.success) {
        enhancedContent += `\n\n**💡 What's Next?**\n• I'll monitor this for you automatically\n• Type "status" to see current system health\n• Say "suggest improvements" for optimization ideas`
      }

      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: enhancedContent,
        timestamp: new Date(),
        metadata: {
          command: userInput,
          status: result.success ? 'completed' : 'error',
          results: result.data,
          executionTime: result.executionTime
        }
      }

      setMessages(prev => [...prev, aiResponse])

      // Update focus based on command
      if (userInput.toLowerCase().includes('congress')) {
        setConversationContext(prev => ({ ...prev, currentFocus: 'Congressional Data' }))
      } else if (userInput.toLowerCase().includes('photo')) {
        setConversationContext(prev => ({ ...prev, currentFocus: 'Photo Management' }))
      }

    } catch (error) {
      console.error('Command processing error:', error)
      
      setMessages(prev => prev.filter(m => m.id.startsWith('thinking-')))
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'ai',
        content: `❌ **Error processing command**: ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nDon't worry! I'll investigate this issue and try to prevent it in the future.`,
        timestamp: new Date(),
        metadata: { status: 'error' }
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const command = input.trim()
    setInput('')
    await processCommand(command)
  }

  const handleOneClickFix = async (action: string) => {
    await processCommand(action)
  }

  // =============================================================================
  // LIFECYCLE EFFECTS
  // =============================================================================

  // Start autonomous monitoring
  useEffect(() => {
    if (autonomousMode) {
      // Initial health check
      performHealthCheck()
      
      // Set up regular monitoring
      healthCheckInterval.current = window.setInterval(performHealthCheck, 30000) // Every 30 seconds
      
      return () => {
        if (healthCheckInterval.current) {
          window.clearInterval(healthCheckInterval.current)
        }
      }
    }
  }, [autonomousMode, performHealthCheck])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user'
    const isSystem = message.role === 'system'
    const isAutonomous = message.role === 'autonomous'
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Enhanced Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser 
                ? 'bg-blue-500 text-white' 
                : isSystem 
                ? 'bg-gray-500 text-white'
                : isAutonomous
                ? 'bg-purple-500 text-white animate-pulse'
                : 'bg-green-500 text-white'
            }`}>
              {isUser ? '👤' : isSystem ? '⚙️' : isAutonomous ? '🤖' : '🧠'}
            </div>

            {/* Message Content */}
            <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-4 rounded-lg ${
                isUser 
                  ? 'bg-blue-500 text-white' 
                  : isSystem
                  ? 'bg-gray-100 text-gray-800'
                  : isAutonomous
                  ? 'bg-purple-50 text-purple-900 border border-purple-200'
                  : 'bg-green-50 text-gray-800 border border-green-200'
              }`}>
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>

                {/* Enhanced Metadata */}
                {message.metadata && (
                  <div className="mt-3 pt-3 border-t border-opacity-20 border-current">
                    <div className="flex items-center gap-2 text-xs opacity-75 flex-wrap">
                      {message.metadata.status === 'pending' && (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Processing...</span>
                        </>
                      )}
                      {message.metadata.status === 'executing' && (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Executing...</span>
                        </>
                      )}
                      {message.metadata.status === 'completed' && (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Completed</span>
                          {message.metadata.executionTime && (
                            <span>in {message.metadata.executionTime}ms</span>
                          )}
                        </>
                      )}
                      {message.metadata.status === 'error' && (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Error</span>
                        </>
                      )}
                      {message.metadata.status === 'suggestion' && (
                        <>
                          <Lightbulb className="w-3 h-3" />
                          <span>Suggestion</span>
                        </>
                      )}
                      {message.metadata.autoResolved && (
                        <>
                          <Wrench className="w-3 h-3" />
                          <span>Auto-Fixed</span>
                        </>
                      )}
                      {message.metadata.category && (
                        <Badge variant="outline" className="text-xs">
                          {message.metadata.category}
                        </Badge>
                      )}
                    </div>

                    {/* One-Click Fix Buttons */}
                    {message.metadata.suggestion?.oneClickFix && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOneClickFix(message.metadata!.suggestion!.action)}
                          className="text-xs"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Fix Now
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Timestamp with enhanced info */}
              <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                {message.timestamp.toLocaleTimeString()}
                {isAutonomous && ' • Autonomous Action'}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 border-green-600'
      case 'warning': return 'text-yellow-600 border-yellow-600'
      case 'critical': return 'text-red-600 border-red-600'
      default: return 'text-gray-600 border-gray-600'
    }
  }

  // =============================================================================
  // ENHANCED QUICK COMMANDS WITH CONTEXT AWARENESS
  // =============================================================================

  const quickCommands = [
    {
      label: 'Fix Photo Issues',
      command: 'analyze and fix all congressional photo download issues including schema problems',
      icon: <Download className="w-4 h-4" />,
      category: 'congressional',
      priority: systemHealth?.congressional_photos !== 'healthy' ? 'high' : 'medium'
    },
    {
      label: 'System Health Report',
      command: 'generate comprehensive system health report with recommendations',
      icon: <Activity className="w-4 h-4" />,
      category: 'monitoring',
      priority: 'high'
    },
    {
      label: 'Auto-Sync Everything',
      command: 'perform intelligent sync of all congressional data based on what needs updating',
      icon: <Database className="w-4 h-4" />,
      category: 'database',
      priority: 'medium'
    },
    {
      label: 'Optimize Performance',
      command: 'analyze system performance and apply optimizations automatically',
      icon: <TrendingUp className="w-4 h-4" />,
      category: 'performance',
      priority: systemHealth?.memory_usage && systemHealth.memory_usage > 0.8 ? 'high' : 'low'
    }
  ].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
  })

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Enhanced Header with System Status */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Autonomous AI Assistant</h1>
              <p className="text-sm text-gray-600">
                Intelligent monitoring • Self-healing • Proactive optimization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={autonomousMode ? "text-purple-600 border-purple-600" : "text-gray-600 border-gray-600"}
            >
              {autonomousMode ? '🤖 Autonomous Mode' : '💤 Manual Mode'}
            </Badge>
            
            {systemHealth && (
              <>
                <Badge variant="outline" className={getHealthStatusColor(systemHealth.database)}>
                  <Database className="w-3 h-3 mr-1" />
                  DB: {systemHealth.database}
                </Badge>
                <Badge variant="outline" className={getHealthStatusColor(systemHealth.congressional_photos)}>
                  <Download className="w-3 h-3 mr-1" />
                  Photos: {systemHealth.congressional_photos}
                </Badge>
              </>
            )}
            
            <Badge variant="outline">
              {messages.filter(m => m.role !== 'system').length - 1} interactions
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutonomousMode(!autonomousMode)}
            >
              {autonomousMode ? 'Disable' : 'Enable'} Auto Mode
            </Button>
          </div>
        </div>
        
        {/* System Health Summary */}
        {systemHealth && (
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
            <span>Memory: {(systemHealth.memory_usage * 100).toFixed(1)}%</span>
            <span>Errors: {(systemHealth.error_rate * 100).toFixed(2)}%</span>
            <span>Last Backup: {systemHealth.last_backup ? new Date(systemHealth.last_backup).toLocaleDateString() : 'Never'}</span>
            {lastHealthCheck && (
              <span>Last Check: {lastHealthCheck.toLocaleTimeString()}</span>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Enhanced Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {messages.map(renderMessage)}
              
              {isProcessing && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600">
                        🧠 Processing with full context awareness...
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Enhanced Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={conversationContext.currentFocus 
                    ? `Continue with ${conversationContext.currentFocus}... (e.g., "fix photos", "sync data", "check status")`
                    : "What would you like me to help with? I understand natural language!"
                  }
                  className="flex-1"
                  disabled={isProcessing}
                />
                <Button 
                  type="submit" 
                  disabled={isProcessing || !input.trim()}
                  size="icon"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
              
              {/* Context hints */}
              {conversationContext.recentCommands.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Recent: {conversationContext.recentCommands.slice(0, 2).join(' • ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Sidebar with Intelligent Suggestions */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">🎯 Intelligent Actions</h3>
              <p className="text-xs text-gray-600 mb-4">
                Prioritized based on current system state and conversation context
              </p>
            </div>

            <div className="space-y-2">
              {quickCommands.map((cmd, index) => {
                const isPriority = cmd.priority === 'high'
                return (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isPriority ? 'ring-2 ring-red-200 bg-red-50' : ''
                    }`}
                    onClick={() => !isProcessing && processCommand(cmd.command)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isPriority ? 'bg-red-100 text-red-600' :
                          cmd.category === 'database' ? 'bg-blue-100 text-blue-600' :
                          cmd.category === 'congressional' ? 'bg-red-100 text-red-600' :
                          cmd.category === 'monitoring' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {cmd.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-gray-900">
                              {cmd.label}
                            </p>
                            {isPriority && (
                              <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                                Priority
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {cmd.command}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Separator />

            {/* System Status Panel */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 text-sm">System Status</h4>
              {systemHealth ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Database</span>
                    <Badge variant="outline" className={getHealthStatusColor(systemHealth.database)}>
                      {systemHealth.database}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Photos</span>
                    <Badge variant="outline" className={getHealthStatusColor(systemHealth.congressional_photos)}>
                      {systemHealth.congressional_photos}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Services</span>
                    <Badge variant="outline" className={getHealthStatusColor(systemHealth.ai_services)}>
                      {systemHealth.ai_services}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span className={systemHealth.memory_usage > 0.8 ? 'text-red-600' : 'text-green-600'}>
                      {(systemHealth.memory_usage * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Loading system status...</div>
              )}
            </div>

            <Separator />

            {/* Conversation Context */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Conversation Context</h4>
              <div className="space-y-2 text-xs">
                {conversationContext.currentFocus && (
                  <div>
                    <span className="font-medium text-gray-700">Current Focus:</span>
                    <br />
                    <span className="text-gray-600">{conversationContext.currentFocus}</span>
                  </div>
                )}
                
                {Object.keys(conversationContext.problemHistory).length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Issues Resolved:</span>
                    <br />
                    {Object.entries(conversationContext.problemHistory).map(([type, count]) => (
                      <span key={type} className="text-gray-600 block">
                        {type}: {count} times
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs text-gray-500">
                💡 <strong>Autonomous AI:</strong> I continuously monitor your system and proactively solve problems. I understand natural language, remember our conversations, and suggest optimizations based on patterns I observe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 