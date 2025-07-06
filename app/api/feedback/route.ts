import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

// Validate feedback payload with improved email validation
const FeedbackSchema = z.object({
  userId: z.string().nullable(),
  userEmail: z.string().email().nullable().optional(), // Make email optional and nullable
  feedbackType: z.string(),
  contextType: z.string(),
  contextId: z.string().nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  feedbackText: z.string().min(1),
  submittedAt: z.string().datetime(),
  userAgent: z.string().optional(),
  path: z.string().optional()
})

export async function POST(request: Request) {
  try {
    // Check for required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required environment variables for Supabase")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Parse and validate the request body
    const body = await request.json()
    
    try {
      var validatedData = FeedbackSchema.parse(body)
    } catch (validationError) {
      console.error("Validation error:", validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid feedback data", details: validationError.errors },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Initialize Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Log the data being inserted for debugging
    console.log("Inserting feedback:", {
      user_id: validatedData.userId,
      feedback_type: validatedData.feedbackType,
      context_type: validatedData.contextType,
      feedback_text_length: validatedData.feedbackText.length
    })

    // Insert feedback into the database
    const { data, error } = await supabase
      .from("user_feedback")
      .insert([
        {
          user_id: validatedData.userId,
          user_email: validatedData.userEmail || null,
          feedback_type: validatedData.feedbackType,
          context_type: validatedData.contextType,
          context_id: validatedData.contextId || null,
          rating: validatedData.rating || null,
          feedback_text: validatedData.feedbackText,
          submitted_at: validatedData.submittedAt,
          user_agent: validatedData.userAgent || null,
          path: validatedData.path || null,
          status: "new"
        }
      ])
      .select()

    if (error) {
      console.error("Error inserting feedback:", error)
      return NextResponse.json(
        { 
          error: "Failed to save feedback", 
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log("Feedback saved successfully:", data?.[0]?.id)
    return NextResponse.json({ 
      success: true, 
      id: data?.[0]?.id,
      message: "Feedback saved successfully"
    })
    
  } catch (error) {
    console.error("Error processing feedback:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to process feedback",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 