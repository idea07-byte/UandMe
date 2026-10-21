import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import ChatEmptyState from './ChatEmptyState';
import Modal from '../common/Modal';
import ConfirmationModal from '../common/ConfirmationModal';
import ContactDetailsPanel from '../contacts/ContactDetailsPanel';
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
}) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const toast = useToast();

  if (!conversation) {
    return <ChatEmptyState onNewChat={onNewChat} />;
  }

  // Filter messages if search query is active
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.text?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : messages;

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

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-charcoal-900 overflow-hidden relative transition-colors">
      {/* Active Chat Header */}
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        onTogglePin={onTogglePin}
        onToggleMute={onToggleMute}
        onToggleArchive={onToggleArchive}
        onToggleFavorite={onToggleFavorite}
        onToggleUnread={onToggleUnread}
        onClearChat={() => setIsClearModalOpen(true)}
        onDeleteChat={() => setIsDeleteModalOpen(true)}
        onToggleBlock={() => setIsBlockModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCloseSearch={() => setSearchQuery('')}
      />

      {/* Blocked Contact Notice Banner */}
      {conversation.isBlocked && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900/60 px-4 py-2.5 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200 animate-slide-down">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-semibold">
              You blocked this contact. They cannot message or call you.
            </span>
          </div>

          <button
            type="button"
            onClick={() => onToggleBlock?.(conversation)}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-charcoal-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors shadow-soft-sm"
          >
            Unblock
          </button>
        </div>
      )}

      {/* Message History with Date Dividers, Typing, and Scroll Control */}
      <MessageList
        messages={filteredMessages}
        activeConversation={conversation}
        isTyping={isTyping}
        typingUserName={typingUserName}
        searchHighlight={searchQuery}
        onRetryMessage={onRetryMessage}
      />

      {/* Message Composer (Disabled when blocked) */}
      {conversation.isBlocked ? (
        <div className="p-4 bg-charcoal-50 dark:bg-charcoal-950/60 border-t border-charcoal-200 dark:border-charcoal-800 text-center text-xs text-charcoal-500">
          <span>You have blocked this contact. Unblock {conversation.name} to send messages.</span>
        </div>
      ) : (
        <MessageComposer
          onSendMessage={(text, attachments) => onSendMessage(text, attachments)}
          onTypingStart={onStartTyping}
          onTypingStop={onStopTyping}
          placeholder={`Message ${conversation.name}...`}
        />
      )}

      {/* Contact Profile Modal */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        maxWidth="max-w-md"
      >
        <ContactDetailsPanel
          contact={{
            ...conversation,
            role: conversation.role || (conversation.isGroup ? 'Group Discussion' : 'Campus Peer'),
            department: conversation.department || 'Computer Science',
            statusMessage: conversation.about || conversation.statusMessage || 'Available on PulseChat',
          }}
          onClose={() => setIsInfoModalOpen(false)}
          onStartChat={() => setIsInfoModalOpen(false)}
          onToggleFavorite={() => onToggleFavorite?.(conversation.id)}
          onToggleBlock={() => {
            setIsInfoModalOpen(false);
            setIsBlockModalOpen(true);
          }}
          className="border-0 p-0"
        />
      </Modal>

      {/* Clear Conversation History Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Clear conversation history?"
        message={`Are you sure you want to clear all messages with ${conversation.name}? All message text and attachments will be deleted from your active view.`}
        confirmText="Clear Messages"
        variant="warning"
        icon={Eraser}
        note="This is a local demonstration action. Messages will be cleared from this active browser session."
      />

      {/* Delete Conversation Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete conversation with ${conversation.name}?`}
        message="This conversation will be permanently removed from your active inbox. You can always restart a new conversation with this contact from the Contacts tab."
        confirmText="Delete Conversation"
        variant="danger"
        icon={Trash2}
        note="Permanent backend deletion and database cascade will be implemented in Phase 5."
      />

      {/* Block Contact Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onConfirm={handleConfirmBlock}
        title={conversation.isBlocked ? `Unblock ${conversation.name}?` : `Block ${conversation.name}?`}
        message={
          conversation.isBlocked
            ? `${conversation.name} will be able to send you messages and start audio/video calls again.`
            : `Blocked contacts will no longer be able to message or call you. You can unblock them at any time.`
        }
        confirmText={conversation.isBlocked ? 'Unblock Contact' : 'Block Contact'}
        variant={conversation.isBlocked ? 'primary' : 'danger'}
        icon={Ban}
        note="Frontend demo simulation. Real-time blocking enforcement occurs on the WebSocket gateway in Phase 5."
      />
    </div>
  );
};

export default ChatArea;
