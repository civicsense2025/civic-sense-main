import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { createHash } from 'crypto';

export class CongressionalPhotoService {
  private supabase: SupabaseClient;
  private bucketName = 'congressional-photos';
  
  constructor() {
    this.supabase = createClient();
  }
  
  async downloadAndStorePhoto(bioguideId: string, memberId: string): Promise<{
    success: boolean;
    photoRecord?: any;
    error?: string;
  }> {
    try {
      // Check if photo already exists and is current
      const existingPhoto = await this.getExistingPhoto(bioguideId);
      if (existingPhoto && await this.isPhotoCurrent(existingPhoto)) {
        return { success: true, photoRecord: existingPhoto };
      }
      
      // Find best available photo size from unitedstates/images
      const sourcePhoto = await this.findBestSourcePhoto(bioguideId);
      if (!sourcePhoto.exists || !sourcePhoto.url) {
        console.log(`📷 No photo available for bioguide ${bioguideId}`);
        return { success: false, error: 'No photo available' };
      }
      
      // Download original photo
      const originalBuffer = await this.downloadPhoto(sourcePhoto.url);
      const contentHash = this.generateHash(originalBuffer);
      
      // Skip if photo hasn't changed
      if (existingPhoto?.content_hash === contentHash) {
        return { success: true, photoRecord: existingPhoto };
      }
      
      // Get image dimensions
      const metadata = await sharp(originalBuffer).metadata();
      
      // Create optimized versions
      const optimizedVersions = await this.createOptimizedVersions(originalBuffer, bioguideId);
      
      // Store in Supabase Storage
      const storagePaths = await this.uploadToStorage(bioguideId, originalBuffer, optimizedVersions);
      
      // Save photo record to database
      const photoRecord = await this.savePhotoRecord({
        member_id: memberId,
        bioguide_id: bioguideId,
        storage_path: storagePaths.original,
        original_url: sourcePhoto.url,
        file_size: originalBuffer.length,
        image_width: metadata.width,
        image_height: metadata.height,
        thumbnail_path: storagePaths.thumbnail,
        medium_path: storagePaths.medium,
        large_path: storagePaths.large,
        content_hash: contentHash,
        optimization_complete: true
      });
      
      // Update public_figures record
      await this.updateMemberPhotoUrl(memberId, storagePaths.medium);
      
      console.log(`✅ Photo processed for bioguide ${bioguideId}`);
      return { success: true, photoRecord };
      
    } catch (error: any) {
      console.error(`❌ Photo processing failed for ${bioguideId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  private async findBestSourcePhoto(bioguideId: string): Promise<{
    exists: boolean;
    url: string | null;
    size: string | null;
  }> {
    // Try sizes in order of preference: original -> 450x550 -> 225x275
    const sizes = ['original', '450x550', '225x275'];
    
    for (const size of sizes) {
      const url = `https://unitedstates.github.io/images/congress/${size}/${bioguideId}.jpg`;
      
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return { exists: true, url, size };
        }
      } catch (error) {
        continue;
      }
    }
    
    return { exists: false, url: null, size: null };
  }
  
  private async downloadPhoto(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download photo: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  
  private async createOptimizedVersions(originalBuffer: Buffer, bioguideId: string): Promise<{
    thumbnail: Buffer;
    medium: Buffer;
    large: Buffer;
  }> {
    const sharpImage = sharp(originalBuffer);
    
    // Create optimized versions in parallel
    const [thumbnail, medium, large] = await Promise.all([
      // Thumbnail: 150x150, optimized for lists
      sharpImage
        .clone()
        .resize(150, 150, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer(),
      
      // Medium: 300x300, optimized for cards
      sharpImage
        .clone()
        .resize(300, 300, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 90, progressive: true })
        .toBuffer(),
      
      // Large: 600x600, optimized for profile pages
      sharpImage
        .clone()
        .resize(600, 600, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 95, progressive: true })
        .toBuffer()
    ]);
    
    return { thumbnail, medium, large };
  }
  
  private async uploadToStorage(
    bioguideId: string, 
    originalBuffer: Buffer, 
    optimizedVersions: any
  ): Promise<{
    original: string;
    thumbnail: string;
    medium: string;
    large: string;
  }> {
    const basePath = `members/${bioguideId}`;
    
    // Upload all versions in parallel
    const [originalUpload, thumbnailUpload, mediumUpload, largeUpload] = await Promise.all([
      this.supabase.storage
        .from(this.bucketName)
        .upload(`${basePath}/original.jpg`, originalBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        }),
      
      this.supabase.storage
        .from(this.bucketName)
        .upload(`${basePath}/thumbnail.jpg`, optimizedVersions.thumbnail, {
          contentType: 'image/jpeg',
          upsert: true
        }),
      
      this.supabase.storage
        .from(this.bucketName)
        .upload(`${basePath}/medium.jpg`, optimizedVersions.medium, {
          contentType: 'image/jpeg',
          upsert: true
        }),
      
      this.supabase.storage
        .from(this.bucketName)
        .upload(`${basePath}/large.jpg`, optimizedVersions.large, {
          contentType: 'image/jpeg',
          upsert: true
        })
    ]);
    
    // Check for upload errors
    const uploads = [originalUpload, thumbnailUpload, mediumUpload, largeUpload];
    const uploadNames = ['original', 'thumbnail', 'medium', 'large'];
    
    uploads.forEach((upload, index) => {
      if (upload.error) {
        throw new Error(`Failed to upload ${uploadNames[index]}: ${upload.error.message}`);
      }
    });
    
    return {
      original: `${basePath}/original.jpg`,
      thumbnail: `${basePath}/thumbnail.jpg`,
      medium: `${basePath}/medium.jpg`,
      large: `${basePath}/large.jpg`
    };
  }
  
  private async savePhotoRecord(photoData: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('congressional_photos')
      .upsert(photoData, { onConflict: 'bioguide_id' })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to save photo record: ${error.message}`);
    }
    
    return data;
  }
  
  private async updateMemberPhotoUrl(memberId: string, mediumPhotoPath: string): Promise<void> {
    // Get public URL for the medium-sized photo
    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(mediumPhotoPath);
    
    // Update public_figures record
    const { error } = await this.supabase
      .from('public_figures')
      .update({
        official_photo_url: urlData.publicUrl,
        photo_source: 'unitedstates_github',
        photo_last_updated: new Date().toISOString()
      })
      .eq('id', memberId);
    
    if (error) {
      throw new Error(`Failed to update member photo URL: ${error.message}`);
    }
  }
  
  private generateHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
  
  private async getExistingPhoto(bioguideId: string): Promise<any | null> {
    const { data } = await this.supabase
      .from('congressional_photos')
      .select('*')
      .eq('bioguide_id', bioguideId)
      .single();
    
    return data;
  }
  
  private async isPhotoCurrent(photoRecord: any): Promise<boolean> {
    // Consider photo current if downloaded within last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const downloadedAt = new Date(photoRecord.downloaded_at);
    return downloadedAt > thirtyDaysAgo && photoRecord.optimization_complete;
  }
  
  // Utility method to get all photo URLs for a member
  async getMemberPhotoUrls(bioguideId: string): Promise<{
    thumbnail: string | null;
    medium: string | null;
    large: string | null;
    original: string | null;
  }> {
    const photoRecord = await this.getExistingPhoto(bioguideId);
    if (!photoRecord) {
      return { thumbnail: null, medium: null, large: null, original: null };
    }
    
    const getPublicUrl = (path: string) => {
      const { data } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(path);
      return data.publicUrl;
    };
    
    return {
      thumbnail: photoRecord.thumbnail_path ? getPublicUrl(photoRecord.thumbnail_path) : null,
      medium: photoRecord.medium_path ? getPublicUrl(photoRecord.medium_path) : null,
      large: photoRecord.large_path ? getPublicUrl(photoRecord.large_path) : null,
      original: photoRecord.storage_path ? getPublicUrl(photoRecord.storage_path) : null
    };
  }
  
  // Bulk photo processing for all members
  async processAllMemberPhotos(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    const { data: members } = await this.supabase
      .from('public_figures')
      .select('id, bioguide_id, full_name')
      .not('bioguide_id', 'is', null);
    
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const member of members || []) {
      results.processed++;
      
      const result = await this.downloadAndStorePhoto(member.bioguide_id, member.id);
      
      if (result.success) {
        results.succeeded++;
      } else {
        results.failed++;
        results.errors.push(`${member.full_name} (${member.bioguide_id}): ${result.error}`);
      }
      
      // Rate limiting - don't overwhelm the source server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
} 