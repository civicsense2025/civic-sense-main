/**
 * Figure Assets Utility
 * Provides local asset paths for public figures and congressional members
 * Based on the new asset structure:
 * - Congressional members: assets/images/congress/{congress_number}/{bioguide_id}/
 * - Public figures: assets/images/public_figures/{slug}/
 */

import { MobilePublicFigure } from '../services/mobile-data-service';

// Default fallback image
const DEFAULT_AVATAR = require('../../assets/images/icon.png');

// Import the congressional photos mapping if available
let getCongressionalPhoto: (bioguideId: string) => any = () => null;
try {
  // This import will be available after running the download script
  const photosModule = require('../assets/congressional-photos');
  if (typeof photosModule.getCongressionalPhoto === 'function') {
    getCongressionalPhoto = photosModule.getCongressionalPhoto;
  }
} catch (error) {
  console.log('Congressional photos mapping not available');
}

/**
 * Get local asset path for a public figure
 * Returns local asset if available, otherwise falls back to remote URL or default
 */
export function getFigureAssetPath(figure: MobilePublicFigure): any {
  try {
    // Try congressional member path first (if has bioguide_id)
    if (figure.bioguide_id) {
      // Check if we have a pre-mapped photo for this bioguide_id
      const photo = getCongressionalPhoto(figure.bioguide_id);
      if (photo) {
        return photo;
      }
    }
    
    // No local asset found, return null to use remote URL
    return null;
    
  } catch (error) {
    console.log(`⚠️ No local asset found for figure: ${figure.display_name || figure.full_name}`);
    return null;
  }
}

/**
 * Get image source for a figure (local asset, remote URL, or default)
 */
export function getFigureImageSource(figure: MobilePublicFigure): { uri?: string } | any {
  // First try local asset
  const localAsset = getFigureAssetPath(figure);
  if (localAsset) {
    return localAsset;
  }
  
  // Then try remote URLs
  if (figure.image_url) {
    return { uri: figure.image_url };
  }
  
  if (figure.official_photo_url) {
    return { uri: figure.official_photo_url };
  }
  
  // Finally use default avatar
  return DEFAULT_AVATAR;
}

/**
 * Check if a figure has a local asset available
 */
export function hasLocalFigureAsset(figure: MobilePublicFigure): boolean {
  return getFigureAssetPath(figure) !== null;
}

/**
 * Get congress number for a figure (for display purposes)
 */
export function getFigureCongressNumber(figure: MobilePublicFigure): string | null {
  if (!figure.bioguide_id || !figure.congress_member_type) {
    return null;
  }
  
  // With the new approach, we don't know the congress number from the static mapping
  // Return the most recent congress as default
  return '119';
} 