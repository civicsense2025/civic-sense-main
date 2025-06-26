import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-access'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }
    
    console.log('📸 Fetching photo statistics...')

    const supabase = await createClient()
    
    const photoStats = {
      total_photos: 0,
      optimized_versions: 0,
      storage_used_mb: 0,
      congress_119_photos: 0,
      congress_118_photos: 0,
      congress_117_photos: 0,
      failed_downloads: 0,
      pending_updates: 0
    }

    // Get overall photo statistics
    const { data: totalPhotos, error: totalError } = await supabase
      .from('congressional_photos')
      .select('id, file_size, congress_number, optimization_complete')

    if (!totalError && totalPhotos) {
      photoStats.total_photos = totalPhotos.length

      // Calculate optimized versions (4 per photo: original, thumbnail, medium, large)
      const optimizedCount = totalPhotos.filter(p => p.optimization_complete).length
      photoStats.optimized_versions = optimizedCount * 4

      // Calculate storage used (approximate)
      const totalFileSize = totalPhotos.reduce((sum, photo) => sum + (photo.file_size || 0), 0)
      photoStats.storage_used_mb = totalFileSize / (1024 * 1024) // Convert to MB

      // Count by congress
      photoStats.congress_119_photos = totalPhotos.filter(p => p.congress_number === 119).length
      photoStats.congress_118_photos = totalPhotos.filter(p => p.congress_number === 118).length
      photoStats.congress_117_photos = totalPhotos.filter(p => p.congress_number === 117).length

      // Count failed downloads (photos without optimization)
      photoStats.failed_downloads = totalPhotos.filter(p => !p.optimization_complete).length
    }

    // Get pending updates (photos older than 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: pendingPhotos, error: pendingError } = await supabase
      .from('congressional_photos')
      .select('id')
      .lt('downloaded_at', thirtyDaysAgo.toISOString())

    if (!pendingError && pendingPhotos) {
      photoStats.pending_updates = pendingPhotos.length
    }

    console.log('✅ Photo statistics fetched:', photoStats)

    return NextResponse.json({
      success: true,
      data: photoStats
    })

  } catch (error) {
    console.error('Error fetching photo statistics:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 