"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"

interface Feedback {
  id: string
  user_id: string | null
  user_email: string | null
  feedback_type: string
  context_type: string
  context_id: string | null
  rating: number | null
  feedback_text: string
  submitted_at: string
  status: "new" | "reviewed" | "archived"
  path: string | null
}

export default function FeedbackAdminPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is admin
    if (user && !user.user_metadata?.isAdmin) {
      router.push("/")
      return
    }

    fetchFeedback()
  }, [user, statusFilter, typeFilter])

  async function fetchFeedback() {
    setIsLoading(true)
    
    try {
      let query = supabase
        .from("user_feedback")
        .select("*")
        .order("submitted_at", { ascending: false })
      
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }
      
      if (typeFilter !== "all") {
        query = query.eq("feedback_type", typeFilter)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error("Error fetching feedback:", error)
        return
      }
      
      setFeedback(data as Feedback[])
    } catch (error) {
      console.error("Error in feedback fetch:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function updateFeedbackStatus(id: string, status: "new" | "reviewed" | "archived") {
    try {
      const { error } = await supabase
        .from("user_feedback")
        .update({ status })
        .eq("id", id)
      
      if (error) {
        console.error("Error updating feedback status:", error)
        return
      }
      
      // Update local state
      setFeedback(feedback.map(item => 
        item.id === id ? { ...item, status } : item
      ))
    } catch (error) {
      console.error("Error in status update:", error)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "new":
        return <Badge variant="destructive">New</Badge>
      case "reviewed":
        return <Badge variant="default">Reviewed</Badge>
      case "archived":
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case "suggestion":
        return <Badge variant="secondary">Suggestion</Badge>
      case "issue":
        return <Badge variant="destructive">Issue</Badge>
      case "content":
        return <Badge variant="default">Content</Badge>
      case "praise":
        return <Badge variant="outline">Praise</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  if (!user || !user.user_metadata?.isAdmin) {
    return <div className="p-8">Unauthorized access</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Feedback Management</h1>
      
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Status Filter</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Type Filter</label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="suggestion">Suggestions</SelectItem>
              <SelectItem value="issue">Issues</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="praise">Praise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="ml-auto">
          <label className="block text-sm font-medium mb-1">&nbsp;</label>
          <Button onClick={() => fetchFeedback()} disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Context</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="w-1/3">Feedback</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading feedback...
                </TableCell>
              </TableRow>
            ) : feedback.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No feedback found
                </TableCell>
              </TableRow>
            ) : (
              feedback.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(item.submitted_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{getTypeBadge(item.feedback_type)}</TableCell>
                  <TableCell>
                    {item.context_type}
                    {item.context_id && <span className="block text-xs text-slate-500">{item.context_id}</span>}
                  </TableCell>
                  <TableCell>{item.rating || "-"}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{item.feedback_text}</div>
                    {item.path && (
                      <div className="text-xs text-slate-500 truncate">
                        Path: {item.path}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.user_email || item.user_id || "Anonymous"}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {item.status !== "reviewed" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateFeedbackStatus(item.id, "reviewed")}
                        >
                          Mark Reviewed
                        </Button>
                      )}
                      {item.status !== "archived" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateFeedbackStatus(item.id, "archived")}
                        >
                          Archive
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 