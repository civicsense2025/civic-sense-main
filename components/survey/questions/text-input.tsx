"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, Phone, Calendar, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface TextInputProps {
  questionId: string
  type?: "text" | "email" | "phone" | "number" | "date" | "textarea"
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  maxLength?: number
  rows?: number
  className?: string
}

export function TextInput({ 
  questionId, 
  type = "text", 
  value = "", 
  onChange, 
  placeholder,
  required = false,
  maxLength,
  rows = 4,
  className 
}: TextInputProps) {
  const getIcon = () => {
    switch (type) {
      case "email":
        return <Mail className="h-5 w-5 text-slate-400" />
      case "phone":
        return <Phone className="h-5 w-5 text-slate-400" />
      case "date":
        return <Calendar className="h-5 w-5 text-slate-400" />
      default:
        return null
    }
  }
  
  const getPlaceholder = () => {
    if (placeholder) return placeholder
    
    switch (type) {
      case "email":
        return "your@email.com"
      case "phone":
        return "(555) 123-4567"
      case "number":
        return "Enter a number..."
      case "textarea":
        return "Share your thoughts..."
      default:
        return "Enter your answer..."
    }
  }
  
  const getInputType = () => {
    switch (type) {
      case "email":
        return "email"
      case "phone":
        return "tel"
      case "number":
        return "number"
      case "date":
        return "date"
      default:
        return "text"
    }
  }
  
  const hasIcon = type === "email" || type === "phone" || type === "date"
  
  if (type === "textarea") {
    return (
      <div className={cn("space-y-2", className)}>
        <Textarea
          id={questionId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={getPlaceholder()}
          required={required}
          maxLength={maxLength}
          rows={rows}
          className="w-full text-base p-4 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 resize-none rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
        />
        {maxLength && (
          <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
            <span>Share as much detail as you'd like</span>
            <span>{value.length}/{maxLength}</span>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        {hasIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            {getIcon()}
          </div>
        )}
        <Input
          id={questionId}
          type={getInputType()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={getPlaceholder()}
          required={required}
          maxLength={maxLength}
          className={cn(
            "w-full text-base p-4 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/20",
            hasIcon && "pl-12"
          )}
        />
      </div>
      
      {maxLength && (
        <div className="text-right">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {value.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  )
} 