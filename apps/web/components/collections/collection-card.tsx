import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Collection } from '@civicsense/types/collections'

interface CollectionCardProps {
  collection: Collection
  onSelect?: (collection: Collection) => void
}

export function CollectionCard({ collection, onSelect }: CollectionCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{collection.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{collection.description}</p>
        <Button onClick={() => onSelect?.(collection)} className="w-full">
          View Collection
        </Button>
      </CardContent>
    </Card>
  )
} 