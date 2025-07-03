"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Bookmark, Star, Tags, Clock, Folder } from 'lucide-react'
import { cn } from '../../utils'
import type { BookmarkStats as BookmarkStatsType } from '@civicsense/shared/src/lib/types/bookmarks'

interface BookmarkStatsProps {
  stats: BookmarkStatsType
  className?: string
}

export function BookmarkStats({ stats, className }: BookmarkStatsProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
          <Bookmark className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_bookmarks}</div>
          <p className="text-xs text-slate-500">Saved items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Favorites</CardTitle>
          <Star className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.favorite_count}</div>
          <p className="text-xs text-slate-500">Starred items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Collections</CardTitle>
          <Folder className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_collections}</div>
          <p className="text-xs text-slate-500">Organized groups</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Snippets</CardTitle>
          <Tags className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_snippets}</div>
          <p className="text-xs text-slate-500">Saved excerpts</p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Popular Tags</CardTitle>
          <Tags className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.most_used_tags.map((tag: { tag: string; count: number }) => (
              <Badge key={tag.tag} variant="secondary" className="text-xs">
                {tag.tag} ({tag.count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <Clock className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recent_activity.map((activity: { id: string; title: string; type: 'bookmark' | 'snippet' }) => (
              <div
                key={activity.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="truncate flex-1">{activity.title}</span>
                <Badge variant="outline" className="ml-2">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 