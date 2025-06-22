import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

async function extractEventData(url: string): Promise<{
  title: string
  description: string
  date: string
  significance: number
  policy_areas: string[]
  why_this_matters: string
} | null> {
  try {
    const response = await fetch(url)
    const html = await response.text()

    const prompt = `Extract historical event information from this webpage content. Format the response as JSON with the following fields:
- title: A concise title for the event
- description: A 2-3 sentence description of what happened
- date: The date in YYYY-MM-DD format
- significance: A number from 1-10 indicating historical significance
- policy_areas: An array of relevant policy areas (e.g., ["civil rights", "foreign policy"])
- why_this_matters: A brief explanation of the event's historical significance and impact

Webpage content:
${html.substring(0, 4000)} // Limit content length for token constraints`

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts historical event information from webpages and formats it as structured data. Focus on significant political, social, and governmental events in American history."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0].message.content
    if (!content) return null

    const result = JSON.parse(content)
    return result
  } catch (error) {
    console.error('Error extracting event data:', error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check admin authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email?.endsWith('@civicsense.org')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get pending events
    const { data: pendingEvents, error: fetchError } = await supabase
      .from('user_events')
      .select('*')
      .eq('status', 'pending')
      .limit(10) // Process in batches

    if (fetchError) {
      throw fetchError
    }

    // Process each event
    const results = await Promise.all(pendingEvents.map(async (event) => {
      const extractedData = await extractEventData(event.url)
      
      if (!extractedData) {
        // Mark as rejected if we couldn't extract data
        await supabase
          .from('user_events')
          .update({
            status: 'rejected',
            admin_notes: 'Failed to extract event data from URL'
          })
          .eq('id', event.id)
        
        return null
      }

      // Update user event with extracted data
      await supabase
        .from('user_events')
        .update({
          event_title: extractedData.title,
          event_description: extractedData.description,
          status: 'approved'
        })
        .eq('id', event.id)

      // Create event in events table
      const { error: insertError } = await supabase
        .from('events')
        .insert({
          topic_title: extractedData.title,
          description: extractedData.description,
          date: extractedData.date,
          ai_extraction_metadata: {
            significance: extractedData.significance,
            policy_areas: extractedData.policy_areas,
            source_url: event.url,
            extracted_at: new Date().toISOString()
          },
          why_this_matters: extractedData.why_this_matters,
          is_active: true
        })

      if (insertError) {
        console.error('Error inserting event:', insertError)
        return null
      }

      return extractedData
    }))

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful: results.filter(Boolean).length
    })
  } catch (error) {
    console.error('Error in bulk import:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 