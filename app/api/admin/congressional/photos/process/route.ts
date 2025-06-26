import { NextRequest, NextResponse } from 'next/server'
import { CongressionalPhotoServiceLocal } from '@/lib/services/congressional-photo-service-local'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-access'

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }
    
    const body = await request.json()
    const { congress_number, force_refresh = false } = body

    if (!congress_number) {
      return NextResponse.json(
        { error: 'Congress number is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Starting photo processing for ${congress_number}th Congress...`)

    const photoService = new CongressionalPhotoServiceLocal()
    const supabase = await createClient()

    // Get all members for the specified congress
    const { data: members, error: membersError } = await supabase
      .from('congressional_members')
      .select('bioguide_id, full_name, chamber, congress_number')
      .eq('congress_number', congress_number)

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch congressional members' },
        { status: 500 }
      )
    }

    if (!members || members.length === 0) {
      return NextResponse.json(
        { error: `No members found for ${congress_number}th Congress` },
        { status: 404 }
      )
    }

    console.log(`📥 Found ${members.length} members to process photos for`)

    const results = {
      total_members: members.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    }

    // Process photos for each member
    for (const member of members) {
      try {
        console.log(`📸 Processing photos for ${member.full_name} (${member.bioguide_id})`)
        
        const photoResult = await photoService.processPhotosForMember(
          member.bioguide_id,
          congress_number,
          force_refresh
        )

        results.processed++

        if (photoResult.success) {
          results.successful++
          console.log(`✅ Photos processed successfully for ${member.full_name}`)
        } else {
          results.failed++
          results.errors.push(`${member.full_name}: ${photoResult.error}`)
          console.error(`❌ Failed to process photos for ${member.full_name}:`, photoResult.error)
        }

      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`${member.full_name}: ${errorMessage}`)
        console.error(`❌ Error processing ${member.full_name}:`, error)
      }
    }

    console.log(`✨ Photo processing completed:`, results)

    return NextResponse.json({
      success: true,
      results: {
        congress_number,
        ...results,
        summary: `Processed ${results.successful}/${results.total_members} member photos successfully`
      }
    })

  } catch (error) {
    console.error('Photo processing error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 