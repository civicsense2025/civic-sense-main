'use client'

import React from 'react'
import { useFeatureFlag, useStatsigConfig, useStatsig } from '@/components/providers/statsig-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function StatsigExample() {
  const { isEnabled: showNewFeature } = useFeatureFlag('new_quiz_feature')
  const { config: uiConfig } = useStatsigConfig('ui_customization')
  const { logEvent } = useStatsig()

  const handleFeatureClick = () => {
    logEvent('feature_button_clicked', 1, {
      feature: 'new_quiz_feature',
      page: 'example'
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Statsig Feature Flags Example</CardTitle>
          <CardDescription>
            This demonstrates how to use Statsig in your CivicSense app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Feature Flag Example */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Feature Flag: new_quiz_feature</h3>
            {showNewFeature ? (
              <div className="text-green-600">
                ✅ New quiz feature is enabled for this user!
                <Button 
                  onClick={handleFeatureClick}
                  className="ml-4"
                  size="sm"
                >
                  Try New Feature
                </Button>
              </div>
            ) : (
              <div className="text-gray-500">
                ❌ New quiz feature is not enabled for this user
              </div>
            )}
          </div>

          {/* Dynamic Config Example */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Dynamic Config: ui_customization</h3>
            <div className="space-y-2">
              <div>
                <strong>Primary Color:</strong> {uiConfig.get?.('primary_color', '#3b82f6') || '#3b82f6'}
              </div>
              <div>
                <strong>Max Questions:</strong> {uiConfig.get?.('max_questions', 10) || 10}
              </div>
              <div>
                <strong>Show Hints:</strong> {uiConfig.get?.('show_hints', true) ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          {/* Event Logging Example */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Event Logging</h3>
            <div className="space-x-2">
              <Button 
                onClick={() => logEvent('quiz_started', 1, { category: 'civic_education' })}
                variant="outline"
                size="sm"
              >
                Log Quiz Started
              </Button>
              <Button 
                onClick={() => logEvent('user_interaction', 1, { type: 'button_click', component: 'example' })}
                variant="outline"
                size="sm"
              >
                Log Interaction
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
} 