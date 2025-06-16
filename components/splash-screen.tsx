"use client"

import { useEffect, useState } from "react"

/**
 * SplashScreen
 *
 * Displays an animated wordmark while the app is first mounting.
 * The splash automatically fades out after a short delay (1.5-2s) or once the
 * page has finished loading, whichever comes first.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Hide splash screen after the page has loaded or after timeout
    const handleReady = () => setVisible(false)

    // In case the load event has already fired
    if (document.readyState === "complete") {
      handleReady()
    } else {
      window.addEventListener("load", handleReady)
    }

    const timeout = setTimeout(() => setVisible(false), 2000)

    return () => {
      window.removeEventListener("load", handleReady)
      clearTimeout(timeout)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-black transition-opacity duration-700 animate-fadeOut">
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