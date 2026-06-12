'use client';

import { useState } from 'react';

interface ReadAloudButtonProps {
  text: string;
  voice?: 'rex' | 'sal' | 'ara' | 'eve' | 'leo';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showVoiceLabel?: boolean;
  disabled?: boolean;
}

export function ReadAloudButton({
  text,
  voice = 'ara',
  className = '',
  size = 'md',
  showVoiceLabel = true,
  disabled = false,
}: ReadAloudButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voiceLabels: Record<string, string> = {
    rex: 'Rex',
    sal: 'Sal',
    ara: 'Ara',
    eve: 'Eve',
    leo: 'Leo',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  };

  const handlePlay = async () => {
    if (!text?.trim() || isLoading || isPlaying || disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setError('Playback failed');
        setIsPlaying(false);
      };

      setIsPlaying(true);
      await audio.play();
    } catch (err: any) {
      console.error('TTS playback error:', err);
      setError(err.message || 'Could not play audio');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = isLoading || isPlaying;

  return (
    <div className="inline-flex flex-col items-start">
      <button
        onClick={handlePlay}
        disabled={isActive || disabled || !text?.trim()}
        className={`
          inline-flex items-center justify-center rounded-xl font-medium
          transition-all duration-200 active:scale-[0.985]
          bg-gradient-to-r from-blue-600 to-indigo-600 
          hover:from-blue-700 hover:to-indigo-700
          text-white shadow-sm
          disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed
          disabled:opacity-70
          ${sizeClasses[size]}
          ${className}
        `}
        aria-label={`Read aloud with ${voiceLabels[voice]} voice`}
      >
        <span className="flex items-center gap-2">
          {isLoading ? (
            <>
              <span className="animate-spin">⟳</span>
              Generating...
            </>
          ) : isPlaying ? (
            <>
              <span>🔊</span>
              Playing...
            </>
          ) : (
            <>
              <span>🔊</span>
              Read aloud
              {showVoiceLabel && (
                <span className="ml-1 opacity-90 text-xs font-normal">
                  ({voiceLabels[voice]})
                </span>
              )}
            </>
          )}
        </span>
      </button>

      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}