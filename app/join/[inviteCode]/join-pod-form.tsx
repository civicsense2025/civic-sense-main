"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Shield, 
  Clock, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Calendar,
  UserCheck
} from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/hooks/use-toast'

interface InviteInfo {
  podId: string
  podName: string
  podType: string
  familyName?: string
  description?: string
  requiresApproval: boolean
  ageRestrictions: any
  allowedRoles: string[]
  usageInfo: {
    currentUses: number
    maxUses?: number
    expiresAt: string
  }
}

interface JoinPodFormProps {
  inviteCode: string
}

export function JoinPodForm({ inviteCode }: JoinPodFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [age, setAge] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadInviteInfo()
  }, [inviteCode])

  const loadInviteInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/join/${inviteCode}`)
      const data = await response.json()
      
      if (response.ok && data.valid) {
        setInviteInfo(data.invite)
      } else {
        setError(data.error || 'Invalid invite link')
      }
    } catch (err) {
      setError('Failed to load invite information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinPod = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join a learning pod.",
        variant: "destructive"
      })
      return
    }

    if (!inviteInfo) return

    // Validate age restrictions
    if (inviteInfo.ageRestrictions && Object.keys(inviteInfo.ageRestrictions).length > 0 && !age) {
      toast({
        title: "Age required",
        description: "Please enter your age to join this pod.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsJoining(true)
      
      const response = await fetch(`/api/join/${inviteCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: age ? parseInt(age) : undefined,
          message
        })
      })

      const data = await response.json()
      
      if (data.success) {
        if (data.requiresApproval) {
          toast({
            title: "Join request submitted!",
            description: data.message,
          })
          router.push('/dashboard')
        } else {
          toast({
            title: "Successfully joined!",
            description: data.message,
          })
          router.push(`/learning-pods/${data.podId}`)
        }
      } else {
        toast({
          title: "Failed to join pod",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (err) {
      toast({
        title: "Error joining pod",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsJoining(false)
    }
  }

  const getPodTypeIcon = (type: string) => {
    const typeMap: Record<string, string> = {
      'family': '👨‍👩‍👧‍👦',
      'friends': '👥',
      'classroom': '🏫',
      'study_group': '📚',
      'campaign': '🗳️',
      'organization': '🏢',
      'book_club': '📖',
      'debate_team': '⚖️'
    }
    return typeMap[type] || '👥'
  }

  const formatPodType = (type: string) => {
    const formatMap: Record<string, string> = {
      'family': 'Family',
      'friends': 'Friends',
      'classroom': 'Classroom',
      'study_group': 'Study Group',
      'campaign': 'Political Campaign',
      'organization': 'Organization',
      'book_club': 'Book Club',
      'debate_team': 'Debate Team'
    }
    return formatMap[type] || type
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading invite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invite</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!inviteInfo) return null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Join Learning Pod</h1>
        <p className="text-muted-foreground">
          You've been invited to join a learning pod!
        </p>
      </div>

      {/* Pod Information */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getPodTypeIcon(inviteInfo.podType)}</span>
            <div>
              <CardTitle className="text-xl">{inviteInfo.podName}</CardTitle>
              {inviteInfo.familyName && (
                <p className="text-muted-foreground">{inviteInfo.familyName}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {formatPodType(inviteInfo.podType)}
            </Badge>
            {inviteInfo.requiresApproval && (
              <Badge variant="outline" className="gap-1">
                <UserCheck className="h-3 w-3" />
                Requires Approval
              </Badge>
            )}
          </div>

          {inviteInfo.description && (
            <div>
              <h4 className="font-medium mb-2">About this pod:</h4>
              <p className="text-muted-foreground">{inviteInfo.description}</p>
            </div>
          )}

          {/* Age Restrictions */}
          {inviteInfo.ageRestrictions && Object.keys(inviteInfo.ageRestrictions).length > 0 && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Age Requirements:</strong>
                {inviteInfo.ageRestrictions.min_age && (
                  <span> Minimum age: {inviteInfo.ageRestrictions.min_age}</span>
                )}
                {inviteInfo.ageRestrictions.max_age && (
                  <span> Maximum age: {inviteInfo.ageRestrictions.max_age}</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Usage Information */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {inviteInfo.usageInfo.currentUses}
                {inviteInfo.usageInfo.maxUses && `/${inviteInfo.usageInfo.maxUses}`} uses
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Expires {new Date(inviteInfo.usageInfo.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Join Form */}
      {user ? (
        <Card>
          <CardHeader>
            <CardTitle>Join Pod</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Age Input (if required) */}
            {inviteInfo.ageRestrictions && Object.keys(inviteInfo.ageRestrictions).length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                />
                <p className="text-xs text-muted-foreground">
                  Required to verify age restrictions for this pod
                </p>
              </div>
            )}

            {/* Message (if approval required) */}
            {inviteInfo.requiresApproval && (
              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the pod organizers why you'd like to join..."
                  rows={3}
                />
              </div>
            )}

            {/* Join Button */}
            <Button 
              onClick={handleJoinPod}
              disabled={isJoining}
              className="w-full gap-2"
              size="lg"
            >
              {isJoining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {inviteInfo.requiresApproval ? 'Submitting Request...' : 'Joining Pod...'}
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  {inviteInfo.requiresApproval ? 'Request to Join' : 'Join Pod'}
                </>
              )}
            </Button>

            {inviteInfo.requiresApproval && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  This pod requires approval to join. Your request will be reviewed by the pod organizers.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
            <p className="text-muted-foreground mb-6">
              You need to sign in to join this learning pod.
            </p>
            <Button onClick={() => router.push('/login')} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Sign In to Join
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 