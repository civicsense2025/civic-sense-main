'use client'

import { useStatsig, useFeatureFlag } from '@/components/providers/statsig-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function StatsigExample() {
  const { isReady, hasError, logEvent } = useStatsig()
  const { isEnabled: newDesignFlag } = useFeatureFlag('new_design_enabled')

  const handleFeatureClick = () => {
    logEvent('feature_test_clicked', 1, { source: 'example_component' })
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">Statsig Integration Status</h3>
        {isReady ? (
          <Badge variant="default" className="bg-green-500">Ready</Badge>
        ) : hasError ? (
          <Badge variant="destructive">Error</Badge>
        ) : (
          <Badge variant="secondary">Loading...</Badge>
        )}
      </div>
      
      {hasError && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Network Error:</strong> Statsig failed to initialize. Running in fallback mode.
            Feature flags will return default values.
          </p>
          <details className="mt-2">
            <summary className="text-xs cursor-pointer">Debug Information</summary>
            <div className="mt-2 text-xs font-mono bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
              <p>Client Key: {process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY ? 'Configured' : 'Missing'}</p>
              <p>Environment: {process.env.NODE_ENV}</p>
              <p>Error: Network request to featureassets.org failed</p>
              <p>Possible causes:</p>
              <ul className="ml-4 list-disc">
                <li>Internet connectivity issues</li>
                <li>Firewall blocking requests</li>
                <li>Invalid client key</li>
                <li>Statsig service temporarily unavailable</li>
              </ul>
            </div>
          </details>
        </div>
      )}
      
      <div className="space-y-2">
        <p className="text-sm">
          <strong>Feature Flag (new_design_enabled):</strong> {newDesignFlag ? 'Enabled' : 'Disabled'}
        </p>
        
        <Button 
          onClick={handleFeatureClick}
          variant={newDesignFlag ? 'default' : 'outline'}
        >
          Test Feature & Log Event
        </Button>
        
        {!isReady && !hasError && (
          <p className="text-xs text-gray-500">
            Waiting for Statsig to initialize...
          </p>
        )}
      </div>
    </div>
  )
} 