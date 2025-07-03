'use client'

import { useEffect, useState } from 'react'
import { useFeatureFlag, useFeatureFlagDebug } from '@civicsense/shared/useFeatureFlags-statsig'
import { useStatsig } from '@/components/providers/statsig-provider'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

export function StatsigMigrationTest() {
  const { isReady, hasError, logEvent } = useStatsig()
  const [testResults, setTestResults] = useState<any[]>([])
  
  // Test a few key feature flags
  const multiplayerEnabled = useFeatureFlag('multiplayer')
  const podsEnabled = useFeatureFlag('learningPods')
  const quizzesEnabled = useFeatureFlag('quizzes')
  const globalSearchEnabled = useFeatureFlag('globalSearch')
  
  // Debug info for development
  const multiplayerDebug = useFeatureFlagDebug('multiplayer')
  const podsDebug = useFeatureFlagDebug('learningPods')
  const quizzesDebug = useFeatureFlagDebug('quizzes')
  const globalSearchDebug = useFeatureFlagDebug('globalSearch')
  
  const runTests = () => {
    const results = [
      {
        name: 'Multiplayer',
        enabled: multiplayerEnabled,
        debug: multiplayerDebug,
        expected: true
      },
      {
        name: 'Learning Pods', 
        enabled: podsEnabled,
        debug: podsDebug,
        expected: true
      },
      {
        name: 'Quizzes',
        enabled: quizzesEnabled,
        debug: quizzesDebug,
        expected: true
      },
      {
        name: 'Global Search',
        enabled: globalSearchEnabled,
        debug: globalSearchDebug,
        expected: true
      }
    ]
    
    setTestResults(results)
    
    // Log test completion
    logEvent('migration_test_completed', 1, {
      statsig_ready: isReady,
      has_error: hasError,
      tests_passed: results.filter(r => r.enabled === r.expected).length,
      total_tests: results.length
    })
  }
  
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🎯 Statsig Migration Test</span>
          <div className="flex gap-2">
            {isReady ? (
              <Badge variant="default" className="bg-green-500">Statsig Ready</Badge>
            ) : hasError ? (
              <Badge variant="destructive">Statsig Error</Badge>
            ) : (
              <Badge variant="secondary">Statsig Loading...</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statsig Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {isReady ? '✅' : '⏳'}
            </div>
            <div className="text-sm text-gray-600">
              Statsig Ready: {isReady ? 'Yes' : 'No'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {hasError ? '❌' : '✅'}
            </div>
            <div className="text-sm text-gray-600">
              Has Errors: {hasError ? 'Yes' : 'No'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              🚀
            </div>
            <div className="text-sm text-gray-600">
              Migration Status: Active
            </div>
          </div>
        </div>
        
        {/* Test Button */}
        <div className="text-center">
          <Button onClick={runTests} size="lg">
            🧪 Run Feature Flag Tests
          </Button>
        </div>
        
        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test Results:</h3>
            
            {testResults.map((result, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">
                    {result.enabled === result.expected ? '✅' : '❌'}
                  </div>
                  <div>
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-gray-600">
                      Expected: {result.expected ? 'Enabled' : 'Disabled'} | 
                      Actual: {result.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge variant={result.enabled === result.expected ? 'default' : 'destructive'}>
                    {result.enabled === result.expected ? 'PASS' : 'FAIL'}
                  </Badge>
                  
                  {/* Debug info in development */}
                  {process.env.NODE_ENV === 'development' && result.debug && (
                    <div className="text-xs text-gray-500 mt-1">
                      Source: {result.debug.sources.statsig !== 'not_ready' ? 'Statsig' : 'Environment'}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Summary */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="font-semibold text-blue-800 dark:text-blue-200">
                🎯 Migration Summary
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                {testResults.filter(r => r.enabled === r.expected).length} of {testResults.length} tests passed
                {isReady ? ' • Statsig integration active!' : ' • Running on environment fallback'}
              </div>
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">📋 Next Steps:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600 dark:text-gray-400">
            <li>Create the 45 Statsig gates using the MCP integration</li>
            <li>Verify this test shows "Statsig Ready" status</li>
            <li>Confirm all feature flags are working as expected</li>
            <li>Test flag changes in Statsig console update immediately</li>
            <li>Monitor analytics in Statsig dashboard</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
} 