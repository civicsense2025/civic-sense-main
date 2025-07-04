import { UIStrings } from '../ui-strings';

// Import all translations
import { strings as enStrings } from './en';
import { strings as esStrings } from './es';
import { strings as frStrings } from './fr';
import { strings as itStrings } from './it';
import { strings as jaStrings } from './ja';
import { strings as koStrings } from './ko';
import { strings as ptStrings } from './pt';
import { strings as zhStrings } from './zh';
import { strings as viStrings } from './vi';
import { strings as deStrings } from './de';
import { strings as arStrings } from './ar';
import { strings as ruStrings } from './ru';

// Export all translations
export const translations: Record<string, UIStrings> = {
  en: enStrings,
  es: esStrings,
  fr: frStrings,
  it: itStrings,
  ja: jaStrings,
  ko: koStrings,
  pt: ptStrings,
  zh: zhStrings,
  vi: viStrings,
  de: deStrings,
  ar: arStrings,
  ru: ruStrings
}; 