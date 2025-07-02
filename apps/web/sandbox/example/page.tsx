"use client"

import { Container } from '@civicsense/ui-web/components/ui/container'
import { Card, CardContent, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { Badge } from '@civicsense/ui-web/components/ui/badge'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { Alert, AlertDescription } from '@civicsense/ui-web/components/ui/alert'
import { Skeleton } from '@civicsense/ui-web/components/ui/skeleton'

// Example component for demonstration
function ExampleComponent({ 
  title, 
  description, 
  status = 'active',
  isLoading = false,
  error = null 
}: {
  title?: string
  description?: string  
  status?: 'active' | 'inactive' | 'pending'
  isLoading?: boolean
  error?: string | null
}) {
  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          Error: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title || 'Example Component'}</CardTitle>
          <Badge className={statusColors[status]}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          {description || 'This is an example component demonstrating sandbox structure.'}
        </p>
      </CardContent>
    </Card>
  )
}

export default function ExampleSandboxPage() {
  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-2xl font-bold">🧪 Example Component Test</h1>
          <Badge className="bg-green-100 text-green-800">Stable</Badge>
          <Badge variant="outline">UI</Badge>
        </div>
        <p className="text-gray-600 mb-4">
          This is an example sandbox page demonstrating the structure and patterns 
          for testing components in the CivicSense sandbox environment.
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('http://localhost:6006/?path=/story/example--default', '_blank')}
          >
            📖 View in Storybook
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            🔄 Refresh Test
          </Button>
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Default State</CardTitle>
          </CardHeader>
          <CardContent>
            <ExampleComponent 
              title="Default Example"
              description="This shows the component in its default state with basic props."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loading State</CardTitle>
          </CardHeader>
          <CardContent>
            <ExampleComponent isLoading={true} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error State</CardTitle>
          </CardHeader>
          <CardContent>
            <ExampleComponent error="Something went wrong while loading data" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Active Status</h4>
              <ExampleComponent 
                title="Active Component"
                description="Component with active status"
                status="active"
              />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Pending Status</h4>
              <ExampleComponent 
                title="Pending Component"
                description="Component with pending status"
                status="pending"
              />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Inactive Status</h4>
              <ExampleComponent 
                title="Inactive Component"
                description="Component with inactive status"
                status="inactive"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edge Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Very Long Text</h4>
              <ExampleComponent 
                title="This is a very long title that tests how the component handles extensive text content and maintains proper layout and readability"
                description="This is an extremely long description that tests how the component handles extensive text content and maintains proper layout and readability across different screen sizes and viewports. It should wrap properly and maintain visual hierarchy."
              />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Minimal Content</h4>
              <ExampleComponent title="Short" description="Brief." />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Missing Optional Props</h4>
              <ExampleComponent />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Development Notes */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Development Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Testing Checklist:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>✅ Component handles loading states correctly</li>
                <li>✅ Error boundaries prevent crashes</li>
                <li>✅ Responsive design works on mobile</li>
                <li>✅ Accessibility tested with keyboard navigation</li>
                <li>✅ All status variants render properly</li>
                <li>✅ Long text content wraps appropriately</li>
                <li>✅ Missing props don't break component</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Next Steps:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Create comprehensive Storybook stories</li>
                <li>Add unit tests for all scenarios</li>
                <li>Test with screen readers</li>
                <li>Validate color contrast ratios</li>
                <li>Performance test with large datasets</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Sandbox Pattern:</h4>
              <p className="text-sm text-gray-600">
                This page demonstrates the standard sandbox structure: header with metadata, 
                test scenarios in organized cards, and development notes for tracking progress.
                Use this as a template for your own component testing pages.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  )
} 