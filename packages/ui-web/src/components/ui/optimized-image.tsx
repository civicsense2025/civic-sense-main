"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { cn } from '@civicsense/shared/lib/utils'
import { Skeleton } from '../ui/skeleton'

// ============================================================================
// OPTIMIZED IMAGE COMPONENT FOR CIVICSENSE
// ============================================================================

/**
 * Props for the OptimizedImage component
 */
interface OptimizedImageProps {
  /** Image source URL */
  src: string
  /** Alt text for accessibility */
  alt: string
  /** Image width */
  width: number
  /** Image height */
  height: number
  /** Additional CSS classes */
  className?: string
  /** Image priority (for above-the-fold images) */
  priority?: boolean
  /** Placeholder while loading */
  placeholder?: 'blur' | 'empty'
  /** Blur data URL for placeholder */
  blurDataURL?: string
  /** Object fit behavior */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  /** Object position */
  objectPosition?: string
  /** Image sizes for responsive design */
  sizes?: string
  /** Quality setting (1-100) */
  quality?: number
  /** Loading behavior */
  loading?: 'lazy' | 'eager'
  /** Callback when image loads */
  onLoad?: () => void
  /** Callback when image fails to load */
  onError?: () => void
  /** Show skeleton loader while loading */
  showSkeleton?: boolean
  /** Rounded corners */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Whether image fills container */
  fill?: boolean
}

/**
 * Optimized image component that prevents layout shifts and improves Core Web Vitals
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  objectFit = 'cover',
  objectPosition = 'center',
  sizes,
  quality = 90,
  loading = 'lazy',
  onLoad,
  onError,
  showSkeleton = true,
  rounded = 'none',
  fill = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  // Generate blur placeholder if not provided
  const shimmer = (w: number, h: number) => `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f1f5f9" offset="20%" />
          <stop stop-color="#e2e8f0" offset="50%" />
          <stop stop-color="#f1f5f9" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#f1f5f9" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>`

  const toBase64 = (str: string) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str)

  const defaultBlurDataURL = `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }

  // Container for maintaining aspect ratio and preventing layout shift
  const containerStyle = fill ? {} : {
    position: 'relative' as const,
    width,
    height,
  }

  return (
    <div 
      style={containerStyle}
      className={cn(
        'relative overflow-hidden bg-slate-100 dark:bg-slate-800',
        roundedClasses[rounded],
        fill && 'w-full h-full',
        className
      )}
    >
      {/* Skeleton loader */}
      {isLoading && showSkeleton && (
        <Skeleton 
          className={cn(
            'absolute inset-0 z-10',
            roundedClasses[rounded]
          )}
          style={fill ? {} : { width, height }}
        />
      )}

      {/* Error state */}
      {hasError ? (
        <div 
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500',
            roundedClasses[rounded]
          )}
          style={fill ? {} : { width, height }}
        >
          <svg 
            className="w-8 h-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          {...(fill ? { fill: true } : { width, height })}
          className={cn(
            'transition-opacity duration-300',
            isLoading && 'opacity-0',
            !isLoading && 'opacity-100',
            roundedClasses[rounded]
          )}
          style={{
            objectFit,
            objectPosition,
          }}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL || (placeholder === 'blur' ? defaultBlurDataURL : undefined)}
          sizes={sizes}
          quality={quality}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  )
}

// ============================================================================
// SPECIALIZED IMAGE COMPONENTS
// ============================================================================

/**
 * Avatar image with optimized loading and fallback
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
  fallbackInitials,
  ...props
}: {
  src: string
  alt: string
  size?: number
  className?: string
  fallbackInitials?: string
} & Partial<OptimizedImageProps>) {
  const [hasError, setHasError] = useState(false)

  if (hasError && fallbackInitials) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-full',
          className
        )}
        style={{ width: size, height: size }}
      >
        {fallbackInitials}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      rounded="full"
      objectFit="cover"
      onError={() => setHasError(true)}
      {...props}
    />
  )
}

/**
 * Hero image with responsive sizes
 */
export function OptimizedHeroImage({
  src,
  alt,
  className,
  ...props
}: {
  src: string
  alt: string
  className?: string
} & Partial<OptimizedImageProps>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      className={className}
      priority
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
      quality={95}
      placeholder="blur"
      {...props}
    />
  )
}

/**
 * Card thumbnail with consistent sizing
 */
export function OptimizedThumbnail({
  src,
  alt,
  className,
  ...props
}: {
  src: string
  alt: string
  className?: string
} & Partial<OptimizedImageProps>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={320}
      height={180}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={80}
      rounded="md"
      {...props}
    />
  )
} 