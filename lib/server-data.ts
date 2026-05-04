// Server-side data access functions for server components
import { createClient } from './supabase-server'

// Types
export interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  created_at: string
}

export interface ContentItem {
  id: string
  title: string
  content: string
  type: 'text' | 'text-image' | 'video' | 'quiz' | 'audio'
  category_id: string | null
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[] | null
  image_url: string | null
  video_url: string | null
  audio_url: string | null
  quiz: {
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  } | null
  read_time: number
  likes: number
  views: number
  is_featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface UserProfile {
  id: string
  role: 'parent' | 'student'
  parent_id: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  grade_level: string | null
  interests: string[] | null
  learning_goals: string | null
  created_at: string
  updated_at: string
}

// Server-side functions for server components
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile (server):', error, 'for userId:', userId)
    return null
  }

  return data
}

export async function getContentByGradeLevel(gradeLevel: string, options?: {
  category?: string
  difficulty?: string
  featured?: boolean
  limit?: number
}): Promise<ContentItem[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('content_items')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_published', true)
      .contains('tags', [gradeLevel]) // Filter by grade level in tags

    if (options?.category) {
      query = query.eq('category_id', options.category)
    }

    if (options?.difficulty) {
      query = query.eq('difficulty', options.difficulty)
    }

    if (options?.featured) {
      query = query.eq('is_featured', true)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.warn('Database not available for grade-filtered content (server), using fallback:', error.message)
      return []
    }

    return data || []
  } catch (err) {
    console.warn('Database connection failed for grade-filtered content (server), using fallback')
    return []
  }
}

export async function getContentItems(options?: {
  category?: string
  difficulty?: string
  featured?: boolean
  limit?: number
  offset?: number
  gradeLevel?: string
  search?: string
}): Promise<ContentItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('content_items')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('is_published', true)

  if (options?.category) {
    query = query.eq('category_id', options.category)
  }

  if (options?.difficulty) {
    query = query.eq('difficulty', options.difficulty)
  }

  if (options?.featured) {
    query = query.eq('is_featured', true)
  }

  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching content items (server):', error)
    return []
  }

  return data || []
}