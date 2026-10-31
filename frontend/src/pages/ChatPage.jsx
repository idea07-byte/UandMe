import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WhatsAppNavRail from '../components/chat/WhatsAppNavRail';
import ConversationList from '../components/chat/ConversationList';
import ChatArea from '../components/chat/ChatArea';
import ChatEmptyState from '../components/chat/ChatEmptyState';
import CallsList from '../components/chat/CallsList';
import CallsEmptyState from '../components/chat/CallsEmptyState';
import StatusList from '../components/chat/StatusList';
import StatusEmptyState from '../components/chat/StatusEmptyState';
import CommunitiesList from '../components/chat/CommunitiesList';
import CommunitiesEmptyState from '../components/chat/CommunitiesEmptyState';
import WhatsAppStatusViewer from '../components/chat/WhatsAppStatusViewer';
import WhatsAppCallDetailsView from '../components/chat/WhatsAppCallDetailsView';
import WhatsAppCommunityDetailsView from '../components/chat/WhatsAppCommunityDetailsView';
import WhatsAppDialpadModal from '../components/chat/WhatsAppDialpadModal';
import chatService from '../services/chatService';
import useToast from '../hooks/useToast';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import { useCall } from '../context/CallContext';
import { cn } from '../utils/cn';
import {
  getConversationCryptoKey,
  encryptText,
  decryptText,
} from '../utils/cryptoUtils';

export const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { messagingService } = useSocket();
  const { startCall } = useCall();

  // Navigation rail section ('chats' | 'calls' | 'status' | 'communities' | 'archived' | 'starred' | 'settings')
  const [activeSection, setActiveSection] = useState('chats');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  // WhatsApp Dialpad Modal State
  const [isDialpadOpen, setIsDialpadOpen] = useState(false);

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
        view: activeSection,
      });
      setConversations(data);
    } catch {
      toast.error('Failed to load conversations.');
    } finally {
      setIsLoadingList(false);
    }
  }, [activeSection, filterTab, searchQuery, toast]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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
    chatService.getMessages(activeConversationId).then(async (data) => {
      if (!Array.isArray(data)) {
        setMessages([]);
        return;
      }
      const activeChat = conversations.find((c) => c.id === activeConversationId);
      const partner = activeChat?.participants?.find((p) => {
        const pid = typeof p === 'object' ? p._id || p.id : p;
        return pid !== (user?.id || user?._id);
      });
      const partnerId = typeof partner === 'object' ? partner._id || partner.id : partner;
      const key = await getConversationCryptoKey(activeConversationId, user?.id || user?._id, partnerId);

      if (key) {
        const decryptedList = await Promise.all(
          data.map(async (m) => {
            if (m.text && m.text.startsWith('e2ee:')) {
              const decrypted = await decryptText(m.text, key);
              return { ...m, text: decrypted, isE2EE: true };
            }
            return m;
          })
        );
        setMessages(decryptedList);
      } else {
        setMessages(data);
      }
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
  }, [activeConversationId, messagingService, conversations, user]);

  // Setup live Socket.IO event listeners with complete cleanup on unmount
  useEffect(() => {
    // 1. Inbound messages with client-side decryption
    const unsubMsg = messagingService.onReceiveMessage(async (incomingMsg) => {
      let displayMsg = incomingMsg;
      if (incomingMsg.text && incomingMsg.text.startsWith('e2ee:')) {
        const key = await getConversationCryptoKey(
          incomingMsg.conversationId,
          user?.id || user?._id,
          incomingMsg.senderId
        );
        if (key) {
          const decrypted = await decryptText(incomingMsg.text, key);
          displayMsg = { ...incomingMsg, text: decrypted, isE2EE: true };
        }
      }

      if (incomingMsg.conversationId === activeConversationId) {
        setMessages((prev) => {
          // Prevent duplicates by ID or clientMessageId
          const exists = prev.some(
            (m) =>
              m.id === displayMsg.id ||
              (displayMsg.clientMessageId && m.clientMessageId === displayMsg.clientMessageId)
          );
          if (exists) return prev;
          return [...prev, displayMsg];
        });

        // Automatically acknowledge read status if window is currently focused on this chat
        messagingService.markConversationAsRead(activeConversationId);
      }

      // Reconcile sidebar preview & unread badge
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id === displayMsg.conversationId) {
            const isCurrentChat = c.id === activeConversationId;
            return {
              ...c,
              unreadCount: isCurrentChat ? 0 : (c.unreadCount || 0) + 1,
              lastMessage: {
                text: displayMsg.text || '📎 Attachment',
                timestamp: displayMsg.timestamp,
                senderId: displayMsg.senderId,
                status: displayMsg.status || 'sent',
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
    const unsubStopTyping = messagingService.stopTyping
      ? messagingService.onStopTyping(({ conversationId }) => {
          if (conversationId === activeConversationId) {
            setIsTyping(false);
            setTypingUserName('');
          }
        })
      : () => {};

    // 5. Network / Room authorization errors
    const unsubError = messagingService.onError((err) => {
      toast.error(err.message || 'Messaging network error');
    });

    return () => {
      unsubMsg();
      unsubStatus();
      unsubTyping();
      unsubStopTyping?.();
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
  const handleSendMessage = async (text, attachments = [], replyTo = null) => {
    if (!activeConversationId) return;

    // Resolve 1-to-1 partner to derive conversation encryption key
    const partner = activeConversation?.participants?.find((p) => {
      const pid = typeof p === 'object' ? p._id || p.id : p;
      return pid !== (user?.id || user?._id);
    });
    const partnerId = typeof partner === 'object' ? partner._id || partner.id : partner;
    const key = await getConversationCryptoKey(activeConversationId, user?.id || user?._id, partnerId);

    // Encrypt payload for transmission and server storage
    let payloadText = text;
    if (key && text) {
      payloadText = await encryptText(text, key);
    }

    // 1. Dispatch through messagingService to obtain optimistic representation with encrypted text for wire
    const optimisticMsg = messagingService.sendMessage({
      conversationId: activeConversationId,
      text: payloadText,
      attachments,
      replyTo,
      sender: { id: user?.id || 'usr_me_1', name: user?.name || 'You' },
    });

    // 2. Render instantly in local message stream with original plaintext for user
    setMessages((prev) => [...prev, { ...optimisticMsg, text, isE2EE: Boolean(key) }]);

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
    setActiveSection('chats');
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
    toast.success(isPinned ? 'Chat pinned to top' : 'Chat unpinned');
  };

  // Handle toggling mute
  const handleToggleMute = async (id) => {
    const isMuted = await chatService.toggleMute(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isMuted } : c))
    );
    toast.info(isMuted ? 'Notifications muted' : 'Notifications unmuted');
  };

  // Handle toggling archive
  const handleToggleArchive = async (id) => {
    const isArchived = await chatService.toggleArchive(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isArchived } : c))
    );
    toast.success(isArchived ? 'Chat archived' : 'Chat restored from archive');
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
      toast.error(`Blocked ${contact.name}. You will no longer receive messages or calls.`);
    } else {
      toast.success(`Unblocked ${contact.name}.`);
    }
  };

  // Helper to extract actual recipient ID from conversation
  const resolveTargetUser = (target) => {
    const c = target || activeConversation;
    if (!c) return null;
    const currentUid = user?.id || user?._id;
    const recipientId =
      c.recipientId ||
      c.partnerId ||
      c._id ||
      c.id ||
      c.participants?.find((p) => {
        const pid = typeof p === 'object' ? p._id || p.id : p;
        return pid !== currentUid;
      })?._id ||
      c.participants?.find((p) => {
        const pid = typeof p === 'object' ? p._id || p.id : p;
        return pid !== currentUid;
      })?.id;

    return {
      recipientId: typeof recipientId === 'object' ? recipientId._id || recipientId.id : recipientId,
      recipientName: c.recipientName || c.name || c.username || 'Contact',
      recipientAvatar: c.recipientAvatar || c.avatar || null,
      conversationId: c.conversationId || c.id || c._id,
    };
  };

  // WhatsApp Voice & Video Call handlers
  const handleStartVoiceCall = (target) => {
    const info = resolveTargetUser(target);
    if (!info || !info.recipientId) {
      toast.info('Select a conversation or contact to place a call.');
      return;
    }
    startCall({ ...info, callType: 'voice' });
  };

  const handleStartVideoCall = (target) => {
    const info = resolveTargetUser(target);
    if (!info || !info.recipientId) {
      toast.info('Select a conversation or contact to place a video call.');
      return;
    }
    startCall({ ...info, callType: 'video' });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0B141A] text-[#E9EDEF]">
      {/* 1st Pane: WhatsApp Thin Navigation Rail (Far Left) */}
      <WhatsAppNavRail
        activeSection={activeSection}
        onSelectSection={(section) => {
          if (section === 'settings') {
            navigate('/settings/profile');
            return;
          }
          if (section === 'contacts') {
            navigate('/contacts');
            return;
          }
          setActiveSection(section);
          setSelectedStatus(null);
          setSelectedCall(null);
          setSelectedCommunity(null);
        }}
        unreadChatsCount={unreadTotal}
        missedCallsCount={1}
        hasUnreadStatus={true}
      />

      {/* 2nd Pane: Left List Pane (Chats / Calls / Status / Communities / Archived / Starred) */}
      <div
        className={cn(
          'h-full shrink-0',
          // Responsive: Below 900px, if conversation is open, hide list pane
          activeConversationId && activeSection === 'chats' ? 'hidden md:flex' : 'flex w-full md:w-auto'
        )}
      >
        {activeSection === 'chats' && (
          <ConversationList
            conversations={conversations.filter((c) => !c.isArchived)}
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
            activeView="chats"
          />
        )}

        {activeSection === 'calls' && (
          <CallsList
            onSelectCall={(call) => setSelectedCall(call)}
            selectedCallId={selectedCall?.id}
            onOpenDialpad={() => setIsDialpadOpen(true)}
            onStartCall={(contact, type) => {
              if (type === 'video') {
                handleStartVideoCall(contact);
              } else {
                handleStartVoiceCall(contact);
              }
            }}
          />
        )}

        {activeSection === 'status' && (
          <StatusList
            onSelectStatus={(st) => setSelectedStatus(st)}
            selectedStatusId={selectedStatus?.id}
          />
        )}

        {activeSection === 'communities' && (
          <CommunitiesList
            onSelectCommunity={(comm) => setSelectedCommunity(comm)}
            selectedCommunityId={selectedCommunity?.id}
            onSelectGroup={(sub) => {
              handleAddConversation(sub);
              setActiveSection('chats');
            }}
          />
        )}

        {activeSection === 'archived' && (
          <ConversationList
            conversations={conversations.filter((c) => c.isArchived)}
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
            activeView="archived"
          />
        )}

        {activeSection === 'starred' && (
          <ConversationList
            conversations={conversations.filter((c) => c.isFavorite)}
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
            filterTab="favorites"
            onFilterChange={setFilterTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={isLoadingList}
            activeView="chats"
          />
        )}
      </div>

      {/* 3rd Pane: Main Pane (Open Conversation / Calls / Status / Communities Empty States) */}
      <div
        className={cn(
          'flex-1 h-full min-w-0',
          // Responsive: Below 900px, hide main pane when no conversation is active
          !activeConversationId && activeSection === 'chats' ? 'hidden md:flex' : 'flex'
        )}
      >
        {activeSection === 'chats' || activeSection === 'archived' || activeSection === 'starred' ? (
          activeConversation ? (
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
              onStartVoiceCall={handleStartVoiceCall}
              onStartVideoCall={handleStartVideoCall}
            />
          ) : (
            <ChatEmptyState onNewChat={() => navigate('/contacts')} />
          )
        ) : activeSection === 'calls' ? (
          selectedCall ? (
            <WhatsAppCallDetailsView
              call={selectedCall}
              onStartVoiceCall={(target) => handleStartVoiceCall(target || selectedCall)}
              onStartVideoCall={(target) => handleStartVideoCall(target || selectedCall)}
              onOpenChat={(target) => {
                handleAddConversation(target || selectedCall);
                setActiveSection('chats');
              }}
            />
          ) : (
            <CallsEmptyState
              onOpenDialpad={() => setIsDialpadOpen(true)}
              onStartCall={() => {
                if (activeConversation) {
                  handleStartVoiceCall(activeConversation);
                } else if (conversations.length > 0) {
                  handleStartVoiceCall(conversations[0]);
                } else {
                  setIsDialpadOpen(true);
                }
              }}
            />
          )
        ) : activeSection === 'status' ? (
          selectedStatus ? (
            <WhatsAppStatusViewer
              status={selectedStatus}
              onClose={() => setSelectedStatus(null)}
              onReply={(statusItem, text) => {
                handleAddConversation({
                  id: selectedStatus.userId || selectedStatus.id,
                  name: selectedStatus.name,
                  avatar: selectedStatus.avatar,
                });
                setActiveSection('chats');
                handleSendMessage(`Replying to status: "${text}"`);
              }}
            />
          ) : (
            <StatusEmptyState />
          )
        ) : activeSection === 'communities' ? (
          selectedCommunity ? (
            <WhatsAppCommunityDetailsView
              community={selectedCommunity}
              onOpenSubgroupChat={(subgroup) => {
                handleAddConversation(subgroup);
                setActiveSection('chats');
              }}
              onAddSubgroup={(comm) => {
                toast.info(`Add group to ${comm.name}`);
              }}
            />
          ) : (
            <CommunitiesEmptyState />
          )
        ) : (
          <ChatEmptyState onNewChat={() => navigate('/contacts')} />
        )}
      </div>

      {/* WhatsApp Dialpad Modal */}
      <WhatsAppDialpadModal
        isOpen={isDialpadOpen}
        onClose={() => setIsDialpadOpen(false)}
        contacts={contacts}
        onStartCall={(recipient, type) => {
          if (type === 'video') {
            handleStartVideoCall(recipient);
          } else {
            handleStartVoiceCall(recipient);
          }
        }}
      />
    </div>
  );
};

export default ChatPage;
