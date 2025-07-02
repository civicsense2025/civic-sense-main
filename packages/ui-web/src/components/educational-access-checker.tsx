"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { GraduationCap, Check, X, Loader2, AlertCircle } from 'lucide-react'
import { useEducationalAccess } from '@civicsense/shared/hooks/useEducationalAccess'
import { useAuth } from '@/components/auth/auth-provider'
import { formatDistanceToNow } from 'date-fns'

export function EducationalAccessChecker() {
  const { user } = useAuth()
  const { 
    isChecking, 
    hasAccess, 
    lastChecked, 
    error, 
    checkEducationalAccess, 
    reset,
    canCheck 
  } = useEducationalAccess()
  
  const [customEmail, setCustomEmail] = useState('')
  const [useCustomEmail, setUseCustomEmail] = useState(false)

  const handleCheck = async () => {
    const emailToUse = useCustomEmail ? customEmail : user?.email
    await checkEducationalAccess(emailToUse)
  }

  const handleReset = () => {
    reset()
    setCustomEmail('')
    setUseCustomEmail(false)
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">
            Please sign in to check educational access
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          Educational Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Students and faculty at educational institutions can get free premium access with a verified .edu email address.
        </div>

        {/* Current Status */}
        {hasAccess !== null && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
            {hasAccess ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-700 dark:text-green-400 font-medium">
                  Educational access verified
                </span>
              </>
            ) : (
              <>
                <X className="h-4 w-4 text-red-600" />
                <span className="text-red-700 dark:text-red-400 font-medium">
                  Educational access not verified
                </span>
              </>
            )}
            {lastChecked && (
              <Badge variant="outline" className="ml-auto">
                Checked {formatDistanceToNow(lastChecked, { addSuffix: true })}
              </Badge>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700 dark:text-red-400 text-sm">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Email Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="use-account-email"
              checked={!useCustomEmail}
              onChange={() => setUseCustomEmail(false)}
              className="w-4 h-4 text-blue-600"
            />
            <Label htmlFor="use-account-email" className="flex-1">
              Use account email: <span className="font-mono text-sm">{user.email}</span>
              {user.email && !user.email.toLowerCase().includes('.edu') && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Not .edu
                </Badge>
              )}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="use-custom-email"
              checked={useCustomEmail}
              onChange={() => setUseCustomEmail(true)}
              className="w-4 h-4 text-blue-600"
            />
            <Label htmlFor="use-custom-email">
              Use different .edu email
            </Label>
          </div>

          {useCustomEmail && (
            <div className="ml-6 space-y-2">
              <Input
                type="email"
                placeholder="your.name@university.edu"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="max-w-sm"
              />
              <p className="text-xs text-slate-500">
                Must be a valid .edu email address
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleCheck}
            disabled={isChecking || (!canCheck && !useCustomEmail) || (useCustomEmail && !customEmail.toLowerCase().includes('.edu'))}
            className="flex items-center gap-2"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <GraduationCap className="h-4 w-4" />
                Check Educational Access
              </>
            )}
          </Button>

          {(hasAccess !== null || error) && (
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-slate-500 dark:text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
          <p className="mb-1">
            <strong>Eligible institutions:</strong> Universities, colleges, and K-12 schools with .edu email addresses
          </p>
          <p>
            <strong>What you get:</strong> Free premium access including unlimited quizzes, analytics, and all features
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 