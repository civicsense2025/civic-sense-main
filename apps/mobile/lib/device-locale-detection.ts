/**
 * Device Locale Detection for CivicSense Mobile
 * Automatically detects user's device language and region preferences
 * Supports 13+ languages with fallback logic
 */

import * as Localization from 'expo-localization'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface DeviceLocaleInfo {
  language: string
  region: string
  languageTag: string // e.g., 'es-MX', 'en-US'
  textDirection: 'ltr' | 'rtl'
  isFirstLaunch: boolean
  preferredVoiceLanguage?: string
  timeZone: string
  numberFormat: {
    decimal: string
    thousands: string
    currency: string
  }
}

// Supported languages with their regions and RTL info
interface LocaleConfig {
  regions: string[]
  rtl: boolean
  voice: string
}

const SUPPORTED_LOCALES: Record<string, LocaleConfig> = {
  'en': { regions: ['US', 'GB', 'CA', 'AU'], rtl: false, voice: 'en-US' },
  'es': { regions: ['ES', 'MX', 'AR', 'CO', 'PE', 'CL'], rtl: false, voice: 'es-ES' },
  'fr': { regions: ['FR', 'CA', 'BE', 'CH'], rtl: false, voice: 'fr-FR' },
  'de': { regions: ['DE', 'AT', 'CH'], rtl: false, voice: 'de-DE' },
  'it': { regions: ['IT', 'CH'], rtl: false, voice: 'it-IT' },
  'pt': { regions: ['PT', 'BR'], rtl: false, voice: 'pt-PT' },
  'ru': { regions: ['RU', 'BY', 'KZ'], rtl: false, voice: 'ru-RU' },
  'ja': { regions: ['JP'], rtl: false, voice: 'ja-JP' },
  'ko': { regions: ['KR'], rtl: false, voice: 'ko-KR' },
  'zh': { regions: ['CN', 'TW', 'HK', 'SG'], rtl: false, voice: 'zh-CN' },
  'ar': { regions: ['SA', 'AE', 'EG', 'MA'], rtl: true, voice: 'ar-SA' },
  'hi': { regions: ['IN'], rtl: false, voice: 'hi-IN' },
  'vi': { regions: ['VN'], rtl: false, voice: 'vi-VN' }
}

const STORAGE_KEY = 'civicsense-device-locale'
const FIRST_LAUNCH_KEY = 'civicsense-first-launch'

/**
 * Detect device locale information with comprehensive fallback
 */
export async function detectDeviceLocale(): Promise<DeviceLocaleInfo> {
  try {
    // Check if we've stored user's preference
    const storedLocale = await AsyncStorage.getItem(STORAGE_KEY)
    const isFirstLaunch = !(await AsyncStorage.getItem(FIRST_LAUNCH_KEY))
    
    // Get device locales
    const deviceLocales = await Localization.getLocalizationAsync()
    const preferredLocale = deviceLocales.locale || 'en-US'
    
    // Parse language and region
    const [detectedLang, detectedRegion] = preferredLocale.split('-')
    const language = detectedLang.toLowerCase()
    const region = detectedRegion?.toUpperCase() || 'US'
    
    // Check if detected language is supported
    const supportedLang = Object.keys(SUPPORTED_LOCALES).includes(language) 
      ? language 
      : 'en' // fallback to English
    
    // Validate region for the language
    const langConfig = SUPPORTED_LOCALES[supportedLang]
    const validRegion = langConfig.regions.includes(region) 
      ? region 
      : langConfig.regions[0] // Use first region as default
    
    const languageTag = `${supportedLang}-${validRegion}`
    
    // Determine number format based on locale
    const numberFormat = getNumberFormat(languageTag)
    
    const localeInfo: DeviceLocaleInfo = {
      language: supportedLang,
      region: validRegion,
      languageTag,
      textDirection: langConfig.rtl ? 'rtl' : 'ltr',
      isFirstLaunch,
      preferredVoiceLanguage: langConfig.voice,
      timeZone: deviceLocales.timezone || 'America/New_York',
      numberFormat
    }
    
    // Store detected locale for future reference
    if (isFirstLaunch) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localeInfo))
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true')
    }
    
    return localeInfo
    
  } catch (error) {
    console.warn('Device locale detection failed, using defaults:', error)
    
    // Fallback to safe defaults
    return {
      language: 'en',
      region: 'US',
      languageTag: 'en-US',
      textDirection: 'ltr',
      isFirstLaunch: true,
      preferredVoiceLanguage: 'en-US',
      timeZone: 'America/New_York',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        currency: '$'
      }
    }
  }
}

/**
 * Get number formatting rules for a locale
 */
function getNumberFormat(languageTag: string): DeviceLocaleInfo['numberFormat'] {
  const formatMap: Record<string, DeviceLocaleInfo['numberFormat']> = {
    // US/UK English
    'en-US': { decimal: '.', thousands: ',', currency: '$' },
    'en-GB': { decimal: '.', thousands: ',', currency: '£' },
    'en-CA': { decimal: '.', thousands: ',', currency: 'C$' },
    'en-AU': { decimal: '.', thousands: ',', currency: 'A$' },
    
    // Spanish
    'es-ES': { decimal: ',', thousands: '.', currency: '€' },
    'es-MX': { decimal: '.', thousands: ',', currency: '$' },
    'es-AR': { decimal: ',', thousands: '.', currency: '$' },
    
    // French
    'fr-FR': { decimal: ',', thousands: ' ', currency: '€' },
    'fr-CA': { decimal: ',', thousands: ' ', currency: 'C$' },
    
    // German
    'de-DE': { decimal: ',', thousands: '.', currency: '€' },
    'de-AT': { decimal: ',', thousands: '.', currency: '€' },
    
    // Italian
    'it-IT': { decimal: ',', thousands: '.', currency: '€' },
    
    // Portuguese
    'pt-PT': { decimal: ',', thousands: ' ', currency: '€' },
    'pt-BR': { decimal: ',', thousands: '.', currency: 'R$' },
    
    // Others
    'ru-RU': { decimal: ',', thousands: ' ', currency: '₽' },
    'ja-JP': { decimal: '.', thousands: ',', currency: '¥' },
    'ko-KR': { decimal: '.', thousands: ',', currency: '₩' },
    'zh-CN': { decimal: '.', thousands: ',', currency: '¥' },
    'ar-SA': { decimal: '.', thousands: ',', currency: 'ر.س' },
    'hi-IN': { decimal: '.', thousands: ',', currency: '₹' },
    'vi-VN': { decimal: ',', thousands: '.', currency: '₫' }
  }
  
  return formatMap[languageTag] || formatMap['en-US']
}

/**
 * Save user's language preference override
 */
export async function saveLanguagePreference(language: string, region?: string): Promise<void> {
  try {
    const langConfig = SUPPORTED_LOCALES[language]
    if (!langConfig) {
      throw new Error(`Unsupported language: ${language}`)
    }
    
    const validRegion = region && langConfig.regions.includes(region) 
      ? region 
      : langConfig.regions[0]
    
    const localeInfo: Partial<DeviceLocaleInfo> = {
      language,
      region: validRegion,
      languageTag: `${language}-${validRegion}`,
      textDirection: langConfig.rtl ? 'rtl' : 'ltr',
      preferredVoiceLanguage: langConfig.voice,
      numberFormat: getNumberFormat(`${language}-${validRegion}`)
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localeInfo))
  } catch (error) {
    console.error('Failed to save language preference:', error)
  }
}

/**
 * Get stored locale preference
 */
export async function getStoredLocalePreference(): Promise<Partial<DeviceLocaleInfo> | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Failed to get stored locale preference:', error)
    return null
  }
}

/**
 * Check if language requires RTL layout
 */
export function isRTLLanguage(language: string): boolean {
  const langConfig = SUPPORTED_LOCALES[language]
  return langConfig?.rtl || false
}

/**
 * Get preferred voice language for text-to-speech
 */
export function getPreferredVoiceLanguage(language: string): string {
  const langConfig = SUPPORTED_LOCALES[language]
  return langConfig?.voice || 'en-US'
}

/**
 * Format number according to locale
 */
export function formatNumberForLocale(
  number: number, 
  localeInfo: DeviceLocaleInfo,
  options?: { 
    style?: 'decimal' | 'currency' | 'percent'
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
): string {
  const { style = 'decimal', minimumFractionDigits = 0, maximumFractionDigits = 2 } = options || {}
  
  try {
    if (style === 'currency') {
      return new Intl.NumberFormat(localeInfo.languageTag, {
        style: 'currency',
        currency: getCurrencyCode(localeInfo.numberFormat.currency),
        minimumFractionDigits,
        maximumFractionDigits
      }).format(number)
    }
    
    return new Intl.NumberFormat(localeInfo.languageTag, {
      style,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(number)
    
  } catch (error) {
    // Fallback to manual formatting
    const formatted = number.toFixed(maximumFractionDigits)
    const [whole, decimal] = formatted.split('.')
    
    // Add thousands separators
    const wholeWithSeparators = whole.replace(/\B(?=(\d{3})+(?!\d))/g, localeInfo.numberFormat.thousands)
    
    return decimal ? `${wholeWithSeparators}${localeInfo.numberFormat.decimal}${decimal}` : wholeWithSeparators
  }
}

/**
 * Get currency code from symbol
 */
function getCurrencyCode(symbol: string): string {
  const currencyMap: Record<string, string> = {
    '$': 'USD',
    '€': 'EUR', 
    '£': 'GBP',
    '¥': 'JPY',
    '₩': 'KRW',
    '₽': 'RUB',
    'R$': 'BRL',
    'C$': 'CAD',
    'A$': 'AUD',
    'ر.س': 'SAR',
    '₹': 'INR',
    '₫': 'VND'
  }
  
  return currencyMap[symbol] || 'USD'
}

/**
 * Initialize device locale detection on app start
 */
export async function initializeDeviceLocale(): Promise<DeviceLocaleInfo> {
  const localeInfo = await detectDeviceLocale()
  
  // Apply RTL layout if needed
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const { I18nManager } = require('react-native')
    
    if (localeInfo.textDirection === 'rtl' && !I18nManager.isRTL) {
      I18nManager.allowRTL(true)
      I18nManager.forceRTL(true)
      // Note: App restart required for RTL changes to take effect
    }
  }
  
  return localeInfo
} 