import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { Collection } from '@/types/collections'

interface CollectionCardProps {
  collection: Collection
  onClick?: () => void
}

export function CollectionCard({ collection, onClick }: CollectionCardProps) {
  const progress = 'progress' in collection ? collection.progress?.progress_percentage || 0 : 0

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        <CardTitle>{collection.title}</CardTitle>
        <CardDescription>{collection.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          {collection.categories?.map((category: string) => (
            <Badge key={category}>{category}</Badge>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardContent>
    </Card>
  )
} 