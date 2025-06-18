"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Check, 
  X, 
  User,
  Clock,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/hooks/use-toast'

interface JoinRequest {
  id: string
  pod_id: string
  requester_id: string
  message: string | null
  requester_age: number | null
  status: 'pending' | 'approved' | 'denied' | 'expired'
  created_at: string
  expires_at: string
  learning_pods: {
    pod_name: string
    pod_type: string
  }
}

interface JoinRequestNotificationsProps {
  className?: string
}

export function JoinRequestNotifications({ className }: JoinRequestNotificationsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    if (user) {
      loadJoinRequests()
      // Poll for new requests every 30 seconds
      const interval = setInterval(loadJoinRequests, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const loadJoinRequests = async () => {
    try {
      const response = await fetch('/api/learning-pods/join-requests')
      const data = await response.json()
      
      if (response.ok) {
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Failed to load join requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequest = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      const response = await fetch(`/api/learning-pods/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: `Request ${action}d`,
          description: `The join request has been ${action}d.`,
        })
        loadJoinRequests()
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${action} request`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error(`Failed to ${action} request:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} request`,
        variant: "destructive"
      })
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')

  if (isLoading || pendingRequests.length === 0) {
    return null
  }

  return (
    <div className={cn("relative", className)}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        {pendingRequests.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {pendingRequests.length}
          </span>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowNotifications(false)}
          />
          
          {/* Notifications Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-medium text-slate-900 dark:text-white">
                Join Requests
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            Join request for {request.learning_pods.pod_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            {new Date(request.created_at).toLocaleDateString()}
                            {request.requester_age && (
                              <>
                                <span>•</span>
                                <span>Age {request.requester_age}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-0">
                        Pending
                      </Badge>
                    </div>

                    {request.message && (
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-600 dark:text-slate-400 font-light">
                          "{request.message}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRequest(request.id, 'approve')}
                        className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 font-light"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequest(request.id, 'deny')}
                        className="h-8 px-3 font-light border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 