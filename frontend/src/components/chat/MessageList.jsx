import React, { useRef, useEffect, useState } from 'react';
import { Lock, ArrowDown } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { formatDateDivider } from '../../utils/formatters';

export const MessageList = ({
  messages = [],
  activeConversation,
  currentUserId = 'usr_me_1',
  isTyping = false,
  typingUserName = '',
  searchHighlight = '',
  onRetryMessage,
  onReply,
  onReact,
  onDeleteMessage,
  onForward,
  onStar,
}) => {
  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadWhileScrolled, setUnreadWhileScrolled] = useState(0);

  // Monitor scroll position to show/hide scroll-to-latest button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom > 160) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
      setUnreadWhileScrolled(0);
    }
  };

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Auto-scroll on new message if user is already near bottom
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

    if (isNearBottom) {
      scrollToBottom('smooth');
    } else {
      setUnreadWhileScrolled((prev) => prev + 1);
    }
  }, [messages.length]);

  // Initial scroll to bottom on conversation change
  useEffect(() => {
    scrollToBottom('auto');
    setUnreadWhileScrolled(0);
  }, [activeConversation?.id]);

  // Helper to determine whether to render date separator
  const shouldRenderDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.timestamp).toDateString();
    return currentDate !== prevDate;
  };

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden wa-chat-wallpaper">
      {/* Scrollable Messages Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-12 py-4 space-y-2"
      >
        {/* End-to-end Encryption Banner */}
        <div className="flex justify-center my-3 select-none px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#182229] text-[12px] text-[#FFEECD]/80 text-center max-w-md shadow-sm border border-[#222D34]">
            <Lock className="w-3.5 h-3.5 text-[#FFD279] shrink-0" />
            <span>Messages and calls are end-to-end encrypted. No one outside of this chat, not even UandMe, can read or listen to them.</span>
          </div>
        </div>

        {/* Message Stream with Date Dividers */}
        {messages.map((msg, index) => {
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showDate = shouldRenderDateSeparator(msg, prevMsg);
          const isOutgoing = msg.senderId === currentUserId;

          return (
            <React.Fragment key={msg.id || index}>
              {/* Date Separator Pill */}
              {showDate && (
                <div className="flex justify-center my-3 select-none">
                  <span className="px-3 py-1 rounded-md text-[11.5px] font-medium text-[#8696A0] bg-[#182229] shadow-sm uppercase tracking-wide">
                    {formatDateDivider(msg.timestamp)}
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <MessageBubble
                message={msg}
                isOutgoing={isOutgoing}
                showSenderName={activeConversation?.isGroup}
                searchHighlight={searchHighlight}
                onRetry={onRetryMessage}
                onReply={onReply}
                onReact={onReact}
                onDelete={onDeleteMessage}
                onForward={onForward}
                onStar={onStar}
              />
            </React.Fragment>
          );
        })}

        {/* Real-time Typing Indicator */}
        {isTyping && (
          <div className="pt-1">
            <TypingIndicator
              senderName={typingUserName || activeConversation?.name || 'Contact'}
              avatar={activeConversation?.avatar}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Latest Control */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-4 right-6 z-20 p-2.5 rounded-full bg-[#202C33] text-[#AEBAC1] hover:text-[#E9EDEF] border border-[#2A3942] shadow-xl hover:bg-[#374248] active:scale-95 transition-all flex items-center justify-center animate-slide-up"
          title="Scroll to latest message"
          aria-label="Scroll to latest message"
        >
          <ArrowDown className="w-4 h-4" />
          {unreadWhileScrolled > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00A884] text-white text-[10px] font-bold flex items-center justify-center">
              {unreadWhileScrolled}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default MessageList;
