/**
 * CivicSense AI Personality Manager
 * Manages civic education expert personalities for chat interactions
 */

export interface CivicPersonality {
  code: string;
  name: string;
  title: string;
  category: 'constitutional' | 'local_government' | 'activism' | 'journalism' | 'legal' | 'education';
  expertise: string[];
  personality_traits: string[];
  speaking_style: 'academic' | 'conversational' | 'passionate' | 'analytical' | 'practical';
  civic_focus: string;
}

export interface ChatContext {
  topic?: string;
  userId?: string;
  sessionId: string;
}

export interface ExpertPanelOptions extends ChatContext {
  maxExperts?: number;
}

export interface PersonalityResponse {
  personality: CivicPersonality;
  message: string;
  confidence: number;
  civic_insights: string[];
  action_suggestions: string[];
}

export interface ExpertPanelResponse {
  experts: PersonalityResponse[];
  consensus_points: string[];
  action_recommendations: string[];
  topic_analysis: string;
}

class PersonalityManager {
  private personalities: CivicPersonality[] = [
    {
      code: 'maya_college',
      name: 'Maya Chen',
      title: 'Political Science Student',
      category: 'education',
      expertise: ['constitutional_law', 'voting_rights', 'student_government'],
      personality_traits: ['curious', 'analytical', 'collaborative'],
      speaking_style: 'conversational',
      civic_focus: 'Youth civic engagement and constitutional literacy'
    },
    {
      code: 'james_veteran',
      name: 'James Rodriguez',
      title: 'Army Veteran & Civic Educator',
      category: 'activism',
      expertise: ['military_service', 'veteran_affairs', 'civic_duty', 'leadership'],
      personality_traits: ['disciplined', 'direct', 'service_oriented'],
      speaking_style: 'practical',
      civic_focus: 'Duty-based civic engagement and military-civilian bridge'
    },
    {
      code: 'michael_lawyer',
      name: 'Michael Thompson',
      title: 'Civil Rights Attorney',
      category: 'legal',
      expertise: ['civil_rights', 'constitutional_law', 'litigation', 'equality'],
      personality_traits: ['precise', 'passionate', 'justice_focused'],
      speaking_style: 'analytical',
      civic_focus: 'Legal pathways for democratic change and civil rights protection'
    },
    {
      code: 'anna_journalist',
      name: 'Anna Williams',
      title: 'Investigative Reporter',
      category: 'journalism',
      expertise: ['investigative_reporting', 'government_transparency', 'media_literacy'],
      personality_traits: ['inquisitive', 'skeptical', 'truth_seeking'],
      speaking_style: 'analytical',
      civic_focus: 'Government accountability and informed citizenship'
    },
    {
      code: 'carlos_activist',
      name: 'Carlos Martinez',
      title: 'Community Organizer',
      category: 'activism',
      expertise: ['grassroots_organizing', 'local_politics', 'community_engagement'],
      personality_traits: ['passionate', 'collaborative', 'action_oriented'],
      speaking_style: 'passionate',
      civic_focus: 'Bottom-up democratic change and community empowerment'
    }
  ];

  // Find best personality match for a topic
  async autoMatchAndChat(message: string, context: ChatContext): Promise<PersonalityResponse> {
    // Simple topic matching - in a real implementation, this would use AI
    const lowercaseMessage = message.toLowerCase();
    
    let bestPersonality = this.personalities[0]; // Default fallback
    
    if (lowercaseMessage.includes('constitution') || lowercaseMessage.includes('rights')) {
      bestPersonality = this.personalities.find(p => p.code === 'michael_lawyer') || bestPersonality;
    } else if (lowercaseMessage.includes('media') || lowercaseMessage.includes('transparency')) {
      bestPersonality = this.personalities.find(p => p.code === 'anna_journalist') || bestPersonality;
    } else if (lowercaseMessage.includes('community') || lowercaseMessage.includes('local')) {
      bestPersonality = this.personalities.find(p => p.code === 'carlos_activist') || bestPersonality;
    } else if (lowercaseMessage.includes('military') || lowercaseMessage.includes('veteran')) {
      bestPersonality = this.personalities.find(p => p.code === 'james_veteran') || bestPersonality;
    }

    return this.generatePersonalityResponse(bestPersonality, message, context);
  }

  // Chat with a specific personality
  async chatWithPersonality(personalityCode: string, message: string, context: ChatContext): Promise<PersonalityResponse> {
    const personality = this.personalities.find(p => p.code === personalityCode);
    if (!personality) {
      throw new Error(`Personality ${personalityCode} not found`);
    }
    
    return this.generatePersonalityResponse(personality, message, context);
  }

  // Get expert panel discussion
  async getExpertPanel(message: string, options: ExpertPanelOptions): Promise<ExpertPanelResponse> {
    const maxExperts = Math.min(options.maxExperts || 3, this.personalities.length);
    
    // Select diverse personalities for the panel
    const selectedPersonalities = this.personalities.slice(0, maxExperts);
    
    const experts: PersonalityResponse[] = [];
    for (const personality of selectedPersonalities) {
      const response = await this.generatePersonalityResponse(personality, message, options);
      experts.push(response);
    }

    return {
      experts,
      consensus_points: [
        'Democratic participation requires informed citizenship',
        'Multiple perspectives strengthen democratic discourse',
        'Action is essential for meaningful civic engagement'
      ],
      action_recommendations: [
        'Research the topic through multiple credible sources',
        'Engage with your local representatives',
        'Participate in community discussions',
        'Stay informed about upcoming elections and issues'
      ],
      topic_analysis: `The expert panel discussed "${message}" from various civic perspectives, emphasizing both institutional and grassroots approaches to democratic engagement.`
    };
  }

  // Get personalities by category
  async getPersonalitiesByCategory(category: string): Promise<CivicPersonality[]> {
    return this.personalities.filter(p => p.category === category);
  }

  // Find personalities suited for a topic
  async findPersonalitiesForTopic(topic: string): Promise<CivicPersonality[]> {
    const topicLower = topic.toLowerCase();
    return this.personalities.filter(personality => 
      personality.expertise.some(exp => 
        exp.toLowerCase().includes(topicLower) || 
        topicLower.includes(exp.toLowerCase())
      )
    );
  }

  // Get all personalities
  async getAllPersonalities(): Promise<CivicPersonality[]> {
    return [...this.personalities];
  }

  // Generate personality-specific response
  private async generatePersonalityResponse(
    personality: CivicPersonality, 
    message: string, 
    context: ChatContext
  ): Promise<PersonalityResponse> {
    // In a real implementation, this would call an AI service
    // For now, return a structured response based on personality traits
    
    const baseResponse = this.getPersonalityBasedResponse(personality, message);
    
    return {
      personality,
      message: baseResponse,
      confidence: 0.85,
      civic_insights: this.generateCivicInsights(personality, message),
      action_suggestions: this.generateActionSuggestions(personality, message)
    };
  }

  private getPersonalityBasedResponse(personality: CivicPersonality, message: string): string {
    const responses: Record<string, string> = {
      'maya_college': `As someone studying political science, I think about ${message} from both theoretical and practical perspectives. This connects to broader patterns in American democracy...`,
      'james_veteran': `From my military service experience, I approach ${message} with discipline and a focus on civic duty. Here's what I think citizens need to understand...`,
      'michael_lawyer': `From a legal standpoint, ${message} involves important constitutional principles. Let me break down the key legal frameworks...`,
      'anna_journalist': `As an investigative reporter, I want to examine ${message} by following the facts and asking tough questions about power structures...`,
      'carlos_activist': `From a community organizing perspective, ${message} is about empowering people to create change from the ground up. Here's how we can take action...`
    };

    return responses[personality.code] || `From my expertise in ${personality.civic_focus}, I believe ${message} requires us to think critically about democratic participation...`;
  }

  private generateCivicInsights(personality: CivicPersonality, message: string): string[] {
    return [
      `${personality.name} emphasizes the importance of understanding institutional processes`,
      `This perspective highlights how individual actions connect to systemic change`,
      `The discussion reveals multiple pathways for democratic engagement`
    ];
  }

  private generateActionSuggestions(personality: CivicPersonality, message: string): string[] {
    const common = [
      'Research the topic through multiple credible sources',
      'Discuss with others to gain different perspectives',
      'Contact your representatives about this issue'
    ];

    const specific = {
      'legal': ['Review relevant laws and court cases', 'Understand your legal rights'],
      'journalism': ['Fact-check information from multiple sources', 'Follow investigative reporting on the topic'],
      'activism': ['Join community organizations working on this issue', 'Attend local government meetings'],
      'education': ['Take courses or workshops on the topic', 'Teach others what you learn'],
      'constitutional': ['Study constitutional principles involved', 'Learn about checks and balances'],
      'local_government': ['Attend city council meetings', 'Learn about local election processes']
    };

    return [...common, ...(specific[personality.category] || [])];
  }
}

// Singleton instance
let personalityManagerInstance: PersonalityManager | null = null;

export function getPersonalityManager(): PersonalityManager {
  if (!personalityManagerInstance) {
    personalityManagerInstance = new PersonalityManager();
  }
  return personalityManagerInstance;
}

// Export types and main function
export { PersonalityManager };
export default getPersonalityManager; 