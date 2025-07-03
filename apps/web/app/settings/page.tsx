"use client"

import { useState, useEffect } from "react"
import { useAuth } from '@civicsense/ui-web'
import { usePremium } from "@civicsense/business-logic/hooks/usePremium"
import { useLazyVoices } from "@civicsense/business-logic/hooks/useLazyVoices"
import { PremiumSubscriptionCard } from "@civicsense/ui-web/components/premium-subscription-card"
import { UserMenu } from "@civicsense/ui-web/components/auth/user-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@civicsense/ui-web'
import { Button } from '@civicsense/ui-web'
import { Input } from '@civicsense/ui-web'
import { Label } from '@civicsense/ui-web'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@civicsense/ui-web/components/ui/tabs"
import { Badge } from '@civicsense/ui-web'
import { Separator } from "@civicsense/ui-web/components/ui/separator"
import { Switch } from "@civicsense/ui-web/components/ui/switch"
import { Slider } from "@civicsense/ui-web/components/ui/slider"
import { Alert, AlertDescription } from "@civicsense/ui-web/components/ui/alert"
import { 
  User, Settings, Crown, Bell, Shield, Download,
  Mail, Calendar, CreditCard, Key, Trash2,
  ArrowLeft, Save, AlertCircle, CheckCircle,
  Moon, Sun, Globe, Smartphone, Lock,
  Accessibility, Volume2, Eye, Type, Headphones,
  RefreshCw, Play
} from "lucide-react"
import { EducationalAccessChecker } from "@civicsense/ui-web/components/educational-access-checker"
import { LanguageSwitcher } from "@civicsense/ui-web/components/language-switcher"
import { cn } from '@civicsense/ui-web'
import { useTheme } from "next-themes"
import Link from "next/link"
import { GiftCreditsDashboard } from "./gift-credits-dashboard"
import { LanguageSettings } from "@civicsense/ui-web/components/language-settings"
import { redirect } from 'next/navigation'
import { createClient } from '@civicsense/business-logic/database/server'
import { SignOutButton } from '../protected/sign-out-button'

interface UserPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
  achievementAlerts: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  // Accessibility preferences
  accessibilityEnabled: boolean
  audioEnabled: boolean
  autoPlayQuestions: boolean
  autoPlayAnswers: boolean
  speechRate: number
  speechPitch: number
  speechVolume: number
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  keyboardShortcuts: boolean
  extendedTimeouts: boolean
  confirmActions: boolean
  // Platform preferences
  emailDeliveryFrequency: 'immediate' | 'daily' | 'weekly' | 'monthly' | 'never'
  emailFormat: 'html' | 'text' | 'mixed'
  socialSharingEnabled: boolean
  autoShareAchievements: boolean
  allowDataAnalytics: boolean
  allowPersonalization: boolean
  exportFormat: 'json' | 'csv' | 'pdf'
  integrationSync: boolean
  notificationChannels: string[]
  dataRetentionPeriod: '1year' | '2years' | '5years' | 'forever'
  marketingEmails: boolean
  productUpdates: boolean
  communityDigest: boolean
  surveyInvitations: boolean
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              User ID
            </label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{user.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Sign In
            </label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">
              {new Date(user.last_sign_in_at || '').toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Account</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
              Sign Out
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sign out of your account on this device.
            </p>
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  )
}