import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatSidebar from '../components/chat/ChatSidebar';
import ConversationList from '../components/chat/ConversationList';
import ChatArea from '../components/chat/ChatArea';
import chatService from '../services/chatService';
import useToast from '../hooks/useToast';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import { cn } from '../utils/cn';

export const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { messagingService } = useSocket();

  // Navigation sidebar state ('chats' | 'contacts' | 'archived')
  const [activeNav, setActiveNav] = useState('chats');

  // Conversation list state
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(chatId || null);

  // Filter & Search states
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'favorites'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Real-time network states
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState('');

  // Fetch conversations based on active view, filter, and search
  const loadConversations = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const data = await chatService.getConversations({
        filter: filterTab,
        search: searchQuery,
        view: activeNav,
      });
      setConversations(data);
    } catch {
      toast.error('Failed to load conversations.');
    } finally {
      setIsLoadingList(false);
    }
  }, [activeNav, filterTab, searchQuery, toast]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load contacts when activeNav is 'contacts'
  useEffect(() => {
    if (activeNav === 'contacts') {
      chatService.getContacts().then((data) => setContacts(data));
    }
  }, [activeNav]);

  // Sync route param with activeConversationId
  useEffect(() => {
    if (chatId) {
      setActiveConversationId(chatId);
    }
  }, [chatId]);

  // Manage room subscription lifecycle when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    // 1. Join room on server (or sandbox)
    messagingService.joinConversation(activeConversationId);

    // 2. Fetch message history
    chatService.getMessages(activeConversationId).then((data) => {
      setMessages(data);
    });

    // 3. Mark conversation as read
    messagingService.markConversationAsRead(activeConversationId);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId ? { ...c, unreadCount: 0 } : c
      )
    );

    // Reset typing status on conversation switch
    setIsTyping(false);
    setTypingUserName('');

    // Cleanup: leave previous room when conversation unmounts or changes
    return () => {
      messagingService.leaveConversation(activeConversationId);
    };
  }, [activeConversationId, messagingService]);

  // Setup live Socket.IO event listeners with complete cleanup on unmount
  useEffect(() => {
    // 1. Inbound messages
    const unsubMsg = messagingService.onReceiveMessage((incomingMsg) => {
      if (incomingMsg.conversationId === activeConversationId) {
        setMessages((prev) => {
          // Prevent duplicates by ID or clientMessageId
          const exists = prev.some(
            (m) =>
              m.id === incomingMsg.id ||
              (incomingMsg.clientMessageId && m.clientMessageId === incomingMsg.clientMessageId)
          );
          if (exists) return prev;
          return [...prev, incomingMsg];
        });

        // Automatically acknowledge read status if window is currently focused on this chat
        messagingService.markConversationAsRead(activeConversationId);
      }

      // Reconcile sidebar preview & unread badge
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id === incomingMsg.conversationId) {
            const isCurrentChat = c.id === activeConversationId;
            return {
              ...c,
              unreadCount: isCurrentChat ? 0 : (c.unreadCount || 0) + 1,
              lastMessage: {
                text: incomingMsg.text || '📎 Attachment',
                timestamp: incomingMsg.timestamp,
                senderId: incomingMsg.senderId,
                status: incomingMsg.status || 'sent',
              },
            };
          }
          return c;
        });

        return updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          const timeA = new Date(a.lastMessage?.timestamp || 0).getTime();
          const timeB = new Date(b.lastMessage?.timestamp || 0).getTime();
          return timeB - timeA;
        });
      });
    });

    // 2. Message status updates (sending -> sent -> delivered -> read / failed)
    const unsubStatus = messagingService.onMessageStatusUpdated((update) => {
      const { clientMessageId, messageId, conversationId, status, serverMessage } = update;

      setMessages((prev) =>
        prev.map((m) => {
          const matchClient =
            clientMessageId && (m.clientMessageId === clientMessageId || m.id === clientMessageId);
          const matchServer = messageId && m.id === messageId;

          if (matchClient || matchServer) {
            return {
              ...m,
              ...(serverMessage || {}),
              id: messageId || m.id,
              status,
              isOptimistic: status === 'sending',
            };
          }
          return m;
        })
      );

      // Reconcile status indicator in conversation sidebar
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId && c.lastMessage) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                status,
              },
            };
          }
          return c;
        })
      );
    });

    // 3. Remote typing indicator
    const unsubTyping = messagingService.onTyping(({ conversationId, userId, userName }) => {
      if (conversationId === activeConversationId && userId !== (user?.id || 'usr_me_1')) {
        setIsTyping(true);
        setTypingUserName(userName || 'Contact');
      }
    });

    // 4. Remote stop typing indicator
    const unsubStopTyping = messagingService.onStopTyping(({ conversationId }) => {
      if (conversationId === activeConversationId) {
        setIsTyping(false);
        setTypingUserName('');
      }
    });

    // 5. Network / Room authorization errors
    const unsubError = messagingService.onError((err) => {
      toast.error(err.message || 'Messaging network error');
    });

    return () => {
      unsubMsg();
      unsubStatus();
      unsubTyping();
      unsubStopTyping();
      unsubError();
    };
  }, [activeConversationId, messagingService, user, toast]);

  // Find active conversation object
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  // Compute total unread count across all conversations
  const unreadTotal = useMemo(
    () =>
      conversations.reduce(
        (sum, c) => (c.isArchived ? sum : sum + (c.unreadCount || 0)),
        0
      ),
    [conversations]
  );

  // Handle selecting a conversation
  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    navigate(`/chat/${id}`);
  };

  // Handle sending a message with optimistic UI and service reconciliation
  const handleSendMessage = (text, attachments = []) => {
    if (!activeConversationId) return;

    // 1. Dispatch through messagingService to obtain optimistic representation
    const optimisticMsg = messagingService.sendMessage({
      conversationId: activeConversationId,
      text,
      attachments,
      sender: { id: user?.id || 'usr_me_1', name: user?.name || 'You' },
    });

    // 2. Render instantly in local message stream
    setMessages((prev) => [...prev, optimisticMsg]);

    // 3. Update conversation preview immediately in sidebar
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              lastMessage: {
                text: text || '📎 Attachment',
                timestamp: optimisticMsg.timestamp,
                senderId: user?.id || 'usr_me_1',
                status: 'sending',
              },
            }
          : c
      );
      return updated.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const timeA = new Date(a.lastMessage?.timestamp || 0).getTime();
        const timeB = new Date(b.lastMessage?.timestamp || 0).getTime();
        return timeB - timeA;
      });
    });
  };

  // Handle retrying a failed message
  const handleRetryMessage = (failedMessage) => {
    messagingService.retryMessage(failedMessage);
  };

  // Handle user starting typing in composer
  const handleStartTyping = () => {
    if (activeConversationId) {
      messagingService.startTyping(activeConversationId);
    }
  };

  // Handle user stopping typing in composer
  const handleStopTyping = () => {
    if (activeConversationId) {
      messagingService.stopTyping(activeConversationId);
    }
  };

  // Handle adding or creating a new conversation
  const handleAddConversation = async (contact) => {
    const created = await chatService.createOrGetConversation(contact);
    setConversations((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
    setActiveConversationId(created.id);
    navigate(`/chat/${created.id}`);
    setActiveNav('chats');
  };

  // Handle toggling pin
  const handleTogglePin = async (id) => {
    const isPinned = await chatService.togglePin(id);
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, pinned: isPinned } : c));
      return updated.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const timeA = new Date(a.lastMessage?.timestamp || 0).getTime();
        const timeB = new Date(b.lastMessage?.timestamp || 0).getTime();
        return timeB - timeA;
      });
    });
    toast.success(isPinned ? 'Conversation pinned to top' : 'Conversation unpinned');
  };

  // Handle toggling mute
  const handleToggleMute = async (id) => {
    const isMuted = await chatService.toggleMute(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isMuted } : c))
    );
    toast.info(isMuted ? 'Notifications muted for this chat' : 'Notifications unmuted');
  };

  // Handle toggling archive
  const handleToggleArchive = async (id) => {
    const isArchived = await chatService.toggleArchive(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isArchived } : c))
    );
    toast.success(isArchived ? 'Conversation archived' : 'Conversation restored from archive');
    loadConversations();
  };

  // Handle toggling favorite
  const handleToggleFavorite = async (id) => {
    const isFav = await chatService.toggleFavorite(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: isFav } : c))
    );
    toast.success(isFav ? 'Added to favorites' : 'Removed from favorites');
  };

  // Handle toggling unread
  const handleToggleUnread = async (id) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;

    if (target.unreadCount > 0) {
      await chatService.markAsRead(id);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
    } else {
      await chatService.markAsUnread(id);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 1 } : c))
      );
    }
  };

  // Handle clearing conversation history
  const handleClearChat = async (id) => {
    await chatService.clearMessages(id);
    if (id === activeConversationId) {
      setMessages([]);
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, lastMessage: null } : c))
    );
  };

  // Handle deleting conversation
  const handleDeleteChat = async (id) => {
    await chatService.deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      navigate('/chat');
    }
  };

  // Handle blocking/unblocking contact
  const handleToggleBlock = async (contact) => {
    const targetId = contact.id;
    const updatedBlocked = await chatService.toggleBlockContact(targetId);

    setConversations((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, isBlocked: updatedBlocked } : c))
    );

    if (updatedBlocked) {
      toast.error(`Blocked ${contact.name}. You will no longer receive their messages.`);
    } else {
      toast.success(`Unblocked ${contact.name}. You can resume messaging.`);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-charcoal-50 dark:bg-charcoal-950">
      {/* Panel 1: Primary Navigation Icon Sidebar */}
      <ChatSidebar
        activeNav={activeNav}
        onNavChange={(nav) => {
          setActiveNav(nav);
          if (nav === 'contacts') {
            navigate('/contacts');
          }
        }}
        unreadCount={unreadTotal}
      />

      {/* Panel 2: Conversation List Sidebar */}
      <div
        className={cn(
          'h-full shrink-0',
          // On mobile, show list when no conversation is active
          activeConversationId ? 'hidden md:flex' : 'flex w-full md:w-auto'
        )}
      >
        <ConversationList
          conversations={conversations}
          contacts={contacts}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onAddConversation={handleAddConversation}
          onTogglePin={handleTogglePin}
          onToggleMute={handleToggleMute}
          onToggleArchive={handleToggleArchive}
          onToggleFavorite={handleToggleFavorite}
          onToggleUnread={handleToggleUnread}
          onClearChat={(c) => handleClearChat(c.id)}
          onDeleteChat={(c) => handleDeleteChat(c.id)}
          onToggleBlock={handleToggleBlock}
          filterTab={filterTab}
          onFilterChange={setFilterTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLoading={isLoadingList}
          activeView={activeNav}
        />
      </div>

      {/* Panel 3: Active Chat Window */}
      <div
        className={cn(
          'flex-1 h-full min-w-0',
          // On mobile, hide chat window when no conversation is selected
          !activeConversationId ? 'hidden md:flex' : 'flex'
        )}
      >
        <ChatArea
          conversation={activeConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          onRetryMessage={handleRetryMessage}
          onStartTyping={handleStartTyping}
          onStopTyping={handleStopTyping}
          onBack={() => {
            setActiveConversationId(null);
            navigate('/chat');
          }}
          onNewChat={() => navigate('/contacts')}
          onTogglePin={handleTogglePin}
          onToggleMute={handleToggleMute}
          onToggleArchive={handleToggleArchive}
          onToggleFavorite={handleToggleFavorite}
          onToggleUnread={handleToggleUnread}
          onClearChat={handleClearChat}
          onDeleteChat={handleDeleteChat}
          onToggleBlock={handleToggleBlock}
          isTyping={isTyping}
          typingUserName={typingUserName}
        />
      </div>
    </div>
  );
};

export default ChatPage;
