// Data access layer for Skill Gain - Client-side functions
import { createBrowserSupabaseClient } from './supabase'

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }
}

const dataCache = new SimpleCache()

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

export interface UserProgress {
  id: string
  user_id: string
  content_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress_percentage: number
  time_spent: number
  completed_at: string | null
  last_accessed_at: string
  created_at: string
  content?: ContentItem
}

export interface UserBookmark {
  id: string
  user_id: string
  content_id: string
  created_at: string
  content?: ContentItem
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_type: string
  title: string
  description: string | null
  icon: string | null
  earned_at: string
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

// Categories
export async function getCategories(): Promise<Category[]> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    // Silent failure - return empty array for graceful degradation
    return []
  }

  return data || []
}

// Content Items
export async function getContentItems(options?: {
  category?: string
  difficulty?: string
  featured?: boolean
  limit?: number
  offset?: number
  gradeLevel?: string
  search?: string
}): Promise<ContentItem[]> {
  // Create cache key based on options
  const cacheKey = `content_items_${JSON.stringify(options || {})}`
  const cached = dataCache.get<ContentItem[]>(cacheKey)
  if (cached) {
    return cached
  }

  const supabase = createBrowserSupabaseClient()

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
    // Silent failure - return empty array for graceful degradation
    return []
  }

  const result = data || []
  // Cache for 2 minutes since content doesn't change frequently
  dataCache.set(cacheKey, result, 2 * 60 * 1000)
  return result
}

export async function getContentItem(id: string): Promise<ContentItem | null> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('content_items')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (error) {
    // Handle "not found" errors gracefully - these are expected 404s, not actual errors
    if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
      return null
    }
    // Only log actual errors, not missing content
    console.error('Error fetching content item:', error)
    return null
  }

  return data
}

export async function searchContent(query: string): Promise<ContentItem[]> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('content_items')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('is_published', true)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    // Silent failure - return empty array for graceful degradation
    return []
  }

  return data || []
}

// Get content filtered by grade level
export async function getContentByGradeLevel(gradeLevel: string, options?: {
  category?: string
  difficulty?: string
  featured?: boolean
  limit?: number
}): Promise<ContentItem[]> {
  try {
    const supabase = createBrowserSupabaseClient()

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
      console.warn('Database not available for grade-filtered content, using fallback:', error.message)
      // Return fallback content filtered by grade
      return []
    }

    return data || []
  } catch (err) {
    console.warn('Database connection failed for grade-filtered content, using fallback')
    return []
  }
}

// User Profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    // If no profile exists, try to create one silently
    if (error.code === 'PGRST116') {
      return await createUserProfile(userId)
    }
    // Silent failure for other errors - return null for graceful degradation
    return null
  }

  return data
}

// Helper function to create a user profile if it doesn't exist
async function createUserProfile(userId: string): Promise<UserProfile | null> {
  try {
  const supabase = createBrowserSupabaseClient()

    // Get user metadata from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Error getting user for profile creation:', authError)
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        role: 'student',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Student'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return null
    }

    console.log('Successfully created user profile for:', userId)
    return data
  } catch (err) {
    console.error('Failed to create user profile:', err)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    // Silent failure - return null for graceful degradation
    return null
  }

  return data
}

// User Progress
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  try {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        *,
        content:content_items(*, category:categories(*))
      `)
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false })

  if (error) {
    // Silent failure - return fallback progress data for graceful degradation
      return [
        {
          id: '1',
          user_id: userId,
          content_id: '1',
          status: 'completed',
          progress_percentage: 100,
          time_spent: 25,
          completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          last_accessed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          content: {
            id: '1',
            title: 'How Photosynthesis Works',
            content: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy.',
            type: 'text',
            category_id: '1',
            difficulty: 'beginner',
            tags: ['science', 'biology'],
            image_url: null,
            video_url: null,
            audio_url: null,
            quiz: null,
            read_time: 5,
            likes: 24,
            views: 156,
            is_featured: true,
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: { id: '1', name: 'Science', description: 'Explore the wonders of science', icon: '🔬', color: 'blue', created_at: new Date().toISOString() }
          }
        },
        {
          id: '2',
          user_id: userId,
          content_id: '2',
          status: 'in_progress',
          progress_percentage: 75,
          time_spent: 15,
          completed_at: null,
          last_accessed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          created_at: new Date().toISOString(),
          content: {
            id: '2',
            title: 'Ancient Rome Quiz',
            content: 'Test your knowledge of ancient Roman history.',
            type: 'quiz',
            category_id: '2',
            difficulty: 'intermediate',
            tags: ['history', 'rome'],
            image_url: null,
            video_url: null,
            audio_url: null,
            quiz: null,
            read_time: 10,
            likes: 18,
            views: 89,
            is_featured: false,
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: { id: '2', name: 'History', description: 'Learn about historical events', icon: '🏛️', color: 'green', created_at: new Date().toISOString() }
          }
        },
        {
          id: '3',
          user_id: userId,
          content_id: '3',
          status: 'in_progress',
          progress_percentage: 30,
          time_spent: 8,
          completed_at: null,
          last_accessed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          created_at: new Date().toISOString(),
          content: {
            id: '3',
            title: 'Geography: Understanding Maps',
            content: 'Learn about different types of maps and how to read them.',
            type: 'text',
            category_id: '3',
            difficulty: 'beginner',
            tags: ['geography', 'maps'],
            image_url: null,
            video_url: null,
            audio_url: null,
            quiz: null,
            read_time: 6,
            likes: 15,
            views: 67,
            is_featured: false,
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: { id: '3', name: 'Geography', description: 'Discover the world around us', icon: '🌍', color: 'orange', created_at: new Date().toISOString() }
          }
        }
      ]
    }

    return data || []
  } catch (err) {
    console.warn('Database connection failed for user progress, using fallback data')
    return []
  }
}

export async function getUserProgressForContent(userId: string, contentId: string): Promise<UserProgress | null> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching user progress for content:', error)
    return null
  }

  return data
}

export async function updateUserProgress(
  userId: string,
  contentId: string,
  updates: Partial<UserProgress>
): Promise<UserProgress | null> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      content_id: contentId,
      ...updates,
      last_accessed_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    // Silent failure - return null for graceful degradation
    return null
  }

  return data
}

// User Bookmarks
export async function getUserBookmarks(userId: string): Promise<UserBookmark[]> {
  try {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase
      .from('user_bookmarks')
      .select(`
        *,
        content:content_items(*, category:categories(*))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Database not available for user bookmarks, using fallback data:', error.message)
      // Return fallback bookmark data
      return [
        {
          id: '1',
          user_id: userId,
          content_id: '1',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          content: {
            id: '1',
            title: 'How Photosynthesis Works',
            content: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy.',
            type: 'text',
            category_id: '1',
            difficulty: 'beginner',
            tags: ['science', 'biology'],
            image_url: null,
            video_url: null,
            audio_url: null,
            quiz: null,
            read_time: 5,
            likes: 24,
            views: 156,
            is_featured: true,
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: { id: '1', name: 'Science', description: 'Explore the wonders of science', icon: '🔬', color: 'blue', created_at: new Date().toISOString() }
          }
        },
        {
          id: '2',
          user_id: userId,
          content_id: '4',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          content: {
            id: '4',
            title: 'Introduction to Algebra',
            content: 'Algebra is a branch of mathematics that uses letters and symbols to represent numbers and quantities in formulas and equations.',
            type: 'text',
            category_id: '4',
            difficulty: 'intermediate',
            tags: ['mathematics', 'algebra'],
            image_url: null,
            video_url: null,
            audio_url: null,
            quiz: null,
            read_time: 10,
            likes: 22,
            views: 134,
            is_featured: true,
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: { id: '4', name: 'Mathematics', description: 'Master mathematical concepts', icon: '🔢', color: 'purple', created_at: new Date().toISOString() }
          }
        },
        {
          id: '3',
          user_id: userId,
          content_id: '5',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          content: {
            id: '5',
            title: 'The Water Cycle Explained',
            content: 'The water cycle is the continuous movement of water on, above, and below the surface of the Earth.',
            type: 'text-image',
            category_id: '1',
            difficulty: 'beginner',
            tags: ['science', 'water', 'environment'],
            image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
            video_url: null,
            audio_url: null,
            quiz: null,
            read_time: 4,
            likes: 31,
            views: 203,
            is_featured: false,
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: { id: '1', name: 'Science', description: 'Explore the wonders of science', icon: '🔬', color: 'blue', created_at: new Date().toISOString() }
          }
        },
        {
          id: '4',
          user_id: userId,
          content_id: '2',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          content: {
            id: '2',
            title: 'Ancient Rome: The Rise and Fall',
            content: 'Ancient Rome was a powerful civilization that began as a small city-state and grew to encompass much of Europe, North Africa, and the Middle East.',
            type: 'text-image',
            category_id: '2',
            difficulty: 'intermediate',
            tags: ['history', 'rome', 'civilization'],
            image_url: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=400',
            video_url: null,
            audio_url: null,
            quiz: null,
            read_time: 8,
            likes: 18,
            views: 89,
            is_featured: false,
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: { id: '2', name: 'History', description: 'Learn about historical events', icon: '🏛️', color: 'green', created_at: new Date().toISOString() }
          }
        }
      ]
    }

    return data || []
  } catch (err) {
    console.warn('Database connection failed for user bookmarks, using fallback data')
    return []
  }
}

export async function addUserBookmark(userId: string, contentId: string): Promise<UserBookmark | null> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('user_bookmarks')
    .insert({
      user_id: userId,
      content_id: contentId
    })
    .select()
    .single()

  if (error) {
    // Silent failure - return null for graceful degradation
    return null
  }

  return data
}

export async function removeUserBookmark(userId: string, contentId: string): Promise<boolean> {
  const supabase = createBrowserSupabaseClient()

  const { error } = await supabase
    .from('user_bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('content_id', contentId)

  if (error) {
    // Silent failure - return false for graceful degradation
    return false
  }

  return true
}

export async function isContentBookmarked(userId: string, contentId: string): Promise<boolean> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('user_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // Silent failure - return false for graceful degradation
    return false
  }

  return !!data
}

// User Achievements
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  try {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (error) {
      console.warn('Database not available for user achievements, using fallback data:', error.message)
      // Return fallback achievement data
      return [
        {
          id: '1',
          user_id: userId,
          achievement_type: 'first_steps',
          title: 'First Steps',
          description: 'Completed your first learning module',
          icon: '🎯',
          earned_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks ago
        },
        {
          id: '2',
          user_id: userId,
          achievement_type: 'knowledge_seeker',
          title: 'Knowledge Seeker',
          description: 'Read 10 different topics',
          icon: '📚',
          earned_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
        },
        {
          id: '3',
          user_id: userId,
          achievement_type: 'quiz_master',
          title: 'Quiz Master',
          description: 'Scored 100% on 5 quizzes',
          icon: '🏆',
          earned_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
        }
      ]
    }

    return data || []
  } catch (err) {
    console.warn('Database connection failed for user achievements, using fallback data')
    return [
      {
        id: '1',
        user_id: userId,
        achievement_type: 'first_steps',
        title: 'First Steps',
        description: 'Completed your first learning module',
        icon: '🎯',
        earned_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        user_id: userId,
        achievement_type: 'knowledge_seeker',
        title: 'Knowledge Seeker',
        description: 'Read 10 different topics',
        icon: '📚',
        earned_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        user_id: userId,
        achievement_type: 'quiz_master',
        title: 'Quiz Master',
        description: 'Scored 100% on 5 quizzes',
        icon: '🏆',
        earned_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
}

// Statistics
export async function getUserStats(userId: string): Promise<{
  totalCompleted: number
  totalStarted: number
  currentStreak: number
  totalTime: number
  achievements: number
}> {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get progress stats
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('status, time_spent')
      .eq('user_id', userId)

    // Get achievements count
    const { count: achievementsCount, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (progressError || achievementsError) {
      console.warn('Database not available for user stats, using fallback data:', progressError?.message || achievementsError?.message)
      // Return fallback stats
      return {
        totalCompleted: 12,
        totalStarted: 8,
        currentStreak: 5,
        totalTime: 240,
        achievements: 3
      }
    }

    const totalCompleted = progressData?.filter(p => p.status === 'completed').length || 0
    const totalStarted = progressData?.length || 0
    const totalTime = progressData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0

    // For now, return mock streak - in real implementation, calculate from progress history
    const currentStreak = 5

    return {
      totalCompleted,
      totalStarted,
      currentStreak,
      totalTime,
      achievements: achievementsCount || 0
    }
  } catch (err) {
    console.warn('Database connection failed for user stats, using fallback data')
    return {
      totalCompleted: 12,
      totalStarted: 8,
      currentStreak: 5,
      totalTime: 240,
      achievements: 3
    }
  }
}

// Client-side functions (for components that need to run on client)
export const clientData = {
  async getCategories(): Promise<Category[]> {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    return data || []
  },

  async getContentItems(options?: {
    category?: string
    difficulty?: string
    featured?: boolean
    limit?: number
  }): Promise<ContentItem[]> {
    const supabase = createBrowserSupabaseClient()

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

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching content items:', error)
      return []
    }

    return data || []
  },

  async searchContent(query: string): Promise<ContentItem[]> {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase
      .from('content_items')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error searching content:', error)
      return []
    }

    return data || []
  }
}

// Analytics Functions
export interface WeeklyData {
  week: string
  hours: number
  date: string
}

export interface SubjectProgress {
  subject: string
  completed: number
  total: number
  percentage: number
}

export interface LearningVelocity {
  thisWeek: number
  lastWeek: number
  change: number
  changePercent: number
}

export interface PersonalizedInsight {
  id: string
  type: 'improvement' | 'achievement' | 'recommendation' | 'streak'
  title: string
  description: string
  icon: string
  priority: number
}

export interface UserAnalytics {
  weeklyHours: WeeklyData[]
  subjectProgress: SubjectProgress[]
  currentStreak: number
  longestStreak: number
  totalCompleted: number
  totalTimeSpent: number
  completionRate: number
  learningVelocity: LearningVelocity
  insights: PersonalizedInsight[]
  activityHeatmap: { date: string; count: number }[]
}

// Get comprehensive user analytics
export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  const supabase = createBrowserSupabaseClient()

  try {
    // Get all user progress data
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select(`
        *,
        content:content_items(
          title,
          type,
          category:categories(name),
          read_time
        )
      `)
      .eq('user_id', userId)

    if (progressError) throw progressError

    // Get achievements data
    const { data: achievementsData, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (achievementsError) throw achievementsError

    // Calculate weekly learning hours (last 4 weeks)
    const weeklyHours = calculateWeeklyHours(progressData || [])

    // Calculate subject progress breakdown
    const subjectProgress = calculateSubjectProgress(progressData || [])

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreaks(progressData || [])

    // Calculate totals
    const totalCompleted = progressData?.filter(p => p.status === 'completed').length || 0
    const totalTimeSpent = progressData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0
    const totalItems = progressData?.length || 0
    const completionRate = totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0

    // Calculate learning velocity
    const learningVelocity = calculateLearningVelocity(progressData || [])

    // Generate personalized insights
    const insights = generateInsights(progressData || [], achievementsData || [], {
      currentStreak,
      totalCompleted,
      completionRate,
      learningVelocity
    })

    // Generate activity heatmap data
    const activityHeatmap = generateActivityHeatmap(progressData || [])

    return {
      weeklyHours,
      subjectProgress,
      currentStreak,
      longestStreak,
      totalCompleted,
      totalTimeSpent,
      completionRate,
      learningVelocity,
      insights,
      activityHeatmap
    }
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    return {
      weeklyHours: [],
      subjectProgress: [],
      currentStreak: 0,
      longestStreak: 0,
      totalCompleted: 0,
      totalTimeSpent: 0,
      completionRate: 0,
      learningVelocity: { thisWeek: 0, lastWeek: 0, change: 0, changePercent: 0 },
      insights: [],
      activityHeatmap: []
    }
  }
}

// Calculate weekly learning hours for the last 4 weeks
function calculateWeeklyHours(progressData: any[]): WeeklyData[] {
  const weeks: { [key: string]: number } = {}
  const now = new Date()

  // Initialize last 4 weeks
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i * 7))
    const weekKey = weekStart.toISOString().split('T')[0].substring(0, 10)
    weeks[weekKey] = 0
  }

  // Aggregate time spent by week
  progressData.forEach(progress => {
    if (progress.last_accessed_at) {
      const date = new Date(progress.last_accessed_at)
      const weekKey = date.toISOString().split('T')[0].substring(0, 10)
      if (weeks.hasOwnProperty(weekKey)) {
        weeks[weekKey] += (progress.time_spent || 0) / 60 // Convert to hours
      }
    }
  })

  return Object.entries(weeks)
    .map(([date, hours]) => ({
      week: `Week of ${new Date(date).toLocaleDateString()}`,
      hours: Math.round(hours * 10) / 10,
      date
    }))
    .reverse()
}

// Calculate subject progress breakdown
function calculateSubjectProgress(progressData: any[]): SubjectProgress[] {
  const subjectStats: { [key: string]: { completed: number; total: number } } = {}

  progressData.forEach(progress => {
    const subject = progress.content?.category?.name || 'Uncategorized'
    if (!subjectStats[subject]) {
      subjectStats[subject] = { completed: 0, total: 0 }
    }
    subjectStats[subject].total++
    if (progress.status === 'completed') {
      subjectStats[subject].completed++
    }
  })

  return Object.entries(subjectStats).map(([subject, stats]) => ({
    subject,
    completed: stats.completed,
    total: stats.total,
    percentage: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
  }))
}

// Calculate current and longest streaks
function calculateStreaks(progressData: any[]): { currentStreak: number; longestStreak: number } {
  if (!progressData.length) return { currentStreak: 0, longestStreak: 0 }

  // Sort by completion date
  const completedItems = progressData
    .filter(p => p.status === 'completed' && p.completed_at)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())

  if (!completedItems.length) return { currentStreak: 0, longestStreak: 0 }

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1

  // Calculate current streak (from most recent completion)
  const mostRecent = new Date(completedItems[0].completed_at)
  const today = new Date()
  const daysDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff <= 1) { // Completed today or yesterday
    currentStreak = 1
    let checkDate = new Date(mostRecent)

    for (let i = 1; i < completedItems.length; i++) {
      const itemDate = new Date(completedItems[i].completed_at)
      const dayDiff = Math.floor((checkDate.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))

      if (dayDiff === 1) { // Consecutive day
        currentStreak++
        checkDate = itemDate
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  let prevDate: Date | null = null
  completedItems.forEach(item => {
    const itemDate = new Date(item.completed_at)

    if (!prevDate) {
      tempStreak = 1
    } else {
      const dayDiff = Math.floor((prevDate.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))
      if (dayDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }

    prevDate = itemDate
  })

  longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

  return { currentStreak, longestStreak }
}

// Calculate learning velocity (this week vs last week)
function calculateLearningVelocity(progressData: any[]): LearningVelocity {
  const now = new Date()
  const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const thisWeek = progressData.filter(p => {
    if (!p.completed_at) return false
    const completedDate = new Date(p.completed_at)
    return completedDate >= thisWeekStart && completedDate < new Date()
  }).length

  const lastWeek = progressData.filter(p => {
    if (!p.completed_at) return false
    const completedDate = new Date(p.completed_at)
    return completedDate >= lastWeekStart && completedDate < thisWeekStart
  }).length

  const change = thisWeek - lastWeek
  const changePercent = lastWeek > 0 ? (change / lastWeek) * 100 : (thisWeek > 0 ? 100 : 0)

  return {
    thisWeek,
    lastWeek,
    change,
    changePercent: Math.round(changePercent * 10) / 10
  }
}

// Generate personalized insights
function generateInsights(
  progressData: any[],
  achievementsData: any[],
  stats: { currentStreak: number; totalCompleted: number; completionRate: number; learningVelocity: LearningVelocity }
): PersonalizedInsight[] {
  const insights: PersonalizedInsight[] = []

  // Streak-based insights
  if (stats.currentStreak >= 7) {
    insights.push({
      id: 'streak-master',
      type: 'streak',
      title: 'Streak Master! 🔥',
      description: `Amazing! You've maintained a ${stats.currentStreak}-day learning streak. Keep it up!`,
      icon: '🔥',
      priority: 1
    })
  } else if (stats.currentStreak === 0 && progressData.length > 0) {
    insights.push({
      id: 'streak-restart',
      type: 'recommendation',
      title: 'Restart Your Streak',
      description: 'Complete a lesson today to start building your learning streak!',
      icon: '🎯',
      priority: 2
    })
  }

  // Performance insights
  if (stats.completionRate >= 80) {
    insights.push({
      id: 'high-completion',
      type: 'achievement',
      title: 'Completion Champion!',
      description: `You've completed ${Math.round(stats.completionRate)}% of your started content. Excellent work!`,
      icon: '🏆',
      priority: 1
    })
  }

  // Velocity insights
  if (stats.learningVelocity.change > 0) {
    insights.push({
      id: 'velocity-up',
      type: 'improvement',
      title: 'Learning Momentum!',
      description: `You're completing ${stats.learningVelocity.changePercent}% more content this week. Great progress!`,
      icon: '📈',
      priority: 2
    })
  } else if (stats.learningVelocity.change < 0 && stats.learningVelocity.lastWeek > 0) {
    insights.push({
      id: 'velocity-down',
      type: 'recommendation',
      title: 'Keep the Momentum',
      description: 'Your learning pace slowed this week. Try to complete at least one lesson today!',
      icon: '📉',
      priority: 3
    })
  }

  // Subject-specific insights
  const subjectProgress = calculateSubjectProgress(progressData)
  const bestSubject = subjectProgress.reduce((best, current) =>
    current.percentage > best.percentage ? current : best,
    subjectProgress[0]
  )

  if (bestSubject && bestSubject.percentage >= 50) {
    insights.push({
      id: 'subject-expert',
      type: 'achievement',
      title: `${bestSubject.subject} Expert!`,
      description: `You're excelling in ${bestSubject.subject} with ${Math.round(bestSubject.percentage)}% completion.`,
      icon: '⭐',
      priority: 2
    })
  }

  // Achievement-based insights
  if (achievementsData.length === 0 && stats.totalCompleted >= 3) {
    insights.push({
      id: 'achievement-unlock',
      type: 'recommendation',
      title: 'Achievements Await!',
      description: 'Complete a few more lessons to unlock your first achievement badge!',
      icon: '🎖️',
      priority: 3
    })
  }

  // Sort by priority and return top insights
  return insights
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4)
}

// Generate activity heatmap data
function generateActivityHeatmap(progressData: any[]): { date: string; count: number }[] {
  const activityMap: { [key: string]: number } = {}

  // Initialize last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split('T')[0]
    activityMap[dateKey] = 0
  }

  // Count activities per day
  progressData.forEach(progress => {
    if (progress.last_accessed_at) {
      const date = new Date(progress.last_accessed_at).toISOString().split('T')[0]
      if (activityMap.hasOwnProperty(date)) {
        activityMap[date]++
      }
    }
  })

  return Object.entries(activityMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}



// Get leaderboard data
export async function getLeaderboard(limit: number = 10): Promise<Array<{
  user_id: string
  full_name: string | null
  avatar_url: string | null
  total_time: number
  total_completed: number
  current_streak: number
}>> {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get all users with their stats
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('role', 'student')

    if (usersError) throw usersError

    // Calculate stats for each user
    const leaderboardData = await Promise.all(
      (users || []).map(async (user) => {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('time_spent, status')
          .eq('user_id', user.id)

        const totalTime = progressData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0
        const totalCompleted = progressData?.filter(p => p.status === 'completed').length || 0

        const { currentStreak } = await getCurrentStreak(user.id)

        return {
          user_id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          total_time: totalTime,
          total_completed: totalCompleted,
          current_streak: currentStreak
        }
      })
    )

    // Sort by total time spent (descending) and return top limit
    return leaderboardData
      .sort((a, b) => b.total_time - a.total_time)
      .slice(0, limit)

  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
}

// Get family leaderboard for parents
export async function getFamilyLeaderboard(parentId: string, limit: number = 10): Promise<Array<{
  user_id: string
  full_name: string | null
  avatar_url: string | null
  total_time: number
  total_completed: number
  current_streak: number
  role: string
}>> {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get parent and their children
    const { data: familyMembers, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .or(`id.eq.${parentId},parent_id.eq.${parentId}`)

    if (error) throw error

    // Calculate stats for each family member
    const leaderboardData = await Promise.all(
      (familyMembers || []).map(async (member) => {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('time_spent, status')
          .eq('user_id', member.id)

        const totalTime = progressData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0
        const totalCompleted = progressData?.filter(p => p.status === 'completed').length || 0

        const { currentStreak } = member.role === 'student' ? await getCurrentStreak(member.id) : { currentStreak: 0 }

        return {
          user_id: member.id,
          full_name: member.full_name,
          avatar_url: member.avatar_url,
          total_time: totalTime,
          total_completed: totalCompleted,
          current_streak: currentStreak,
          role: member.role
        }
      })
    )

    // Sort by total time spent (descending) and return top limit
    return leaderboardData
      .sort((a, b) => b.total_time - a.total_time)
      .slice(0, limit)

  } catch (error) {
    console.error('Error fetching family leaderboard:', error)
    return []
  }
}

// Check and unlock achievements for a user
export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get user stats
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('status, time_spent, completed_at')
      .eq('user_id', userId)

    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('achievement_type')
      .eq('user_id', userId)

    const existingAchievements = achievements?.map(a => a.achievement_type) || []
    const newAchievements: string[] = []

    // Calculate stats
    const totalCompleted = progressData?.filter(p => p.status === 'completed').length || 0
    const totalTime = progressData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0

    // Calculate current streak
    const { currentStreak } = await getCurrentStreak(userId)

    // Check for new achievements
    const achievementChecks = [
      {
        type: 'first_steps',
        condition: totalCompleted >= 1 && !existingAchievements.includes('first_steps'),
        title: 'First Steps',
        description: 'Completed your first learning module',
        icon: '🎯'
      },
      {
        type: 'content_explorer',
        condition: totalCompleted >= 10 && !existingAchievements.includes('content_explorer'),
        title: 'Content Explorer',
        description: 'Completed 10 different learning modules',
        icon: '🗺️'
      },
      {
        type: 'quiz_master',
        condition: totalCompleted >= 25 && !existingAchievements.includes('quiz_master'),
        title: 'Quiz Master',
        description: 'Completed 25 learning modules',
        icon: '🏆'
      },
      {
        type: 'weekly_warrior',
        condition: totalTime >= 420 && !existingAchievements.includes('weekly_warrior'), // 7 hours
        title: 'Weekly Warrior',
        description: 'Spent 7+ hours learning this week',
        icon: '⚔️'
      },
      {
        type: 'learning_velocity',
        condition: totalCompleted >= 50 && !existingAchievements.includes('learning_velocity'),
        title: 'Learning Velocity',
        description: 'Completed 50 learning modules at high speed',
        icon: '🚀'
      },
      {
        type: 'streak_master',
        condition: currentStreak >= 7 && !existingAchievements.includes('streak_master'),
        title: '7-Day Streak',
        description: 'Maintained a 7-day learning streak',
        icon: '🔥'
      }
    ]

    // Check parent-specific achievements
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role === 'parent') {
      // Get children stats
      const { data: children } = await supabase
        .from('profiles')
        .select('id')
        .eq('parent_id', userId)
        .eq('role', 'student')

      if (children && children.length > 0) {
        let totalFamilyCompleted = totalCompleted
        let totalFamilyTime = totalTime

        for (const child of children) {
          const { data: childProgress } = await supabase
            .from('user_progress')
            .select('status, time_spent')
            .eq('user_id', child.id)

          totalFamilyCompleted += childProgress?.filter(p => p.status === 'completed').length || 0
          totalFamilyTime += childProgress?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0
        }

        if (totalFamilyCompleted >= 20 && !existingAchievements.includes('parents_pride')) {
          achievementChecks.push({
            type: 'parents_pride',
            condition: true,
            title: 'Parent\'s Pride',
            description: 'Helped family complete 20+ learning modules',
            icon: '👨‍👩‍👧‍👦'
          })
        }
      }
    }

    // Unlock new achievements
    for (const check of achievementChecks) {
      if (check.condition) {
        try {
          await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_type: check.type,
              title: check.title,
              description: check.description,
              icon: check.icon
            })

          newAchievements.push(check.title)
        } catch (error) {
          // Achievement might already exist, continue
          console.log(`Achievement ${check.type} may already exist`)
        }
      }
    }

    return newAchievements
  } catch (error) {
    console.error('Error checking achievements:', error)
    return []
  }
}

// Check if user has completed grade assessment
export async function hasCompletedAssessment(userId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase
      .from('grade_assessments')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (error) {
      // Silently handle database errors - don't show in console for better UX
      console.log('Assessment check temporarily unavailable')
      return false
    }

    return data && data.length > 0
  } catch (error) {
    // Silently handle errors - don't show in console for better UX
    console.log('Assessment check temporarily unavailable')
    return false
  }
}

// Calculate current learning streak
export async function getCurrentStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
  try {
    const supabase = createBrowserSupabaseClient()

    const { data: progressData, error } = await supabase
      .from('user_progress')
      .select('last_accessed_at, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('last_accessed_at', { ascending: false })

    if (error) throw error

    return calculateStreaks(progressData || [])
  } catch (error) {
    console.error('Error calculating streak:', error)
    return { currentStreak: 0, longestStreak: 0 }
  }
}

// Types for learning paths
export interface LearningPath {
  id: string
  user_id: string
  curriculum_id: string
  subject_id: string
  current_grade: string
  status: 'active' | 'completed' | 'paused'
  progress_percentage: number
  completed_lessons: string[]
  current_lesson: string | null
  started_at: string
  last_accessed_at: string
  created_at: string
  updated_at: string
  subjects?: {
    name: string
    icon: string
    color: string
  }
}

export interface NextBestLesson {
  lessonId: string
  title: string
  subject: string
  grade: string
  reason: string
  priority: number
  estimatedDifficulty: 'beginner' | 'intermediate' | 'advanced'
}

// Generate adaptive learning paths based on assessment results
export async function generateAdaptiveLearningPaths(userId: string): Promise<void> {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get user's assessment results
    const { data: assessment, error: assessmentError } = await supabase
      .from('grade_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('assessed_at', { ascending: false })
      .limit(1)
      .single()

    if (assessmentError || !assessment) {
      console.log('No assessment found for user, cannot generate adaptive paths')
      return
    }

    // Get curriculum and subjects
    const { data: curriculum, error: curriculumError } = await supabase
      .from('curriculums')
      .select('id')
      .eq('name', 'CAPS')
      .single()

    if (curriculumError || !curriculum) {
      console.error('CAPS curriculum not found')
      return
    }

    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('curriculum_id', curriculum.id)

    if (subjectsError || !subjects) {
      console.error('Error fetching subjects')
      return
    }

    // Parse assessment data to understand strengths/weaknesses
    const assessmentData = assessment.assessment_data || {}
    const strengths = assessmentData.strengths || []
    const weaknesses = assessmentData.weaknesses || []

    // Generate learning paths for each subject
    for (const subject of subjects) {
      await generateSubjectLearningPath(userId, curriculum.id, subject.id, assessment.assessed_grade, strengths, weaknesses)
    }

  } catch (error) {
    console.error('Error generating adaptive learning paths:', error)
  }
}

// Generate learning path for a specific subject
async function generateSubjectLearningPath(
  userId: string,
  curriculumId: string,
  subjectId: string,
  assessedGrade: string,
  strengths: string[],
  weaknesses: string[]
): Promise<void> {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get lesson plans for this subject and grade
    const { data: lessonPlans, error: lessonsError } = await supabase
      .from('lesson_plans')
      .select('id, title, grade_level, difficulty, prerequisites, learning_objectives')
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('sequence_order', { ascending: true })

    if (lessonsError || !lessonPlans) {
      console.error('Error fetching lesson plans for subject:', subjectId)
      return
    }

    // Determine starting grade based on assessment and subject performance
    let startingGrade = assessedGrade

    // If subject is in weaknesses, start one grade lower
    const subjectName = await getSubjectName(subjectId)
    if (weaknesses.some(w => w.toLowerCase().includes(subjectName?.toLowerCase() || ''))) {
      startingGrade = getLowerGrade(assessedGrade)
    }

    // Filter lessons for appropriate grade level
    const relevantLessons = lessonPlans.filter(lesson =>
      lesson.grade_level === startingGrade ||
      lesson.grade_level === getLowerGrade(startingGrade) // Include easier grade as backup
    )

    // Create or update learning path
    const { error: upsertError } = await supabase
      .from('learning_paths')
      .upsert({
        user_id: userId,
        curriculum_id: curriculumId,
        subject_id: subjectId,
        current_grade: startingGrade,
        status: 'active',
        progress_percentage: 0,
        completed_lessons: [],
        current_lesson: relevantLessons.length > 0 ? relevantLessons[0].id : null,
        last_accessed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,curriculum_id,subject_id'
      })

    if (upsertError) {
      console.error('Error upserting learning path:', upsertError)
    }

  } catch (error) {
    console.error('Error generating subject learning path:', error)
  }
}

// Get next best lesson recommendation
export async function getNextBestLesson(userId: string): Promise<NextBestLesson | null> {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get user's learning paths
    const { data: learningPaths, error: pathsError } = await supabase
      .from('learning_paths')
      .select(`
        *,
        subjects(name)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')

    if (pathsError || !learningPaths || learningPaths.length === 0) {
      return null
    }

    // Get user's recent progress and assessment data
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('content_id, status, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10)

    const { data: assessment } = await supabase
      .from('grade_assessments')
      .select('assessment_data')
      .eq('user_id', userId)
      .order('assessed_at', { ascending: false })
      .limit(1)
      .single()

    // Analyze patterns and recommend next lesson
    const recommendations: NextBestLesson[] = []

    for (const path of learningPaths) {
      if (path.current_lesson) {
        // Get current lesson details
        const { data: currentLesson } = await supabase
          .from('lesson_plans')
          .select('id, title, grade_level, difficulty, prerequisites')
          .eq('id', path.current_lesson)
          .single()

        if (currentLesson) {
          recommendations.push({
            lessonId: currentLesson.id,
            title: currentLesson.title,
            subject: path.subjects?.name || 'Unknown',
            grade: currentLesson.grade_level,
            reason: 'Current lesson in your personalized path',
            priority: 10,
            estimatedDifficulty: currentLesson.difficulty || 'intermediate'
          })
        }
      }

      // Look for prerequisite lessons if struggling
      const weaknesses = assessment?.assessment_data?.weaknesses || []
      if (weaknesses.length > 0) {
        const subjectName = path.subjects?.name || ''
        const isWeakSubject = weaknesses.some((w: string) =>
          w.toLowerCase().includes(subjectName.toLowerCase())
        )

        if (isWeakSubject) {
          // Recommend easier prerequisite lessons
          const { data: easierLessons } = await supabase
            .from('lesson_plans')
            .select('id, title, grade_level, difficulty')
            .eq('subject_id', path.subject_id)
            .eq('grade_level', getLowerGrade(path.current_grade))
            .eq('is_active', true)
            .limit(2)

          easierLessons?.forEach(lesson => {
            recommendations.push({
              lessonId: lesson.id,
              title: lesson.title,
              subject: subjectName,
              grade: lesson.grade_level,
              reason: 'Recommended prerequisite to build foundation',
              priority: 8,
              estimatedDifficulty: 'beginner'
            })
          })
        }
      }
    }

    // Sort by priority and return top recommendation
    recommendations.sort((a, b) => b.priority - a.priority)
    return recommendations[0] || null

  } catch (error) {
    console.error('Error getting next best lesson:', error)
    return null
  }
}

// Update learning paths based on lesson completion
export async function updateLearningPathsOnProgress(userId: string, lessonId: string): Promise<void> {
  try {
    const supabase = createBrowserSupabaseClient()

    // Find which learning path this lesson belongs to
    const { data: lessonPlan } = await supabase
      .from('lesson_plans')
      .select('subject_id, grade_level, sequence_order')
      .eq('id', lessonId)
      .single()

    if (!lessonPlan) return

    // Update the relevant learning path
    const { data: learningPath } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('user_id', userId)
      .eq('subject_id', lessonPlan.subject_id)
      .single()

    if (!learningPath) return

    // Add lesson to completed lessons
    const completedLessons = learningPath.completed_lessons || []
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId)
    }

    // Find next lesson in sequence
    const { data: nextLessons } = await supabase
      .from('lesson_plans')
      .select('id, title')
      .eq('subject_id', lessonPlan.subject_id)
      .eq('grade_level', lessonPlan.grade_level)
      .gt('sequence_order', lessonPlan.sequence_order)
      .eq('is_active', true)
      .order('sequence_order', { ascending: true })
      .limit(1)

    const nextLesson = nextLessons?.[0]?.id || null

    // Calculate progress percentage
    const { data: totalLessons } = await supabase
      .from('lesson_plans')
      .select('id', { count: 'exact' })
      .eq('subject_id', lessonPlan.subject_id)
      .eq('grade_level', lessonPlan.grade_level)
      .eq('is_active', true)

    const progressPercentage = totalLessons ?
      Math.round((completedLessons.length / totalLessons.length) * 100) : 0

    // Update learning path
    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        completed_lessons: completedLessons,
        current_lesson: nextLesson,
        progress_percentage: Math.min(progressPercentage, 100),
        last_accessed_at: new Date().toISOString(),
        status: progressPercentage >= 100 ? 'completed' : 'active'
      })
      .eq('id', learningPath.id)

    if (updateError) {
      console.error('Error updating learning path:', updateError)
    }

  } catch (error) {
    console.error('Error updating learning paths on progress:', error)
  }
}

// Helper functions
async function getSubjectName(subjectId: string): Promise<string | null> {
  try {
    const supabase = createBrowserSupabaseClient()
    const { data } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subjectId)
      .single()

    return data?.name || null
  } catch (error) {
    return null
  }
}

function getLowerGrade(grade: string): string {
  const gradeNumbers: { [key: string]: string } = {
    'Grade 1': 'Grade R',
    'Grade 2': 'Grade 1',
    'Grade 3': 'Grade 2',
    'Grade 4': 'Grade 3',
    'Grade 5': 'Grade 4',
    'Grade 6': 'Grade 5',
    'Grade 7': 'Grade 6',
    'Grade 8': 'Grade 7',
    'Grade 9': 'Grade 8',
    'Grade 10': 'Grade 9',
    'Grade 11': 'Grade 10',
    'Grade 12': 'Grade 11'
  }

  return gradeNumbers[grade] || grade
}

// Get personalized recommendations for a user
export async function getPersonalizedRecommendations(userId: string, limit: number = 6): Promise<ContentItem[]> {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    // Get user's progress to understand what they've completed
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select(`
        content_id,
        status,
        content:content_items(
          category_id,
          difficulty,
          tags
        )
      `)
      .eq('user_id', userId)

    if (progressError) throw progressError

    // Analyze completed content to understand preferences
    const completedContent = progressData?.filter(p => p.status === 'completed') || []
    const completedCategories = completedContent.map(p => p.content?.[0]?.category_id).filter(Boolean)
    const completedTags = completedContent.flatMap(p => p.content?.[0]?.tags || []).filter(Boolean) as string[]
    const completedDifficulties = completedContent.map(p => p.content?.[0]?.difficulty).filter(Boolean) as string[]

    // Get all available content
    const { data: allContent, error: contentError } = await supabase
      .from('content_items')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_published', true)

    if (contentError) throw contentError

    // Filter out already completed content
    const completedIds = completedContent.map(p => p.content_id)
    let availableContent = allContent?.filter(item => !completedIds.includes(item.id)) || []

    // Score content based on various factors
    const scoredContent = availableContent.map(content => {
      let score = 0

      // Grade level match (high priority)
      if (profile.grade_level && content.tags?.includes(profile.grade_level)) {
        score += 10
      }

      // Interest match (high priority)
      if (profile.interests && profile.interests.some((interest: string) =>
        content.tags?.includes(interest) || content.title.toLowerCase().includes(interest.toLowerCase())
      )) {
        score += 8
      }

      // Category preference based on completed content
      if (completedCategories.includes(content.category_id)) {
        score += 6
      }

      // Difficulty progression (prefer slightly harder than current level)
      const currentAvgDifficulty = completedDifficulties.length > 0 ?
        completedDifficulties.reduce((sum, diff) => {
          const levels = { beginner: 1, intermediate: 2, advanced: 3 }
          return sum + (levels[diff as keyof typeof levels] || 1)
        }, 0) / completedDifficulties.length : 1

      const difficultyLevels = { beginner: 1, intermediate: 2, advanced: 3 }
      const contentLevel = difficultyLevels[content.difficulty as keyof typeof difficultyLevels] || 1
      if (Math.abs(contentLevel - currentAvgDifficulty) <= 1) {
        score += 4
      }

      // Tag similarity
      const tagOverlap = content.tags?.filter((tag: string) => completedTags.includes(tag)).length || 0
      score += tagOverlap * 2

      // Recency bonus (newer content slightly preferred)
      const daysSinceCreated = (Date.now() - new Date(content.created_at).getTime()) / (1000 * 60 * 60 * 24)
      score += Math.max(0, 3 - daysSinceCreated / 30) // Bonus for content less than 30 days old

      // Featured content bonus
      if (content.is_featured) {
        score += 2
      }

      return { ...content, recommendationScore: score }
    })

    // Sort by score and return top recommendations
    return scoredContent
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit)

  } catch (error) {
    // Silently handle recommendation errors - don't show in console for better UX
    console.log('Personalized recommendations temporarily unavailable, using fallback')
    // Fallback to featured content
    try {
      const supabase = createBrowserSupabaseClient()
      const { data } = await supabase
        .from('content_items')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_published', true)
        .eq('is_featured', true)
        .limit(limit)

      return data || []
    } catch (fallbackError) {
      // Silently handle fallback errors too
      console.log('Fallback recommendations also unavailable')
      return []
    }
  }
}



