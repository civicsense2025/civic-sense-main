'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {error.message || 'An unexpected error occurred'}
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700"
        >
          Go home
        </Link>
      </div>
    </div>
  )
} 