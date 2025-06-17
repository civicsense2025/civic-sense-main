import { supabase } from "@/lib/supabase"

// Define types for our skill operations
export interface Skill {
  id: string
  skill_name: string
  skill_slug: string
  category_name: string
  description: string
  difficulty_level: number
  is_core_skill: boolean
  mastery_level?: string
  progress_percentage?: number
  questions_attempted?: number
  questions_correct?: number
  last_practiced_at?: string
  needs_practice?: boolean
}

export interface LearningObjective {
  id: string
  skill_id: string
  objective_text: string
  objective_type: string
  mastery_level_required: string
  display_order: number
}

export interface SkillPrerequisite {
  id: string
  skill_id: string
  prerequisite_skill_id: string
  prerequisite_skill_name?: string
  prerequisite_skill_slug?: string
  required_mastery_level: string
  is_strict_requirement: boolean
}

export const skillOperations = {
  // Get user's skills with progress information
  async getUserSkills(userId: string): Promise<Skill[]> {
    try {
      // Handle guest user case
      if (!userId || userId === 'guest-user') {
        // Return mock data for guest users
        return this.getMockSkills();
      }

      // Try to get data from the user_skill_analytics view
      const { data, error } = await supabase
        .from('user_skill_analytics')
        .select('*')
        .eq('user_id', userId)
        .limit(500)

      if (error) {
        console.error('Database error fetching user skills:', error)
        // Fallback to mock skills on database error
        return this.getMockSkills()
      }

      // If no data found, return mock skills
      if (!data || data.length === 0) {
        console.log('No user skill data found, returning mock skills')
        return this.getMockSkills()
      }

      const skills: Skill[] = data.map((row: any) => ({
        id: row.skill_id || `skill-${Math.random()}`,
        skill_name: row.skill_name || 'Unknown Skill',
        skill_slug: row.skill_slug || 'unknown-skill',
        category_name: row.category_name || 'General',
        description: row.description || '', 
        difficulty_level: Number(row.skill_difficulty) || 1,
        is_core_skill: Boolean(row.is_core_skill),
        mastery_level: row.mastery_level || 'novice',
        progress_percentage: Math.round(Number(row.skill_level) || 0),
        questions_attempted: Number(row.questions_attempted) || 0,
        questions_correct: Number(row.questions_correct) || 0,
        last_practiced_at: row.last_practiced_at || null
      }))

      return skills
    } catch (error) {
      console.error(`Error fetching skills for user ${userId}:`, error)
      // Return mock skills on any error
      return this.getMockSkills()
    }
  },

  // Helper method to provide consistent mock skills
  getMockSkills(): Skill[] {
    return [
      {
        id: 'mock-skill-1',
        skill_name: 'Understanding Government',
        skill_slug: 'understanding-government',
        category_name: 'Government',
        description: 'Learn the basics of how government works',
        difficulty_level: 1,
        is_core_skill: true,
        mastery_level: 'beginner',
        progress_percentage: 25,
        questions_attempted: 5,
        questions_correct: 3,
        last_practiced_at: new Date().toISOString()
      },
      {
        id: 'mock-skill-2',
        skill_name: 'Media Literacy',
        skill_slug: 'media-literacy',
        category_name: 'Media',
        description: 'Learn to critically evaluate media sources',
        difficulty_level: 2,
        is_core_skill: true,
        mastery_level: 'beginner',
        progress_percentage: 10,
        questions_attempted: 2,
        questions_correct: 1,
        last_practiced_at: new Date().toISOString()
      },
      {
        id: 'mock-skill-3',
        skill_name: 'Civic Engagement',
        skill_slug: 'civic-engagement',
        category_name: 'Civic Action',
        description: 'Discover ways to participate in your community',
        difficulty_level: 1,
        is_core_skill: true,
        mastery_level: 'novice',
        progress_percentage: 5,
        questions_attempted: 1,
        questions_correct: 1,
        last_practiced_at: new Date().toISOString()
      }
    ];
  },

  // Get a specific skill by slug
  async getSkillBySlug(skillSlug: string): Promise<Skill | null> {
    try {
      // For now, return a mock skill for testing purposes
      // This will be replaced with a direct query once the tables are created
      const mockSkills = this.getMockSkills();
      const matchingSkill = mockSkills.find(s => s.skill_slug === skillSlug);
      
      return matchingSkill || null;
    } catch (error) {
      console.error(`Error fetching skill with slug ${skillSlug}:`, error)
      return null
    }
  },

  // Get detailed skill information (alias for getSkillBySlug for compatibility)
  async getSkillDetails(skillId: string): Promise<{
    skill: Skill | null,
    objectives: LearningObjective[],
    prerequisites: SkillPrerequisite[],
    dependentSkills: SkillPrerequisite[]
  }> {
    try {
      // Try to get skill by ID first, then by slug
      let skill = await this.getSkillBySlug(skillId)
      
      if (!skill) {
        // If not found by slug, try to find by ID in mock skills
        const mockSkills = this.getMockSkills();
        skill = mockSkills.find(s => s.id === skillId) || null;
      }
      
      if (!skill) {
        return {
          skill: null,
          objectives: [],
          prerequisites: [],
          dependentSkills: []
        }
      }
      
      // Get related data
      const [objectives, prerequisites, dependentSkills] = await Promise.all([
        this.getLearningObjectives(skill.id),
        this.getSkillPrerequisites(skill.id),
        this.getDependentSkills(skill.id)
      ])
      
      return {
        skill,
        objectives,
        prerequisites,
        dependentSkills
      }
    } catch (error) {
      console.error(`Error fetching skill details for ${skillId}:`, error)
      return {
        skill: null,
        objectives: [],
        prerequisites: [],
        dependentSkills: []
      }
    }
  },

  // Get learning objectives for a skill
  async getLearningObjectives(skillId: string): Promise<LearningObjective[]> {
    try {
      // For now, return mock data until the actual tables are created
      return [
        {
          id: '1',
          skill_id: skillId,
          objective_text: 'Understand the basic principles of this skill',
          objective_type: 'knowledge',
          mastery_level_required: 'beginner',
          display_order: 1
        },
        {
          id: '2',
          skill_id: skillId,
          objective_text: 'Apply this skill in simple scenarios',
          objective_type: 'application',
          mastery_level_required: 'beginner',
          display_order: 2
        },
        {
          id: '3',
          skill_id: skillId,
          objective_text: 'Analyze complex problems using this skill',
          objective_type: 'analysis',
          mastery_level_required: 'intermediate',
          display_order: 3
        }
      ]
    } catch (error) {
      console.error(`Error fetching learning objectives for skill ${skillId}:`, error)
      return []
    }
  },

  // Get prerequisites for a skill
  async getSkillPrerequisites(skillId: string): Promise<SkillPrerequisite[]> {
    try {
      // For now, return mock data until the actual tables are created
      return [
        {
          id: '1',
          skill_id: skillId,
          prerequisite_skill_id: 'prereq1',
          prerequisite_skill_name: 'Foundation Skill 1',
          prerequisite_skill_slug: 'foundation-skill-1',
          required_mastery_level: 'beginner',
          is_strict_requirement: true
        },
        {
          id: '2',
          skill_id: skillId,
          prerequisite_skill_id: 'prereq2',
          prerequisite_skill_name: 'Foundation Skill 2',
          prerequisite_skill_slug: 'foundation-skill-2',
          required_mastery_level: 'beginner',
          is_strict_requirement: false
        }
      ]
    } catch (error) {
      console.error(`Error fetching prerequisites for skill ${skillId}:`, error)
      return []
    }
  },

  // Get skills that have this skill as a prerequisite (dependent skills)
  async getDependentSkills(skillId: string): Promise<SkillPrerequisite[]> {
    try {
      // For now, return mock data until the actual tables are created
      return [
        {
          id: '1',
          skill_id: 'dep1',
          prerequisite_skill_id: skillId,
          prerequisite_skill_name: 'Advanced Skill 1',
          prerequisite_skill_slug: 'advanced-skill-1',
          required_mastery_level: 'intermediate',
          is_strict_requirement: true
        },
        {
          id: '2',
          skill_id: 'dep2',
          prerequisite_skill_id: skillId,
          prerequisite_skill_name: 'Advanced Skill 2',
          prerequisite_skill_slug: 'advanced-skill-2',
          required_mastery_level: 'intermediate',
          is_strict_requirement: false
        }
      ]
    } catch (error) {
      console.error(`Error fetching dependent skills for skill ${skillId}:`, error)
      return []
    }
  },

  // Helper method to provide consistent mock skill relationships
  getMockSkillRelationships(categoryFilter?: string): {
    nodes: Array<{ id: string, name: string, category: string, level?: string }>,
    links: Array<{ source: string, target: string, required_level: string, is_strict: boolean }>
  } {
    const mockNodes = [
      { id: 'gov-basics', name: 'Government Basics', category: 'Government', level: 'beginner' },
      { id: 'media-literacy', name: 'Media Literacy', category: 'Media', level: 'beginner' },
      { id: 'civic-engagement', name: 'Civic Engagement', category: 'Participation', level: 'intermediate' },
      { id: 'voting-rights', name: 'Voting Rights', category: 'Elections', level: 'beginner' },
      { id: 'fact-checking', name: 'Fact Checking', category: 'Media', level: 'intermediate' },
      { id: 'budget-analysis', name: 'Budget Analysis', category: 'Government', level: 'advanced' }
    ];
    
    const mockLinks = [
      { source: 'gov-basics', target: 'civic-engagement', required_level: 'beginner', is_strict: true },
      { source: 'media-literacy', target: 'civic-engagement', required_level: 'beginner', is_strict: false },
      { source: 'gov-basics', target: 'budget-analysis', required_level: 'intermediate', is_strict: true },
      { source: 'media-literacy', target: 'fact-checking', required_level: 'beginner', is_strict: true },
      { source: 'voting-rights', target: 'civic-engagement', required_level: 'beginner', is_strict: false }
    ];
    
    // Filter by category if specified
    if (categoryFilter) {
      const filteredNodes = mockNodes.filter(node => 
        node.category.toLowerCase() === categoryFilter.toLowerCase()
      );
      
      // Get IDs of filtered nodes
      const nodeIds = new Set(filteredNodes.map(node => node.id));
      
      // Filter links to only include connections between filtered nodes
      const filteredLinks = mockLinks.filter(link => 
        nodeIds.has(link.source) && nodeIds.has(link.target)
      );
      
      return {
        nodes: filteredNodes,
        links: filteredLinks
      };
    }
    
    return {
      nodes: mockNodes,
      links: mockLinks
    };
  },
  
  // Update getAllSkillRelationships to handle guest users
  async getAllSkillRelationships(categoryFilter?: string): Promise<{
    nodes: Array<{ id: string, name: string, category: string, level?: string }>,
    links: Array<{ source: string, target: string, required_level: string, is_strict: boolean }>
  }> {
    try {
      // Get all skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('id, skill_name, category_name, difficulty_level')
      
      if (skillsError) throw skillsError
      
      // Get all skill relationships using direct query instead of RPC
      const { data: relData, error: relError } = await supabase
        .from('skill_prerequisites')
        .select('*')
      
      if (relError) {
        console.error('Error fetching skill relationships:', relError)
        // Fallback to mock data on error
        return this.getMockSkillRelationships(categoryFilter)
      }
      
      // Transform data
      const nodes = (skillsData || []).map((skill: any) => ({
        id: skill.id,
        name: skill.skill_name,
        category: skill.category_name,
        level: this.difficultyToLevel(skill.difficulty_level)
      }))
      
      const links = (relData || []).map((rel: any) => ({
        source: rel.prerequisite_skill_id,
        target: rel.dependent_skill_id,
        required_level: rel.required_mastery_level,
        is_strict: rel.is_strict_requirement
      }))
      
      // Filter by category if specified
      if (categoryFilter && nodes.length > 0) {
        const filteredNodes = nodes.filter(node => 
          node.category.toLowerCase() === categoryFilter.toLowerCase()
        )
        
        // Get IDs of filtered nodes
        const nodeIds = new Set(filteredNodes.map(node => node.id))
        
        // Filter links to only include connections between filtered nodes
        const filteredLinks = links.filter((link: { source: string, target: string }) => 
          nodeIds.has(link.source) && nodeIds.has(link.target)
        )
        
        return {
          nodes: filteredNodes,
          links: filteredLinks
        }
      }
      
      return { nodes, links }
    } catch (error) {
      console.error('Error fetching skill relationships:', error)
      // Return mock data on error
      return this.getMockSkillRelationships(categoryFilter)
    }
  },
  
  // Helper to convert difficulty level to mastery level
  difficultyToLevel(difficulty: number): string {
    switch (difficulty) {
      case 1: return 'beginner'
      case 2: return 'intermediate'
      case 3: return 'advanced'
      case 4: return 'expert'
      default: return 'beginner'
    }
  },

  // Get learning objectives for a user based on their current skills
  async getUserLearningObjectives(userId: string, limit?: number): Promise<{
    skill_slug: string,
    skill_name: string,
    category_name: string,
    objective_text: string,
    mastery_level_required: string,
    objective_type: string,
    display_order: number
  }[]> {
    try {
      // Handle guest user case
      if (!userId || userId === 'guest-user') {
        // Return mock learning objectives for guest users
        return this.getMockLearningObjectives(limit);
      }
      
      // Get user's skills with progress info
      const userSkills = await this.getUserSkills(userId)
      
      // Get all learning objectives using a valid table name
      const { data, error } = await supabase
        .from('skill_learning_objectives')
        .select('*, skills(*)')
        .order('display_order', { ascending: true })
      
      if (error) throw error
      
      // Transform data
      const objectives = (data || []).map((obj: any) => ({
        skill_slug: obj.skills?.skill_slug || '',
        skill_name: obj.skills?.skill_name || '',
        category_name: obj.skills?.category_name || '',
        objective_text: obj.objective_text,
        mastery_level_required: obj.mastery_level_required,
        objective_type: obj.objective_type,
        display_order: obj.display_order
      }))
      
      // Filter and limit
      let result = objectives
      
      // Apply limit if specified
      if (limit && limit > 0) {
        result = result.slice(0, limit)
      }
      
      return result
    } catch (error) {
      console.error(`Error fetching learning objectives for user ${userId}:`, error)
      // Return mock data on error
      return this.getMockLearningObjectives(limit)
    }
  },

  // Helper method to provide consistent mock learning objectives
  getMockLearningObjectives(limit?: number): {
    skill_slug: string,
    skill_name: string,
    category_name: string,
    objective_text: string,
    mastery_level_required: string,
    objective_type: string,
    display_order: number
  }[] {
    const mockObjectives = [
      {
        skill_slug: 'government-basics',
        skill_name: 'Government Basics',
        category_name: 'Government',
        objective_text: 'Understand the three branches of government',
        mastery_level_required: 'beginner',
        objective_type: 'knowledge',
        display_order: 1
      },
      {
        skill_slug: 'media-literacy',
        skill_name: 'Media Literacy',
        category_name: 'Media',
        objective_text: 'Identify reliable news sources',
        mastery_level_required: 'beginner',
        objective_type: 'application',
        display_order: 1
      },
      {
        skill_slug: 'civic-participation',
        skill_name: 'Civic Participation',
        category_name: 'Participation',
        objective_text: 'Learn how to contact your representatives',
        mastery_level_required: 'intermediate',
        objective_type: 'application',
        display_order: 2
      },
      {
        skill_slug: 'voting-rights',
        skill_name: 'Voting Rights',
        category_name: 'Elections',
        objective_text: 'Understand voter registration requirements in your state',
        mastery_level_required: 'beginner',
        objective_type: 'knowledge',
        display_order: 1
      },
      {
        skill_slug: 'fact-checking',
        skill_name: 'Fact Checking',
        category_name: 'Media Literacy',
        objective_text: 'Learn to verify claims using primary sources',
        mastery_level_required: 'intermediate',
        objective_type: 'application',
        display_order: 2
      }
    ];
    
    // Apply limit if specified
    if (limit && limit > 0) {
      return mockObjectives.slice(0, limit);
    }
    
    return mockObjectives;
  },

  // Get user's skill progress - this function was missing
  async getUserSkillProgress(userId: string, skillId: string): Promise<{
    mastery_level: string
    skill_level: number
    questions_attempted: number
    questions_correct: number
    last_practiced_at: string | null
  } | null> {
    try {
      // For now, return mock data until the actual tables are created
      return {
        mastery_level: 'beginner',
        skill_level: 65,
        questions_attempted: 12,
        questions_correct: 8,
        last_practiced_at: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error fetching skill progress for user ${userId}, skill ${skillId}:`, error)
      return null
    }
  }
} 