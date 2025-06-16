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
      const { data, error } = await supabase
        .from('user_skill_analytics')
        .select('*')
        .eq('user_id', userId)
        .limit(500)

      if (error) throw error

      const skills: Skill[] = (data || []).map((row: any) => ({
        id: row.skill_id,
        skill_name: row.skill_name,
        skill_slug: row.skill_slug,
        category_name: row.category_name,
        description: '', // description not in view; can be fetched separately if needed
        difficulty_level: row.skill_difficulty || 1,
        is_core_skill: row.is_core_skill || false,
        mastery_level: row.mastery_level,
        progress_percentage: Math.round(row.skill_level ?? 0),
        questions_attempted: row.questions_attempted,
        questions_correct: row.questions_correct,
        last_practiced_at: row.last_practiced_at
      }))

      return skills
    } catch (error) {
      console.error(`Error fetching skills for user ${userId}:`, error)
      return []
    }
  },

  // Get a specific skill by slug
  async getSkillBySlug(skillSlug: string): Promise<Skill | null> {
    try {
      // For now, we'll get all skills and find the one with matching slug
      // This will be replaced with a direct query once the tables are created
      const { skillOperations: existingSkillOps } = await import('@/lib/database')
      const allSkills = await existingSkillOps.getAll()
      
      const matchingSkill = allSkills.find(s => 
        s.name.toLowerCase().replace(/\s+/g, '-') === skillSlug
      )
      
      if (!matchingSkill) return null
      
      return {
        id: matchingSkill.id,
        skill_name: matchingSkill.name,
        skill_slug: matchingSkill.name.toLowerCase().replace(/\s+/g, '-'),
        category_name: matchingSkill.name, // Using name as category for now
        description: matchingSkill.description || '', // Convert null to empty string
        difficulty_level: 1,
        is_core_skill: true
      }
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
        // If not found by slug, try to find by ID
        const { skillOperations: existingSkillOps } = await import('@/lib/database')
        const allSkills = await existingSkillOps.getAll()
        const matchingSkill = allSkills.find(s => s.id === skillId)
        
        if (matchingSkill) {
          skill = {
            id: matchingSkill.id,
            skill_name: matchingSkill.name,
            skill_slug: matchingSkill.name.toLowerCase().replace(/\s+/g, '-'),
            category_name: matchingSkill.name,
            description: matchingSkill.description || '',
            difficulty_level: 1,
            is_core_skill: true
          }
        }
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

  // Get all skill relationships for visualization
  async getAllSkillRelationships(): Promise<{
    nodes: Array<{ id: string, name: string, category: string, level?: string }>,
    links: Array<{ source: string, target: string, required_level: string, is_strict: boolean }>
  }> {
    try {
      // Get all skills to create nodes
      const { skillOperations: existingSkillOps } = await import('@/lib/database')
      const allSkills = await existingSkillOps.getAll()
      
      // Create nodes from skills
      const nodes = allSkills.map(skill => ({
        id: skill.name.toLowerCase().replace(/\s+/g, '-'),
        name: skill.name,
        category: skill.name, // Using name as category for now
        level: 'beginner'
      }))
      
      // Create some mock links for visualization
      const links: Array<{ source: string, target: string, required_level: string, is_strict: boolean }> = []
      
      // Create connections between some of the skills
      if (nodes.length > 1) {
        for (let i = 1; i < Math.min(nodes.length, 10); i++) {
          links.push({
            source: nodes[i].id,
            target: nodes[0].id, // Connect to the first node
            required_level: 'beginner',
            is_strict: i % 2 === 0
          })
        }
      }
      
      return { nodes, links }
    } catch (error) {
      console.error('Error fetching skill relationships:', error)
      return { nodes: [], links: [] }
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
      // Get user skills
      const userSkills = await this.getUserSkills(userId)
      
      // Create some learning objectives based on the user's skills
      let objectives: Array<{
        skill_slug: string,
        skill_name: string,
        category_name: string,
        objective_text: string,
        mastery_level_required: string,
        objective_type: string,
        display_order: number
      }> = []
      
      // Add objectives for each skill
      for (const skill of userSkills.slice(0, 3)) {
        objectives.push({
          skill_slug: skill.skill_slug,
          skill_name: skill.skill_name,
          category_name: skill.category_name,
          objective_text: `Understand the basic principles of ${skill.skill_name}`,
          mastery_level_required: 'beginner',
          objective_type: 'knowledge',
          display_order: 1
        })
        
        objectives.push({
          skill_slug: skill.skill_slug,
          skill_name: skill.skill_name,
          category_name: skill.category_name,
          objective_text: `Apply ${skill.skill_name} in real-world scenarios`,
          mastery_level_required: 'intermediate',
          objective_type: 'application',
          display_order: 2
        })
      }
      
      // Apply limit if specified
      if (limit && objectives.length > limit) {
        objectives = objectives.slice(0, limit)
      }
      
      return objectives
    } catch (error) {
      console.error(`Error fetching learning objectives for user ${userId}:`, error)
      return []
    }
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