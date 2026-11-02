import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import ChatEmptyState from './ChatEmptyState';
import ConfirmationModal from '../common/ConfirmationModal';
import WhatsAppContactInfoPanel from './WhatsAppContactInfoPanel';
import WhatsAppCallModal from './WhatsAppCallModal';
import ForwardMessageModal from './ForwardMessageModal';
import { Ban, Eraser, Trash2 } from 'lucide-react';
import useToast from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';

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
  onReact,
  onDeleteMessage,
  onStar,
  isTyping = false,
  typingUserName = '',
  onStartVoiceCall,
  onStartVideoCall,
}) => {
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // { type: 'voice' | 'video', contact }
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedDeleteMsgId, setSelectedDeleteMsgId] = useState(null);
  const [isDeleteMsgModalOpen, setIsDeleteMsgModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const toast = useToast();
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id || 'usr_me_1';

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
    onReact?.(messageId, emoji);
    toast.success(`Reacted with ${emoji}`);
  };

  const handleDeleteMessagePrompt = (messageId) => {
    setSelectedDeleteMsgId(messageId);
    setIsDeleteMsgModalOpen(true);
  };

  const handleDeleteForEveryone = () => {
    if (selectedDeleteMsgId) {
      onDeleteMessage?.(selectedDeleteMsgId, 'soft');
      setIsDeleteMsgModalOpen(false);
      setSelectedDeleteMsgId(null);
    }
  };

  const handleDeleteForMe = () => {
    if (selectedDeleteMsgId) {
      onDeleteMessage?.(selectedDeleteMsgId, 'me');
      setIsDeleteMsgModalOpen(false);
      setSelectedDeleteMsgId(null);
    }
  };

  const handleForwardMessage = (message) => {
    setForwardingMessage(message);
  };

  const handleToggleStar = (message) => {
    onStar?.(message);
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
          currentUserId={currentUserId}
          isTyping={isTyping}
          typingUserName={typingUserName}
          searchHighlight={searchQuery}
          onRetryMessage={onRetryMessage}
          onReply={handleReply}
          onReact={handleReact}
          onDeleteMessage={handleDeleteMessagePrompt}
          onForward={handleForwardMessage}
          onStar={handleToggleStar}
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
          conversation={conversation}
          currentUserId={currentUserId}
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

      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={Boolean(forwardingMessage)}
        onClose={() => setForwardingMessage(null)}
        message={forwardingMessage}
        onForwarded={() => setForwardingMessage(null)}
      />

      {/* WhatsApp Style Delete Message Options Modal */}
      {isDeleteMsgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#202C33] border border-[#2A3942] rounded-3xl p-5 shadow-2xl text-[#E9EDEF] space-y-4">
            <div>
              <h4 className="text-base font-bold text-[#E9EDEF]">Delete message?</h4>
              <p className="text-xs text-[#8696A0] mt-1">
                You can delete this message for everyone or delete it just for yourself.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteForEveryone}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md"
              >
                Delete for everyone
              </button>

              <button
                type="button"
                onClick={handleDeleteForMe}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2A3942] hover:bg-[#374248] text-[#E9EDEF] text-xs font-bold transition-all"
              >
                Delete for me
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDeleteMsgModalOpen(false);
                  setSelectedDeleteMsgId(null);
                }}
                className="w-full py-2 text-center text-xs font-semibold text-[#8696A0] hover:text-[#E9EDEF] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
