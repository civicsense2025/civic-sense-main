/**
 * CivicSense Date & Number Formatting System
 * 
 * Provides localized formatting for dates, numbers, and civic-specific content
 * Integrates with the UI strings system for consistent internationalization
 */

export interface LocaleFormattingRules {
  // Date formatting
  dateFormat: {
    short: string; // 12/31/2023 (US) vs 31/12/2023 (EU)
    medium: string; // Dec 31, 2023 vs 31 Dic 2023
    long: string; // December 31, 2023 vs 31 de diciembre de 2023
    relative: {
      today: string;
      yesterday: string;
      tomorrow: string;
      daysAgo: string; // "{n} days ago"
      weeksAgo: string; // "{n} weeks ago"
      monthsAgo: string; // "{n} months ago"
    };
  };
  
  // Number formatting
  numberFormat: {
    decimal: string; // "." vs ","
    thousands: string; // "," vs "." vs " "
    currency: {
      symbol: string;
      position: 'before' | 'after';
      spacing: boolean;
    };
    percentage: {
      symbol: string;
      spacing: boolean;
    };
  };
  
  // Civic-specific formatting
  civic: {
    votingNumbers: {
      millions: string; // "1.2M votes" vs "1,2M votos"
      thousands: string; // "15.5K votes" vs "15,5K votos"
    };
    districts: {
      format: string; // "District {n}" vs "Distrito {n}"
    };
    terms: {
      format: string; // "{n}-year term" vs "mandato de {n} años"
    };
  };
  
  // Time zone handling
  timeZone: {
    default: string;
    format: '12h' | '24h';
    labels: {
      am: string;
      pm: string;
    };
  };
}

// Comprehensive locale formatting rules
export const LOCALE_FORMATTING: Record<string, LocaleFormattingRules> = {
  'en': {
    dateFormat: {
      short: 'MM/dd/yyyy',
      medium: 'MMM dd, yyyy',
      long: 'MMMM dd, yyyy',
      relative: {
        today: 'today',
        yesterday: 'yesterday',
        tomorrow: 'tomorrow',
        daysAgo: '{n} days ago',
        weeksAgo: '{n} weeks ago',
        monthsAgo: '{n} months ago',
      },
    },
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: {
        symbol: '$',
        position: 'before',
        spacing: false,
      },
      percentage: {
        symbol: '%',
        spacing: false,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n}M votes',
        thousands: '{n}K votes',
      },
      districts: {
        format: 'District {n}',
      },
      terms: {
        format: '{n}-year term',
      },
    },
    timeZone: {
      default: 'America/New_York',
      format: '12h',
      labels: {
        am: 'AM',
        pm: 'PM',
      },
    },
  },
  
  'es': {
    dateFormat: {
      short: 'dd/MM/yyyy',
      medium: 'dd MMM yyyy',
      long: 'dd \'de\' MMMM \'de\' yyyy',
      relative: {
        today: 'hoy',
        yesterday: 'ayer',
        tomorrow: 'mañana',
        daysAgo: 'hace {n} días',
        weeksAgo: 'hace {n} semanas',
        monthsAgo: 'hace {n} meses',
      },
    },
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: {
        symbol: '$',
        position: 'before',
        spacing: true,
      },
      percentage: {
        symbol: '%',
        spacing: false,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n}M votos',
        thousands: '{n}K votos',
      },
      districts: {
        format: 'Distrito {n}',
      },
      terms: {
        format: 'mandato de {n} años',
      },
    },
    timeZone: {
      default: 'America/Mexico_City',
      format: '24h',
      labels: {
        am: 'AM',
        pm: 'PM',
      },
    },
  },
  
  'zh': {
    dateFormat: {
      short: 'yyyy/MM/dd',
      medium: 'yyyy年MM月dd日',
      long: 'yyyy年MM月dd日',
      relative: {
        today: '今天',
        yesterday: '昨天',
        tomorrow: '明天',
        daysAgo: '{n}天前',
        weeksAgo: '{n}周前',
        monthsAgo: '{n}个月前',
      },
    },
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: {
        symbol: '¥',
        position: 'before',
        spacing: false,
      },
      percentage: {
        symbol: '%',
        spacing: false,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n}百万票',
        thousands: '{n}千票',
      },
      districts: {
        format: '第{n}区',
      },
      terms: {
        format: '{n}年任期',
      },
    },
    timeZone: {
      default: 'Asia/Shanghai',
      format: '24h',
      labels: {
        am: '上午',
        pm: '下午',
      },
    },
  },
  
  'ar': {
    dateFormat: {
      short: 'dd/MM/yyyy',
      medium: 'dd MMM yyyy',
      long: 'dd MMMM yyyy',
      relative: {
        today: 'اليوم',
        yesterday: 'أمس',
        tomorrow: 'غداً',
        daysAgo: 'منذ {n} أيام',
        weeksAgo: 'منذ {n} أسابيع',
        monthsAgo: 'منذ {n} أشهر',
      },
    },
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: {
        symbol: 'ر.س',
        position: 'after',
        spacing: true,
      },
      percentage: {
        symbol: '%',
        spacing: false,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n} مليون صوت',
        thousands: '{n} ألف صوت',
      },
      districts: {
        format: 'المقاطعة {n}',
      },
      terms: {
        format: 'فترة {n} سنوات',
      },
    },
    timeZone: {
      default: 'Asia/Riyadh',
      format: '12h',
      labels: {
        am: 'ص',
        pm: 'م',
      },
    },
  },
  
  'fr': {
    dateFormat: {
      short: 'dd/MM/yyyy',
      medium: 'dd MMM yyyy',
      long: 'dd MMMM yyyy',
      relative: {
        today: 'aujourd\'hui',
        yesterday: 'hier',
        tomorrow: 'demain',
        daysAgo: 'il y a {n} jours',
        weeksAgo: 'il y a {n} semaines',
        monthsAgo: 'il y a {n} mois',
      },
    },
    numberFormat: {
      decimal: ',',
      thousands: ' ',
      currency: {
        symbol: '€',
        position: 'after',
        spacing: true,
      },
      percentage: {
        symbol: '%',
        spacing: true,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n}M votes',
        thousands: '{n}K votes',
      },
      districts: {
        format: 'District {n}',
      },
      terms: {
        format: 'mandat de {n} ans',
      },
    },
    timeZone: {
      default: 'Europe/Paris',
      format: '24h',
      labels: {
        am: 'AM',
        pm: 'PM',
      },
    },
  },
  
  'de': {
    dateFormat: {
      short: 'dd.MM.yyyy',
      medium: 'dd. MMM yyyy',
      long: 'dd. MMMM yyyy',
      relative: {
        today: 'heute',
        yesterday: 'gestern',
        tomorrow: 'morgen',
        daysAgo: 'vor {n} Tagen',
        weeksAgo: 'vor {n} Wochen',
        monthsAgo: 'vor {n} Monaten',
      },
    },
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: {
        symbol: '€',
        position: 'after',
        spacing: true,
      },
      percentage: {
        symbol: '%',
        spacing: false,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n}M Stimmen',
        thousands: '{n}K Stimmen',
      },
      districts: {
        format: 'Bezirk {n}',
      },
      terms: {
        format: '{n}-jährige Amtszeit',
      },
    },
    timeZone: {
      default: 'Europe/Berlin',
      format: '24h',
      labels: {
        am: 'AM',
        pm: 'PM',
      },
    },
  },
  
  'pt': {
    dateFormat: {
      short: 'dd/MM/yyyy',
      medium: 'dd \'de\' MMM \'de\' yyyy',
      long: 'dd \'de\' MMMM \'de\' yyyy',
      relative: {
        today: 'hoje',
        yesterday: 'ontem',
        tomorrow: 'amanhã',
        daysAgo: 'há {n} dias',
        weeksAgo: 'há {n} semanas',
        monthsAgo: 'há {n} meses',
      },
    },
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: {
        symbol: 'R$',
        position: 'before',
        spacing: true,
      },
      percentage: {
        symbol: '%',
        spacing: false,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n}M votos',
        thousands: '{n}K votos',
      },
      districts: {
        format: 'Distrito {n}',
      },
      terms: {
        format: 'mandato de {n} anos',
      },
    },
    timeZone: {
      default: 'America/Sao_Paulo',
      format: '24h',
      labels: {
        am: 'AM',
        pm: 'PM',
      },
    },
  },
  
  'hi': {
    dateFormat: {
      short: 'dd/MM/yyyy',
      medium: 'dd MMM yyyy',
      long: 'dd MMMM yyyy',
      relative: {
        today: 'आज',
        yesterday: 'कल',
        tomorrow: 'कल',
        daysAgo: '{n} दिन पहले',
        weeksAgo: '{n} सप्ताह पहले',
        monthsAgo: '{n} महीने पहले',
      },
    },
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: {
        symbol: '₹',
        position: 'before',
        spacing: false,
      },
      percentage: {
        symbol: '%',
        spacing: false,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n}M वोट',
        thousands: '{n}K वोट',
      },
      districts: {
        format: 'जिला {n}',
      },
      terms: {
        format: '{n} साल का कार्यकाल',
      },
    },
    timeZone: {
      default: 'Asia/Kolkata',
      format: '12h',
      labels: {
        am: 'पूर्वाह्न',
        pm: 'अपराह्न',
      },
    },
  },
  
  'ru': {
    dateFormat: {
      short: 'dd.MM.yyyy',
      medium: 'dd MMM yyyy г.',
      long: 'dd MMMM yyyy г.',
      relative: {
        today: 'сегодня',
        yesterday: 'вчера',
        tomorrow: 'завтра',
        daysAgo: '{n} дней назад',
        weeksAgo: '{n} недель назад',
        monthsAgo: '{n} месяцев назад',
      },
    },
    numberFormat: {
      decimal: ',',
      thousands: ' ',
      currency: {
        symbol: '₽',
        position: 'after',
        spacing: true,
      },
      percentage: {
        symbol: '%',
        spacing: false,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n}M голосов',
        thousands: '{n}K голосов',
      },
      districts: {
        format: 'Округ {n}',
      },
      terms: {
        format: '{n}-летний срок',
      },
    },
    timeZone: {
      default: 'Europe/Moscow',
      format: '24h',
      labels: {
        am: 'AM',
        pm: 'PM',
      },
    },
  },
  
  'ja': {
    dateFormat: {
      short: 'yyyy/MM/dd',
      medium: 'yyyy年MM月dd日',
      long: 'yyyy年MM月dd日',
      relative: {
        today: '今日',
        yesterday: '昨日',
        tomorrow: '明日',
        daysAgo: '{n}日前',
        weeksAgo: '{n}週間前',
        monthsAgo: '{n}ヶ月前',
      },
    },
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: {
        symbol: '¥',
        position: 'before',
        spacing: false,
      },
      percentage: {
        symbol: '%',
        spacing: false,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n}百万票',
        thousands: '{n}千票',
      },
      districts: {
        format: '第{n}区',
      },
      terms: {
        format: '{n}年の任期',
      },
    },
    timeZone: {
      default: 'Asia/Tokyo',
      format: '24h',
      labels: {
        am: '午前',
        pm: '午後',
      },
    },
  },
  
  'ko': {
    dateFormat: {
      short: 'yyyy. MM. dd.',
      medium: 'yyyy년 MM월 dd일',
      long: 'yyyy년 MM월 dd일',
      relative: {
        today: '오늘',
        yesterday: '어제',
        tomorrow: '내일',
        daysAgo: '{n}일 전',
        weeksAgo: '{n}주 전',
        monthsAgo: '{n}개월 전',
      },
    },
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: {
        symbol: '₩',
        position: 'before',
        spacing: false,
      },
      percentage: {
        symbol: '%',
        spacing: false,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n}백만 표',
        thousands: '{n}천 표',
      },
      districts: {
        format: '제{n}구',
      },
      terms: {
        format: '{n}년 임기',
      },
    },
    timeZone: {
      default: 'Asia/Seoul',
      format: '12h',
      labels: {
        am: '오전',
        pm: '오후',
      },
    },
  },
  
  'it': {
    dateFormat: {
      short: 'dd/MM/yyyy',
      medium: 'dd MMM yyyy',
      long: 'dd MMMM yyyy',
      relative: {
        today: 'oggi',
        yesterday: 'ieri',
        tomorrow: 'domani',
        daysAgo: '{n} giorni fa',
        weeksAgo: '{n} settimane fa',
        monthsAgo: '{n} mesi fa',
      },
    },
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: {
        symbol: '€',
        position: 'after',
        spacing: true,
      },
      percentage: {
        symbol: '%',
        spacing: false,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n}M voti',
        thousands: '{n}K voti',
      },
      districts: {
        format: 'Distretto {n}',
      },
      terms: {
        format: 'mandato di {n} anni',
      },
    },
    timeZone: {
      default: 'Europe/Rome',
      format: '24h',
      labels: {
        am: 'AM',
        pm: 'PM',
      },
    },
  },
  
  'vi': {
    dateFormat: {
      short: 'dd/MM/yyyy',
      medium: 'dd tháng MM, yyyy',
      long: 'dd tháng MM năm yyyy',
      relative: {
        today: 'hôm nay',
        yesterday: 'hôm qua',
        tomorrow: 'ngày mai',
        daysAgo: '{n} ngày trước',
        weeksAgo: '{n} tuần trước',
        monthsAgo: '{n} tháng trước',
      },
    },
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: {
        symbol: '₫',
        position: 'after',
        spacing: true,
      },
      percentage: {
        symbol: '%',
        spacing: false,
      },
    },
    civic: {
      votingNumbers: {
        millions: '{n}M phiếu',
        thousands: '{n}K phiếu',
      },
      districts: {
        format: 'Quận {n}',
      },
      terms: {
        format: 'nhiệm kỳ {n} năm',
      },
    },
    timeZone: {
      default: 'Asia/Ho_Chi_Minh',
      format: '24h',
      labels: {
        am: 'SA',
        pm: 'CH',
      },
    },
  },
};

/**
 * Enhanced date/number formatter with civic-specific formatting
 */
export class CivicLocaleFormatter {
  private locale: string;
  private rules: LocaleFormattingRules;

  constructor(locale: string = 'en') {
    this.locale = locale;
    this.rules = LOCALE_FORMATTING[locale] || LOCALE_FORMATTING['en'];
  }

  // Date formatting methods
  formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
    try {
      const options: Intl.DateTimeFormatOptions = {};
      
      switch (format) {
        case 'short':
          options.dateStyle = 'short';
          break;
        case 'medium':
          options.dateStyle = 'medium';
          break;
        case 'long':
          options.dateStyle = 'long';
          break;
      }
      
      return new Intl.DateTimeFormat(this.locale, options).format(date);
    } catch (error) {
      // Fallback to English formatting
      return new Intl.DateTimeFormat('en-US', { dateStyle: format }).format(date);
    }
  }

  formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInDays === 0) {
      return this.rules.dateFormat.relative.today;
    } else if (diffInDays === 1) {
      return this.rules.dateFormat.relative.yesterday;
    } else if (diffInDays === -1) {
      return this.rules.dateFormat.relative.tomorrow;
    } else if (diffInDays < 7) {
      return this.rules.dateFormat.relative.daysAgo.replace('{n}', diffInDays.toString());
    } else if (diffInWeeks < 4) {
      return this.rules.dateFormat.relative.weeksAgo.replace('{n}', diffInWeeks.toString());
    } else {
      return this.rules.dateFormat.relative.monthsAgo.replace('{n}', diffInMonths.toString());
    }
  }

  // Number formatting methods
  formatNumber(num: number): string {
    try {
      return new Intl.NumberFormat(this.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(num);
    } catch (error) {
      return num.toLocaleString('en-US');
    }
  }

  formatCurrency(amount: number, currencyCode?: string): string {
    try {
      const currency = currencyCode || 'USD';
      return new Intl.NumberFormat(this.locale, {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (error) {
      const symbol = this.rules.numberFormat.currency.symbol;
      const formatted = this.formatNumber(amount);
      
      if (this.rules.numberFormat.currency.position === 'before') {
        return this.rules.numberFormat.currency.spacing ? `${symbol} ${formatted}` : `${symbol}${formatted}`;
      } else {
        return this.rules.numberFormat.currency.spacing ? `${formatted} ${symbol}` : `${formatted}${symbol}`;
      }
    }
  }

  formatPercentage(num: number): string {
    try {
      return new Intl.NumberFormat(this.locale, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(num / 100);
    } catch (error) {
      const formatted = this.formatNumber(num);
      const symbol = this.rules.numberFormat.percentage.symbol;
      return this.rules.numberFormat.percentage.spacing ? `${formatted} ${symbol}` : `${formatted}${symbol}`;
    }
  }

  // Civic-specific formatting methods
  formatVotingNumbers(votes: number): string {
    if (votes >= 1000000) {
      const millions = Math.round(votes / 100000) / 10; // Round to 1 decimal
      return this.rules.civic.votingNumbers.millions.replace('{n}', millions.toString());
    } else if (votes >= 1000) {
      const thousands = Math.round(votes / 100) / 10; // Round to 1 decimal
      return this.rules.civic.votingNumbers.thousands.replace('{n}', thousands.toString());
    } else {
      return `${this.formatNumber(votes)} ${this.locale === 'en' ? 'votes' : 'votos'}`;
    }
  }

  formatDistrict(districtNumber: number): string {
    return this.rules.civic.districts.format.replace('{n}', districtNumber.toString());
  }

  formatTerm(years: number): string {
    return this.rules.civic.terms.format.replace('{n}', years.toString());
  }

  // Time formatting
  formatTime(date: Date): string {
    try {
      const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: this.rules.timeZone.format === '12h',
      };
      
      return new Intl.DateTimeFormat(this.locale, options).format(date);
    } catch (error) {
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      if (this.rules.timeZone.format === '12h') {
        const hour12 = hours % 12 || 12;
        const ampm = hours >= 12 ? this.rules.timeZone.labels.pm : this.rules.timeZone.labels.am;
        return `${hour12}:${minutes} ${ampm}`;
      } else {
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      }
    }
  }

  // Utility methods
  getLocaleRules(): LocaleFormattingRules {
    return this.rules;
  }

  static getSupportedLocales(): string[] {
    return Object.keys(LOCALE_FORMATTING);
  }

  static isRTL(locale: string): boolean {
    const rtlLocales = ['ar', 'he', 'fa', 'ur'];
    return rtlLocales.includes(locale);
  }
}

// Export convenience functions
export const formatDate = (date: Date, locale: string, format: 'short' | 'medium' | 'long' = 'medium') => {
  const formatter = new CivicLocaleFormatter(locale);
  return formatter.formatDate(date, format);
};

export const formatRelativeDate = (date: Date, locale: string) => {
  const formatter = new CivicLocaleFormatter(locale);
  return formatter.formatRelativeDate(date);
};

export const formatNumber = (num: number, locale: string) => {
  const formatter = new CivicLocaleFormatter(locale);
  return formatter.formatNumber(num);
};

export const formatVotingNumbers = (votes: number, locale: string) => {
  const formatter = new CivicLocaleFormatter(locale);
  return formatter.formatVotingNumbers(votes);
};

export const formatDistrict = (districtNumber: number, locale: string) => {
  const formatter = new CivicLocaleFormatter(locale);
  return formatter.formatDistrict(districtNumber);
};

export const formatTerm = (years: number, locale: string) => {
  const formatter = new CivicLocaleFormatter(locale);
  return formatter.formatTerm(years);
};

export default CivicLocaleFormatter; 