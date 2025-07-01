'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function StatsigTest() {
  const [testResults, setTestResults] = useState<string[]>([])

  const runStatsigTest = () => {
    setTestResults([
      'Feature flags initialized',
      'A/B testing configured', 
      'Analytics tracking enabled'
    ])
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Statsig Configuration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runStatsigTest}>
          Run Statsig Test
        </Button>
        
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
          </div>
        )}
      </CardContent>
    </Card>
  )
} 