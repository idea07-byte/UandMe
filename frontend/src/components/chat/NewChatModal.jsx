import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Building,
  Mail,
  Phone,
  Calendar,
  X,
  Users,
  Sparkles,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import OnlineIndicator from './OnlineIndicator';
import Button from '../common/Button';
import SearchInput from '../forms/SearchInput';
import EmptyState from '../common/EmptyState';
import chatService from '../../services/chatService';
import useToast from '../../hooks/useToast';
import { cn } from '../../utils/cn';

/**
 * New Chat Interface Modal.
 * Allows searching campus registered users by name or institutional email,
 * previewing profile details, and starting direct conversations with instant feedback.
 */
export const NewChatModal = ({
  isOpen,
  onClose,
  onStartChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all'); // 'all' | 'students' | 'faculty'
  const toast = useToast();

  // Load registered users on modal open or search change
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedUser(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    chatService.searchRegisteredUsers(searchQuery).then((data) => {
      if (isMounted) {
        setRegisteredUsers(data);
        // Default select first result on desktop if none selected
        if (data.length > 0) {
          setSelectedUser((prev) => prev || data[0]);
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, searchQuery]);

  // Filter by role category
  const filteredUsers = useMemo(() => {
    if (filterRole === 'faculty') {
      return registeredUsers.filter(
        (u) =>
          u.role?.toLowerCase().includes('advisor') ||
          u.role?.toLowerCase().includes('director') ||
          u.department?.toLowerCase().includes('faculty')
      );
    }
    if (filterRole === 'students') {
      return registeredUsers.filter(
        (u) =>
          !u.role?.toLowerCase().includes('advisor') &&
          !u.role?.toLowerCase().includes('director') &&
          !u.department?.toLowerCase().includes('faculty')
      );
    }
    return registeredUsers;
  }, [registeredUsers, filterRole]);

  // Handle starting conversation
  const handleSelectAndStart = (user) => {
    if (!user) return;
    setSelectedUser(user);
    toast.success(`Opening direct conversation with ${user.name}`);
    onStartChat?.(user);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-chat-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl max-h-[85vh] z-10 flex flex-col bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 rounded-3xl shadow-soft-xl overflow-hidden animate-scale-in">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-charcoal-100 dark:border-charcoal-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 id="new-chat-modal-title" className="text-lg font-black text-charcoal-900 dark:text-white tracking-tight">
                Start New Direct Conversation
              </h3>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                Search verified contacts and team members by name or email.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Pane: Split-View (List on Left, Profile Preview on Right) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Search & Users List */}
          <div className="w-full md:w-7/12 flex flex-col border-r border-charcoal-100 dark:border-charcoal-800 min-h-0">
            {/* Search and Filters */}
            <div className="p-4 space-y-3 border-b border-charcoal-100 dark:border-charcoal-800/60 shrink-0">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Search by full name or email address..."
                autoFocus
              />

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 pt-0.5">
                {[
                  { id: 'all', label: 'All Contacts' },
                  { id: 'students', label: 'Members' },
                  { id: 'faculty', label: 'Advisors' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterRole(tab.id)}
                    className={cn(
                      'px-3 py-1 text-xs font-semibold rounded-xl transition-all',
                      filterRole === tab.id
                        ? 'bg-primary-600 text-white shadow-soft-sm'
                        : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Registered Users Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-charcoal-200 dark:bg-charcoal-800 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 bg-charcoal-200 dark:bg-charcoal-800 rounded" />
                        <div className="h-2.5 w-48 bg-charcoal-200 dark:bg-charcoal-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isSelected = selectedUser?.id === user.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      onDoubleClick={() => handleSelectAndStart(user)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-2xl text-left cursor-pointer transition-all border group',
                        isSelected
                          ? 'bg-primary-50/80 dark:bg-charcoal-800 border-primary-300 dark:border-primary-800 shadow-soft-sm'
                          : 'hover:bg-charcoal-100/70 dark:hover:bg-charcoal-800/60 border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <Avatar src={user.avatar} name={user.name} size="md" />
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <OnlineIndicator status={user.status} size="sm" pulse={user.status === 'online'} />
                          </div>
                        </div>

                        {/* Name & Email Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4
                              className={cn(
                                'text-sm font-bold truncate leading-tight',
                                isSelected
                                  ? 'text-primary-950 dark:text-primary-100'
                                  : 'text-charcoal-900 dark:text-charcoal-100'
                              )}
                            >
                              {user.name}
                            </h4>
                            <span className="text-[10px] text-charcoal-400 font-mono">
                              {user.handle}
                            </span>
                          </div>
                          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Right Action Button */}
                      <Button
                        size="xs"
                        variant={isSelected ? 'primary' : 'secondary'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndStart(user);
                        }}
                        className="shrink-0 ml-2"
                      >
                        Chat
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center my-auto">
                  <EmptyState
                    icon={Users}
                    title="No users found"
                    description={
                      searchQuery
                        ? `No campus users matched "${searchQuery}". Check the spelling or email domain.`
                        : 'No registered users in this category.'
                    }
                    actionLabel={searchQuery ? 'Clear Search' : undefined}
                    onAction={searchQuery ? () => setSearchQuery('') : undefined}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: User Profile Preview Panel */}
          <div className="hidden md:flex md:w-5/12 flex-col bg-charcoal-50/50 dark:bg-charcoal-950/40 p-6 overflow-y-auto justify-between">
            {selectedUser ? (
              <div className="space-y-6">
                {/* Header Preview */}
                <div className="text-center space-y-3">
                  <div className="relative inline-block mx-auto">
                    <Avatar src={selectedUser.avatar} name={selectedUser.name} size="2xl" />
                    <div className="absolute bottom-1 right-1">
                      <OnlineIndicator status={selectedUser.status} size="md" pulse={selectedUser.status === 'online'} />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-charcoal-900 dark:text-white">
                      {selectedUser.name}
                    </h4>
                    <p className="text-xs font-mono text-primary-600 dark:text-primary-400">
                      {selectedUser.handle}
                    </p>
                    <span className="inline-block mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-charcoal-200/70 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 capitalize">
                      {selectedUser.role || 'Campus Member'}
                    </span>
                  </div>
                </div>

                {/* Status Message / About text */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200/80 dark:border-charcoal-800 shadow-soft-sm text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 block mb-1">
                    About / Status
                  </span>
                  <p className="text-charcoal-700 dark:text-charcoal-300 italic leading-relaxed">
                    "{selectedUser.statusMessage || selectedUser.about || 'Available on PulseChat'}"
                  </p>
                </div>

                {/* Information Attributes */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-charcoal-900 border border-charcoal-200/60 dark:border-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
                    <Mail className="w-4 h-4 text-primary-600 shrink-0" />
                    <span className="truncate">{selectedUser.email}</span>
                  </div>

                  {selectedUser.department && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-charcoal-900 border border-charcoal-200/60 dark:border-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
                      <Building className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="truncate">{selectedUser.department}</span>
                    </div>
                  )}

                  {selectedUser.phone && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-charcoal-900 border border-charcoal-200/60 dark:border-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-charcoal-900 border border-charcoal-200/60 dark:border-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
                    <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Member since {selectedUser.joinedDate || 'Fall 2024'}</span>
                  </div>
                </div>

                {/* Start Conversation Action Button */}
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center shadow-soft"
                    onClick={() => handleSelectAndStart(selectedUser)}
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                  >
                    Start Direct Conversation
                  </Button>
                  <p className="text-[11px] text-center text-charcoal-400 mt-2">
                    Double-click or click to open conversation window
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center my-auto p-4 text-charcoal-400">
                <Sparkles className="w-8 h-8 mb-2 opacity-50 text-primary-500" />
                <h5 className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                  Select a registered user
                </h5>
                <p className="text-[11px] text-charcoal-500 max-w-[200px] mt-1">
                  Click any student or faculty member on the left to preview their verified profile details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
