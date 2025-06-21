"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase"

interface DonationStatus {
  hasAccess: boolean
  donationAmount?: number
  accessTier?: 'annual' | 'lifetime'
  lastChecked: number
}

interface GiftLink {
  id: string
  code: string
  credits: number
  used_credits: number
  created_at: string
  expires_at: string | null
  is_active: boolean
}

export function GiftCreditsDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [donationStatus, setDonationStatus] = useState<DonationStatus | null>(null)
  const [giftLinks, setGiftLinks] = useState<GiftLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isCopied, setIsCopied] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (user) {
      checkDonationStatus()
      loadGiftLinks()
    }
  }, [user])

  const checkDonationStatus = async () => {
    try {
      // Check local cache first
      const cachedStatus = localStorage.getItem('donationStatus')
      if (cachedStatus) {
        const parsed = JSON.parse(cachedStatus)
        const cacheAge = Date.now() - parsed.lastChecked
        
        // Use cache if less than 1 hour old
        if (cacheAge < 3600000) {
          setDonationStatus(parsed)
          return
        }
      }

      // TODO: Implement user_donations table and uncomment this
      // Check donation status from database
      // const { data: donations } = await supabase
      //   .from('user_donations')
      //   .select('amount, tier')
      //   .eq('user_id', user?.id)
      //   .order('created_at', { ascending: false })
      //   .limit(1)
      //   .single()

      const status: DonationStatus = {
        hasAccess: true, // Temporarily allow access for testing
        lastChecked: Date.now()
      }

      // TODO: Restore when user_donations table exists
      // if (donations) {
      //   status.donationAmount = donations.amount
      //   status.accessTier = donations.tier
      //   status.hasAccess = donations.amount >= 100 // $100 minimum for gift access
      // }

      // Update cache
      localStorage.setItem('donationStatus', JSON.stringify(status))
      setDonationStatus(status)

    } catch (error) {
      console.error('Error checking donation status:', error)
      toast({
        title: 'Error checking donation status',
        description: 'Please try again later',
        variant: 'destructive'
      })
    }
  }

  const loadGiftLinks = async () => {
    try {
      setIsLoading(true)
      const { data: links } = await supabase
        .from('shareable_gift_links')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false })

      setGiftLinks(links || [])
    } catch (error) {
      console.error('Error loading gift links:', error)
      toast({
        title: 'Error loading gift links',
        description: 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createGiftLink = async () => {
    if (!user || isCreating) return

    try {
      setIsCreating(true)

      // Generate unique code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()

      const { data: newLink, error } = await supabase
        .from('shareable_gift_links')
        .insert({
          created_by: user.id,
          link_code: code,
          credits_remaining: 1,
          total_credits: 1,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      setGiftLinks(prev => [newLink, ...prev])
      toast({
        title: 'Gift link created',
        description: 'Share the code with someone to give them access'
      })

    } catch (error) {
      console.error('Error creating gift link:', error)
      toast({
        title: 'Error creating gift link',
        description: 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(prev => ({ ...prev, [code]: true }))
      setTimeout(() => {
        setIsCopied(prev => ({ ...prev, [code]: false }))
      }, 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: 'Error copying code',
        description: 'Please try copying manually',
        variant: 'destructive'
      })
    }
  }

  const bustCache = () => {
    localStorage.removeItem('donationStatus')
    checkDonationStatus()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!donationStatus?.hasAccess) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-light text-slate-900 dark:text-white mb-4">
            Gift Credits Access
          </h2>
          <p className="text-slate-600 dark:text-slate-400 font-light mb-6">
            Check if your donation qualifies you to create gift links for others.
          </p>
          <Button onClick={checkDonationStatus}>
            Check Donation Status
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light text-slate-900 dark:text-white">
            Your Gift Links
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-light mt-1">
            Share these codes to give others access
          </p>
        </div>
        <Button onClick={createGiftLink} disabled={isCreating}>
          Create New Link
        </Button>
      </div>

      <div className="space-y-4">
        {giftLinks.map(link => (
          <Card key={link.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-lg text-slate-900 dark:text-white">
                    {link.code}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-light mt-1">
                    Created {new Date(link.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(link.code)}
                >
                  {isCopied[link.code] ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 