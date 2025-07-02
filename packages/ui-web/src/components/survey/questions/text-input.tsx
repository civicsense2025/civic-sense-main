"use client"

import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import { Mail, Phone, Calendar, User } from "lucide-react"
import { cn } from "@civicsense/shared/lib/utils"

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
      <div className={cn("space-y-4", className)} data-audio-content="true">
        <div className="relative">
          <Textarea
            id={questionId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getPlaceholder()}
            required={required}
            maxLength={maxLength}
            rows={rows}
            className={cn(
              "w-full text-base p-6 border-2 resize-none rounded-2xl transition-all duration-300",
              "bg-white dark:bg-slate-800/50 backdrop-blur-sm",
              "border-slate-200 dark:border-slate-700",
              "focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10",
              "hover:border-slate-300 dark:hover:border-slate-600",
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              value.length > 0 && "border-blue-300 dark:border-blue-600 shadow-sm shadow-blue-600/10"
            )}
          />
          {value.length > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          )}
        </div>
        
        {maxLength && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Share as much detail as you'd like
            </span>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "h-2 w-16 rounded-full overflow-hidden",
                "bg-slate-200 dark:bg-slate-700"
              )}>
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((value.length / maxLength) * 100, 100)}%` }}
                />
              </div>
              <span className={cn(
                "text-sm font-medium",
                value.length > maxLength * 0.9 ? "text-orange-600 dark:text-orange-400" : "text-slate-500 dark:text-slate-400"
              )}>
                {value.length}/{maxLength}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-3", className)} data-audio-content="true">
      <div className="relative group">
        {hasIcon && (
          <div className={cn(
            "absolute left-4 top-1/2 transform -translate-y-1/2 z-10 transition-colors",
            value ? "text-blue-500" : "text-slate-400 group-focus-within:text-blue-500"
          )}>
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
            "w-full text-base p-4 border-2 rounded-2xl transition-all duration-300",
            "bg-white dark:bg-slate-800/50 backdrop-blur-sm",
            "border-slate-200 dark:border-slate-700",
            "focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10",
            "hover:border-slate-300 dark:hover:border-slate-600",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            hasIcon && "pl-12",
            value.length > 0 && "border-blue-300 dark:border-blue-600 shadow-sm shadow-blue-600/10"
          )}
        />
        {value.length > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        )}
      </div>
      
      {maxLength && (
        <div className="flex justify-between items-center">
          <div className="w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((value.length / maxLength) * 100, 100)}%` }}
            />
          </div>
          <span className={cn(
            "text-sm font-medium",
            value.length > maxLength * 0.9 ? "text-orange-600 dark:text-orange-400" : "text-slate-500 dark:text-slate-400"
          )}>
            {value.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  )
} 