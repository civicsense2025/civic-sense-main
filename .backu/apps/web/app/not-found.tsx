"use client"

import Link from 'next/link'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Page Not Found - CivicSense',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <div className="container mx-auto p-4">
      <Card className="p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
          <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
} 