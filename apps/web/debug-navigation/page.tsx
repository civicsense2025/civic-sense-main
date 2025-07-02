"use client"

import { useState } from 'react'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { Input } from '@civicsense/ui-web/components/ui/input'

export default function DebugNavigationPage() {
  const [topicId, setTopicId] = useState('juneteenth-delayed-freedom-1865')
  const [navigationData, setNavigationData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNavigation = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/topics/navigation?topicId=${topicId}&limit=5`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      setNavigationData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Navigation Debug Tool</h1>
      
      <div className="space-y-4 mb-8">
        <div className="flex gap-4">
          <Input
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            placeholder="Enter topic ID"
            className="flex-1"
          />
          <Button onClick={fetchNavigation} disabled={loading}>
            {loading ? 'Loading...' : 'Test Navigation'}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}
      </div>

      {navigationData && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <h2 className="font-semibold mb-2">Current Topic</h2>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(navigationData.current, null, 2)}
            </pre>
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded">
            <h2 className="font-semibold mb-2">Previous Topics ({navigationData.previous?.length || 0})</h2>
            <pre className="text-sm overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(navigationData.previous, null, 2)}
            </pre>
          </div>

          <div className="bg-orange-50 border border-orange-200 p-4 rounded">
            <h2 className="font-semibold mb-2">Next Topics ({navigationData.next?.length || 0})</h2>
            <pre className="text-sm overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(navigationData.next, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded">
            <h2 className="font-semibold mb-2">Has More</h2>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(navigationData.hasMore, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
} 