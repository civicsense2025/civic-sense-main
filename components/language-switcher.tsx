"use client"

import React, { useState } from 'react'
import { useLanguage } from './providers/language-provider'
import { useUIString } from '@/hooks/useUIStrings'
import { Button } from './ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu'
import { Badge } from './ui/badge'
import { Globe, Check, Loader2 } from 'lucide-react'

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal' | 'compact'
  showTranslationStatus?: boolean
}

export function LanguageSwitcher({ 
  variant = 'default', 
  showTranslationStatus = true 
}: LanguageSwitcherProps) {
  const { 
    currentLanguage, 
    setLanguage, 
    supportedLanguages, 
    isTranslating, 
    isPageTranslated,
    getLanguageInfo 
  } = useLanguage()
  
  const [isChanging, setIsChanging] = useState(false)
  
  const currentLang = getLanguageInfo(currentLanguage)
  
  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) return
    
    setIsChanging(true)
    try {
      setLanguage(languageCode)
      
      // Give time for translation to process
      if (languageCode !== 'en') {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } finally {
      setIsChanging(false)
    }
  }

  // Get popular languages first, then others
  const popularLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']
  const sortedLanguages = [
    ...supportedLanguages.filter(lang => popularLanguages.includes(lang.code)),
    ...supportedLanguages.filter(lang => !popularLanguages.includes(lang.code))
  ]

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-gray-500" />
        <select
          value={currentLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={isChanging || isTranslating}
          className="text-sm border-none bg-transparent focus:outline-none"
        >
          {sortedLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.emoji} {lang.nativeName}
            </option>
          ))}
        </select>
        {(isChanging || isTranslating) && (
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            disabled={isChanging || isTranslating}
            className="flex items-center gap-2"
          >
            {currentLang?.emoji} {currentLang?.code.toUpperCase()}
            {(isChanging || isTranslating) && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {sortedLanguages.slice(0, 10).map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                {lang.emoji} {lang.nativeName}
              </span>
              {lang.code === currentLanguage && (
                <Check className="h-3 w-3 text-green-600" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Default variant - full featured
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isChanging || isTranslating}
          className="flex items-center gap-2 min-w-[140px]"
        >
          <Globe className="h-4 w-4" />
          <span className="flex items-center gap-1">
            {currentLang?.emoji} {currentLang?.nativeName}
          </span>
          {(isChanging || isTranslating) && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Choose Language
          {showTranslationStatus && currentLanguage !== 'en' && (
            <Badge variant={isPageTranslated ? "default" : "secondary"} className="text-xs">
              {isPageTranslated ? 'Translated' : 'Original'}
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Popular languages */}
        <div className="px-2 py-1">
          <div className="text-xs font-medium text-gray-500 mb-1">Popular</div>
          {sortedLanguages.slice(0, 6).map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="flex items-center justify-between py-2"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{lang.emoji}</span>
                <div>
                  <div className="font-medium">{lang.nativeName}</div>
                  <div className="text-xs text-gray-500">{lang.name}</div>
                </div>
              </span>
              {lang.code === currentLanguage && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* All other languages */}
        <div className="max-h-48 overflow-y-auto">
          {sortedLanguages.slice(6).map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                {lang.emoji} {lang.nativeName}
              </span>
              {lang.code === currentLanguage && (
                <Check className="h-3 w-3 text-green-600" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
        
        {showTranslationStatus && currentLanguage !== 'en' && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                {isTranslating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Translating page...
                  </>
                ) : isPageTranslated ? (
                  <>
                    <Check className="h-3 w-3 text-green-600" />
                    Page translated to {currentLang?.nativeName}
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3" />
                    Showing original content
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Simple flag-only language switcher for minimal space usage
 */
export function LanguageFlags() {
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage()
  
  const popularLanguages = ['en', 'es', 'fr', 'de', 'it']
  const displayLanguages = supportedLanguages.filter(lang => 
    popularLanguages.includes(lang.code)
  )
  
  return (
    <div className="flex items-center gap-1">
      {displayLanguages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`text-xl hover:scale-110 transition-transform ${
            lang.code === currentLanguage ? 'scale-110' : 'opacity-60'
          }`}
          title={lang.nativeName}
          aria-label={`Switch to ${lang.nativeName}`}
        >
          {lang.emoji}
        </button>
      ))}
    </div>
  )
}

/**
 * Language status indicator
 */
export function LanguageStatus() {
  const { currentLanguage, isTranslating, isPageTranslated, getLanguageInfo } = useLanguage()
  
  if (currentLanguage === 'en') return null
  
  const currentLang = getLanguageInfo(currentLanguage)
  
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {isTranslating ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          Translating to {currentLang?.nativeName}...
        </>
      ) : isPageTranslated ? (
        <>
          <Check className="h-3 w-3 text-green-600" />
          Translated to {currentLang?.nativeName}
        </>
      ) : (
        <>
          <Globe className="h-3 w-3" />
          Original content
        </>
      )}
    </div>
  )
} 