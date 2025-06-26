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

/**
 * Enhanced bill progress tracking with detailed status information
 */
export function getDetailedBillProgress(actions: any[]): {
  stage: number;
  total: number;
  percentage: number;
  currentStage: string;
  nextStage: string | null;
  timeline: BillProgressEvent[];
  isStalled: boolean;
  daysSinceLastAction: number;
} {
  const stages = [
    { key: 'introduced', label: 'Introduced', order: 1 },
    { key: 'committee_referred', label: 'Referred to Committee', order: 2 },
    { key: 'committee_markup', label: 'Committee Markup', order: 3 },
    { key: 'committee_reported', label: 'Reported by Committee', order: 4 },
    { key: 'floor_consideration', label: 'Floor Consideration', order: 5 },
    { key: 'passed_chamber', label: 'Passed Originating Chamber', order: 6 },
    { key: 'other_chamber', label: 'Sent to Other Chamber', order: 7 },
    { key: 'passed_congress', label: 'Passed Both Chambers', order: 8 },
    { key: 'president', label: 'Sent to President', order: 9 },
    { key: 'signed_law', label: 'Signed into Law', order: 10 }
  ];

  // Analyze actions to determine current stage
  const timeline: BillProgressEvent[] = actions.map(action => ({
    date: action.action_date,
    description: action.action_text,
    type: action.action_type,
    chamber: action.chamber,
    significance: action.significance_score || 3,
    isKeyMilestone: isKeyMilestone(action.action_text)
  }));

  const latestAction = actions[0]; // Assuming sorted by date desc
  const daysSinceLastAction = latestAction 
    ? Math.floor((new Date().getTime() - new Date(latestAction.action_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  let currentStage = 1;
  let currentStageLabel = 'Introduced';

  // Determine current stage based on latest actions
  const actionTexts = actions.map(a => a.action_text.toLowerCase());
  
  if (actionTexts.some(text => text.includes('became public law') || text.includes('signed by president'))) {
    currentStage = 10;
    currentStageLabel = 'Signed into Law';
  } else if (actionTexts.some(text => text.includes('presented to president') || text.includes('enrolled'))) {
    currentStage = 9;
    currentStageLabel = 'Sent to President';
  } else if (actionTexts.some(text => text.includes('passed congress') || (text.includes('passed senate') && text.includes('passed house')))) {
    currentStage = 8;
    currentStageLabel = 'Passed Both Chambers';
  } else if (actionTexts.some(text => text.includes('received in') && text.includes('senate'))) {
    currentStage = 7;
    currentStageLabel = 'Sent to Other Chamber';
  } else if (actionTexts.some(text => text.includes('passed') && (text.includes('house') || text.includes('senate')))) {
    currentStage = 6;
    currentStageLabel = 'Passed Originating Chamber';
  } else if (actionTexts.some(text => text.includes('floor') || text.includes('consideration'))) {
    currentStage = 5;
    currentStageLabel = 'Floor Consideration';
  } else if (actionTexts.some(text => text.includes('reported') && text.includes('committee'))) {
    currentStage = 4;
    currentStageLabel = 'Reported by Committee';
  } else if (actionTexts.some(text => text.includes('markup') || text.includes('committee action'))) {
    currentStage = 3;
    currentStageLabel = 'Committee Markup';
  } else if (actionTexts.some(text => text.includes('referred to') || text.includes('committee'))) {
    currentStage = 2;
    currentStageLabel = 'Referred to Committee';
  }

  const nextStage = currentStage < stages.length ? stages[currentStage].label : null;
  const isStalled = daysSinceLastAction > 60 && currentStage < 8; // 60 days with no action

  return {
    stage: currentStage,
    total: stages.length,
    percentage: (currentStage / stages.length) * 100,
    currentStage: currentStageLabel,
    nextStage,
    timeline: timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    isStalled,
    daysSinceLastAction
  };
}

/**
 * Check if an action represents a key milestone
 */
function isKeyMilestone(actionText: string): boolean {
  const milestones = [
    'introduced', 'referred to committee', 'reported by committee',
    'passed', 'agreed to', 'signed by president', 'became public law',
    'vetoed', 'override', 'enrolled'
  ];
  
  const lowerText = actionText.toLowerCase();
  return milestones.some(milestone => lowerText.includes(milestone));
}

/**
 * Get bill urgency level based on type and content
 */
export function getBillUrgency(bill: any): {
  level: 'low' | 'medium' | 'high' | 'urgent';
  reasons: string[];
  color: string;
} {
  const reasons: string[] = [];
  let urgencyScore = 0;

  // Check bill type
  if (bill.bill_type === 'hjres' || bill.bill_type === 'sjres') {
    urgencyScore += 2;
    reasons.push('Constitutional amendment or joint resolution');
  }

  // Check for emergency keywords
  const urgentKeywords = ['emergency', 'crisis', 'disaster', 'immediate', 'urgent'];
  const titleLower = (bill.title || '').toLowerCase();
  
  urgentKeywords.forEach(keyword => {
    if (titleLower.includes(keyword)) {
      urgencyScore += 3;
      reasons.push(`Contains urgent keyword: "${keyword}"`);
    }
  });

  // Check days since introduction
  if (bill.introduced_date) {
    const daysSince = Math.floor((new Date().getTime() - new Date(bill.introduced_date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 365) {
      urgencyScore -= 1;
      reasons.push('Bill is over 1 year old');
    } else if (daysSince < 30) {
      urgencyScore += 1;
      reasons.push('Recently introduced bill');
    }
  }

  // Check for budget/spending bills
  if (titleLower.includes('appropriation') || titleLower.includes('budget') || titleLower.includes('spending')) {
    urgencyScore += 2;
    reasons.push('Budget or appropriations bill');
  }

  // Determine level and color
  let level: 'low' | 'medium' | 'high' | 'urgent';
  let color: string;

  if (urgencyScore >= 5) {
    level = 'urgent';
    color = 'text-red-600';
  } else if (urgencyScore >= 3) {
    level = 'high';
    color = 'text-orange-600';
  } else if (urgencyScore >= 1) {
    level = 'medium';
    color = 'text-yellow-600';
  } else {
    level = 'low';
    color = 'text-gray-600';
  }

  return { level, reasons, color };
}

/**
 * Get stakeholder impact analysis
 */
export function getStakeholderImpact(bill: any): {
  primaryStakeholders: string[];
  impactLevel: 'minimal' | 'moderate' | 'significant' | 'major';
  affectedSectors: string[];
  geographicScope: 'local' | 'state' | 'regional' | 'national' | 'international';
} {
  const title = (bill.title || '').toLowerCase();
  const description = (bill.description || '').toLowerCase();
  const content = `${title} ${description}`;

  const stakeholders: string[] = [];
  const sectors: string[] = [];

  // Stakeholder detection
  const stakeholderKeywords = {
    'Small Businesses': ['small business', 'entrepreneur', 'startup'],
    'Healthcare Workers': ['healthcare', 'hospital', 'doctor', 'nurse', 'medical'],
    'Teachers & Students': ['education', 'school', 'teacher', 'student', 'university'],
    'Veterans': ['veteran', 'military service', 'va ', 'armed forces'],
    'Seniors': ['senior', 'elderly', 'medicare', 'social security', 'retirement'],
    'Working Families': ['working families', 'middle class', 'worker', 'employee'],
    'Farmers': ['agriculture', 'farmer', 'farming', 'rural', 'crop'],
    'Technology Companies': ['technology', 'tech', 'internet', 'digital', 'cyber'],
    'Environmental Groups': ['environment', 'climate', 'clean energy', 'pollution', 'conservation']
  };

  Object.entries(stakeholderKeywords).forEach(([stakeholder, keywords]) => {
    if (keywords.some(keyword => content.includes(keyword))) {
      stakeholders.push(stakeholder);
    }
  });

  // Sector detection
  const sectorKeywords = {
    'Healthcare': ['health', 'medical', 'hospital', 'insurance'],
    'Education': ['education', 'school', 'student', 'learning'],
    'Technology': ['technology', 'internet', 'cyber', 'digital'],
    'Finance': ['banking', 'financial', 'credit', 'loan', 'tax'],
    'Energy': ['energy', 'oil', 'gas', 'renewable', 'electric'],
    'Transportation': ['transportation', 'highway', 'airport', 'transit'],
    'Agriculture': ['agriculture', 'farm', 'food', 'crop'],
    'Defense': ['defense', 'military', 'security', 'homeland']
  };

  Object.entries(sectorKeywords).forEach(([sector, keywords]) => {
    if (keywords.some(keyword => content.includes(keyword))) {
      sectors.push(sector);
    }
  });

  // Determine impact level
  let impactLevel: 'minimal' | 'moderate' | 'significant' | 'major';
  const stakeholderCount = stakeholders.length;
  const sectorCount = sectors.length;

  if (stakeholderCount >= 4 || sectorCount >= 3) {
    impactLevel = 'major';
  } else if (stakeholderCount >= 2 || sectorCount >= 2) {
    impactLevel = 'significant';
  } else if (stakeholderCount >= 1 || sectorCount >= 1) {
    impactLevel = 'moderate';
  } else {
    impactLevel = 'minimal';
  }

  // Determine geographic scope
  let geographicScope: 'local' | 'state' | 'regional' | 'national' | 'international';
  
  if (content.includes('international') || content.includes('foreign') || content.includes('trade')) {
    geographicScope = 'international';
  } else if (content.includes('national') || content.includes('federal') || title.includes('united states')) {
    geographicScope = 'national';
  } else if (content.includes('regional') || content.includes('multi-state')) {
    geographicScope = 'regional';
  } else if (content.includes('state') || content.includes('governor')) {
    geographicScope = 'state';
  } else {
    geographicScope = 'local';
  }

  return {
    primaryStakeholders: stakeholders.slice(0, 5), // Top 5 stakeholders
    impactLevel,
    affectedSectors: sectors.slice(0, 4), // Top 4 sectors
    geographicScope
  };
}

// Type definitions
interface BillProgressEvent {
  date: string;
  description: string;
  type: string;
  chamber: string;
  significance: number;
  isKeyMilestone: boolean;
} 