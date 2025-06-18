"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Gift, Share2, RefreshCw, ExternalLink, Copy, Check } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  const [isCheckingDonation, setIsCheckingDonation] = useState(false)
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [creditsToGift, setCreditsToGift] = useState(5)
  const [giftLinks, setGiftLinks] = useState<GiftLink[]>([])
  const [isLoadingLinks, setIsLoadingLinks] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Cache key for donation status
  const CACHE_KEY = `donation-status-${user?.id}`
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Load cached donation status on mount
  useEffect(() => {
    if (user) {
      loadGiftLinks()
      
      // Try to load cached donation status
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const parsedCache: DonationStatus = JSON.parse(cached)
          // Check if cache is still valid
          if (Date.now() - parsedCache.lastChecked < CACHE_DURATION) {
            setDonationStatus(parsedCache)
            return
          }
        } catch (error) {
          console.warn('Failed to parse cached donation status:', error)
        }
      }
    }
  }, [user])

  const checkDonationStatus = async () => {
    if (!user?.email) return

    setIsCheckingDonation(true)
    try {
      const response = await fetch('/api/auth/grant-donation-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          emailConfirmed: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        const status: DonationStatus = {
          hasAccess: !!result.accessTier,
          donationAmount: result.donationAmount,
          accessTier: result.accessTier,
          lastChecked: Date.now()
        }
        
        setDonationStatus(status)
        
        // Cache the result
        localStorage.setItem(CACHE_KEY, JSON.stringify(status))
        
        if (status.hasAccess) {
          toast({
            title: "Donation Status Verified! ✅",
            description: `You have ${status.accessTier} access from your $${status.donationAmount} donation.`,
          })
        } else {
          toast({
            title: "No Donation Found",
            description: "We couldn't find a qualifying donation ($25+) associated with your email.",
          })
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Error checking donation status:', error)
      toast({
        title: "Check Failed",
        description: "Unable to verify donation status. Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsCheckingDonation(false)
    }
  }

  const loadGiftLinks = async () => {
    if (!user) return

    setIsLoadingLinks(true)
    try {
      const response = await fetch('/api/shareable-gift-links')
      if (response.ok) {
        const data = await response.json()
        setGiftLinks(data.links || [])
      }
    } catch (error) {
      console.error('Error loading gift links:', error)
    } finally {
      setIsLoadingLinks(false)
    }
  }

  const createGiftLink = async () => {
    if (!user || !donationStatus?.hasAccess) return

    setIsCreatingLink(true)
    try {
      const response = await fetch('/api/shareable-gift-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits: creditsToGift
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Gift Link Created! 🎁",
          description: `Created a link with ${creditsToGift} credits to share.`,
        })
        
        // Reload gift links
        await loadGiftLinks()
        
        // Reset form
        setCreditsToGift(5)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create gift link')
      }
    } catch (error) {
      console.error('Error creating gift link:', error)
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Unable to create gift link.",
        variant: "destructive"
      })
    } finally {
      setIsCreatingLink(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    const url = `${window.location.origin}/gift/${code}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
      toast({
        title: "Link Copied! 📋",
        description: "Gift link copied to clipboard.",
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: "Copy Failed",
        description: "Unable to copy link. Please copy manually.",
        variant: "destructive"
      })
    }
  }

  const bustCache = () => {
    localStorage.removeItem(CACHE_KEY)
    setDonationStatus(null)
    toast({
      title: "Cache Cleared",
      description: "Donation status cache has been cleared. Click 'Check Status' to refresh.",
    })
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gift Credits
          </CardTitle>
          <CardDescription>
            Sign in to check your donation status and create gift links.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Donation Status Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gift Credits Access
          </CardTitle>
          <CardDescription>
            Check if your donation qualifies you to create gift links for others.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!donationStatus ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                Click below to check if you have donation-based access to create gift links.
              </p>
              <Button 
                onClick={checkDonationStatus} 
                disabled={isCheckingDonation}
                className="w-full sm:w-auto"
              >
                {isCheckingDonation ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  'Check Donation Status'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={donationStatus.hasAccess ? "default" : "secondary"}>
                    {donationStatus.hasAccess ? "✅ Access Granted" : "❌ No Access"}
                  </Badge>
                  {donationStatus.hasAccess && donationStatus.accessTier && (
                    <Badge variant="outline">
                      {donationStatus.accessTier === 'lifetime' ? '🏆 Lifetime' : '📅 Annual'}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={bustCache}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Clear cache and recheck
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={checkDonationStatus}
                    disabled={isCheckingDonation}
                  >
                    {isCheckingDonation ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Recheck'
                    )}
                  </Button>
                </div>
              </div>
              
              {donationStatus.hasAccess && donationStatus.donationAmount && (
                <p className="text-sm text-muted-foreground">
                  Thank you for your ${donationStatus.donationAmount} donation! 
                  You can create gift links to share CivicSense access with others.
                </p>
              )}
              
              {!donationStatus.hasAccess && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    To create gift links, you need to have made a qualifying donation ($25+).
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/donate" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Make a Donation
                    </a>
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Last checked: {new Date(donationStatus.lastChecked).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Gift Link */}
      {donationStatus?.hasAccess && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Create Gift Link
            </CardTitle>
            <CardDescription>
              Create a shareable link that gives others free access to CivicSense.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Credits to Gift</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                max="50"
                value={creditsToGift}
                onChange={(e) => setCreditsToGift(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="w-full sm:w-32"
              />
              <p className="text-xs text-muted-foreground">
                Each credit allows 1 quiz attempt. Max 50 credits per link.
              </p>
            </div>
            
            <Button 
              onClick={createGiftLink} 
              disabled={isCreatingLink}
              className="w-full sm:w-auto"
            >
              {isCreatingLink ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Link...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Create Gift Link
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing Gift Links */}
      {donationStatus?.hasAccess && (
        <Card>
          <CardHeader>
            <CardTitle>Your Gift Links</CardTitle>
            <CardDescription>
              Manage and share your created gift links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLinks ? (
              <div className="text-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading gift links...</p>
              </div>
            ) : giftLinks.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No gift links created yet. Create one above to get started!
              </p>
            ) : (
              <div className="space-y-3">
                {giftLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {link.code}
                        </code>
                        <Badge variant={link.is_active ? "default" : "secondary"}>
                          {link.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {link.used_credits}/{link.credits} credits used • 
                        Created {new Date(link.created_at).toLocaleDateString()}
                        {link.expires_at && ` • Expires ${new Date(link.expires_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(link.code)}
                      disabled={!link.is_active}
                    >
                      {copiedCode === link.code ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 