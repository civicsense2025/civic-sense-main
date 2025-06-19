import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'

// MailerLite webhook event types
interface MailerLiteWebhookEvent {
  type: 'subscriber.created' | 'subscriber.updated' | 'subscriber.unsubscribed' | 'subscriber.bounced' | 'subscriber.complained' | 'campaign.sent' | 'campaign.opened' | 'campaign.clicked'
  timestamp: string
  data: {
    id: string // message ID or subscriber ID
    email: string
    template?: string
    subject?: string
    url?: string // for click events
    bounce_type?: 'hard' | 'soft'
    reason?: string
    campaign_id?: string
    subscriber_id?: string
  }
}

/**
 * Verify webhook signature from MailerLite
 */
function verifyMailerLiteSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.MAILERLITE_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    console.warn('MAILERLITE_WEBHOOK_SECRET not configured - webhook signature verification disabled')
    return true // Allow in development
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')
    
    const expected = `sha256=${expectedSignature}`
    return expected === signature
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

/**
 * Get email type from message metadata or template name
 */
function getEmailTypeFromMessage(template?: string, subject?: string): string {
  if (template) {
    return template
  }
  
  if (subject) {
    // Map subject patterns to email types
    if (subject.includes('Welcome to CivicSense')) return 'welcome'
    if (subject.includes('Learning Pod')) return 'learning_pod_invitation'
    if (subject.includes('Reset Password')) return 'password_reset'
    if (subject.includes('Achievement')) return 'quiz_achievement'
    if (subject.includes('Level Up')) return 'level_up'
    if (subject.includes('Gift')) return 'gift_claim'
    if (subject.includes('Educational Access')) return 'educational_access'
  }
  
  return 'unknown'
}

/**
 * Track email events in our analytics system
 */
async function trackEmailEvent(event: MailerLiteWebhookEvent) {
  const emailType = getEmailTypeFromMessage(event.data.template, event.data.subject)
  const recipientDomain = event.data.email.split('@')[1]
  
  const analyticsData: Record<string, any> = {
    email_type: emailType,
    message_id: event.data.id,
    recipient_domain: recipientDomain,
    timestamp: event.timestamp,
    plunk_event_type: event.type
  }

  // Add event-specific data
  switch (event.type) {
    case 'campaign.clicked':
      analyticsData.clicked_url = event.data.url
      break
    case 'subscriber.bounced':
      analyticsData.bounce_type = event.data.bounce_type
      analyticsData.bounce_reason = event.data.reason
      break
    case 'subscriber.complained':
      analyticsData.complaint_reason = event.data.reason
      break
  }

  // Log for analytics processing
  console.log(`📊 Email ${event.type.toUpperCase()}: ${emailType}`, analyticsData)

  // In a real implementation, you might also:
  // - Store this in your database
  // - Send to your analytics service directly
  // - Trigger follow-up actions based on email events
}

/**
 * Handle MailerLite webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const signature = headersList.get('X-MailerLite-Signature')
    
    if (!signature) {
      console.warn('Missing MailerLite webhook signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const payload = await request.text()
    
    // Verify webhook signature
    if (!verifyMailerLiteSignature(payload, signature)) {
      console.error('Invalid MailerLite webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: MailerLiteWebhookEvent = JSON.parse(payload)
    
    // Validate event structure
    if (!event.type || !event.data?.id || !event.data?.email) {
      console.error('Invalid webhook event structure:', event)
      return NextResponse.json({ error: 'Invalid event structure' }, { status: 400 })
    }

    // Track the email event
    await trackEmailEvent(event)

    // Process specific event types
    switch (event.type) {
      case 'campaign.sent':
        console.log(`📧 Campaign sent: ${event.data.email}`)
        break
        
      case 'campaign.opened':
        console.log(`📧 Email opened: ${event.data.email}`)
        // Could trigger follow-up emails or user journey steps
        break
        
      case 'campaign.clicked':
        console.log(`📧 Email clicked: ${event.data.email} -> ${event.data.url}`)
        // Track engagement and conversion
        break
        
      case 'subscriber.bounced':
        console.log(`📧 Email bounced: ${event.data.email} (${event.data.bounce_type})`)
        // Handle bounced emails - update user status, remove from lists
        break
        
      case 'subscriber.complained':
        console.log(`📧 Email complaint: ${event.data.email}`)
        // Handle spam complaints - immediately unsubscribe
        break
        
      case 'subscriber.unsubscribed':
        console.log(`📧 Email unsubscribed: ${event.data.email}`)
        // Update user preferences
        break
        
      case 'subscriber.created':
        console.log(`📧 Subscriber created: ${event.data.email}`)
        break
        
      case 'subscriber.updated':
        console.log(`📧 Subscriber updated: ${event.data.email}`)
        break
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error processing Plunk webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'CivicSense Email Webhook',
    timestamp: new Date().toISOString()
  })
} 