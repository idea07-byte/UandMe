import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatSidebar from '../components/chat/ChatSidebar';
import {
  ContactList,
  ContactDetailsPanel,
  NewContactModal,
  EditContactModal,
  SyncContactsModal,
} from '../components/contacts';
import contactService from '../services/contactService';
import chatService from '../services/chatService';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { useCall } from '../context/CallContext';
import { cn } from '../utils/cn';

/**
 * WhatsApp-style Contacts Management Page.
 * - Split-pane contacts directory with alphabetical grouping and quick-jump index
 * - Add contact by phone number with live registration check and duplicate blocking
 * - Start 1-on-1 chat or audio/video call for registered users
 * - Invite unregistered users via Web Share, SMS, or WhatsApp link
 * - Edit, delete, favorite, and block contacts
 * - Device contacts synchronization
 */
export const ContactsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const { startCall } = useCall();

  // Contact list state
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'registered' | 'unregistered' | 'favorites'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await contactService.getContacts({
        search: searchQuery,
        filter: statusFilter,
      });
      setContacts(data);

      // Default select first contact on desktop if none selected
      if (data.length > 0 && !selectedContact) {
        setSelectedContact(data[0]);
      } else if (selectedContact) {
        // Refresh selected contact state
        const updated = data.find((c) => c.id === selectedContact.id);
        if (updated) setSelectedContact(updated);
      }
    } catch (err) {
      console.error('[ContactsPage] Failed to fetch contacts:', err);
      setError('An error occurred while loading contacts.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, selectedContact]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Handle Starting a Conversation from Contact
  const handleStartChat = async (contact) => {
    if (!contact) return;
    try {
      const target = contact.contactUser
        ? { ...contact.contactUser, name: contact.name, id: contact.contactUser.id || contact.contactUser._id }
        : contact;

      const conv = await chatService.createOrGetConversation(target);
      toast.success(`Opening chat with ${contact.name}`);
      navigate(`/chat/${conv.id}`);
    } catch (err) {
      console.error('[ContactsPage] handleStartChat error:', err);
      toast.error('Failed to initiate conversation.');
    }
  };

  // Handle Voice / Video Calls
  const handleStartVoiceCall = (target) => {
    if (!target) return;
    startCall({
      recipientId: target.id || target._id || target.partnerId,
      recipientName: target.name,
      recipientAvatar: target.avatar,
      callType: 'voice',
    });
  };

  const handleStartVideoCall = (target) => {
    if (!target) return;
    startCall({
      recipientId: target.id || target._id || target.partnerId,
      recipientName: target.name,
      recipientAvatar: target.avatar,
      callType: 'video',
    });
  };

  // Toggle Favorite
  const handleToggleFavorite = async (contact) => {
    try {
      const updated = await contactService.toggleFavorite(contact.id);
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, isFavorite: updated.isFavorite } : c))
      );
      if (selectedContact?.id === contact.id) {
        setSelectedContact((prev) => ({ ...prev, isFavorite: updated.isFavorite }));
      }
      toast.success(
        updated.isFavorite ? `Added ${contact.name} to favorites` : `Removed ${contact.name} from favorites`
      );
    } catch {
      toast.error('Failed to update favorite status');
    }
  };

  // Toggle Block / Unblock Contact
  const handleToggleBlock = async (contact) => {
    try {
      const updated = await contactService.toggleBlock(contact.id);
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, isBlocked: updated.isBlocked } : c))
      );
      if (selectedContact?.id === contact.id) {
        setSelectedContact((prev) => ({ ...prev, isBlocked: updated.isBlocked }));
      }
      toast.info(
        updated.isBlocked ? `Blocked ${contact.name}` : `Unblocked ${contact.name}`
      );
    } catch {
      toast.error('Failed to update block status');
    }
  };

  // Handle Edit Contact
  const handleEditContact = (contact) => {
    setEditingContact(contact);
  };

  const handleContactUpdated = (updatedContact) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === updatedContact.id ? updatedContact : c))
    );
    if (selectedContact?.id === updatedContact.id) {
      setSelectedContact(updatedContact);
    }
  };

  // Handle Delete Contact
  const handleDeleteContact = async (contact) => {
    try {
      await contactService.deleteContact(contact.id);
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      if (selectedContact?.id === contact.id) {
        const remaining = contacts.filter((c) => c.id !== contact.id);
        setSelectedContact(remaining.length > 0 ? remaining[0] : null);
      }
      toast.success(`Removed ${contact.name} from contacts.`);
    } catch {
      toast.error('Failed to delete contact.');
    }
  };

  // Handle Contact Created
  const handleContactCreated = (newContact) => {
    setContacts((prev) => [newContact, ...prev.filter((c) => c.id !== newContact.id)]);
    setSelectedContact(newContact);
  };

  // Handle Invite Unregistered Contact
  const handleInviteContact = async (contact) => {
    const inviteUrl = `${window.location.origin}/register?ref=${encodeURIComponent(user?.phone || 'uandi')}`;
    const inviteText = `Hey ${contact.name}! I'm using uandi to chat and call with end-to-end encryption. Join me here: ${inviteUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on uandi',
          text: inviteText,
          url: inviteUrl,
        });
        toast.success('Invitation shared!');
        return;
      } catch (err) {}
    }

    // Try SMS URI
    if (contact.phone) {
      window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(inviteText)}`;
      return;
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(inviteText);
      toast.success('Invite link copied to clipboard!');
    } catch {
      toast.info(`Share link: ${inviteUrl}`);
    }
  };

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden bg-white dark:bg-[#111B21] transition-colors">
      {/* Panel 1: Slim Navigation Sidebar */}
      <ChatSidebar
        activeNav="contacts"
        onNavChange={(nav) => {
          if (nav === 'chats' || nav === 'archived') navigate('/chat');
        }}
      />

      {/* Panel 2: Contacts List (Alphabetically Grouped & Filterable) */}
      <div
        className={cn(
          'h-full shrink-0 flex flex-col',
          // On mobile, hide list when contact details are active
          selectedContact ? 'hidden md:flex' : 'flex w-full md:w-auto'
        )}
      >
        <ContactList
          contacts={contacts}
          selectedContactId={selectedContact?.id}
          onSelectContact={(contact) => setSelectedContact(contact)}
          onStartChat={handleStartChat}
          onInvite={handleInviteContact}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          isLoading={isLoading}
          error={error}
          onRetry={fetchContacts}
          onOpenNewContactModal={() => setIsNewContactModalOpen(true)}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
        />
      </div>

      {/* Panel 3: Contact Details Panel */}
      <div
        className={cn(
          'flex-1 h-full min-w-0 flex flex-col',
          // On mobile, hide panel if no contact is selected
          !selectedContact ? 'hidden md:flex' : 'flex'
        )}
      >
        <ContactDetailsPanel
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onStartChat={handleStartChat}
          onStartVoiceCall={handleStartVoiceCall}
          onStartVideoCall={handleStartVideoCall}
          onToggleFavorite={handleToggleFavorite}
          onToggleBlock={handleToggleBlock}
          onEditContact={handleEditContact}
          onDeleteContact={handleDeleteContact}
          onInviteContact={handleInviteContact}
          className="flex-1"
        />
      </div>

      {/* New Contact Modal */}
      <NewContactModal
        isOpen={isNewContactModalOpen}
        onClose={() => setIsNewContactModalOpen(false)}
        onContactCreated={handleContactCreated}
        onStartChat={handleStartChat}
      />

      {/* Edit Contact Modal */}
      <EditContactModal
        isOpen={Boolean(editingContact)}
        contact={editingContact}
        onClose={() => setEditingContact(null)}
        onContactUpdated={handleContactUpdated}
      />

      {/* Sync Device Contacts Modal */}
      <SyncContactsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncCompleted={fetchContacts}
      />
    </div>
  );
};

export default ContactsPage;
