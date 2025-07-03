"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Mail, Copy, Check, Plus, Send, BarChart3 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useAuth } from '@civicsense/ui-web'
import { useToast } from '@civicsense/ui-web'
import { GiftCreditsAnalytics } from '@/components/gift-credits-analytics'

interface GiftCredits {
  annual: { total: number; used: number; available: number; totalDonation: number }
  lifetime: { total: number; used: number; available: number; totalDonation: number }
}

interface GiftRedemption {
  id: string
  recipient_email: string
  access_type: 'annual' | 'lifetime'
  gift_message: string | null
  redemption_status: 'pending' | 'claimed' | 'expired'
  redemption_code: string
  expires_at: string
  claimed_at: string | null
  created_at: string
}

export function GiftCreditsManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [giftCredits, setGiftCredits] = useState<GiftCredits | null>(null)
  const [sentGifts, setSentGifts] = useState<GiftRedemption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSendForm, setShowSendForm] = useState(false)
  const [sendingGift, setSendingGift] = useState(false)
  
  // Form state
  const [recipientEmail, setRecipientEmail] = useState('')
  const [accessType, setAccessType] = useState<'annual' | 'lifetime'>('annual')
  const [giftMessage, setGiftMessage] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Load gift credits and sent gifts
  useEffect(() => {
    if (user) {
      loadGiftData()
    }
  }, [user])

  const loadGiftData = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Load gift credits
      const creditsResponse = await fetch(`/api/gift-credits?userId=${user.id}`)
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json()
        setGiftCredits(creditsData.giftCredits)
      }

      // Load sent gifts
      const giftsResponse = await fetch(`/api/gift-redemptions?userId=${user.id}&type=sent`)
      if (giftsResponse.ok) {
        const giftsData = await giftsResponse.json()
        setSentGifts(giftsData.redemptions)
      }
    } catch (error) {
      console.error('Error loading gift data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendGift = async () => {
    if (!user || !recipientEmail || sendingGift) return

    setSendingGift(true)
    try {
      const response = await fetch('/api/gift-redemptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donorUserId: user.id,
          recipientEmail,
          accessType,
          giftMessage: giftMessage || null
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: "Gift sent successfully! 🎁",
          description: `${accessType === 'lifetime' ? 'Lifetime' : 'Annual'} access gift sent to ${recipientEmail}`,
        })

        // Reset form
        setRecipientEmail('')
        setGiftMessage('')
        setShowSendForm(false)
        
        // Reload data
        loadGiftData()
      } else {
        toast({
          title: "Failed to send gift",
          description: result.error || 'Something went wrong',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error sending gift:', error)
      toast({
        title: "Error sending gift",
        description: 'Please try again later',
        variant: "destructive",
      })
    } finally {
      setSendingGift(false)
    }
  }

  const copyRedemptionCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
      toast({
        title: "Code copied!",
        description: "Redemption code copied to clipboard",
      })
    } catch (error) {
      console.error('Error copying code:', error)
    }
  }

  const hasGiftCredits = giftCredits && (giftCredits.annual.available > 0 || giftCredits.lifetime.available > 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="manage" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manage" className="flex items-center gap-2">
          <Gift className="w-4 h-4" />
          Manage Gifts
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Analytics & History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manage" className="space-y-6">
        {/* Gift Credits Overview */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-600" />
            Your Gift Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasGiftCredits ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {giftCredits.annual.available > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-light text-blue-700 dark:text-blue-300">
                      {giftCredits.annual.available}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Annual Access Gifts Available
                    </div>
                    <div className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                      {giftCredits.annual.used} used of {giftCredits.annual.total} total
                    </div>
                  </div>
                )}
                
                {giftCredits.lifetime.available > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl font-light text-purple-700 dark:text-purple-300">
                      {giftCredits.lifetime.available}
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">
                      Lifetime Access Gifts Available
                    </div>
                    <div className="text-xs text-purple-500 dark:text-purple-500 mt-1">
                      {giftCredits.lifetime.used} used of {giftCredits.lifetime.total} total
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => setShowSendForm(!showSendForm)}
                className="w-full md:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Send a Gift
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No gift credits yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Donate $75 or more to earn gift credits and share CivicSense access with others.
              </p>
              <Button
                onClick={() => window.location.href = '/donate'}
                variant="outline"
              >
                Make a Donation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Gift Form */}
      <AnimatePresence>
        {showSendForm && hasGiftCredits && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Send a Gift
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient-email">Recipient Email</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    placeholder="friend@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Access Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={accessType === 'annual' ? 'default' : 'outline'}
                      onClick={() => setAccessType('annual')}
                      disabled={giftCredits?.annual.available === 0}
                      className="flex-1"
                    >
                      Annual ({giftCredits?.annual.available || 0} available)
                    </Button>
                    <Button
                      type="button"
                      variant={accessType === 'lifetime' ? 'default' : 'outline'}
                      onClick={() => setAccessType('lifetime')}
                      disabled={giftCredits?.lifetime.available === 0}
                      className="flex-1"
                    >
                      Lifetime ({giftCredits?.lifetime.available || 0} available)
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gift-message">Personal Message (Optional)</Label>
                  <Textarea
                    id="gift-message"
                    placeholder="I thought you'd enjoy learning about civic engagement with CivicSense!"
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSendGift}
                    disabled={!recipientEmail || sendingGift}
                    className="flex-1"
                  >
                    {sendingGift ? 'Sending...' : 'Send Gift'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSendForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sent Gifts */}
      {sentGifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-slate-600" />
              Sent Gifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentGifts.map((gift) => (
                <div
                  key={gift.id}
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {gift.recipient_email}
                      </span>
                      <Badge variant={gift.redemption_status === 'claimed' ? 'default' : 'secondary'}>
                        {gift.redemption_status}
                      </Badge>
                      <Badge variant="outline">
                        {gift.access_type}
                      </Badge>
                    </div>
                    {gift.gift_message && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        "{gift.gift_message}"
                      </p>
                    )}
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      Sent {new Date(gift.created_at).toLocaleDateString()}
                      {gift.claimed_at && (
                        <span> • Claimed {new Date(gift.claimed_at).toLocaleDateString()}</span>
                      )}
                      {gift.redemption_status === 'pending' && (
                        <span> • Expires {new Date(gift.expires_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  {gift.redemption_status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyRedemptionCode(gift.redemption_code)}
                    >
                      {copiedCode === gift.redemption_code ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </TabsContent>

      <TabsContent value="analytics">
        <GiftCreditsAnalytics />
      </TabsContent>
    </Tabs>
  )
} 