import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Smile,
  Send,
  Mic,
  Camera,
  Image as ImageIcon,
  FileText,
  User as UserIcon,
  BarChart2,
  X,
  AlertCircle,
  CornerUpLeft,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { EMOJI_CATEGORIES } from '../../services/mockChatData';
import useToast from '../../hooks/useToast';

const MAX_CHAR_LIMIT = 2000;
const WARN_CHAR_THRESHOLD = 1800;

/**
 * WhatsApp Desktop Style Message Composer.
 * Spec Page 2 & 6:
 * - Attach popup menu (photos, camera, document, contact, poll)
 * - Emoji picker popover
 * - "Type a message" input
 * - Mic button that swaps to green send button when text is entered
 * - Quoted reply preview banner
 */
export const MessageComposer = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  replyingTo = null,
  onCancelReply,
  disabled = false,
  placeholder = 'Type a message',
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
  const hasText = text.trim().length > 0;
  const canSend = (hasText || selectedAttachments.length > 0) && !isOverLimit && !disabled && !isSending;

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
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

    onSendMessage(content, atts, replyingTo);
    onTypingStop?.();

    // Clear and restore
    setText('');
    setSelectedAttachments([]);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
    onCancelReply?.();

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
    toast.info(`Attached ${name}`);
    textareaRef.current?.focus();
  };

  const handleRemoveAttachment = (index) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative bg-[#202C33] border-t border-[#222D34] select-none z-10 transition-colors">
      {/* Quoted Reply Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#182229] border-b border-[#222D34] animate-slide-down">
          <div className="flex items-center gap-2.5 min-w-0">
            <CornerUpLeft className="w-4 h-4 text-[#00A884] shrink-0" />
            <div className="border-l-2 border-[#00A884] pl-2 min-w-0">
              <span className="text-xs font-bold text-[#00A884] block truncate">
                Replying to {replyingTo.senderName || 'Contact'}
              </span>
              <p className="text-xs text-[#8696A0] truncate">{replyingTo.text || 'Attachment'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-full text-[#8696A0] hover:text-[#E9EDEF]"
            title="Cancel reply"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full mb-2 left-4 z-30 w-80 sm:w-96 max-h-80 overflow-y-auto p-4 rounded-2xl bg-[#202C33] border border-[#2A3942] shadow-2xl animate-scale-in"
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2A3942]">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#8696A0]">
              Emoji
            </h5>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 rounded-lg text-[#8696A0] hover:text-[#E9EDEF]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <div key={idx}>
                <h6 className="text-[11px] font-semibold text-[#8696A0] mb-2">{cat.name}</h6>
                <div className="grid grid-cols-8 gap-1.5 text-xl">
                  {cat.emojis.map((emoji, eIdx) => (
                    <button
                      key={eIdx}
                      type="button"
                      onClick={() => handleInsertEmoji(emoji)}
                      className="p-1.5 rounded-lg hover:bg-[#2A3942] hover:scale-125 transition-all text-center flex items-center justify-center cursor-pointer"
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

      {/* WhatsApp Desktop Attach Popup Menu */}
      {showAttachmentMenu && (
        <div
          ref={attachmentMenuRef}
          className="absolute bottom-full mb-3 left-4 z-30 w-52 p-2 rounded-2xl bg-[#233138] border border-[#2A3942] shadow-2xl space-y-1 animate-scale-in"
        >
          <button
            type="button"
            onClick={() => handleAddAttachment('document', 'Report_2026.pdf', '1.4 MB')}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-medium text-[#E9EDEF] hover:bg-[#111B21] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span>Document</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddAttachment('image', 'Campus_Photo.png', '2.8 MB')}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-medium text-[#E9EDEF] hover:bg-[#111B21] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span>Photos & videos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachmentMenu(false);
              toast.info('Camera snapshot trigger');
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-medium text-[#E9EDEF] hover:bg-[#111B21] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-rose-600/30 text-rose-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <span>Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachmentMenu(false);
              toast.info('Share contact card from campus directory');
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-medium text-[#E9EDEF] hover:bg-[#111B21] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-sky-600/30 text-sky-400 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <span>Contact</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachmentMenu(false);
              toast.info('Poll creation modal opened');
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-medium text-[#E9EDEF] hover:bg-[#111B21] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-amber-600/30 text-amber-400 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span>Poll</span>
          </button>
        </div>
      )}

      {/* Selected Attachments Preview Bar */}
      {selectedAttachments.length > 0 && (
        <div className="flex items-center gap-2 px-4 pt-2.5 pb-1 overflow-x-auto">
          {selectedAttachments.map((att, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#2A3942] text-xs text-[#E9EDEF] border border-[#222D34] shrink-0"
            >
              {att.type === 'image' ? (
                <ImageIcon className="w-3.5 h-3.5 text-[#00A884]" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span className="truncate max-w-[180px] font-medium">{att.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(index)}
                className="p-0.5 rounded text-[#8696A0] hover:text-rose-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Bar (Emoji, Attach, Input, Mic/Send) */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5">
        {/* Emoji Button */}
        <button
          type="button"
          data-emoji-trigger
          onClick={() => {
            setShowEmojiPicker((prev) => !prev);
            setShowAttachmentMenu(false);
          }}
          className={cn(
            'p-2 rounded-full text-[#8696A0] hover:text-[#E9EDEF] transition-colors shrink-0',
            showEmojiPicker && 'text-[#00A884]'
          )}
          title="Emoji"
        >
          <Smile className="w-6 h-6" />
        </button>

        {/* Attachment Button */}
        <button
          type="button"
          data-attachment-trigger
          onClick={() => {
            setShowAttachmentMenu((prev) => !prev);
            setShowEmojiPicker(false);
          }}
          className={cn(
            'p-2 rounded-full text-[#8696A0] hover:text-[#E9EDEF] transition-colors shrink-0',
            showAttachmentMenu && 'text-[#00A884]'
          )}
          title="Attach"
        >
          <Paperclip className="w-6 h-6 rotate-45" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative flex items-center bg-[#2A3942] rounded-lg px-4 py-2">
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
            className="w-full text-[14.5px] bg-transparent outline-none text-[#E9EDEF] placeholder-[#8696A0] resize-none max-h-28 leading-5"
          />
        </div>

        {/* Dynamic Mic / Send Button */}
        {hasText || selectedAttachments.length > 0 ? (
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="w-10 h-10 rounded-full bg-[#00A884] hover:bg-[#008f6f] active:scale-95 text-[#111B21] flex items-center justify-center shrink-0 transition-transform shadow-md"
            title="Send (Enter)"
          >
            <Send className="w-5 h-5 fill-current ml-0.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => toast.info('Voice message: hold to record voice note.')}
            className="w-10 h-10 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942] flex items-center justify-center shrink-0 transition-colors"
            title="Voice message"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageComposer;
