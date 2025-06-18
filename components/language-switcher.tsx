"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Globe, Check, Loader2 } from 'lucide-react'
import { useLanguage } from '@/components/providers/language-provider'

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact'
  className?: string
}

export function LanguageSwitcher({ variant = 'default', className }: LanguageSwitcherProps) {
  const { 
    currentLanguage, 
    setLanguage, 
    supportedLanguages, 
    getLanguageInfo,
    isTranslating,
    isPageTranslated
  } = useLanguage()

  const currentLang = getLanguageInfo(currentLanguage)
  
  // Popular languages shown first
  const popularLanguages = supportedLanguages.slice(0, 10)
  const otherLanguages = supportedLanguages.slice(10)

  const handleLanguageChange = (languageCode: string) => {
    if (languageCode !== currentLanguage && !isTranslating) {
      setLanguage(languageCode)
    }
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 px-2 ${className}`}
            disabled={isTranslating}
          >
            {isTranslating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span className="text-base mr-1">{currentLang?.emoji}</span>
                <span className="text-xs">{currentLang?.code.toUpperCase()}</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isTranslating && (
            <>
              <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                Translating page...
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          
          {popularLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isTranslating}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <span className="mr-2">{lang.emoji}</span>
                <span className="text-sm">{lang.name}</span>
              </div>
              {currentLanguage === lang.code && <Check className="h-3 w-3" />}
            </DropdownMenuItem>
          ))}
          
          {otherLanguages.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {otherLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  disabled={isTranslating}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="mr-2">{lang.emoji}</span>
                    <span className="text-sm">{lang.name}</span>
                  </div>
                  {currentLanguage === lang.code && <Check className="h-3 w-3" />}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`min-w-[140px] justify-start ${className}`}
          disabled={isTranslating}
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              <span className="mr-2">{currentLang?.emoji}</span>
              {currentLang?.name}
              {isPageTranslated && currentLanguage !== 'en' && (
                <span className="ml-auto text-xs text-green-600">●</span>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {isTranslating && (
          <>
            <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
              Translating page content...
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Popular Languages
        </div>
        
        {popularLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isTranslating}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              <span className="mr-3">{lang.emoji}</span>
              <div>
                <div className="font-medium">{lang.name}</div>
                <div className="text-xs text-muted-foreground">{lang.nativeName}</div>
              </div>
            </div>
            {currentLanguage === lang.code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        
        {otherLanguages.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Other Languages
            </div>
            
            {otherLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isTranslating}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <span className="mr-3">{lang.emoji}</span>
                  <div>
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-xs text-muted-foreground">{lang.nativeName}</div>
                  </div>
                </div>
                {currentLanguage === lang.code && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        {currentLanguage !== 'en' && isPageTranslated && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-green-600 flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Page translated to {currentLang?.name}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 