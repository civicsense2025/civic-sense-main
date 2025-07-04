"use client"

import { useToast } from "../../components/ui"
import { registerToastDispatch } from '@civicsense/shared'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"
import { useEffect } from "react"

export function Toaster() {
  const { toasts, toast } = useToast()

  useEffect(() => {
    registerToastDispatch(toast)
  }, [toast])

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, copyText, ...props }) {
        return (
          <Toast key={id} copyText={copyText} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
