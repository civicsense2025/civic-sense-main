"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { supabase } from "@civicsense/shared/lib/supabase"
import { Alert, AlertDescription } from "../ui/alert"
import { AlertCircle } from "lucide-react"
import { useToast } from "@civicsense/shared/hooks/use-toast"
import { useAnalytics } from "@civicsense/shared/utils/analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { SignInForm } from "./sign-in-form"
import { SignUpForm } from "./sign-up-form"

interface ConsolidatedAuthFormProps {
  onSuccess: () => void
  initialMode?: "sign-in" | "sign-up"
  onResetPassword?: () => void
}

export function ConsolidatedAuthForm({ 
  onSuccess, 
  initialMode = "sign-in",
  onResetPassword
}: ConsolidatedAuthFormProps) {
  const [activeTab, setActiveTab] = useState<"sign-in" | "sign-up">(initialMode)

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "sign-in" | "sign-up")}>
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="sign-in" className="rounded-l-full">Sign In</TabsTrigger>
        <TabsTrigger value="sign-up" className="rounded-r-full">Sign Up</TabsTrigger>
      </TabsList>
      
      <TabsContent value="sign-in">
        <SignInForm 
          onSuccess={onSuccess} 
          onResetPassword={onResetPassword || (() => {})}
        />
      </TabsContent>
      
      <TabsContent value="sign-up">
        <SignUpForm onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  )
} 