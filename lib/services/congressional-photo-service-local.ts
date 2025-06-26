import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Enhanced Congressional Photo Service
 * Saves photos locally to public/images/congress/{congress_number}/{bioguide_id}/
 */
export class CongressionalPhotoServiceLocal {
  private supabase: SupabaseClient;
  private basePath: string;
  
  constructor() {
    this.supabase = createClient();
    this.basePath = path.join(process.cwd(), 'public', 'images', 'congress');
  }
  
  /**
   * Download and store photo locally with multi-congress support
   */
  async downloadAndStorePhoto(
    bioguideId: string, 
    memberId: string, 
    congressNumber: number
  ): Promise<{
    success: boolean;
    photoRecord?: any;
    error?: string;
  }> {
    try {
      // Check if photo already exists and is current
      const existingPhoto = await this.getExistingPhoto(bioguideId, congressNumber);
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
      
      // Save to local filesystem
      const localPaths = await this.saveToLocalStorage(
        bioguideId, 
        congressNumber, 
        originalBuffer, 
        optimizedVersions
      );
      
      // Save photo record to database
      const photoRecord = await this.savePhotoRecord({
        member_id: memberId,
        bioguide_id: bioguideId,
        congress_number: congressNumber,
        local_path: localPaths.basePath,
        original_path: localPaths.original,
        thumbnail_path: localPaths.thumbnail,
        medium_path: localPaths.medium,
        large_path: localPaths.large,
        original_url: sourcePhoto.url,
        file_size: originalBuffer.length,
        image_width: metadata.width,
        image_height: metadata.height,
        content_hash: contentHash,
        optimization_complete: true
      });
      
      // Update public_figures record with local path
      await this.updateMemberPhotoUrl(memberId, localPaths.medium, congressNumber);
      
      console.log(`✅ Photo saved locally for ${bioguideId} (${congressNumber}th Congress)`);
      return { success: true, photoRecord };
      
    } catch (error: any) {
      console.error(`❌ Photo processing failed for ${bioguideId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Save photos to local filesystem
   */
  private async saveToLocalStorage(
    bioguideId: string,
    congressNumber: number,
    originalBuffer: Buffer, 
    optimizedVersions: {
      thumbnail: Buffer;
      medium: Buffer;
      large: Buffer;
    }
  ): Promise<{
    basePath: string;
    original: string;
    thumbnail: string;
    medium: string;
    large: string;
  }> {
    // Create directory structure: public/images/congress/{congress_number}/{bioguide_id}/
    const memberDir = path.join(this.basePath, congressNumber.toString(), bioguideId);
    
    // Ensure directory exists
    await fs.mkdir(memberDir, { recursive: true });
    
    // Save all versions
    await Promise.all([
      fs.writeFile(path.join(memberDir, 'original.jpg'), originalBuffer),
      fs.writeFile(path.join(memberDir, 'thumbnail.jpg'), optimizedVersions.thumbnail),
      fs.writeFile(path.join(memberDir, 'medium.jpg'), optimizedVersions.medium),
      fs.writeFile(path.join(memberDir, 'large.jpg'), optimizedVersions.large)
    ]);
    
    // Return relative paths for database storage
    const relativePath = `/images/congress/${congressNumber}/${bioguideId}`;
    
    return {
      basePath: relativePath,
      original: `${relativePath}/original.jpg`,
      thumbnail: `${relativePath}/thumbnail.jpg`,
      medium: `${relativePath}/medium.jpg`,
      large: `${relativePath}/large.jpg`
    };
  }
  
  /**
   * Find best available photo from unitedstates/images repository
   */
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
  
  /**
   * Download photo from URL
   */
  private async downloadPhoto(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download photo: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  
  /**
   * Create optimized versions using Sharp
   */
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
  
  /**
   * Save photo record to database
   */
  private async savePhotoRecord(photoData: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('congressional_photos')
      .upsert(photoData, { 
        onConflict: 'bioguide_id,congress_number' 
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to save photo record: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Update member photo URL in public_figures table
   */
  private async updateMemberPhotoUrl(
    memberId: string, 
    mediumPhotoPath: string,
    congressNumber: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('public_figures')
      .update({
        official_photo_url: mediumPhotoPath,
        photo_source: 'unitedstates_github',
        photo_last_updated: new Date().toISOString(),
        current_congress: congressNumber
      })
      .eq('id', memberId);
    
    if (error) {
      throw new Error(`Failed to update member photo URL: ${error.message}`);
    }
  }
  
  /**
   * Generate SHA256 hash of buffer
   */
  private generateHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
  
  /**
   * Get existing photo record from database
   */
  private async getExistingPhoto(
    bioguideId: string, 
    congressNumber: number
  ): Promise<any | null> {
    const { data } = await this.supabase
      .from('congressional_photos')
      .select('*')
      .eq('bioguide_id', bioguideId)
      .eq('congress_number', congressNumber)
      .single();
    
    return data;
  }
  
  /**
   * Check if photo is current (within 30 days)
   */
  private async isPhotoCurrent(photoRecord: any): Promise<boolean> {
    // Consider photo current if downloaded within last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const downloadedAt = new Date(photoRecord.downloaded_at);
    return downloadedAt > thirtyDaysAgo && photoRecord.optimization_complete;
  }
  
  /**
   * Get all photo URLs for a member
   */
  async getMemberPhotoUrls(
    bioguideId: string, 
    congressNumber: number
  ): Promise<{
    thumbnail: string | null;
    medium: string | null;
    large: string | null;
    original: string | null;
  }> {
    const photoRecord = await this.getExistingPhoto(bioguideId, congressNumber);
    if (!photoRecord) {
      return { thumbnail: null, medium: null, large: null, original: null };
    }
    
    return {
      thumbnail: photoRecord.thumbnail_path,
      medium: photoRecord.medium_path,
      large: photoRecord.large_path,
      original: photoRecord.original_path
    };
  }
  
  /**
   * Bulk process photos for all members in a specific congress
   */
  async processAllMemberPhotos(congressNumber: number): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    const { data: members } = await this.supabase
      .from('public_figures')
      .select('id, bioguide_id, full_name')
      .not('bioguide_id', 'is', null)
      .or(`current_congress.eq.${congressNumber},congress_member_type.not.is.null`);
    
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const member of members || []) {
      results.processed++;
      
      const result = await this.downloadAndStorePhoto(
        member.bioguide_id, 
        member.id,
        congressNumber
      );
      
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
  
  /**
   * Clean up old photos for a specific congress
   */
  async cleanupOldPhotos(congressNumber: number, daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { data: oldPhotos } = await this.supabase
      .from('congressional_photos')
      .select('bioguide_id, local_path')
      .eq('congress_number', congressNumber)
      .lt('downloaded_at', cutoffDate.toISOString());
    
    let cleaned = 0;
    
    for (const photo of oldPhotos || []) {
      try {
        const photoDir = path.join(
          process.cwd(), 
          'public', 
          photo.local_path
        );
        
        if (existsSync(photoDir)) {
          await fs.rm(photoDir, { recursive: true, force: true });
          cleaned++;
        }
      } catch (error) {
        console.error(`Failed to clean up ${photo.bioguide_id}:`, error);
      }
    }
    
    return cleaned;
  }
} 