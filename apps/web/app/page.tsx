"use client"

import { useState, useEffect, useCallback, useMemo, Suspense } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic'

// Import from the correct local lib files
import { dataService } from "@/lib/data-service"
import { enhancedQuizDatabase } from "@/lib/quiz-database"
import { supabase } from "@/lib/supabase/client"

// Import UI components
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Import correct types from shared package
import type { TopicMetadata } from '@civicsense/types/quiz'

type CategoryType = string

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Welcome to CivicSense</h1>
      <div className="prose lg:prose-xl">
        <p className="mb-4">
          Civic education that politicians don't want you to have.
        </p>
        <div className="flex gap-4">
          <Button asChild className="bg-primary">
            <Link href="/signup">Sign Up</Link>
          </Button>
          <Button asChild className="bg-secondary">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
