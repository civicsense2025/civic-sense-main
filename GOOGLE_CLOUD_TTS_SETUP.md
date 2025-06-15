# Google Cloud Text-to-Speech Setup Guide

This guide will help you set up Google Cloud Text-to-Speech (TTS) with translation capabilities for your CivicSense application.

## 🔐 Authentication Methods (Choose One)

### Method 1: Workload Identity Federation (Recommended)

**This is the modern, secure approach recommended by Google.** No service account keys needed!

#### For Vercel/Netlify Deployment

1. **Create a Workload Identity Pool**
```bash
# Enable required APIs
gcloud services enable iamcredentials.googleapis.com
gcloud services enable sts.googleapis.com

# Create workload identity pool
gcloud iam workload-identity-pools create "civicsense-pool" \
    --project="YOUR_PROJECT_ID" \
    --location="global" \
    --display-name="CivicSense External Pool"
```

2. **Create a Workload Identity Provider**
```bash
# For GitHub Actions (if using GitHub)
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
    --project="YOUR_PROJECT_ID" \
    --location="global" \
    --workload-identity-pool="civicsense-pool" \
    --display-name="GitHub Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com"

# For other platforms, you'll need different OIDC settings
```

3. **Create Service Account and Grant Permissions**
```bash
# Create service account
gcloud iam service-accounts create civicsense-tts \
    --project="YOUR_PROJECT_ID" \
    --description="CivicSense TTS service account" \
    --display-name="CivicSense TTS"

# Grant TTS permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:civicsense-tts@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/texttospeech.user"

# Grant Translation permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:civicsense-tts@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudtranslate.user"

# Allow workload identity pool to impersonate service account
gcloud iam service-accounts add-iam-policy-binding \
    --role roles/iam.workloadIdentityUser \
    --member "principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/civicsense-pool/*" \
    civicsense-tts@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

4. **Set Environment Variables**
```env
# In your deployment platform (Vercel, Netlify, etc.)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_WORKLOAD_IDENTITY_PROVIDER=projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/civicsense-pool/providers/github-provider
GOOGLE_SERVICE_ACCOUNT_EMAIL=civicsense-tts@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

5. **Update Your Code**
```typescript
// In your API route, use workload identity instead of service account keys
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

// The auth library will automatically use workload identity federation
const client = await auth.getClient();
```

#### For Google Cloud Deployment (Cloud Run, App Engine)

If deploying to Google Cloud, it's even simpler:

```bash
# Just create and attach a service account - no keys needed!
gcloud iam service-accounts create civicsense-app \
    --description="CivicSense application service account" \
    --display-name="CivicSense App"

# Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:civicsense-app@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/texttospeech.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:civicsense-app@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudtranslate.user"

# Deploy with service account attached
gcloud run deploy civicsense \
    --service-account=civicsense-app@YOUR_PROJECT_ID.iam.gserviceaccount.com \
    --source .
```

### Method 2: Service Account Keys (Fallback)

**⚠️ Only use this for development or if Workload Identity Federation isn't available.**

## 🔧 Required Dependencies

Install the necessary packages:

```bash
npm install @google-cloud/text-to-speech @google-cloud/translate google-auth-library
```

## 🌍 Supported Languages

The integration supports 25+ languages including:
- English (US, UK, AU, IN)
- Spanish (Spain, Mexico, Argentina)
- French (France, Canada)
- German, Italian, Portuguese
- Chinese (Mandarin, Cantonese)
- Japanese, Korean, Hindi
- Arabic, Russian, Dutch
- And many more...

## 💰 Pricing Information

### Text-to-Speech Pricing
- **Standard voices**: $4.00 per 1 million characters
- **WaveNet voices**: $16.00 per 1 million characters  
- **Neural2 voices**: $16.00 per 1 million characters (highest quality)

### Translation Pricing
- **Text Translation**: $20.00 per 1 million characters
- **Language Detection**: Free

### Free Tier
- **1 million characters per month** for Standard voices
- **100,000 characters per month** for WaveNet/Neural2 voices

## 🧪 Testing Your Setup

Use the built-in test component to verify everything works:

```typescript
// Add this to any page to test
import { GoogleTTSTest } from '@/components/google-tts-test'

export default function TestPage() {
  return <GoogleTTSTest />
}
```

## 🔒 Security Best Practices

### For Workload Identity Federation
- ✅ Use attribute conditions to restrict access
- ✅ Regularly audit workload identity pool usage
- ✅ Use least-privilege IAM roles
- ✅ Monitor authentication logs

### For Service Account Keys (if used)
- ❌ Never commit keys to version control
- ❌ Don't store keys in client-side code
- ✅ Rotate keys regularly (every 90 days)
- ✅ Use environment variables
- ✅ Restrict key permissions to minimum required

## 🚀 Production Deployment

### Environment Variables Checklist

**For Workload Identity Federation:**
```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_WORKLOAD_IDENTITY_PROVIDER=projects/.../workloadIdentityPools/.../providers/...
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

**For Service Account Keys (fallback):**
```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
# OR individual values:
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

### Deployment Platform Setup

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add the required environment variables
3. Redeploy your application

**Netlify:**
1. Go to Site Settings → Environment Variables
2. Add the required environment variables
3. Trigger a new deploy

**Google Cloud Run:**
```bash
gcloud run deploy civicsense \
    --service-account=civicsense-app@YOUR_PROJECT_ID.iam.gserviceaccount.com \
    --source .
```

## 🚀 Quick Start: Workload Identity Federation with Vercel

Here's a complete example for setting up Workload Identity Federation with Vercel deployment:

### Step 1: Set up Google Cloud
```bash
# Set your project ID
export PROJECT_ID="your-project-id"
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Enable required APIs
gcloud services enable texttospeech.googleapis.com
gcloud services enable translate.googleapis.com
gcloud services enable iamcredentials.googleapis.com
gcloud services enable sts.googleapis.com

# Create workload identity pool
gcloud iam workload-identity-pools create "vercel-pool" \
    --project="$PROJECT_ID" \
    --location="global" \
    --display-name="Vercel Deployment Pool"

# Create OIDC provider for Vercel (using GitHub as identity provider)
gcloud iam workload-identity-pools providers create-oidc "vercel-github" \
    --project="$PROJECT_ID" \
    --location="global" \
    --workload-identity-pool="vercel-pool" \
    --display-name="Vercel via GitHub" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com"

# Create service account
gcloud iam service-accounts create civicsense-vercel \
    --project="$PROJECT_ID" \
    --description="CivicSense Vercel deployment" \
    --display-name="CivicSense Vercel"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:civicsense-vercel@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/texttospeech.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:civicsense-vercel@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudtranslate.user"

# Allow workload identity pool to impersonate service account
gcloud iam service-accounts add-iam-policy-binding \
    --role roles/iam.workloadIdentityUser \
    --member "principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/vercel-pool/*" \
    civicsense-vercel@$PROJECT_ID.iam.gserviceaccount.com
```

### Step 2: Configure Vercel Environment Variables
In your Vercel dashboard, add these environment variables:

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_WORKLOAD_IDENTITY_PROVIDER=projects/123456789/locations/global/workloadIdentityPools/vercel-pool/providers/vercel-github
GOOGLE_SERVICE_ACCOUNT_EMAIL=civicsense-vercel@your-project-id.iam.gserviceaccount.com
```

### Step 3: Update Your Code
Your existing API route will automatically detect and use Workload Identity Federation!

### Step 4: Deploy and Test
```bash
# Deploy to Vercel
vercel --prod

# Test the API
curl -X POST https://your-app.vercel.app/api/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","targetLanguage":"en-US"}'
```

## 🐛 Troubleshooting

### Common Issues

**"Authentication failed"**
- Verify your project ID is correct
- Check that APIs are enabled
- Ensure service account has proper roles
- For Workload Identity: verify provider configuration

**"API not enabled"**
- Enable Text-to-Speech API: `gcloud services enable texttospeech.googleapis.com`
- Enable Translation API: `gcloud services enable translate.googleapis.com`

**"Permission denied"**
- Check IAM roles are correctly assigned
- Verify service account email is correct
- For Workload Identity: check attribute mapping

**"Quota exceeded"**
- Check your usage in Google Cloud Console
- Consider upgrading to paid tier
- Implement usage tracking in your app

### Debug Mode

Enable debug logging by setting:
```env
GOOGLE_CLOUD_DEBUG=true
```

## 📊 Usage Monitoring

Monitor your usage in the Google Cloud Console:
1. Go to APIs & Services → Enabled APIs
2. Click on "Cloud Text-to-Speech API"
3. View quotas and usage metrics

Set up billing alerts to avoid unexpected charges:
1. Go to Billing → Budgets & Alerts
2. Create a budget for your expected usage
3. Set up email notifications

## 🔄 Migration from Service Account Keys

If you're currently using service account keys and want to migrate:

1. Set up Workload Identity Federation (steps above)
2. Update your environment variables
3. Remove the service account key file
4. Test thoroughly in staging
5. Deploy to production
6. Delete the old service account key

## 📚 Additional Resources

- [Google Cloud TTS Documentation](https://cloud.google.com/text-to-speech/docs)
- [Workload Identity Federation Guide](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Translation API Documentation](https://cloud.google.com/translate/docs)
- [IAM Best Practices](https://cloud.google.com/iam/docs/using-iam-securely)

---

**Need help?** Check the test component output for detailed error messages and debugging information. 