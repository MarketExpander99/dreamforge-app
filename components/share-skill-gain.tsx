'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Share2,
  Download,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Link as LinkIcon
} from 'lucide-react'

interface ShareSkillGainProps {
  variant?: 'button' | 'card' | 'floating'
  size?: 'sm' | 'default' | 'lg'
  showText?: boolean
}

export function ShareSkillGain({
  variant = 'button',
  size = 'default',
  showText = true
}: ShareSkillGainProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = 'https://skill-gain.com'
  const shareText = 'Transform your learning with Skill Gain! Join me on this amazing educational platform featuring adaptive CAPS curriculum, gamification, and social learning. 🚀📚 #SkillGain #Education #SouthAfrica'
  const shareImage = 'https://skill-gain.com/share-image.jpg'

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: LinkIcon,
      action: async () => {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        alert('Link copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      },
      color: 'text-blue-600'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      action: () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        window.open(url, '_blank')
      },
      color: 'text-green-600'
    },
    {
      name: 'Email',
      icon: Mail,
      action: () => {
        const url = `mailto:?subject=${encodeURIComponent('Check out Skill Gain!')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
        window.open(url, '_blank')
      },
      color: 'text-gray-600'
    },
    {
      name: 'Facebook',
      icon: Copy, // Using Copy as placeholder since Facebook doesn't exist
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
        window.open(url, '_blank')
      },
      color: 'text-blue-700'
    },
    {
      name: 'Twitter',
      icon: Copy, // Using Copy as placeholder since Twitter doesn't exist
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        window.open(url, '_blank')
      },
      color: 'text-sky-500'
    },
    {
      name: 'Download Image',
      icon: Download,
      action: () => {
        // Generate and download share image
        generateShareImage()
      },
      color: 'text-purple-600'
    }
  ]

  const generateShareImage = () => {
    // Create a canvas element
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 630
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630)
    gradient.addColorStop(0, '#3b82f6')
    gradient.addColorStop(1, '#8b5cf6')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1200, 630)

    // Add pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 12; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * 60, j * 52.5, 30, 26.25)
        }
      }
    }

    // Add text
    ctx.fillStyle = 'white'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Skill Gain', 600, 200)

    ctx.font = '32px Arial'
    ctx.fillText('Where Learning Feels Like Discovery', 600, 250)

    ctx.font = '24px Arial'
    ctx.fillText('Transform education with adaptive CAPS curriculum,', 600, 320)
    ctx.fillText('gamification, and social learning', 600, 350)

    ctx.font = 'bold 28px Arial'
    ctx.fillText('Join thousands of South African students!', 600, 420)

    ctx.font = '20px Arial'
    ctx.fillText('skill-gain.com', 600, 480)

    // Add some icons (simplified)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = '36px Arial'
    ctx.fillText('📚🎓🚀', 600, 540)

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'skill-gain-share.jpg'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        alert('Share image downloaded!')
      }
    }, 'image/jpeg', 0.9)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Skill Gain - Learn Through Discovery',
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        // Fallback to custom share modal
        setIsOpen(true)
      }
    } else {
      setIsOpen(true)
    }
  }

  if (variant === 'card') {
    return (
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Share Skill Gain</h3>
              <p className="text-blue-100 text-sm">Help others discover amazing learning</p>
            </div>
            <Button
              onClick={handleShare}
              variant="secondary"
              size="sm"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'floating') {
    return (
      <>
        <Button
          onClick={handleShare}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg rounded-full w-14 h-14 p-0"
          size="lg"
        >
          <Share2 className="w-6 h-6" />
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Share Skill Gain</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    ×
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {shareOptions.map((option) => {
                    const IconComponent = option.icon
                    return (
                      <Button
                        key={option.name}
                        variant="outline"
                        className="h-auto p-4 flex flex-col gap-2"
                        onClick={option.action}
                      >
                        <IconComponent className={`w-6 h-6 ${option.color}`} />
                        <span className="text-xs">{option.name}</span>
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>
    )
  }

  // Default button variant
  return (
    <>
      <Button
        onClick={handleShare}
        variant="outline"
        size={size}
        className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100"
      >
        <Share2 className={`w-4 h-4 ${showText ? 'mr-2' : ''}`} />
        {showText && 'Share Skill Gain'}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Share Skill Gain</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  ×
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {shareOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <Button
                      key={option.name}
                      variant="outline"
                      className="h-auto p-4 flex flex-col gap-2"
                      onClick={option.action}
                    >
                      <IconComponent className={`w-6 h-6 ${option.color}`} />
                      <span className="text-xs">{option.name}</span>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}