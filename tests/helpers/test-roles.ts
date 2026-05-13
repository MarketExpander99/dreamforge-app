import { Page } from '@playwright/test'
import { createBrowserSupabaseClient } from '../../lib/supabase-client'

// Helper to create test student
export async function createTestStudent(page: Page) {
  const supabase = createBrowserSupabaseClient()
  // Assume signup via API or direct insert for test
  // For real test, use signup flow or DB insert
  await page.evaluate(async () => {
    // Mock or use fetch to signup
    await fetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({
      email: 'teststudent@example.com',
      password: 'password123',
      role: 'student',
      fullName: 'Test Student',
      grade: '10'
    }) })
  })
  // Wait for profile creation
  await page.waitForTimeout(2000)
}

// Helper to create test teacher
export async function createTestTeacher(page: Page) {
  const supabase = createBrowserSupabaseClient()
  await page.evaluate(async () => {
    await fetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({
      email: 'testteacher@example.com',
      password: 'password123',
      role: 'teacher',
      fullName: 'Test Teacher',
      school: 'Test School'
    }) })
  })
  await page.waitForTimeout(2000)
}

// Helper to clean test user
export async function cleanTestUser(page: Page) {
  await page.evaluate(async () => {
    // Logout
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    // Delete user via API if possible
    await fetch('/api/admin/delete-user', { method: 'POST', body: JSON.stringify({
      emails: ['teststudent@example.com', 'testteacher@example.com', 'testparent@example.com']
    }) })
  })
}

export async function createTestParent(page: Page) {
  const supabase = createBrowserSupabaseClient()
  await page.evaluate(async () => {
    await fetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({
      email: 'testparent@example.com',
      password: 'password123',
      role: 'teacher',
      fullName: 'Test Parent',
      school: 'Test School'
    }) })
  })
  await page.waitForTimeout(2000)
}

export async function linkStudentToParent(page: Page, studentEmail: string, parentEmail: string) {
  await page.evaluate(async (sEmail: string, pEmail: string) => {
    const supabase = createBrowserSupabaseClient()
    const { data: student } = await supabase.from('profiles').select('id').eq('email', sEmail).single()
    const { data: parent } = await supabase.from('profiles').select('id').eq('email', pEmail).single()
    if (student && parent) {
      await supabase.from('profiles').update({ parent_id: parent.id }).eq('id', student.id)
    }
  }, studentEmail, parentEmail)
  await page.waitForTimeout(1000)
}
