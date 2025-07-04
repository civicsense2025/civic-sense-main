import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { Collection } from '@/types/collections'

interface CollectionStatsProps {
  collection: Collection
}

export function CollectionStats({ collection }: CollectionStatsProps) {
  const progress = 'progress' in collection ? collection.progress?.progress_percentage || 0 : 0
  const completedItems = 'progress' in collection ? collection.progress?.completed_items || 0 : 0
  const totalItems = 'progress' in collection ? collection.progress?.total_items || collection.itemCount : collection.itemCount

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{completedItems}</div>
              <div className="text-sm text-muted-foreground">Completed Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalItems}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
          </div>

          {collection.estimated_minutes && (
            <>
              <Separator />
              <div className="text-center">
                <div className="text-2xl font-bold">{collection.estimated_minutes}</div>
                <div className="text-sm text-muted-foreground">Estimated Minutes</div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 