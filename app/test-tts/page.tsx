import { GoogleTTSTest } from '@/components/google-tts-test'

export default function TestTTSPage() {
  // Detect environment
  const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production'
  const hasLocalCredentials = process.env.GOOGLE_CLOUD_PRIVATE_KEY && process.env.GOOGLE_CLOUD_CLIENT_EMAIL
  const hasWorkloadIdentity = process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const hasServiceAccountKey = process.env.GOOGLE_APPLICATION_CREDENTIALS

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Google Cloud TTS Test
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test your Google Cloud Text-to-Speech integration
          </p>
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              isProduction 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {isProduction ? '🚀 Production Environment' : '🛠️ Development Environment'}
            </span>
          </div>
        </div>
        
        <GoogleTTSTest />
        
        <div className="mt-8 space-y-4">
          {/* Environment Variables Check */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              🔧 Environment Variables Check
            </h3>
            
            {/* Common Variables */}
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1 mb-4">
              <div className="font-medium">Required for all environments:</div>
              <div className="ml-4">
                {process.env.GOOGLE_CLOUD_PROJECT_ID ? '✅' : '❌'} GOOGLE_CLOUD_PROJECT_ID: {process.env.GOOGLE_CLOUD_PROJECT_ID ? 'Set' : 'Missing'}
              </div>
            </div>

            {/* Local Development Variables */}
            {!isProduction && (
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1 mb-4">
                <div className="font-medium">For local development (.env.local):</div>
                <div className="ml-4">
                  {hasLocalCredentials ? '✅' : '❌'} GOOGLE_CLOUD_PRIVATE_KEY: {process.env.GOOGLE_CLOUD_PRIVATE_KEY ? 'Set' : 'Missing'}
                </div>
                <div className="ml-4">
                  {process.env.GOOGLE_CLOUD_CLIENT_EMAIL ? '✅' : '❌'} GOOGLE_CLOUD_CLIENT_EMAIL: {process.env.GOOGLE_CLOUD_CLIENT_EMAIL ? 'Set' : 'Missing'}
                </div>
              </div>
            )}

            {/* Production Variables */}
            {isProduction && (
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1 mb-4">
                <div className="font-medium">For production (Vercel):</div>
                <div className="ml-4">
                  {hasWorkloadIdentity ? '✅' : '❌'} GOOGLE_WORKLOAD_IDENTITY_PROVIDER: {process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER ? 'Set' : 'Missing'}
                </div>
                <div className="ml-4">
                  {process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅' : '❌'} GOOGLE_SERVICE_ACCOUNT_EMAIL: {process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Set' : 'Missing'}
                </div>
              </div>
            )}

            {/* Fallback Variables */}
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <div className="font-medium">Fallback option:</div>
              <div className="ml-4">
                {hasServiceAccountKey ? '✅' : '❌'} GOOGLE_APPLICATION_CREDENTIALS: {process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Set' : 'Missing'}
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              📋 Setup Instructions
            </h3>
            
            {!isProduction ? (
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <div className="font-medium">For Local Development:</div>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Create a <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">.env.local</code> file in your project root</li>
                  <li>Add your Google Cloud service account credentials:
                    <div className="mt-1 ml-4 text-xs font-mono bg-slate-200 dark:bg-slate-800 p-2 rounded">
                      GOOGLE_CLOUD_PROJECT_ID=your-project-id<br/>
                      GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com<br/>
                      GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
                    </div>
                  </li>
                  <li>Restart your development server</li>
                </ol>
              </div>
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <div className="font-medium">For Production (Vercel):</div>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Set up Workload Identity Federation in Google Cloud Console</li>
                  <li>Add environment variables in Vercel dashboard:
                    <div className="mt-1 ml-4 text-xs font-mono bg-slate-200 dark:bg-slate-800 p-2 rounded">
                      GOOGLE_CLOUD_PROJECT_ID<br/>
                      GOOGLE_WORKLOAD_IDENTITY_PROVIDER<br/>
                      GOOGLE_SERVICE_ACCOUNT_EMAIL
                    </div>
                  </li>
                  <li>Deploy your application</li>
                </ol>
              </div>
            )}
          </div>

          {/* Authentication Status */}
          <div className={`border rounded-lg p-4 max-w-2xl mx-auto ${
            ((!isProduction && hasLocalCredentials) || (isProduction && hasWorkloadIdentity) || hasServiceAccountKey)
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <h3 className={`font-semibold mb-2 ${
              ((!isProduction && hasLocalCredentials) || (isProduction && hasWorkloadIdentity) || hasServiceAccountKey)
                ? 'text-green-900 dark:text-green-100'
                : 'text-yellow-900 dark:text-yellow-100'
            }`}>
              🔐 Authentication Status
            </h3>
            <div className={`text-sm ${
              ((!isProduction && hasLocalCredentials) || (isProduction && hasWorkloadIdentity) || hasServiceAccountKey)
                ? 'text-green-700 dark:text-green-300'
                : 'text-yellow-700 dark:text-yellow-300'
            }`}>
              {(!isProduction && hasLocalCredentials) ? (
                '✅ Ready for local development with individual credentials'
              ) : (isProduction && hasWorkloadIdentity) ? (
                '✅ Ready for production with Workload Identity Federation'
              ) : hasServiceAccountKey ? (
                '✅ Ready with service account key fallback'
              ) : (
                '⚠️ Authentication not properly configured. Please set up the required environment variables.'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 