import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CongressSyncService } from '@/lib/services/congress-sync-service';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Parse sync options from request body
    const body = await request.json();
    const { 
      syncMembers = true, 
      syncBills = true, 
      syncVotes = false,
      syncCommittees = false,
      limit = 100 
    } = body;
    
    // Initialize sync service
    const syncService = new CongressSyncService();
    
    // Track sync results
    const results = {
      started_at: new Date().toISOString(),
      members: { synced: 0, errors: 0 },
      bills: { synced: 0, errors: 0 },
      votes: { synced: 0, errors: 0 },
      committees: { synced: 0, errors: 0 }
    };
    
    // Sync Congressional Members
    if (syncMembers) {
      try {
        console.log('🔄 Starting Congressional members sync...');
        const memberResults = await syncService.syncCongressionalMembers();
        results.members = memberResults;
        console.log(`✅ Synced ${memberResults.synced} members`);
      } catch (error) {
        console.error('❌ Error syncing members:', error);
        results.members.errors++;
      }
    }
    
    // Sync Bills
    if (syncBills) {
      try {
        console.log('🔄 Starting bills sync...');
        const billResults = await syncService.syncRecentBills(limit);
        results.bills = billResults;
        console.log(`✅ Synced ${billResults.synced} bills`);
      } catch (error) {
        console.error('❌ Error syncing bills:', error);
        results.bills.errors++;
      }
    }
    
    // Sync Votes (if enabled)
    if (syncVotes) {
      try {
        console.log('🔄 Starting votes sync...');
        const voteResults = await syncService.syncRecentVotes();
        results.votes = voteResults;
        console.log(`✅ Synced ${voteResults.synced} votes`);
      } catch (error) {
        console.error('❌ Error syncing votes:', error);
        results.votes.errors++;
      }
    }
    
    // Sync Committees (if enabled)
    if (syncCommittees) {
      try {
        console.log('🔄 Starting committees sync...');
        const committeeResults = await syncService.syncCommittees();
        results.committees = committeeResults;
        console.log(`✅ Synced ${committeeResults.synced} committees`);
      } catch (error) {
        console.error('❌ Error syncing committees:', error);
        results.committees.errors++;
      }
    }
    
    // Log sync completion
    results.completed_at = new Date().toISOString();
    
    // Save sync log to database
    await supabase
      .from('admin_sync_logs')
      .insert({
        sync_type: 'congressional',
        sync_options: { syncMembers, syncBills, syncVotes, syncCommittees, limit },
        results,
        initiated_by: user.id
      });
    
    return NextResponse.json({
      success: true,
      message: 'Congressional sync completed',
      results
    });
    
  } catch (error) {
    console.error('Congressional sync error:', error);
    return NextResponse.json({
      success: false,
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get sync status
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Get recent sync logs
    const { data: syncLogs, error } = await supabase
      .from('admin_sync_logs')
      .select('*')
      .eq('sync_type', 'congressional')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    // Get current counts
    const [
      { count: memberCount },
      { count: billCount },
      { count: voteCount },
      { count: committeeCount }
    ] = await Promise.all([
      supabase.from('public_figures').select('*', { count: 'exact', head: true }).not('bioguide_id', 'is', null),
      supabase.from('congressional_bills').select('*', { count: 'exact', head: true }),
      supabase.from('congressional_votes').select('*', { count: 'exact', head: true }),
      supabase.from('congressional_committees').select('*', { count: 'exact', head: true })
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        currentCounts: {
          members: memberCount || 0,
          bills: billCount || 0,
          votes: voteCount || 0,
          committees: committeeCount || 0
        },
        recentSyncs: syncLogs || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sync status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 