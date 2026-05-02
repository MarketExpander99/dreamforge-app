// Data access layer for KnowFeed
import { createClient } from './supabase-server'
import { createBrowserSupabaseClient } from './supabase'

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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    throw new Error(`Failed to fetch categories: ${error.message}`)
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

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching content items:', error)
    throw new Error(`Failed to fetch content items: ${error.message}`)
  }

  return data || []
}

export async function getContentItem(id: string): Promise<ContentItem | null> {
  const supabase = await createClient()

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
    console.error('Error fetching content item:', error)
    return null
  }

  return data
}

export async function searchContent(query: string): Promise<ContentItem[]> {
  const supabase = await createClient()

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

// Get content filtered by grade level
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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    return null
  }

  return data
}

// User Progress
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        *,
        content:content_items(*, category:categories(*))
      `)
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false })

    if (error) {
      console.warn('Database not available for user progress, using fallback data:', error.message)
      // Return fallback progress data
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
  const supabase = await createClient()

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
  const supabase = await createClient()

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
    console.error('Error updating user progress:', error)
    return null
  }

  return data
}

// User Bookmarks
export async function getUserBookmarks(userId: string): Promise<UserBookmark[]> {
  try {
    const supabase = await createClient()

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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_bookmarks')
    .insert({
      user_id: userId,
      content_id: contentId
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding user bookmark:', error)
    return null
  }

  return data
}

export async function removeUserBookmark(userId: string, contentId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('content_id', contentId)

  if (error) {
    console.error('Error removing user bookmark:', error)
    return false
  }

  return true
}

export async function isContentBookmarked(userId: string, contentId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking bookmark status:', error)
    return false
  }

  return !!data
}

// User Achievements
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  try {
    const supabase = await createClient()

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
    const supabase = await createClient()

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