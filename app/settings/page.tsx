"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { useLazyVoices } from "@/hooks/useLazyVoices"
import { PremiumSubscriptionCard } from "@/components/premium-subscription-card"
import { UserMenu } from "@/components/auth/user-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, Settings, Crown, Bell, Shield, Download,
  Mail, Calendar, CreditCard, Key, Trash2,
  ArrowLeft, Save, AlertCircle, CheckCircle,
  Moon, Sun, Globe, Smartphone, Lock,
  Accessibility, Volume2, Eye, Type, Headphones,
  RefreshCw, Play
} from "lucide-react"
import { EducationalAccessChecker } from "@/components/educational-access-checker"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import Link from "next/link"
import { GiftCreditsDashboard } from "./gift-credits-dashboard"
import { LanguageSettings } from "@/components/language-settings"

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

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { subscription, isPremium, isPro, hasFeatureAccess } = usePremium()
  const { theme, setTheme } = useTheme()
  const { voices, isLoaded: voicesLoaded, isLoading: voicesLoading, loadVoices, error: voicesError } = useLazyVoices()
  const [activeTab, setActiveTab] = useState("account")
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    achievementAlerts: true,
    theme: 'system',
    language: 'en',
    timezone: 'America/New_York',
    // Accessibility defaults
    accessibilityEnabled: false,
    audioEnabled: true,
    autoPlayQuestions: false,
    autoPlayAnswers: false,
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 0.8,
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    keyboardShortcuts: true,
    extendedTimeouts: false,
    confirmActions: false,
    // Platform defaults
    emailDeliveryFrequency: 'immediate',
    emailFormat: 'html',
    socialSharingEnabled: true,
    autoShareAchievements: true,
    allowDataAnalytics: true,
    allowPersonalization: true,
    exportFormat: 'json',
    integrationSync: true,
    notificationChannels: [],
    dataRetentionPeriod: 'forever',
    marketingEmails: true,
    productUpdates: true,
    communityDigest: true,
    surveyInvitations: true
  })

  const [accountData, setAccountData] = useState({
    displayName: '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Voices are now loaded lazily when user opens voice settings

  // Load preferences from localStorage AND database
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Load local preferences first (for non-email settings)
        const saved = localStorage.getItem('civicsense-preferences')
        if (saved) {
          const parsed = JSON.parse(saved)
          setPreferences(prev => ({ ...prev, ...parsed }))
        }

        // Load email preferences from database if user is authenticated
        if (user) {
          const response = await fetch('/api/user/email-preferences')
          if (response.ok) {
            const { preferences: emailPrefs } = await response.json()
            setPreferences(prev => ({
              ...prev,
              emailNotifications: emailPrefs.email_notifications,
              weeklyDigest: emailPrefs.weekly_digest,
              achievementAlerts: emailPrefs.achievement_alerts,
              emailDeliveryFrequency: emailPrefs.email_delivery_frequency,
              emailFormat: emailPrefs.email_format,
              marketingEmails: emailPrefs.marketing_emails,
              productUpdates: emailPrefs.product_updates,
              communityDigest: emailPrefs.community_digest,
              surveyInvitations: emailPrefs.survey_invitations,
              // Map notification channels properly
              notificationChannels: Array.isArray(emailPrefs.notification_channels) 
                ? emailPrefs.notification_channels 
                : []
            }))
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error)
      }
    }

    loadPreferences()
  }, [user])

  useEffect(() => {
    if (user) {
      setAccountData(prev => ({
        ...prev,
        email: user.email || '',
        displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || ''
      }))
    }
  }, [user])

  const handleSavePreferences = async () => {
    setSaveStatus('saving')
    try {
      // Save email preferences to database
      const response = await fetch('/api/user/email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailNotifications: preferences.emailNotifications,
          weeklyDigest: preferences.weeklyDigest,
          achievementAlerts: preferences.achievementAlerts,
          emailDeliveryFrequency: preferences.emailDeliveryFrequency,
          emailFormat: preferences.emailFormat,
          marketingEmails: preferences.marketingEmails,
          productUpdates: preferences.productUpdates,
          communityDigest: preferences.communityDigest,
          surveyInvitations: preferences.surveyInvitations,
          civicNewsAlerts: preferences.allowDataAnalytics, // Map to appropriate field
          reEngagementEmails: true, // Default for now
          notificationChannels: preferences.notificationChannels
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save email preferences')
      }

      // Save other preferences to localStorage (non-email preferences)
      const localPreferences = {
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        accessibilityEnabled: preferences.accessibilityEnabled,
        audioEnabled: preferences.audioEnabled,
        autoPlayQuestions: preferences.autoPlayQuestions,
        autoPlayAnswers: preferences.autoPlayAnswers,
        speechRate: preferences.speechRate,
        speechPitch: preferences.speechPitch,
        speechVolume: preferences.speechVolume,
        highContrast: preferences.highContrast,
        largeText: preferences.largeText,
        reducedMotion: preferences.reducedMotion,
        keyboardShortcuts: preferences.keyboardShortcuts,
        extendedTimeouts: preferences.extendedTimeouts,
        confirmActions: preferences.confirmActions,
        socialSharingEnabled: preferences.socialSharingEnabled,
        autoShareAchievements: preferences.autoShareAchievements,
        allowDataAnalytics: preferences.allowDataAnalytics,
        allowPersonalization: preferences.allowPersonalization,
        exportFormat: preferences.exportFormat,
        integrationSync: preferences.integrationSync,
        dataRetentionPeriod: preferences.dataRetentionPeriod
      }
      localStorage.setItem('civicsense-preferences', JSON.stringify(localPreferences))
      
      // Apply accessibility settings to document
      if (preferences.accessibilityEnabled) {
        document.documentElement.classList.toggle('high-contrast', preferences.highContrast)
        document.documentElement.classList.toggle('large-text', preferences.largeText)
        document.documentElement.classList.toggle('reduced-motion', preferences.reducedMotion)
      } else {
        document.documentElement.classList.remove('high-contrast', 'large-text', 'reduced-motion')
      }
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleUpdateAccount = async () => {
    setSaveStatus('saving')
    try {
      // In a real app, this would update the user's account via Supabase
      console.log('Updating account:', accountData)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleExportData = async () => {
    if (!hasFeatureAccess('export_data')) {
      alert('Data export is a premium feature. Please upgrade to access this functionality.')
      return
    }

    try {
      // In a real app, this would generate and download user data
      const userData = {
        account: accountData,
        preferences,
        subscription: subscription,
        exportDate: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `civicsense-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const getTierBadge = () => {
    if (isPro) return { text: "PRO", color: "bg-gradient-to-r from-indigo-500 to-purple-500" }
    if (isPremium) return { text: "PREMIUM", color: "bg-gradient-to-r from-blue-500 to-indigo-500" }
    return { text: "FREE", color: "bg-slate-500" }
  }

  const tierBadge = getTierBadge()

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <main className="container py-8">
          <h1 className="text-3xl font-light text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Please sign in to access settings
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="container py-8 space-y-12">
        <h1 className="text-3xl font-light text-slate-900 dark:text-white">
          Settings
        </h1>

        <div className="space-y-8">
          {/* Language Settings */}
          <div className="space-y-4">
            <h2 className="text-2xl font-light text-slate-900 dark:text-white">
              Language & Translation
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6">
              <LanguageSettings />
            </div>
          </div>

          {/* Gift Credits */}
          <div className="space-y-4">
            <h2 className="text-2xl font-light text-slate-900 dark:text-white">
              Gift Credits
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6">
              <GiftCreditsDashboard />
            </div>
          </div>

          {/* Other settings sections */}
        </div>
      </main>
    </div>
  )
}