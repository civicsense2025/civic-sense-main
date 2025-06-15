# Stripe Integration Setup Guide

## Environment Variables

You need to add these variables to your `.env.local` file:

```bash
# Your existing variables
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_... for production (this is your STRIPE_API_KEY)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook endpoint secret

# Price IDs (create these in your Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...
```

## Step 1: Set up Stripe Products and Prices

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add Product**

### Create Premium Product:
- Name: "CivicSense Premium"
- Description: "Complete civic education with all features"
- Create recurring price:
  - Yearly: $25.00/year

3. Copy the Price IDs and add them to your `.env.local` file

## Step 2: Set up Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook secret and add it to your `.env.local` file

## Step 3: Test the Integration

### Test Checkout Flow:
1. Start your Next.js app: `npm run dev`
2. Sign in to your app
3. Try to access a premium feature
4. Click "Upgrade to Premium"
5. Use Stripe's test card: `4242 4242 4242 4242`

### Test Customer Portal:
1. Complete a test subscription
2. Try accessing the customer portal from your dashboard
3. Test subscription management features

## Step 4: Enable Stripe Customer Portal

1. In Stripe Dashboard, go to **Settings** → **Billing** → **Customer Portal**
2. Enable the customer portal
3. Configure which features customers can access:
   - ✅ View subscription details
   - ✅ Download invoices  
   - ✅ Update payment methods
   - ✅ Cancel subscriptions
   - ✅ Switch plans (if desired)

## Production Checklist

When ready for production:

1. **Switch to Live Mode**: Replace test keys with live keys
2. **Update Webhook URL**: Point to your production domain
3. **Test Live Integration**: Use real payment methods
4. **Set up Stripe Tax** (if needed)
5. **Configure Email Receipts**
6. **Set up Subscription Analytics**

## Troubleshooting

### Common Issues:

1. **"Invalid API Key"**: Make sure `STRIPE_SECRET_KEY` starts with `sk_test_` or `sk_live_`
2. **Webhook Verification Failed**: Ensure `STRIPE_WEBHOOK_SECRET` is correctly set
3. **Price ID Not Found**: Double-check your price IDs in Stripe Dashboard
4. **CORS Issues**: Make sure your webhook endpoint allows POST requests

### Testing Webhook Locally:

Use Stripe CLI to forward webhooks to your local development server:

```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook secret starting with `whsec_` - use this for local testing.

## Database Migration

Your database is already set up with the premium features migration. If you need to run it:

```bash
# If using Supabase
supabase db push

# Or apply the migration manually in your Supabase dashboard
```

## Security Notes

- Never expose your secret key (`STRIPE_SECRET_KEY`) to the client
- Always validate webhook signatures
- Use HTTPS in production
- Store sensitive data securely (already handled by Supabase)
- Log important events for debugging and compliance 