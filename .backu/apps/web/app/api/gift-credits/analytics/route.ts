import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'summary'

    if (view === 'summary') {
      // Get analytics summary using raw SQL
      const { data: summary, error: summaryError } = await supabase
        .from('gift_credits')
        .select(`
          source_donation_amount,
          credits_available,
          credits_used,
          created_at
        `)
        .eq('donor_user_id', user.id)

      if (summaryError) {
        console.error('Error fetching gift analytics summary:', summaryError)
        return NextResponse.json({ error: 'Failed to fetch analytics summary' }, { status: 500 })
      }

      // Calculate summary stats
      const totalDonated = summary?.reduce((sum, credit) => sum + (credit.source_donation_amount || 0), 0) || 0
      const totalCreditsEarned = summary?.reduce((sum, credit) => sum + credit.credits_available, 0) || 0
      const totalCreditsUsed = summary?.reduce((sum, credit) => sum + credit.credits_used, 0) || 0

      return NextResponse.json({ 
        success: true, 
        data: {
          total_donated_amount: totalDonated,
          total_gift_credits_earned: totalCreditsEarned,
          total_gift_credits_used: totalCreditsUsed,
          conversion_rate: totalCreditsEarned > 0 ? totalCreditsUsed / totalCreditsEarned : 0
        }
      })

    } else if (view === 'detailed') {
      // Get detailed gift credits with claims
      const { data: credits, error: creditsError } = await supabase
        .from('gift_credits')
        .select(`
          id,
          credit_type,
          credits_available,
          credits_used,
          source_donation_amount,
          source_stripe_session_id,
          created_at
        `)
        .eq('donor_user_id', user.id)
        .order('created_at', { ascending: false })

      if (creditsError) {
        console.error('Error fetching detailed gift credits:', creditsError)
        return NextResponse.json({ error: 'Failed to fetch detailed analytics' }, { status: 500 })
      }

      // Get individual claims for each credit batch
      const detailedCredits = await Promise.all(
        (credits || []).map(async (credit) => {
          const { data: claims } = await supabase
            .from('gift_redemptions')
            .select(`
              id,
              recipient_email,
              access_type,
              gift_message,
              redemption_status,
              redemption_code,
              expires_at,
              claimed_at,
              created_at
            `)
            .eq('gift_credit_id', credit.id)
            .order('created_at', { ascending: false })

          return {
            ...credit,
            individual_claims: claims || []
          }
        })
      )

      return NextResponse.json({ 
        success: true, 
        data: detailedCredits 
      })

    } else if (view === 'people') {
      // Get all people helped by this donor
      const { data: claims, error: claimsError } = await supabase
        .from('gift_redemptions')
        .select(`
          recipient_email,
          access_type,
          claimed_at,
          gift_message,
          redemption_code,
          gift_credits!inner (
            donor_user_id
          )
        `)
        .eq('gift_credits.donor_user_id', user.id)
        .eq('redemption_status', 'claimed')
        .order('claimed_at', { ascending: false })

      if (claimsError) {
        console.error('Error fetching people helped:', claimsError)
        return NextResponse.json({ error: 'Failed to fetch people helped' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        data: claims?.map(claim => ({
          email: claim.recipient_email,
          access_type: claim.access_type,
          claim_method: 'individual',
          claimed_at: claim.claimed_at,
          gift_message: claim.gift_message,
          redemption_code: claim.redemption_code
        })) || []
      })

    } else {
      return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Unexpected error in gift analytics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 