"use client"

import type { ToastProps } from "./toast"

// Singleton state for toast dispatch function
let toastDispatch: ((props: ToastProps & { title?: string; description?: string }) => void) | null = null

// Register the toast dispatch function (called by the Toaster component)
export function registerToastDispatch(dispatch: (props: ToastProps & { title?: string; description?: string }) => void) {
  toastDispatch = dispatch
}

// Toast function that can be used anywhere
export function toast(props: ToastProps & { title?: string; description?: string }) {
  if (!toastDispatch) {
    console.warn('Toast was called before toast dispatch was registered')
    return
  }
  toastDispatch(props)
} 