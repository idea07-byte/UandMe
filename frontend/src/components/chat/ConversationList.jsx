import React, { useState } from 'react';
import { Plus, Search, MessageSquareDashed, Users, Archive, Star } from 'lucide-react';
import ConversationItem from './ConversationItem';
import NewChatModal from './NewChatModal';
import NewGroupModal from './NewGroupModal';
import ConnectionStatusBadge from './ConnectionStatusBadge';
import SearchInput from '../forms/SearchInput';
import Button from '../common/Button';
import { cn } from '../../utils/cn';

// Loading Skeleton Placeholder for Conversation Items
const ConversationSkeleton = () => (
  <div className="flex items-center gap-3.5 p-3 rounded-2xl animate-pulse">
    <div className="w-10 h-10 rounded-full bg-charcoal-200 dark:bg-charcoal-800 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex justify-between">
        <div className="h-3 w-28 bg-charcoal-200 dark:bg-charcoal-800 rounded" />
        <div className="h-2.5 w-10 bg-charcoal-200 dark:bg-charcoal-800 rounded" />
      </div>
      <div className="h-2.5 w-44 bg-charcoal-200 dark:bg-charcoal-800 rounded" />
    </div>
  </div>
);

export const ConversationList = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onAddConversation,
  onTogglePin,
  onToggleMute,
  onToggleArchive,
  onToggleFavorite,
  onToggleUnread,
  onClearChat,
  onDeleteChat,
  onToggleBlock,
  filterTab = 'all',
  onFilterChange,
  searchQuery = '',
  onSearchChange,
  isLoading = false,
  activeView = 'chats', // 'chats' | 'contacts' | 'archived'
  contacts = [],
  className,
}) => {
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'archived':
        return 'Archived Chats';
      case 'contacts':
        return 'Campus Contacts';
      default:
        return 'Messages';
    }
  };

  return (
    <div
      className={cn(
        'w-full md:w-80 lg:w-96 flex flex-col h-full bg-[#111B21] border-r border-[#222D34] shrink-0 transition-colors',
        className
      )}
    >
      {/* Top Header */}
      <div className="px-4 pt-3 pb-2 border-b border-[#222D34] shrink-0 bg-[#111B21]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#E9EDEF] tracking-tight">
              {getHeaderTitle()}
            </h2>
            <ConnectionStatusBadge size="sm" />
          </div>

          <div className="flex items-center gap-1">
            {/* New Group Button */}
            <button
              type="button"
              onClick={() => setIsNewGroupModalOpen(true)}
              className="p-2 rounded-full text-[#8696A0] hover:text-[#00A884] hover:bg-[#202C33] transition-colors"
              title="New group"
              aria-label="New group"
            >
              <Users className="w-5 h-5" />
            </button>

            {/* WhatsApp New Chat Button */}
            <button
              type="button"
              onClick={() => setIsNewChatModalOpen(true)}
              className="p-2 rounded-full text-[#8696A0] hover:text-[#00A884] hover:bg-[#202C33] transition-colors"
              title="New chat"
              aria-label="New chat"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* WhatsApp Search Bar */}
        <div className="flex items-center bg-[#202C33] rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#00A884] mb-3">
          <Search className="w-4 h-4 text-[#8696A0] mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full bg-transparent text-sm text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-[#8696A0] hover:text-[#E9EDEF] transition-colors"
            >
              <span className="text-xs">✕</span>
            </button>
          )}
        </div>

        {/* WhatsApp Filter Chips: (All, Unread, Favourites, +) */}
        {activeView === 'chats' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'favorites', label: 'Favourites' },
            ].map((tab) => {
              const isActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onFilterChange(tab.id)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0',
                    isActive
                      ? 'bg-[#005C4B] text-[#E9EDEF] border border-[#00A884]/40'
                      : 'bg-[#202C33] text-[#8696A0] hover:bg-[#2A3942] hover:text-[#E9EDEF]'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}

            {/* '+' button for adding custom filters */}
            <button
              type="button"
              onClick={() => onFilterChange('favorites')}
              className="p-1 rounded-full bg-[#202C33] text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942] transition-colors shrink-0"
              title="Add filter"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* WhatsApp Archived Notice Banner */}
      {activeView === 'archived' && (
        <div className="px-4 py-2.5 bg-[#182229] border-b border-[#222D34] text-xs text-[#8696A0] flex items-center justify-between">
          <span>These chats stay archived when new messages are received. Tap to change in settings.</span>
        </div>
      )}

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // Skeletons
          <>
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </>
        ) : activeView === 'contacts' ? (
          // Contacts List View inside Sidebar if activeView is contacts
          contacts.length > 0 ? (
            contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => onAddConversation?.(contact)}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center text-sm">
                    {contact.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal-900 dark:text-white">
                      {contact.name}
                    </h4>
                    <p className="text-xs text-charcoal-500">{contact.role || contact.email}</p>
                  </div>
                </div>
                <Button size="xs" variant="secondary">
                  Chat
                </Button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-charcoal-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">No contacts found</p>
            </div>
          )
        ) : conversations.length > 0 ? (
          // Regular Conversations List
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onClick={() => onSelectConversation(conv.id)}
              onTogglePin={onTogglePin}
              onToggleMute={onToggleMute}
              onToggleArchive={onToggleArchive}
              onToggleFavorite={onToggleFavorite}
              onToggleUnread={onToggleUnread}
              onClearChat={onClearChat}
              onDeleteChat={onDeleteChat}
              onToggleBlock={onToggleBlock}
            />
          ))
        ) : (
          // Empty State
          <div className="p-8 text-center text-charcoal-400 dark:text-charcoal-500 space-y-2 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-charcoal-100 dark:bg-charcoal-800 flex items-center justify-center mx-auto text-charcoal-400">
              {searchQuery ? (
                <Search className="w-6 h-6 opacity-60" />
              ) : filterTab === 'favorites' ? (
                <Star className="w-6 h-6 opacity-60" />
              ) : activeView === 'archived' ? (
                <Archive className="w-6 h-6 opacity-60" />
              ) : (
                <MessageSquareDashed className="w-6 h-6 opacity-60" />
              )}
            </div>
            <h4 className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
              {searchQuery ? 'No matching conversations' : 'No conversations found'}
            </h4>
            <p className="text-[11px] text-charcoal-500 max-w-[200px] mx-auto">
              {searchQuery
                ? `No results for "${searchQuery}". Check spelling or try a different search.`
                : filterTab === 'unread'
                ? 'All caught up! You have no unread messages.'
                : filterTab === 'favorites'
                ? 'Star your favorite conversations to pin them here.'
                : activeView === 'archived'
                ? 'You do not have any archived chats.'
                : 'Start a direct chat with your peers or team.'}
            </p>
            {searchQuery && (
              <Button size="xs" variant="ghost" onClick={() => onSearchChange('')}>
                Clear Search Filter
              </Button>
            )}
          </div>
        )}
      </div>

      {/* New Direct Chat Interface Modal (Search Registered Users by Name/Email) */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onStartChat={(user) => {
          onAddConversation?.(user);
          setIsNewChatModalOpen(false);
        }}
      />

      {/* New Group Modal */}
      <NewGroupModal
        isOpen={isNewGroupModalOpen}
        onClose={() => setIsNewGroupModalOpen(false)}
        onGroupCreated={(group) => {
          onSelectConversation?.(group);
          onAddConversation?.(group);
        }}
      />
    </div>
  );
};

export default ConversationList;
