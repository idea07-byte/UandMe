import React from 'react';
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
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatMessageTime } from '../../utils/formatters';

export const MessageBubble = ({
  message,
  isOutgoing = false,
  showSenderName = false,
  searchHighlight = '',
  onRetry,
}) => {
  const { text, timestamp, status, senderName, attachments = [], isMock, isOptimistic } = message;

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
        'flex flex-col max-w-[85%] sm:max-w-[72%] md:max-w-[62%] group select-text',
        isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      {/* Sender Name in Group Chats */}
      {showSenderName && !isOutgoing && senderName && (
        <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 mb-1 ml-2 select-none">
          {senderName}
        </span>
      )}

      {/* Bubble Container */}
      <div
        className={cn(
          'relative px-4 py-2.5 rounded-2xl text-sm shadow-soft transition-standard',
          isOptimistic && 'opacity-90',
          isFailed
            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800 rounded-br-xs'
            : isOutgoing
            ? 'bg-primary-600 text-white rounded-br-xs selection:bg-white/30 selection:text-white'
            : 'bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-charcoal-100 rounded-bl-xs border border-charcoal-200/70 dark:border-charcoal-700/60'
        )}
      >
        {/* Mock Sandbox Notice Pill for Local Dev Fallback */}
        {(isMock || isSandboxReply) && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md mb-1.5 border border-purple-200 dark:border-purple-800/80 w-fit select-none">
            <FlaskConical className="w-3 h-3" />
            <span>Dev Mock Sandbox</span>
          </div>
        )}

        {/* Attachments rendering */}
        {attachments.length > 0 && (
          <div className="space-y-2 mb-2">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl text-xs font-medium border',
                  isOutgoing && !isFailed
                    ? 'bg-primary-700/50 border-primary-500/50 text-white'
                    : 'bg-charcoal-50 dark:bg-charcoal-900/60 border-charcoal-200 dark:border-charcoal-700 text-charcoal-800 dark:text-charcoal-200'
                )}
              >
                {att.type === 'image' ? (
                  <ImageIcon className="w-4 h-4 shrink-0 text-emerald-300" />
                ) : (
                  <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
                )}
                <span className="truncate flex-1">{att.name || 'Attached file'}</span>
                {att.size && <span className="opacity-70 text-[10px] shrink-0">{att.size}</span>}
                <Download className="w-3.5 h-3.5 shrink-0 opacity-75 hover:opacity-100 cursor-pointer" />
              </div>
            ))}
          </div>
        )}

        {/* Text Content */}
        {cleanText && (
          <p className="leading-relaxed whitespace-pre-wrap break-words">
            {renderHighlightedText(cleanText)}
          </p>
        )}

        {/* Metadata: Time and Status Checks */}
        <div
          className={cn(
            'flex items-center justify-end gap-1.5 text-[10px] mt-1 select-none font-medium',
            isFailed
              ? 'text-rose-600 dark:text-rose-400'
              : isOutgoing
              ? 'text-primary-100/90'
              : 'text-charcoal-400 dark:text-charcoal-500'
          )}
        >
          <span>{formatMessageTime(timestamp)}</span>

          {isOutgoing && (
            <span className="shrink-0" title={`Status: ${status}`}>
              {status === 'sending' ? (
                <Clock className="w-3 h-3 animate-spin" />
              ) : status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-white font-bold" />
              ) : status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 opacity-90" />
              ) : status === 'failed' ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Check className="w-3.5 h-3.5 opacity-80" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Retry Action for Failed Messages */}
      {isFailed && (
        <div className="flex items-center gap-1.5 mt-1 mr-1 text-xs text-rose-600 dark:text-rose-400">
          <span className="text-[11px]">Failed to send</span>
          <button
            type="button"
            onClick={() => onRetry?.(message)}
            className="inline-flex items-center gap-1 text-[11px] font-bold underline hover:text-rose-800 dark:hover:text-rose-300 cursor-pointer"
          >
            <RotateCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
