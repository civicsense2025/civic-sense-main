import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Validate feedback payload
const FeedbackSchema = z.object({
  userId: z.string().nullable(),
  userEmail: z.string().email().nullable(),
  feedbackType: z.string(),
  contextType: z.string(),
  contextId: z.string().nullable(),
  rating: z.number().min(1).max(5).nullable(),
  feedbackText: z.string().min(1),
  submittedAt: z.string().datetime(),
  userAgent: z.string().optional(),
  path: z.string().optional()
})

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    const body = await request.json()
    const validatedData = FeedbackSchema.parse(body)

    // Initialize Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert feedback into the database
    const { data, error } = await supabase
      .from("user_feedback")
      .insert([
        {
          user_id: validatedData.userId,
          user_email: validatedData.userEmail,
          feedback_type: validatedData.feedbackType,
          context_type: validatedData.contextType,
          context_id: validatedData.contextId,
          rating: validatedData.rating,
          feedback_text: validatedData.feedbackText,
          submitted_at: validatedData.submittedAt,
          user_agent: validatedData.userAgent,
          path: validatedData.path,
          status: "new"
        }
      ])
      .select()

    if (error) {
      console.error("Error inserting feedback:", error)
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      )
    }

    // Optional: Send notification email for urgent feedback
    if (validatedData.feedbackType === "issue") {
      // Implement email notification logic here
      // This could use a service like SendGrid, AWS SES, etc.
    }

    return NextResponse.json({ success: true, id: data?.[0]?.id })
  } catch (error) {
    console.error("Error processing feedback:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid feedback data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    )
  }
} 