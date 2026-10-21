import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Smile,
  Send,
  Image as ImageIcon,
  FileText,
  Music,
  BarChart2,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { EMOJI_CATEGORIES } from '../../services/mockChatData';
import useToast from '../../hooks/useToast';

const MAX_CHAR_LIMIT = 2000;
const WARN_CHAR_THRESHOLD = 1800;

export const MessageComposer = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = 'Type a message... (Enter to send, Shift+Enter for new line)',
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const toast = useToast();

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHAR_LIMIT;
  const canSend = (text.trim().length > 0 || selectedAttachments.length > 0) && !isOverLimit && !disabled && !isSending;

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 140)}px`;
    }
  }, [text]);

  // Click outside to close emoji picker & attachment popups
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        !e.target.closest('[data-emoji-trigger]')
      ) {
        setShowEmojiPicker(false);
      }
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(e.target) &&
        !e.target.closest('[data-attachment-trigger]')
      ) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!canSend) return;

    setIsSending(true);
    const content = text.trim();
    const atts = [...selectedAttachments];

    onSendMessage(content, atts);
    onTypingStop?.();

    // Clear and restore
    setText('');
    setSelectedAttachments([]);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }

    setTimeout(() => {
      setIsSending(false);
    }, 150);
  };

  const handleInsertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleAddAttachment = (type, name, size) => {
    setSelectedAttachments((prev) => [...prev, { type, name, size }]);
    setShowAttachmentMenu(false);
    toast.info(`Added attachment: ${name}`);
    textareaRef.current?.focus();
  };

  const handleRemoveAttachment = (index) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative p-3 sm:p-4 bg-white dark:bg-charcoal-900 border-t border-charcoal-200 dark:border-charcoal-800 transition-colors">
      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full mb-3 left-4 sm:left-6 z-30 w-80 sm:w-96 max-h-80 overflow-y-auto p-4 rounded-3xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 shadow-soft-lg animate-scale-in"
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-charcoal-100 dark:border-charcoal-800">
            <h5 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-charcoal-300">
              Select Emoji
            </h5>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200"
              aria-label="Close emoji picker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5">
            {EMOJI_CATEGORIES.map((category) => (
              <div key={category.name}>
                <p className="text-[11px] font-semibold text-charcoal-400 mb-1.5">
                  {category.name}
                </p>
                <div className="grid grid-cols-8 gap-1.5 text-xl">
                  {category.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleInsertEmoji(emoji)}
                      className="p-1.5 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 hover:scale-125 transition-transform text-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Menu Popover */}
      {showAttachmentMenu && (
        <div
          ref={attachmentMenuRef}
          className="absolute bottom-full mb-3 left-3 sm:left-4 z-30 w-56 p-2 rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 shadow-soft-lg animate-slide-up space-y-1"
        >
          <button
            type="button"
            onClick={() => handleAddAttachment('image', 'capstone_architecture_diagram.png', '1.8 MB')}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-medium text-charcoal-800 dark:text-charcoal-200 hover:bg-primary-50 dark:hover:bg-charcoal-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span>Photos & Videos</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddAttachment('document', 'project_requirements_sprint1.pdf', '340 KB')}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-medium text-charcoal-800 dark:text-charcoal-200 hover:bg-primary-50 dark:hover:bg-charcoal-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span>Document / PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddAttachment('audio', 'voice_memo_meeting_notes.mp3', '4.2 MB')}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-medium text-charcoal-800 dark:text-charcoal-200 hover:bg-primary-50 dark:hover:bg-charcoal-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <span>Audio Recording</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachmentMenu(false);
              toast.info('Team Poll creation will connect to the backend survey API in Phase 4!');
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-medium text-charcoal-800 dark:text-charcoal-200 hover:bg-primary-50 dark:hover:bg-charcoal-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span>Create Poll</span>
          </button>
        </div>
      )}

      {/* Selected Attachments Preview Bar */}
      {selectedAttachments.length > 0 && (
        <div className="flex items-center gap-2 mb-2.5 overflow-x-auto pb-1 max-w-5xl mx-auto">
          {selectedAttachments.map((att, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-charcoal-100 dark:bg-charcoal-800 text-xs text-charcoal-800 dark:text-charcoal-200 border border-charcoal-200 dark:border-charcoal-700 shrink-0"
            >
              {att.type === 'image' ? (
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-sky-500" />
              )}
              <span className="truncate max-w-[180px] font-medium">{att.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(index)}
                className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-charcoal-400 hover:text-rose-500"
                aria-label="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer Input Bar */}
      <div className="flex items-end gap-2 max-w-5xl mx-auto">
        {/* Attachment Trigger */}
        <button
          type="button"
          data-attachment-trigger
          onClick={() => {
            setShowAttachmentMenu((prev) => !prev);
            setShowEmojiPicker(false);
          }}
          className={cn(
            'p-2.5 rounded-xl text-charcoal-500 hover:text-charcoal-700 dark:text-charcoal-400 dark:hover:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors shrink-0 mb-0.5',
            showAttachmentMenu && 'bg-primary-50 text-primary-600 dark:bg-charcoal-800 dark:text-primary-400'
          )}
          title="Add attachment"
          aria-label="Add attachment"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text Input Container */}
        <div className="flex-1 relative flex flex-col bg-charcoal-100/90 dark:bg-charcoal-800/80 rounded-2xl border border-charcoal-200/60 dark:border-charcoal-700/60 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value.trim().length > 0) {
                onTypingStart?.();
              } else {
                onTypingStop?.();
              }
            }}
            onBlur={() => onTypingStop?.()}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full text-sm bg-transparent outline-none py-3 pl-4 pr-11 text-charcoal-900 dark:text-charcoal-100 placeholder:text-charcoal-400 dark:placeholder:text-charcoal-500 resize-none max-h-36"
          />

          {/* Emoji Trigger */}
          <button
            type="button"
            data-emoji-trigger
            onClick={() => {
              setShowEmojiPicker((prev) => !prev);
              setShowAttachmentMenu(false);
            }}
            className={cn(
              'absolute right-2.5 top-2.5 p-1.5 rounded-xl text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200 transition-colors',
              showEmojiPicker && 'text-primary-600 dark:text-primary-400'
            )}
            title="Emoji picker"
            aria-label="Emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Character counter warning (visible when nearing limit) */}
          {charCount >= WARN_CHAR_THRESHOLD && (
            <div className="px-4 pb-1.5 flex items-center justify-between text-[10px]">
              <span
                className={cn(
                  'font-medium flex items-center gap-1',
                  isOverLimit ? 'text-rose-600 font-bold' : 'text-amber-500'
                )}
              >
                <AlertCircle className="w-3 h-3" />
                {isOverLimit ? 'Character limit exceeded' : 'Approaching character limit'}
              </span>
              <span className={isOverLimit ? 'text-rose-600 font-bold' : 'text-charcoal-400'}>
                {charCount} / {MAX_CHAR_LIMIT}
              </span>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            'p-3 rounded-2xl transition-all duration-200 shrink-0 mb-0.5 shadow-soft flex items-center justify-center',
            canSend
              ? 'bg-primary-600 hover:bg-primary-700 active:scale-95 text-white hover:shadow-emerald-glow/40 cursor-pointer'
              : 'bg-charcoal-200 dark:bg-charcoal-800 text-charcoal-400 dark:text-charcoal-600 cursor-not-allowed shadow-none'
          )}
          title="Send Message (Enter)"
          aria-label="Send Message"
        >
          <Send className={cn('w-4 h-4', canSend && 'transform -rotate-12')} />
        </button>
      </div>
    </div>
  );
};

export default MessageComposer;
