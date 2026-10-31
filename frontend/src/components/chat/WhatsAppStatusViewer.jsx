import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Send,
  Smile,
  Heart,
  ThumbsUp,
  Flame,
  Laugh,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import useToast from '../../hooks/useToast';
import { cn } from '../../utils/cn';

const STORY_DURATION_MS = 5000;
const QUICK_REACTIONS = ['❤️', '😂', '🔥', '👏', '😮', '🙏'];

/**
 * Fullscreen WhatsApp Web Status Story Viewer.
 * Displays segmented story progress bars, auto-advances every 5s,
 * supports pause-on-hold, left/right navigation, and direct reply to sender.
 */
export const WhatsAppStatusViewer = ({
  status,
  onClose,
  onNextStatus,
  onPrevStatus,
  onReplyToStatus,
}) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const progressTimerRef = useRef(null);
  const toast = useToast();

  if (!status) return null;

  // Build stories array (using latestStory or generating multiple segments if storiesCount > 1)
  const stories = status.stories || [
    status.latestStory || {
      type: 'text',
      content: 'Hello from WhatsApp Status! 🚀',
      bgColor: '#005C4B',
    },
    ...(status.storiesCount > 1
      ? [
          {
            type: 'image',
            content: 'Working on UandMe WhatsApp release! 💻✨',
            imageUrl:
              'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
          },
        ]
      : []),
  ];

  const activeStory = stories[currentStoryIndex] || stories[0];

  // Auto-advance progress timer
  useEffect(() => {
    setProgress(0);
  }, [currentStoryIndex, status.id]);

  useEffect(() => {
    if (isPaused) return;

    const intervalStep = 50;
    const increment = (intervalStep / STORY_DURATION_MS) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, intervalStep);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPaused, currentStoryIndex, stories.length]);

  // Keyboard navigation (Escape to close, Arrows to navigate)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStoryIndex, stories.length]);

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((idx) => idx + 1);
    } else if (onNextStatus) {
      onNextStatus();
      setCurrentStoryIndex(0);
    } else {
      onClose?.();
    }
  };

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((idx) => idx - 1);
    } else if (onPrevStatus) {
      onPrevStatus();
      setCurrentStoryIndex(0);
    }
  };

  const handleSendReply = (e) => {
    e?.preventDefault();
    if (!replyText.trim()) return;

    const message = `[Status Reply]: ${replyText.trim()}`;
    onReplyToStatus?.(status, message);
    toast.success(`Replied to ${status.name}'s status!`);
    setReplyText('');
    onClose?.();
  };

  const handleReactionClick = (emoji) => {
    const message = `[Status Reaction]: ${emoji}`;
    onReplyToStatus?.(status, message);
    toast.success(`Sent ${emoji} to ${status.name}`);
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none animate-fade-in backdrop-blur-md"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Top Close Button (Desktop header) */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        title="Close (Esc)"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Story Container (Mobile-ratio card on Desktop) */}
      <div className="relative w-full max-w-[480px] h-full sm:h-[90vh] sm:max-h-[820px] bg-[#111B21] sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10">
        {/* Top Story Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 pt-4 flex gap-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {stories.map((_, idx) => {
            let widthPercent = 0;
            if (idx < currentStoryIndex) widthPercent = 100;
            else if (idx === currentStoryIndex) widthPercent = progress;

            return (
              <div
                key={idx}
                className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentStoryIndex(idx);
                }}
              >
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Contact Header */}
        <div className="absolute top-7 left-0 right-0 z-30 px-4 py-2 flex items-center justify-between text-white bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-3">
            <Avatar src={status.avatar} name={status.name} size="md" />
            <div>
              <h4 className="text-sm font-bold text-white leading-tight drop-shadow-md">
                {status.name}
              </h4>
              <p className="text-[11px] text-white/80 drop-shadow-sm">
                {status.time || 'Today'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused((p) => !p);
              }}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Left & Right Click Navigation Touch Zones */}
        <div
          className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          title="Previous"
        />
        <div
          className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          title="Next"
        />

        {/* Story Main Content (Image or Vibrant Text Status) */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {activeStory.type === 'image' && activeStory.imageUrl ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={activeStory.imageUrl}
                alt="Status update"
                className="w-full h-full object-contain"
              />
              {activeStory.content && (
                <div className="absolute bottom-20 left-0 right-0 px-6 py-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-center">
                  <p className="text-white text-base font-medium drop-shadow-md">
                    {activeStory.content}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-8 text-center"
              style={{
                backgroundColor: activeStory.bgColor || '#005C4B',
              }}
            >
              <p className="text-white text-2xl sm:text-3xl font-bold leading-relaxed max-w-sm drop-shadow-md select-text font-sans">
                {activeStory.content || 'Status update'}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Reply Bar & Quick Emoji Reactions */}
        <div
          className="relative z-30 p-3 bg-[#111B21]/90 backdrop-blur-md border-t border-white/10 flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Reaction Pills */}
          <div className="flex items-center justify-around py-1">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReactionClick(emoji)}
                className="text-xl p-1.5 hover:scale-125 transition-transform"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Text Reply Input */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${status.name}...`}
              className="flex-1 px-4 py-2 rounded-full bg-[#202C33] text-sm text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:ring-1 focus:ring-[#00A884]"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2.5 rounded-full bg-[#00A884] disabled:opacity-40 text-white hover:bg-[#00A884]/90 transition-all shrink-0"
              title="Send reply"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Floating Left / Right Desktop Arrow Buttons */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-xl"
        title="Previous Status (Left Arrow)"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-xl"
        title="Next Status (Right Arrow)"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};

export default WhatsAppStatusViewer;

