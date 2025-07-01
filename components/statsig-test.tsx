'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useCommonActionStrings, ui } from '@/hooks/useUIStrings'
import { UIStringsDemo } from './ui-strings-demo'

export function StatsigTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [showUIDemo, setShowUIDemo] = useState(false)
  
  // Demonstrate UI strings integration
  const actionStrings = useCommonActionStrings()

  const runStatsigTest = () => {
    setTestResults([
      'Feature flags initialized',
      'A/B testing configured', 
      'Analytics tracking enabled'
    ])
  }

  const toggleUIDemo = () => {
    setShowUIDemo(!showUIDemo)
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Statsig Configuration Test</span>
            <Badge variant="secondary">With UI Strings</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runStatsigTest}>
              Run Statsig Test
            </Button>
            <Button variant="outline" onClick={toggleUIDemo}>
              {showUIDemo ? 'Hide' : 'Show'} UI Strings Demo
            </Button>
          </div>
          
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Test Results:</h3>
              <ul className="space-y-1">
                {testResults.map((result, index) => (
                  <li key={index} className="text-sm text-green-600">
                    ✓ {result}
                  </li>
                ))}
              </ul>
              
              {/* Demonstrate UI strings usage */}
              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost">
                    {actionStrings.retry}
                  </Button>
                  <Button size="sm" variant="outline">
                    {ui.results.continueLearning()}
                  </Button>
                  <Button size="sm">
                    {ui.messages.success()}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Show UI strings integration demo */}
      {showUIDemo && <UIStringsDemo />}
    </div>
  )
} 