import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-access'

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }
    
    console.log('🔧 Setting up congressional photos storage...')
    
    const supabase = await createClient()
    
    // Create the storage bucket
    const { data: bucket, error: bucketError } = await supabase.storage
      .createBucket('congressional-photos', {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg']
      })
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Failed to create storage bucket:', bucketError)
      return NextResponse.json(
        { 
          error: 'Failed to create storage bucket',
          details: bucketError.message 
        },
        { status: 500 }
      )
    }
    
    // Check if bucket exists and is accessible
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError)
      return NextResponse.json(
        { 
          error: 'Failed to verify storage setup',
          details: listError.message 
        },
        { status: 500 }
      )
    }
    
    const congressionalBucket = buckets?.find(b => b.id === 'congressional-photos')
    
    if (!congressionalBucket) {
      return NextResponse.json(
        { error: 'Congressional photos bucket not found after creation' },
        { status: 500 }
      )
    }
    
    // Test upload permissions by trying to create a test folder
    const { error: testUploadError } = await supabase.storage
      .from('congressional-photos')
      .upload('test/.gitkeep', new Blob([''], { type: 'text/plain' }))
    
    if (testUploadError && !testUploadError.message.includes('already exists')) {
      console.error('❌ Storage upload test failed:', testUploadError)
      return NextResponse.json(
        { 
          error: 'Storage bucket exists but upload permissions failed',
          details: testUploadError.message 
        },
        { status: 500 }
      )
    }
    
    // Clean up test file
    if (!testUploadError) {
      await supabase.storage
        .from('congressional-photos')
        .remove(['test/.gitkeep'])
    }
    
    console.log('✅ Congressional photos storage setup complete')
    
    return NextResponse.json({
      success: true,
      message: 'Congressional photos storage setup complete',
      bucket: {
        id: congressionalBucket.id,
        name: congressionalBucket.name,
        public: congressionalBucket.public,
        file_size_limit: congressionalBucket.file_size_limit,
        allowed_mime_types: congressionalBucket.allowed_mime_types
      }
    })
    
  } catch (error: any) {
    console.error('❌ Storage setup error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during storage setup',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }
    
    const supabase = await createClient()
    
    // Check storage bucket status
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to check storage status', details: error.message },
        { status: 500 }
      )
    }
    
    const congressionalBucket = buckets?.find(b => b.id === 'congressional-photos')
    
    return NextResponse.json({
      bucket_exists: !!congressionalBucket,
      bucket_details: congressionalBucket || null,
      total_buckets: buckets?.length || 0
    })
    
  } catch (error: any) {
    console.error('❌ Storage status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 