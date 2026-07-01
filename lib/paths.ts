// lib/paths.ts
// Shared TypeScript types for personalized learning paths (Phase 2+)
// Used for Grok-generated paths and user-saved paths. Keep simple + extensible for Phase 3.

export interface PathStep {
  title: string
  description: string
  estimatedTime: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
}

export interface SuggestedCourse {
  title: string
  provider: string
  url: string
  estimatedTime: string
  level: string
  reason: string
}

export interface GeneratedPath {
  path: PathStep[]
  suggestedCourses: SuggestedCourse[]
  // Phase 3: lessons stored under the same modules JSONB for no-schema-change persistence
  lessons?: Record<string, LessonCard>
}

export interface LessonCard {
  title: string
  content: string
  keyPoints: string[]
  estimatedTime?: string
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  generatedAt: string
}

export interface SavedLearningPath {
  id: string
  user_id: string
  title: string
  description: string | null
  // modules stores the full GeneratedPath shape (path + suggestedCourses + optional meta + lessons)
  modules: GeneratedPath | any
  status: 'active' | 'completed' | 'archived'
  progress: number // 0-100
  generated_at: string | null
  created_at: string
  updated_at: string
}

// For client usage in lists / detail (lightweight projection)
export interface PathListItem {
  id: string
  title: string
  description: string | null
  status: 'active' | 'completed' | 'archived'
  progress: number
  created_at: string
  updated_at: string
}

