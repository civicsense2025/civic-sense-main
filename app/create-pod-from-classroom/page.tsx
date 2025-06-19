import { Metadata } from 'next'
import { GoogleClassroomPodCreator } from '@/components/integrations/google-classroom-pod-creator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  School, 
  Users, 
  RefreshCw, 
  Mail, 
  Shield,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Info,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Create Pod from Google Classroom | CivicSense',
  description: 'Transform your Google Classroom course into a collaborative CivicSense learning pod with automatic roster sync and student invitations.',
}

export default function CreatePodFromClassroomPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      <div className="container mx-auto px-4 py-12">
        {/* Streamlined Header */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
            Create Pod from Google Classroom
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
            Import your classroom roster and create a collaborative learning pod for civic education
          </p>
        </div>

        {/* Development Notice */}
        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Mode:</strong> This feature requires Google Cloud Console setup with proper OAuth credentials. 
            Currently configured for testing with limited functionality.
          </AlertDescription>
        </Alert>

        {/* Main Integration Component */}
        <GoogleClassroomPodCreator />

        {/* Quick Links */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
                                <Link href="/pods">
                <Users className="h-4 w-4 mr-2" />
                View All Pods
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/test-classroom-setup">
                <ExternalLink className="h-4 w-4 mr-2" />
                Test Integration
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowRight className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Need help? Check out our{' '}
            <Link href="/docs/classroom-integration" className="text-blue-600 hover:underline">
              Google Classroom integration guide
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 