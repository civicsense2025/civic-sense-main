import { supabase } from '../supabase'
import { DB_TABLES } from '../database-constants'
import type { Database } from '../database-types'

type Skill = Database['public']['Tables']['skills']['Row']
type UserSkillPreference = Database['public']['Tables']['user_skill_preferences']['Row']

export interface SkillWithPreference extends Skill {
  preference?: UserSkillPreference | null
}

export interface SkillsByCategory {
  categoryId: string
  categoryName: string
  skills: SkillWithPreference[]
}

export class SkillsService {
  static async getSkills(categoryId?: string): Promise<Skill[]> {
    let query = supabase
      .from(DB_TABLES.SKILLS)
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching skills:', error)
      return []
    }
    
    return data || []
  }
  
  static async getUserSkillPreferences(userId: string): Promise<UserSkillPreference[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.USER_SKILL_PREFERENCES)
      .select('*')
      .eq('user_id', userId)
    
    if (error) {
      console.error('Error fetching user skill preferences:', error)
      return []
    }
    
    return data || []
  }
  
  static async saveUserSkillPreferences(
    userId: string,
    preferences: Array<{
      skill_id: string
      interest_level: number
      target_mastery_level?: number
      learning_timeline?: string
      priority_rank?: number
    }>
  ): Promise<boolean> {
    // Delete existing preferences
    const { error: deleteError } = await supabase
      .from(DB_TABLES.USER_SKILL_PREFERENCES)
      .delete()
      .eq('user_id', userId)
    
    if (deleteError) {
      console.error('Error deleting existing skill preferences:', deleteError)
      return false
    }
    
    // Insert new preferences
    if (preferences.length > 0) {
      const preferencesToInsert = preferences.map(pref => ({
        ...pref,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const { error: insertError } = await supabase
        .from(DB_TABLES.USER_SKILL_PREFERENCES)
        .insert(preferencesToInsert)
      
      if (insertError) {
        console.error('Error saving skill preferences:', insertError)
        return false
      }
    }
    
    return true
  }
  
  static async getSkillsWithPreferences(userId: string): Promise<SkillWithPreference[]> {
    const [skills, preferences] = await Promise.all([
      this.getSkills(),
      this.getUserSkillPreferences(userId)
    ])
    
    const preferencesMap = new Map(
      preferences.map(pref => [pref.skill_id, pref])
    )
    
    return skills.map(skill => ({
      ...skill,
      preference: preferencesMap.get(skill.id) || null
    }))
  }
  
  static async getSkillsByCategory(userId: string): Promise<SkillsByCategory[]> {
    // Fetch skills with category information
    const { data: skillsData, error: skillsError } = await supabase
      .from(DB_TABLES.SKILLS)
      .select(`
        *,
        categories!inner(
          id,
          name,
          display_order
        )
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (skillsError || !skillsData) {
      console.error('Error fetching skills with categories:', skillsError)
      return []
    }
    
    // Fetch user preferences
    const preferences = await this.getUserSkillPreferences(userId)
    const preferencesMap = new Map(
      preferences.map(pref => [pref.skill_id, pref])
    )
    
    // Group skills by category
    const skillsByCategory = new Map<string, SkillsByCategory>()
    
    skillsData.forEach((skill: any) => {
      const categoryId = skill.category_id
      const categoryName = skill.categories?.name || 'Unknown'
      
      if (!skillsByCategory.has(categoryId)) {
        skillsByCategory.set(categoryId, {
          categoryId,
          categoryName,
          skills: []
        })
      }
      
      const category = skillsByCategory.get(categoryId)!
      category.skills.push({
        ...skill,
        preference: preferencesMap.get(skill.id) || null
      })
    })
    
    return Array.from(skillsByCategory.values())
  }
} 