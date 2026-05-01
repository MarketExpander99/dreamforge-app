'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; testUser?: any } | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Database Seeding</CardTitle>
          <CardDescription>
            Seed the database with sample data and create a test user account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              This will create categories, content, and a test user account for testing the application.
            </p>

            <Button
              onClick={handleSeed}
              disabled={loading}
              size="lg"
              className="px-8"
            >
              {loading ? 'Seeding Database...' : 'Seed Database'}
            </Button>
          </div>

          {result && (
            <Card className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? '✅ Success!' : '❌ Error'}
                  </h3>

                  {result.message && (
                    <p className="text-sm text-green-700">{result.message}</p>
                  )}

                  {result.error && (
                    <p className="text-sm text-red-700">{result.error}</p>
                  )}

                  {result.testUser && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <h4 className="font-semibold text-gray-800 mb-2">Test User Created:</h4>
                      <p className="text-sm"><strong>Email:</strong> {result.testUser.email}</p>
                      <p className="text-sm"><strong>Password:</strong> {result.testUser.password}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Use these credentials to sign in and test the application!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              After seeding, visit the home page to see the personalized content feed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}