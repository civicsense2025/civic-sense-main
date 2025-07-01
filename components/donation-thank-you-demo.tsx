"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Heart, CheckCircle, Download, Share2 } from 'lucide-react'

interface DonationThankYouDemoProps {
  amount?: number
  donorName?: string
  isRecurring?: boolean
}

export function DonationThankYouDemo({ 
  amount = 25, 
  donorName = "Democracy Champion",
  isRecurring = false 
}: DonationThankYouDemoProps) {
  const [showReceipt, setShowReceipt] = useState(false)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="text-center">
        <CardHeader className="space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold mb-2">
              Thank You, {donorName}!
            </CardTitle>
            <p className="text-muted-foreground">
              Your ${amount} {isRecurring ? 'monthly ' : ''}donation helps strengthen democracy
            </p>
          </div>

          {isRecurring && (
            <Badge variant="secondary" className="w-fit mx-auto">
              <Heart className="w-4 h-4 mr-1" />
              Monthly Supporter
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-primary/5 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Your Impact</h3>
            <p className="text-sm text-muted-foreground">
              This donation will help educate approximately{' '}
              <span className="font-semibold text-primary">
                {Math.round(amount * 4)} citizens
              </span>{' '}
              about how government actually works.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowReceipt(!showReceipt)}
            >
              <Download className="w-4 h-4 mr-2" />
              Receipt
            </Button>
            
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {showReceipt && (
            <div className="bg-muted/50 rounded-lg p-4 text-left text-sm">
              <h4 className="font-semibold mb-2">Donation Receipt</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>${amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span>{isRecurring ? 'Monthly Recurring' : 'One-time'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax Deductible:</span>
                  <span>Yes</span>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            You will receive a confirmation email shortly with your receipt and details.
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 