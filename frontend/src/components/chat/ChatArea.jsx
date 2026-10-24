import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import ChatEmptyState from './ChatEmptyState';
import ConfirmationModal from '../common/ConfirmationModal';
import WhatsAppContactInfoPanel from './WhatsAppContactInfoPanel';
import WhatsAppCallModal from './WhatsAppCallModal';
import { Ban, Eraser, Trash2 } from 'lucide-react';
import useToast from '../../hooks/useToast';

export const ChatArea = ({
  conversation,
  messages = [],
  onSendMessage,
  onRetryMessage,
  onStartTyping,
  onStopTyping,
  onBack,
  onNewChat,
  onTogglePin,
  onToggleMute,
  onToggleArchive,
  onToggleFavorite,
  onToggleUnread,
  onClearChat,
  onDeleteChat,
  onToggleBlock,
  isTyping = false,
  typingUserName = '',
  onStartVoiceCall,
  onStartVideoCall,
}) => {
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // { type: 'voice' | 'video', contact }
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const toast = useToast();

  if (!conversation) {
    return <ChatEmptyState onNewChat={onNewChat} />;
  }

  // Filter messages if search query is active
  const activeMessageList = messages;
  const filteredMessages = searchQuery.trim()
    ? activeMessageList.filter((m) =>
        m.text?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : activeMessageList;

  const handleConfirmClear = () => {
    onClearChat?.(conversation.id);
    setIsClearModalOpen(false);
    toast.info('Message history has been cleared.');
  };

  const handleConfirmDelete = () => {
    onDeleteChat?.(conversation.id);
    setIsDeleteModalOpen(false);
    toast.success(`Conversation with ${conversation.name} removed.`);
  };

  const handleConfirmBlock = () => {
    onToggleBlock?.(conversation);
    setIsBlockModalOpen(false);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const handleReact = (messageId, emoji) => {
    toast.success(`Reacted with ${emoji}`);
  };

  const handleDeleteMessage = (messageId) => {
    toast.info('Message removed');
  };

  const handleSend = (text, attachments) => {
    onSendMessage(text, attachments, replyingTo);
    setReplyingTo(null);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden relative">
      {/* 3rd Pane: Open Conversation */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#0B141A] relative">
        {/* WhatsApp Chat Header */}
        <ChatHeader
          conversation={conversation}
          onBack={onBack}
          onOpenInfo={() => setIsContactInfoOpen((prev) => !prev)}
          onTogglePin={onTogglePin}
          onToggleMute={onToggleMute}
          onToggleArchive={onToggleArchive}
          onToggleFavorite={onToggleFavorite}
          onToggleUnread={onToggleUnread}
          onClearChat={() => setIsClearModalOpen(true)}
          onDeleteChat={() => setIsDeleteModalOpen(true)}
          onToggleBlock={() => setIsBlockModalOpen(true)}
          onStartVoiceCall={(target) => {
            if (onStartVoiceCall) onStartVoiceCall(target || conversation);
            else setActiveCall({ type: 'voice', contact: target || conversation });
          }}
          onStartVideoCall={(target) => {
            if (onStartVideoCall) onStartVideoCall(target || conversation);
            else setActiveCall({ type: 'video', contact: target || conversation });
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCloseSearch={() => setSearchQuery('')}
        />

        {/* Blocked Contact Notice Banner */}
        {conversation.isBlocked && (
          <div className="bg-rose-950/80 border-b border-rose-900/60 px-4 py-2.5 flex items-center justify-between text-xs text-rose-200 select-none">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">
                You blocked this contact. They cannot message or call you.
              </span>
            </div>

            <button
              type="button"
              onClick={() => onToggleBlock?.(conversation)}
              className="px-3 py-1 rounded-md bg-[#202C33] border border-rose-800 text-rose-300 text-xs font-bold hover:bg-rose-950 transition-colors"
            >
              Unblock
            </button>
          </div>
        )}

        {/* Message History on WhatsApp Doodle Wallpaper */}
        <MessageList
          messages={filteredMessages}
          activeConversation={conversation}
          isTyping={isTyping}
          typingUserName={typingUserName}
          searchHighlight={searchQuery}
          onRetryMessage={onRetryMessage}
          onReply={handleReply}
          onReact={handleReact}
          onDeleteMessage={handleDeleteMessage}
        />

        {/* WhatsApp Message Input Bar */}
        {conversation.isBlocked ? (
          <div className="p-4 bg-[#202C33] border-t border-[#222D34] text-center text-xs text-[#8696A0]">
            <span>You have blocked this contact. Unblock {conversation.name} to send messages.</span>
          </div>
        ) : (
          <MessageComposer
            onSendMessage={handleSend}
            onTypingStart={onStartTyping}
            onTypingStop={onStopTyping}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            placeholder="Type a message"
          />
        )}
      </div>

      {/* 4th Pane: Contact Info sliding beside chat (Spec Page 2 & 4) */}
      {isContactInfoOpen && (
        <WhatsAppContactInfoPanel
          contact={conversation}
          onClose={() => setIsContactInfoOpen(false)}
          onToggleMute={onToggleMute}
          onToggleBlock={onToggleBlock}
          onStartVoiceCall={(target) => {
            if (onStartVoiceCall) onStartVoiceCall(target || conversation);
            else setActiveCall({ type: 'voice', contact: target || conversation });
          }}
          onStartVideoCall={(target) => {
            if (onStartVideoCall) onStartVideoCall(target || conversation);
            else setActiveCall({ type: 'video', contact: target || conversation });
          }}
          isMuted={conversation.isMuted}
          isBlocked={conversation.isBlocked}
        />
      )}

      {/* Real-time WhatsApp Voice & Video Call Modal (fallback if not managed globally by parent) */}
      {!onStartVoiceCall && activeCall && (
        <WhatsAppCallModal
          isOpen={Boolean(activeCall)}
          callType={activeCall.type}
          contact={activeCall.contact || conversation}
          onEndCall={(duration) => {
            setActiveCall(null);
            toast.info(`Call ended (${duration}s)`, 'Call Summary');
          }}
        />
      )}

      {/* Clear Conversation History Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Clear messages in this chat?"
        message={`Are you sure you want to clear all messages with ${conversation.name}?`}
        confirmText="Clear Messages"
        variant="warning"
        icon={Eraser}
      />

      {/* Delete Conversation Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete conversation with ${conversation.name}?`}
        message="This conversation will be permanently removed from your active chats."
        confirmText="Delete Chat"
        variant="danger"
        icon={Trash2}
      />

      {/* Block Contact Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onConfirm={handleConfirmBlock}
        title={conversation.isBlocked ? `Unblock ${conversation.name}?` : `Block ${conversation.name}?`}
        message={
          conversation.isBlocked
            ? `${conversation.name} will be able to send you messages and calls again.`
            : `Blocked contacts will no longer be able to message or call you.`
        }
        confirmText={conversation.isBlocked ? 'Unblock' : 'Block'}
        variant={conversation.isBlocked ? 'primary' : 'danger'}
        icon={Ban}
      />
    </div>
  );
};

export default ChatArea;
