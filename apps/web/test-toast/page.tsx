"use client"

import { Button } from "@civicsense/ui-web/components/ui/button"
import { useToast } from "@civicsense/shared/hooks/use-toast"

export default function TestToastPage() {
  const { toast } = useToast()

  const showSuccessToast = () => {
    toast({
      title: "Success!",
      description: "This is a success message without copy functionality.",
      variant: "default",
    })
  }

  const showErrorToast = () => {
    const errorMessage = "Database connection failed: Connection timeout after 30 seconds. Error code: CONN_TIMEOUT_001"
    toast({
      title: "Connection Error",
      description: errorMessage,
      variant: "destructive",
      copyText: errorMessage,
    })
  }

  const showLongErrorToast = () => {
    const longError = `Failed to process payment: Invalid card number provided. The card number must be between 13-19 digits and pass the Luhn algorithm validation. Please check your card number and try again. If the problem persists, contact your bank. Transaction ID: TXN_${Date.now()}_ERR_INVALID_CARD`
    toast({
      title: "Payment Processing Error",
      description: "There was an error processing your payment. Click the copy icon to get the full error details.",
      variant: "destructive",
      copyText: longError,
    })
  }

  const showApiErrorToast = () => {
    const apiError = JSON.stringify({
      error: "VALIDATION_FAILED",
      message: "Request validation failed",
      details: [
        { field: "email", message: "Invalid email format" },
        { field: "password", message: "Password must be at least 8 characters" }
      ],
      timestamp: new Date().toISOString(),
      requestId: "req_" + Math.random().toString(36).substr(2, 9)
    }, null, 2)
    
    toast({
      title: "API Validation Error",
      description: "Multiple validation errors occurred. Copy the full error details for debugging.",
      variant: "destructive",
      copyText: apiError,
    })
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Toast Copy Functionality Test</h1>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Regular Toast (No Copy)</h2>
          <p className="text-muted-foreground">
            Success toasts don't have copy functionality since they're typically brief confirmations.
          </p>
          <Button onClick={showSuccessToast} variant="default">
            Show Success Toast
          </Button>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Error Toast with Copy</h2>
          <p className="text-muted-foreground">
            Destructive toasts now include a copy icon that allows users to copy error messages to their clipboard.
          </p>
          <Button onClick={showErrorToast} variant="destructive">
            Show Error Toast
          </Button>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Long Error Message</h2>
          <p className="text-muted-foreground">
            When error messages are long, the copy functionality becomes especially useful for sharing with support teams.
          </p>
          <Button onClick={showLongErrorToast} variant="destructive">
            Show Long Error Toast
          </Button>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Structured Error Data</h2>
          <p className="text-muted-foreground">
            Copy functionality works great for structured error data like JSON responses from APIs.
          </p>
          <Button onClick={showApiErrorToast} variant="destructive">
            Show API Error Toast
          </Button>
        </div>
      </div>

      <div className="mt-12 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Only destructive (error) toasts show the copy icon</li>
          <li>The copy icon appears on hover in the top-right corner</li>
          <li>Click the copy icon to copy the error message to your clipboard</li>
          <li>Works with both modern clipboard API and fallback for older browsers</li>
          <li>The copyText prop can contain different text than what's displayed</li>
        </ul>
      </div>
    </div>
  )
} 