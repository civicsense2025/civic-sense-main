import { useState, useEffect } from 'react'
import { uiStrings } from '../lib/ui/ui-strings'
import type { SupportedLanguage } from '@civicsense/types/translations'

export function useUIStrings() {
  const [locale, setLocale] = useState<SupportedLanguage>(uiStrings.getLocale())

  useEffect(() => {
    // Update locale when it changes
    const currentLocale = uiStrings.getLocale()
    if (currentLocale !== locale) {
      setLocale(currentLocale)
    }
  }, [locale])

  const getString = (key: string, params?: Record<string, any>) => {
    return uiStrings.getUIString(key, params)
  }

  const changeLocale = async (newLocale: SupportedLanguage) => {
    await uiStrings.setLocale(newLocale)
    setLocale(newLocale)
  }

  return {
    locale,
    getString,
    changeLocale
  }
} 