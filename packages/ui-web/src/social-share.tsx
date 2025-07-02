"use client"

import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Share2, Twitter, Facebook, Linkedin, Link } from "lucide-react"
import { toast } from "../ui/use-toast"
import { useEffect, useState } from "react"

interface SocialShareProps {
  title: string
  score?: number
  totalQuestions?: number
  url?: string
}

export function SocialShare({ title, score, totalQuestions, url }: SocialShareProps) {
  const [mounted, setMounted] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

  useEffect(() => {
    setMounted(true)
    setShareUrl(url || window.location.href)
  }, [url])

  if (!mounted) return null

  const shareText =
    score !== undefined && totalQuestions !== undefined
      ? `I scored ${score}% on the "${title}" quiz on Civic Spark! Test your civic knowledge too!`
      : `Check out this civic education topic on Civic Spark: "${title}"`

  const encodedShareText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(shareUrl)

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedShareText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  }

  const copyToClipboard = () => {
    const textToCopy = `${shareText} ${shareUrl}`
    
    // Modern browser support
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).then(
        () => {
          toast({
            title: "Link copied!",
            description: "Share link has been copied to clipboard",
          })
        },
        (err) => {
          console.error("Could not copy text: ", err)
          fallbackCopyToClipboard(textToCopy)
        },
      )
    } else {
      // Fallback for older browsers or unsupported contexts
      fallbackCopyToClipboard(textToCopy)
    }
  }

  const fallbackCopyToClipboard = (text: string) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      // Try to copy using execCommand
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        toast({
          title: "Link copied!",
          description: "Share link has been copied to clipboard",
        })
      } else {
        throw new Error('execCommand failed')
      }
    } catch (err) {
      console.error('Fallback copy failed:', err)
      // Final fallback - show the text in a prompt
      const userAgent = navigator.userAgent.toLowerCase()
      if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
        // On mobile, try to select the text for manual copy
        toast({
          title: "Copy not supported",
          description: "Please manually copy this link: " + text.substring(0, 50) + "...",
          variant: "destructive",
        })
      } else {
        // On desktop, show prompt as last resort
        prompt('Please copy this link manually:', text)
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => window.open(shareLinks.twitter, "_blank")}>
          <Twitter className="mr-2 h-4 w-4" />
          <span>Twitter</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(shareLinks.facebook, "_blank")}>
          <Facebook className="mr-2 h-4 w-4" />
          <span>Facebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(shareLinks.linkedin, "_blank")}>
          <Linkedin className="mr-2 h-4 w-4" />
          <span>LinkedIn</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard}>
          <Link className="mr-2 h-4 w-4" />
          <span>Copy Link</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
