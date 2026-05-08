'use client'

import { LandingNavigation } from '@/components/landing-navigation'
import { BookOpen, GraduationCap, Target, Users, PenTool, CheckCircle, Star, ArrowRight, Play, Award, Shield, Zap, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

// Landing Page Component
export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <LandingNavigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-full px-6 py-3 mb-12 shadow-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trusted by 10,000+ South African learners</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
              Unlock Your Potential with
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mt-2">
                CAPS-Aligned Learning
              </span>
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 dark:text-gray-300 mb-16 max-w-5xl mx-auto leading-relaxed font-light">
              South Africa's premier educational platform. Master any subject with AI-powered personalization, interactive content, and curriculum-aligned excellence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="xl"
                onClick={() => router.push('/auth/signup?role=teacher')}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-10 py-5 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                Start Teaching Free
                <Users className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="xl"
                onClick={() => router.push('/auth/signup?role=student')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-5 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                Browse as Student
                <GraduationCap className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="xl"
                variant="outline"
                onClick={() => router.push('/auth/signup?role=parent')}
                className="border-2 border-purple-300 hover:border-purple-500 text-purple-700 dark:text-purple-300 hover:text-purple-600 px-10 py-5 text-lg font-semibold rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
              >
                <Heart className="mr-2 h-5 w-5" />
                Join as Parent
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  ))}
                </div>
                <span>Join 10,000+ learners</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span>4.9/5 student rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                <span>CAPS certified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Target className="h-4 w-4" />
              Designed for South African Education
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Everything You Need to
              <span className="block text-blue-600 dark:text-blue-400">Excel Academically</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Join South Africa's most trusted educational platform with CAPS-aligned curriculum, personalized learning, and proven results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* For Students */}
            <Card className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white dark:bg-gray-800 hover:-translate-y-3 hover:rotate-1 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="text-center pb-8 relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 ring-4 ring-blue-100 dark:ring-blue-900/50 group-hover:ring-blue-200 dark:group-hover:ring-blue-800/50">
                  <GraduationCap className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  For Students
                </CardTitle>
                <p className="text-blue-600 dark:text-blue-400 font-semibold text-lg">Grades R-12</p>
              </CardHeader>
              <CardContent className="text-center space-y-8 relative z-10 px-8">
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Transform your learning experience with AI-powered personalization, interactive content, and real-time progress tracking.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-300">
                    <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">CAPS-aligned curriculum</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-300">
                    <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Adaptive difficulty levels</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-300">
                    <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Instant feedback & explanations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For Teachers */}
            <Card className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white dark:bg-gray-800 hover:-translate-y-3 hover:-rotate-1 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="text-center pb-8 relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500 ring-4 ring-green-100 dark:ring-green-900/50 group-hover:ring-green-200 dark:group-hover:ring-green-800/50">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                  For Teachers
                </CardTitle>
                <p className="text-green-600 dark:text-green-400 font-semibold text-lg">Educators & Schools</p>
              </CardHeader>
              <CardContent className="text-center space-y-8 relative z-10 px-8">
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Powerful classroom management tools, curriculum-aligned content creation, and comprehensive student analytics.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors duration-300">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Class management suite</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors duration-300">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Content creation tools</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors duration-300">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Advanced analytics dashboard</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For Parents */}
            <Card className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white dark:bg-gray-800 hover:-translate-y-3 hover:rotate-1 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="text-center pb-8 relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 ring-4 ring-purple-100 dark:ring-purple-900/50 group-hover:ring-purple-200 dark:group-hover:ring-purple-800/50">
                  <Heart className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                  For Parents
                </CardTitle>
                <p className="text-purple-600 dark:text-purple-400 font-semibold text-lg">Family Learning</p>
              </CardHeader>
              <CardContent className="text-center space-y-8 relative z-10 px-8">
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Stay connected to your child's educational journey with detailed progress tracking and family collaboration tools.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors duration-300">
                    <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Real-time progress monitoring</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors duration-300">
                    <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Family goal setting</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors duration-300">
                    <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Achievement celebrations</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">10,000+</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Active Learners</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Partner Schools</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">95%</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Pass Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">4.9/5</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              3 Simple Steps to Success
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Your Learning Journey
              <span className="block text-blue-600 dark:text-blue-400">Made Simple</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              From assessment to achievement, we've streamlined the learning process to help South African students excel in their studies
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
              <div className="h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-green-400 dark:from-blue-800 dark:via-blue-600 dark:to-green-600 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              <div className="text-center group">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-all duration-300">
                    <Target className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Assess & Personalize
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Take our quick, adaptive assessment to understand your current knowledge level. We instantly create a personalized learning path tailored to your grade and learning style.
                </p>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    🎯 AI-powered personalization in under 5 minutes
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-all duration-300">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Learn & Practice
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Engage with interactive content, watch educational videos, complete quizzes, and practice exercises. Learn at your own pace with immediate feedback and explanations.
                </p>
                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">
                    📚 Interactive lessons with instant feedback
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-all duration-300">
                    <Award className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Track & Achieve
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Monitor your progress with detailed analytics, earn achievements, and celebrate milestones. Build confidence with every completed lesson and improved grade.
                </p>
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    🏆 Celebrate every achievement and milestone
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Ready to Start Your Journey?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Join 10,000+ South African learners already excelling
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => router.push('/auth/signup')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Skill Gain Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Award className="h-4 w-4" />
              Why Choose Us
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              The Complete Learning
              <span className="block text-blue-600 dark:text-blue-400">Advantage</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Built specifically for South African education with unmatched curriculum alignment, privacy protection, and proven results that matter
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* CAPS Curriculum Alignment */}
            <div className="group">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-3xl shadow-2xl mb-8 group-hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      CAPS Curriculum Alignment
                    </h3>
                    <p className="text-blue-100">National Standards Compliance</p>
                  </div>
                </div>
                <p className="text-blue-50 text-lg leading-relaxed mb-8">
                  Every lesson, quiz, and assessment is meticulously aligned with the South African Curriculum and Assessment Policy Statement (CAPS).
                  Learn with confidence knowing your education meets national standards.
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-green-300 flex-shrink-0" />
                    <span className="text-white font-medium">Grade-appropriate content for all levels</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-green-300 flex-shrink-0" />
                    <span className="text-white font-medium">Assessment standards compliance</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-green-300 flex-shrink-0" />
                    <span className="text-white font-medium">Complete national curriculum coverage</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy-First Design */}
            <div className="group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 rounded-3xl shadow-2xl mb-8 group-hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      Privacy-First Design
                    </h3>
                    <p className="text-green-100">POPI Act & GDPR Compliant</p>
                  </div>
                </div>
                <p className="text-green-50 text-lg leading-relaxed mb-8">
                  Your privacy is our priority. We comply with POPI Act regulations and GDPR standards, ensuring your personal information stays protected.
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-green-300 flex-shrink-0" />
                    <span className="text-white font-medium">POPI Act compliant data handling</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-green-300 flex-shrink-0" />
                    <span className="text-white font-medium">Anonymous public profiles</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-green-300 flex-shrink-0" />
                    <span className="text-white font-medium">End-to-end encryption</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">AI-Powered Learning</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Adaptive algorithms that learn your style and pace</p>
            </div>

            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Rich Multimedia Content</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Videos, quizzes, interactive exercises, and audio lessons</p>
            </div>

            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Family Collaboration</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Parents and teachers work together for student success</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 fill-current" />
              Loved by Learners
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Real Stories from
              <span className="block text-blue-600 dark:text-blue-400">Real Learners</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              See how Skill Gain is transforming education across South Africa, one student at a time
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Testimonial 1 */}
            <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800 hover:-translate-y-1">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">5.0</span>
                </div>
                <blockquote className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6 italic">
                  "Skill Gain transformed how I approach mathematics. The interactive quizzes and instant feedback helped me understand concepts that confused me for years. My grades improved from 45% to 78% in just two months!"
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Sarah M.</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Grade 11 Student • Johannesburg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800 hover:-translate-y-1">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">5.0</span>
                </div>
                <blockquote className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6 italic">
                  "As a teacher, Skill Gain is a game-changer. The platform perfectly aligns with CAPS requirements, and my students are more engaged than ever. The analytics help me identify exactly where each student needs support."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-white font-bold text-lg">M</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Mr. Johnson</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mathematics Teacher • Cape Town</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800 hover:-translate-y-1">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">5.0</span>
                </div>
                <blockquote className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6 italic">
                  "Watching my daughter go from hating science to asking for extra work has been incredible. Skill Gain made complex subjects accessible and fun. The family progress tracking keeps us both motivated!"
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-white font-bold text-lg">L</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Linda K.</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Parent • Durban</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="text-center">
            <div className="inline-flex items-center gap-8 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">4.9/5</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
              </div>
              <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">98%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Satisfaction Rate</div>
              </div>
              <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of South African learners already mastering new skills with Skill Gain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/auth/signup')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg"
            >
              Get Started Free
              <Zap className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/auth/login')}
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-blue-400 mr-2" />
                <span className="text-2xl font-bold">Skill Gain</span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering South African learners with personalized, CAPS-aligned education that adapts to every student's unique journey.
              </p>
              <p className="text-sm text-gray-500">
                © 2024 Skill Gain. All rights reserved.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">For Students</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Teachers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Parents</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Content Library</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}