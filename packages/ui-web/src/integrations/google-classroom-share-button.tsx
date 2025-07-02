"use client"

import { useEffect, useId } from 'react'
import { cn } from '../../utils'

/**
 * Google Classroom "Share to Classroom" button
 * Docs: https://developers.google.com/classroom/guides/sharebutton
 *
 * This component dynamically loads the Google platform.js script
 * and renders an accessible share button that teachers can use
 * to post CivicSense content directly to their Classroom courses.
 */
export interface ClassroomShareButtonProps {
  /** Absolute URL to share */
  url: string
  /** Title of the item – appears in Classroom dialog */
  title?: string
  /** Body text shown in Classroom dialog */
  body?: string
  /** assignment | announcement | material | question */
  itemType?: 'assignment' | 'announcement' | 'material' | 'question'
  /** Pixel size of the icon. Defaults to 32. */
  size?: number
  /** light | dark – icon theme. */
  theme?: 'light' | 'dark'
  /** Optional CSS class */
  className?: string
}

/* global gapi */

declare global {
  interface Window {
    __gc_share_script_loaded?: boolean
    gapi?: any
  }
}

const GC_SCRIPT_ID = 'google-platform-share-script'

export function ClassroomShareButton({
  url,
  title = 'Share to Classroom',
  body,
  itemType = 'assignment',
  size = 32,
  theme = 'light',
  className
}: ClassroomShareButtonProps) {
  const containerId = useId()

  useEffect(() => {
    if (!url) return

    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.__gc_share_script_loaded) return resolve()
        const existing = document.getElementById(GC_SCRIPT_ID)
        if (existing) {
          existing.addEventListener('load', () => resolve())
          return
        }
        const script = document.createElement('script')
        script.id = GC_SCRIPT_ID
        script.src = 'https://apis.google.com/js/platform.js'
        script.async = true
        script.defer = true
        script.onload = () => {
          window.__gc_share_script_loaded = true
          resolve()
        }
        script.onerror = () => reject(new Error('Failed to load Google platform.js'))
        document.body.appendChild(script)
      })
    }

    loadScript()
      .then(() => {
        if (!window.gapi?.sharetoclassroom) return
        // Render the button in the container
        window.gapi.sharetoclassroom.render(containerId, {
          url,
          size,
          theme,
          itemtype: itemType,
          title,
          body
        })
      })
      .catch((err) => console.error(err))
  }, [url, title, body, itemType, size, theme, containerId])

  return (
    <div
      id={containerId}
      className={cn('inline-block', className)}
      aria-label="Share to Google Classroom"
    />
  )
} 