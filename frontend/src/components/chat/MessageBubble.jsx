import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Download,
  RotateCw,
  FlaskConical,
  ChevronDown,
  CornerUpLeft,
  Smile,
  Star,
  Trash2,
  Copy,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatMessageTime } from '../../utils/formatters';

// Common emoji reactions
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/**
 * WhatsApp Desktop Style Message Bubble.
 * Spec Page 1-3:
 * - 8 px radius with small corner tail
 * - Outgoing: #005C4B (#D9FDD3 in light)
 * - Incoming: #202C33 (#FFFFFF in light)
 * - Time + delivery ticks (read = #53BDEB double ticks)
 * - Reply quote block
 * - Emoji reactions under bubble
 * - Hover quick action menu
 */
export const MessageBubble = ({
  message,
  isOutgoing = false,
  showSenderName = false,
  searchHighlight = '',
  onRetry,
  onReply,
  onReact,
  onDelete,
}) => {
  const {
    id,
    text,
    timestamp,
    status,
    senderName,
    attachments = [],
    isMock,
    isOptimistic,
    replyTo,
    reactions = [],
  } = message;

  const [showMenu, setShowMenu] = useState(false);
  const [showReactBar, setShowReactBar] = useState(false);

  // Check if emoji-only message (1 to 3 emojis)
  const isEmojiOnly =
    text &&
    /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}){1,3}$/u.test(text.trim());

  // Highlight search matches
  const renderHighlightedText = (content) => {
    if (!searchHighlight || !searchHighlight.trim()) {
      return content;
    }

    const regex = new RegExp(`(${searchHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = content.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-amber-300 dark:bg-amber-500/60 text-charcoal-950 font-semibold px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const isFailed = status === 'failed';
  const isSandboxReply = text?.includes('[Simulated Sandbox Reply]');
  const cleanText = isSandboxReply
    ? text.replace('[Simulated Sandbox Reply]', '').trim()
    : text;

  return (
    <div
      className={cn(
        'flex flex-col max-w-[85%] sm:max-w-[70%] md:max-w-[60%] group relative select-text mb-1',
        isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      {/* Sender Name in Group Chats */}
      {showSenderName && !isOutgoing && senderName && (
        <span className="text-[12px] font-bold text-[#00A884] mb-1 ml-2 select-none">
          {senderName}
        </span>
      )}

      {/* Bubble Container */}
      <div
        className={cn(
          'relative px-3 py-1.5 rounded-lg text-[14px] shadow-sm transition-standard',
          isOutgoing
            ? 'bg-[#005C4B] text-[#E9EDEF] wa-tail-out rounded-tr-none'
            : 'bg-[#202C33] text-[#E9EDEF] wa-tail-in rounded-tl-none',
          isOptimistic && 'opacity-90',
          isFailed && 'border border-rose-500/60'
        )}
      >
        {/* Hover Quick Action Dropdown Trigger */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded bg-black/20 hover:bg-black/40 text-[#8696A0] hover:text-[#E9EDEF] transition-colors"
            title="Message options"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Quick Menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-[#233138] border border-[#2A3942] shadow-xl py-1 z-30 text-xs text-[#E9EDEF] animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onReply?.(message);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-[#111B21] flex items-center gap-2"
              >
                <CornerUpLeft className="w-3.5 h-3.5 text-[#8696A0]" />
                <span>Reply</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowReactBar(true);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-[#111B21] flex items-center gap-2"
              >
                <Smile className="w-3.5 h-3.5 text-[#8696A0]" />
                <span>React to message</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  navigator.clipboard?.writeText(cleanText || '');
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-[#111B21] flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-[#8696A0]" />
                <span>Copy</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onDelete?.(id);
                }}
                className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-[#111B21] flex items-center gap-2 border-t border-[#2A3942]"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Emoji Reaction Floating Bar */}
        {showReactBar && (
          <div className="absolute -top-10 left-0 bg-[#202C33] border border-[#2A3942] rounded-full px-2 py-1 shadow-2xl flex items-center gap-1.5 z-30 animate-scale-in">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReact?.(id, emoji);
                  setShowReactBar(false);
                }}
                className="hover:scale-125 transition-transform text-base p-0.5"
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowReactBar(false)}
              className="text-[#8696A0] hover:text-[#E9EDEF] text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quoted Reply Preview Block (Spec Page 2 & 6) */}
        {replyTo && (
          <div className="mb-1.5 p-2 rounded-md bg-black/20 border-l-4 border-[#00A884] text-xs">
            <span className="font-bold text-[#00A884] block mb-0.5">
              {replyTo.senderName || 'Contact'}
            </span>
            <p className="text-[#8696A0] truncate">{replyTo.text || 'Attachment'}</p>
          </div>
        )}

        {/* Mock Sandbox Notice Pill */}
        {(isMock || isSandboxReply) && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-black/20 px-1.5 py-0.5 rounded mb-1 w-fit select-none">
            <FlaskConical className="w-3 h-3" />
            <span>Dev Sandbox</span>
          </div>
        )}

        {/* Attachments rendering */}
        {attachments.length > 0 && (
          <div className="space-y-1.5 mb-1.5">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-2 rounded-lg text-xs bg-black/20 border border-black/10"
              >
                {att.type === 'image' ? (
                  <ImageIcon className="w-4 h-4 shrink-0 text-[#00A884]" />
                ) : (
                  <FileText className="w-4 h-4 shrink-0 text-[#00A884]" />
                )}
                <span className="truncate flex-1 font-medium">{att.name || 'Attachment'}</span>
                {att.size && <span className="opacity-70 text-[10px] shrink-0">{att.size}</span>}
                <Download className="w-3.5 h-3.5 shrink-0 opacity-75 hover:opacity-100 cursor-pointer" />
              </div>
            ))}
          </div>
        )}

        {/* Text Content */}
        {cleanText && (
          <p
            className={cn(
              'leading-relaxed whitespace-pre-wrap break-words pr-14',
              isEmojiOnly ? 'text-3xl py-1' : 'text-[14.2px]'
            )}
          >
            {renderHighlightedText(cleanText)}
          </p>
        )}

        {/* Metadata: Time and Status Checks pinned to bottom-right */}
        <div className="absolute right-2 bottom-1 flex items-center gap-1 text-[11px] select-none text-[#8696A0]">
          <span>{formatMessageTime(timestamp)}</span>

          {isOutgoing && (
            <span className="shrink-0 ml-0.5" title={`Status: ${status}`}>
              {status === 'sending' ? (
                <Clock className="w-3 h-3 animate-spin text-[#8696A0]" />
              ) : status === 'read' ? (
                <CheckCheck className="w-4 h-4 text-[#53BDEB]" />
              ) : status === 'delivered' ? (
                <CheckCheck className="w-4 h-4 text-[#8696A0]" />
              ) : status === 'failed' ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Check className="w-4 h-4 text-[#8696A0]" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Emoji Reactions below bubble (Spec Page 2 & 6) */}
      {reactions.length > 0 && (
        <div className="flex items-center gap-1 mt-[-6px] ml-2 px-1.5 py-0.5 rounded-full bg-[#202C33] border border-[#2A3942] text-xs shadow-md z-10 w-fit">
          {reactions.map((r, i) => (
            <span key={i}>{typeof r === 'string' ? r : r.emoji}</span>
          ))}
          {reactions.length > 1 && (
            <span className="text-[10px] text-[#8696A0] ml-0.5">{reactions.length}</span>
          )}
        </div>
      )}

      {/* Retry Action for Failed Messages */}
      {isFailed && (
        <div className="flex items-center gap-1.5 mt-1 mr-1 text-xs text-rose-400">
          <span className="text-[11px]">Failed to send</span>
          <button
            type="button"
            onClick={() => onRetry?.(message)}
            className="inline-flex items-center gap-1 text-[11px] font-bold underline hover:text-rose-300 cursor-pointer"
          >
            <RotateCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
