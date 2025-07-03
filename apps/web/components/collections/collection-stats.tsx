import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Collection } from '@civicsense/types/collections'

interface CollectionStatsProps {
  collection: Collection
}

export function CollectionStats({ collection }: CollectionStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{collection.topics.length}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Difficulty</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{collection.difficulty}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{collection.estimatedTime} min</p>
        </CardContent>
      </Card>
    </div>
  )
} 