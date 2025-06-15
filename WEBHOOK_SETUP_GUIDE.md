# Stripe Webhook Setup Guide

Based on your Stripe dashboard, here's exactly how to set up the webhook:

## Step 1: Fill in the Endpoint URL

In the "Endpoint URL" field you see in your screenshot, enter:
```
https://your-domain.com/api/stripe/webhook
```

**For local testing**, if you want to test locally first:
```
https://your-ngrok-url.ngrok.io/api/stripe/webhook
```

## Step 2: Select Events to Listen to

Click on "Select events" and choose these specific events:

### Required Events:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

## Step 3: Complete the Setup

1. Click "Add endpoint" button
2. After creating, you'll see a webhook secret that starts with `whsec_`
3. Copy this secret and add it to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

## Step 4: Test the Webhook

### For Local Development:

1. Install Stripe CLI:
```bash
npm install -g stripe-cli
```

2. Login to Stripe:
```bash
stripe login
```

3. Forward events to your local server:
```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

4. This will give you a webhook secret for local testing - use this in your `.env.local`

### For Production:

1. Deploy your app with the webhook endpoint
2. Update the webhook URL in Stripe dashboard to your production domain
3. Test with a real subscription

## Step 5: Verify Setup

1. Go to `/test-stripe` in your app
2. Click "Test Premium Subscription ($25/year)"
3. Complete the test payment with card `4242 4242 4242 4242`
4. Check your webhook logs in Stripe dashboard to see if events are being received

## Troubleshooting

**If webhook events aren't being received:**
1. Check that your endpoint URL is correct and accessible
2. Verify the webhook secret matches your `.env.local`
3. Make sure your server is running and can receive POST requests
4. Check the webhook logs in Stripe dashboard for error details

**Common issues:**
- URL not accessible (check firewall/hosting settings)
- Wrong webhook secret (copy from Stripe dashboard)
- Missing events (make sure all 6 events are selected)
- SSL certificate issues (use https:// for production)

Your webhook endpoint (`/api/stripe/webhook`) is already built and ready - you just need to configure the Stripe side! 