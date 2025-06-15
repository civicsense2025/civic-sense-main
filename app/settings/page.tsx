"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, Settings, Crown, Bell, Shield, Download,
  Mail, Calendar, CreditCard, Key, Trash2,
  ArrowLeft, Save, AlertCircle, CheckCircle,
  Moon, Sun, Globe, Smartphone, Lock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import Link from "next/link"

interface UserPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
  achievementAlerts: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { subscription, isPremium, isPro, hasFeatureAccess } = usePremium()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("account")
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    achievementAlerts: true,
    theme: 'system',
    language: 'en',
    timezone: 'America/New_York'
  })

  const [accountData, setAccountData] = useState({
    displayName: '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

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
      // In a real app, this would save to your backend
      localStorage.setItem('userPreferences', JSON.stringify(preferences))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
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
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <Card className="max-w-md mx-auto border border-slate-200 dark:border-slate-800">
          <CardContent className="p-8 text-center">
            <Lock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Please sign in to access your account settings.
            </p>
            <Link href="/">
              <Button className="w-full">
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      {/* Clean header matching app/dashboard style */}
      <div className="border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Clean branding */}
            <Link 
              href="/" 
              className="group hover:opacity-70 transition-opacity"
            >
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
                CivicSense
              </h1>
            </Link>
            
            {/* User menu */}
            <UserMenu 
              onSignInClick={() => {}} 
              searchQuery=""
              onSearchChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Main content with consistent spacing */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center space-x-4 mb-2">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
              Account Settings
            </h1>
            <Badge className={cn("text-white border-0", tierBadge.color)}>
              {tierBadge.text}
            </Badge>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your account, subscription, and preferences
          </p>

          {/* Save status alert */}
          {saveStatus !== 'idle' && (
            <Alert className={cn(
              "mt-4 w-auto",
              saveStatus === 'saved' && "border-green-200 bg-green-50 dark:bg-green-950/20",
              saveStatus === 'error' && "border-red-200 bg-red-50 dark:bg-red-950/20"
            )}>
              {saveStatus === 'saving' && <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />}
              {saveStatus === 'saved' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {saveStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
              <AlertDescription className={cn(
                saveStatus === 'saved' && "text-green-800 dark:text-green-200",
                saveStatus === 'error' && "text-red-800 dark:text-red-200"
              )}>
                {saveStatus === 'saving' && 'Saving changes...'}
                {saveStatus === 'saved' && 'Changes saved successfully!'}
                {saveStatus === 'error' && 'Error saving changes. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <TabsTrigger value="account" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
              <Crown className="h-4 w-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
              <Shield className="h-4 w-4 mr-2" />
              Privacy & Data
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Account Information</span>
                </CardTitle>
                <CardDescription>
                  Update your account details and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={accountData.displayName}
                      onChange={(e) => setAccountData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Your display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={accountData.currentPassword}
                        onChange={(e) => setAccountData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={accountData.newPassword}
                        onChange={(e) => setAccountData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="New password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={accountData.confirmPassword}
                        onChange={(e) => setAccountData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={handleUpdateAccount}
                    disabled={saveStatus === 'saving'}
                    className="bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <PremiumSubscriptionCard />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>App Preferences</span>
                </CardTitle>
                <CardDescription>
                  Customize your CivicSense experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Appearance</h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Theme</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Choose your preferred color scheme
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTheme('light')}
                      >
                        <Sun className="h-4 w-4 mr-1" />
                        Light
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTheme('dark')}
                      >
                        <Moon className="h-4 w-4 mr-1" />
                        Dark
                      </Button>
                      <Button
                        variant={theme === 'system' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTheme('system')}
                      >
                        <Smartphone className="h-4 w-4 mr-1" />
                        System
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notification Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Notifications</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Receive updates and reminders via email
                        </p>
                      </div>
                      <Switch
                        checked={preferences.emailNotifications}
                        onCheckedChange={(checked: boolean) => 
                          setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Weekly Digest</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Get a summary of your progress each week
                        </p>
                      </div>
                      <Switch
                        checked={preferences.weeklyDigest}
                        onCheckedChange={(checked: boolean) => 
                          setPreferences(prev => ({ ...prev, weeklyDigest: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Achievement Alerts</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Get notified when you earn new achievements
                        </p>
                      </div>
                      <Switch
                        checked={preferences.achievementAlerts}
                        onCheckedChange={(checked: boolean) => 
                          setPreferences(prev => ({ ...prev, achievementAlerts: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSavePreferences}
                    disabled={saveStatus === 'saving'}
                    className="bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy & Data Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Privacy & Data Management</span>
                </CardTitle>
                <CardDescription>
                  Control your data and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Data Export */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <h4 className="font-semibold">Export Your Data</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Download a copy of all your account data and progress
                    </p>
                    {!hasFeatureAccess('export_data') && (
                      <Badge variant="outline" className="text-xs">
                        Premium Feature
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={handleExportData}
                    variant="outline"
                    disabled={!hasFeatureAccess('export_data')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>

                {/* Account Deletion */}
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-800 dark:text-red-200">Danger Zone</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          // Handle account deletion
                          console.log('Account deletion requested')
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}