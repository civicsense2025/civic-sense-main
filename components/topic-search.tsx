"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface TopicSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function TopicSearch({ searchQuery, onSearchChange }: TopicSearchProps) {
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        placeholder="Search topics..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 rounded-xl"
      />
    </div>
  )
}
