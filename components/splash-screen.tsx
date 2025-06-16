"use client"

import { useEffect, useState } from "react"

/**
 * SplashScreen
 *
 * Displays an animated wordmark while the app is first mounting.
 * The splash automatically fades out once the page has loaded enough content
 * to be interactive, or after a short minimum display time.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Hide splash screen once content is ready
    const hideScreen = () => setVisible(false)
    
    // Check if the page is already loaded
    if (document.readyState === "complete" || document.readyState === "interactive") {
      hideScreen()
    } else {
      // Listen for both DOMContentLoaded (HTML parsed) and load (all resources loaded)
      window.addEventListener("DOMContentLoaded", hideScreen)
      window.addEventListener("load", hideScreen)
    }

    // Set a minimum display time (much shorter than before)
    const minDisplayTimeout = setTimeout(hideScreen, 500)

    return () => {
      window.removeEventListener("DOMContentLoaded", hideScreen)
      window.removeEventListener("load", hideScreen)
      clearTimeout(minDisplayTimeout)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-black transition-opacity duration-300 animate-fadeOut">
      <AnimatedWordmark />
    </div>
  )
}

/**
 * A simple animated wordmark for CivicSense.
 * The text gently scales & fades creating a subtle attention-grabbing effect.
 */
export function AnimatedWordmark() {
  return (
    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wider text-blue-600 dark:text-blue-400 animate-pulse select-none">
      CivicSense
    </h1>
  )
}

// Tailwind CSS: add fadeOut animation via utility classes if not already available.
// If you are using the default Tailwind config, you can extend it:
// theme.extend.keyframes.fadeOut { '0%': { opacity: 1 }, '100%': { opacity: 0 } }
// theme.extend.animation.fadeOut = 'fadeOut 0.7s forwards 1.3s' 