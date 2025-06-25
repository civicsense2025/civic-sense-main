// Utility functions for Congressional features

/**
 * Format bill type for display
 */
export function formatBillType(type: string): string {
  const typeMap: Record<string, string> = {
    'hr': 'H.R.',
    's': 'S.',
    'hjres': 'H.J.Res.',
    'sjres': 'S.J.Res.',
    'hconres': 'H.Con.Res.',
    'sconres': 'S.Con.Res.',
    'hres': 'H.Res.',
    'sres': 'S.Res.'
  };
  
  return typeMap[type.toLowerCase()] || type.toUpperCase();
}

/**
 * Get display name for congress member type
 */
export function formatMemberType(type: string): string {
  return type === 'senator' ? 'Senator' : 'Representative';
}

/**
 * Format party affiliation for display
 */
export function formatParty(party: string): { short: string; color: string } {
  if (party?.includes('Democrat')) {
    return { short: 'D', color: 'text-blue-600' };
  } else if (party?.includes('Republican')) {
    return { short: 'R', color: 'text-red-600' };
  } else if (party?.includes('Independent')) {
    return { short: 'I', color: 'text-purple-600' };
  }
  return { short: party?.charAt(0) || '?', color: 'text-gray-600' };
}

/**
 * Get state name from abbreviation
 */
export function getStateName(abbr: string): string {
  const states: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
    'PR': 'Puerto Rico', 'VI': 'Virgin Islands', 'GU': 'Guam',
    'AS': 'American Samoa', 'MP': 'Northern Mariana Islands'
  };
  
  return states[abbr.toUpperCase()] || abbr;
}

/**
 * Get Congress number for a given year
 */
export function getCongressNumber(year: number): number {
  // Congress numbers started at 1 in 1789
  // Each Congress lasts 2 years
  const baseYear = 1789;
  const baseNumber = 1;
  
  return Math.floor((year - baseYear) / 2) + baseNumber;
}

/**
 * Get current Congress number
 */
export function getCurrentCongress(): number {
  return getCongressNumber(new Date().getFullYear());
}

/**
 * Format Congress years
 */
export function getCongressYears(congressNumber: number): string {
  const startYear = 1789 + (congressNumber - 1) * 2;
  const endYear = startYear + 1;
  return `${startYear}-${endYear}`;
}

/**
 * Check if bill text contains placeholder content
 */
export function hasPlaceholderText(text: string): boolean {
  const placeholderPatterns = [
    'text will be available',
    'coming soon',
    'not yet available',
    'pending',
    'text to come',
    'reserved for',
    'placeholder',
    '[reserved]',
    'bill text will be',
    'will be provided',
    'to be added'
  ];
  
  const lowerText = text.toLowerCase();
  return placeholderPatterns.some(pattern => lowerText.includes(pattern));
}

/**
 * Format member display name with title
 */
export function formatMemberDisplayName(member: {
  congress_member_type: string;
  display_name: string;
  current_state: string;
  current_district?: number;
}): string {
  const title = member.congress_member_type === 'senator' ? 'Sen.' : 'Rep.';
  let display = `${title} ${member.display_name} (${member.current_state}`;
  
  if (member.congress_member_type === 'representative' && member.current_district) {
    display += `-${member.current_district}`;
  }
  
  display += ')';
  return display;
}

/**
 * Calculate bill progress stage
 */
export function getBillProgressStage(status: string): {
  stage: number;
  total: number;
  percentage: number;
  label: string;
} {
  const stages = [
    { key: 'introduced', label: 'Introduced', order: 1 },
    { key: 'committee', label: 'In Committee', order: 2 },
    { key: 'passed_house', label: 'Passed House', order: 3 },
    { key: 'passed_senate', label: 'Passed Senate', order: 4 },
    { key: 'president', label: 'To President', order: 5 },
    { key: 'law', label: 'Became Law', order: 6 }
  ];
  
  let currentStage = 1;
  let label = 'Introduced';
  
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes('law')) {
    currentStage = 6;
    label = 'Became Law';
  } else if (lowerStatus.includes('president') || lowerStatus.includes('enrolled')) {
    currentStage = 5;
    label = 'To President';
  } else if (lowerStatus.includes('passed') && lowerStatus.includes('senate')) {
    currentStage = 4;
    label = 'Passed Senate';
  } else if (lowerStatus.includes('passed') && lowerStatus.includes('house')) {
    currentStage = 3;
    label = 'Passed House';
  } else if (lowerStatus.includes('committee')) {
    currentStage = 2;
    label = 'In Committee';
  }
  
  return {
    stage: currentStage,
    total: stages.length,
    percentage: (currentStage / stages.length) * 100,
    label
  };
}

/**
 * Generate Congress.gov URL for a bill
 */
export function getCongressGovUrl(bill: {
  congress_number: number;
  bill_type: string;
  bill_number: number;
}): string {
  const billType = formatBillType(bill.bill_type).toLowerCase().replace(/\./g, '');
  return `https://www.congress.gov/bill/${bill.congress_number}th-congress/${billType}/${bill.bill_number}`;
}

/**
 * Parse action significance from text
 */
export function getActionSignificance(actionText: string): number {
  const highSignificance = [
    'passed', 'approved', 'enacted', 'became law', 'vetoed',
    'vote', 'amendment', 'final passage', 'conference'
  ];
  
  const mediumSignificance = [
    'reported', 'ordered', 'committee', 'hearing', 'markup'
  ];
  
  const lowerText = actionText.toLowerCase();
  
  if (highSignificance.some(term => lowerText.includes(term))) {
    return 9;
  } else if (mediumSignificance.some(term => lowerText.includes(term))) {
    return 6;
  }
  
  return 3;
} 