import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface CollectionFilter {
  id: string
  label: string
}

interface CollectionFiltersProps {
  filters: CollectionFilter[]
  activeFilter?: string
  onFilterChange: (filter: CollectionFilter) => void
}

export function CollectionFilters({ filters, activeFilter, onFilterChange }: CollectionFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <RadioGroup
          defaultValue={activeFilter}
          onValueChange={(value: string) => {
            const filter = filters.find(f => f.id === value)
            if (filter) onFilterChange(filter)
          }}
        >
          <div className="flex flex-wrap gap-4">
            {filters.map((filter) => (
              <div key={filter.id} className="flex items-center space-x-2">
                <RadioGroupItem value={filter.id} id={filter.id} />
                <Label htmlFor={filter.id}>{filter.label}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
} 