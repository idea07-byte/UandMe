import React, { useState, useEffect } from 'react';
import { X, Search, Check, Users, ArrowRight, ArrowLeft, Camera } from 'lucide-react';
import Avatar from '../common/Avatar';
import chatService from '../../services/chatService';
import useToast from '../../hooks/useToast';
import { cn } from '../../utils/cn';

export const NewGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const toast = useToast();
  const [step, setStep] = useState(1); // 1 = select participants, 2 = group subject & info
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      chatService.getContacts().then((data) => {
        setContacts(data || []);
      });
      setStep(1);
      setSelectedContacts([]);
      setGroupName('');
      setGroupAvatar('');
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleContact = (contact) => {
    const contactId = contact.id || contact._id || contact.partnerId;
    if (selectedContacts.some((c) => (c.id || c._id || c.partnerId) === contactId)) {
      setSelectedContacts((prev) =>
        prev.filter((c) => (c.id || c._id || c.partnerId) !== contactId)
      );
    } else {
      setSelectedContacts((prev) => [...prev, contact]);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    (c.name || c.username || '').toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.warning('Please enter a group subject.');
      return;
    }
    if (selectedContacts.length === 0) {
      toast.warning('Please select at least one contact.');
      return;
    }

    setIsLoading(true);
    try {
      const participantIds = selectedContacts.map(
        (c) => c.partnerId || c.id || c._id
      );
      const newGroup = await chatService.createGroupConversation({
        name: groupName.trim(),
        participants: participantIds,
        avatar: groupAvatar.trim(),
      });

      toast.success(`Group "${groupName}" created!`, 'Group Created');
      onGroupCreated?.(newGroup);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#202C33] border border-[#2A3942] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A3942] bg-[#111B21]">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-1 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h3 className="text-base font-bold text-[#E9EDEF]">
                {step === 1 ? 'Add group members' : 'New group'}
              </h3>
              {step === 1 && (
                <p className="text-xs text-[#8696A0]">
                  {selectedContacts.length} of {contacts.length} selected
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Member Selection */}
        {step === 1 && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Selected Contacts Chips */}
            {selectedContacts.length > 0 && (
              <div className="flex items-center gap-2 p-3 overflow-x-auto border-b border-[#2A3942] bg-[#182229]/60">
                {selectedContacts.map((c) => (
                  <div
                    key={c.id || c._id}
                    className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-[#202C33] border border-[#2A3942] shrink-0 text-xs text-[#E9EDEF]"
                  >
                    <Avatar src={c.avatar} name={c.name} size="xs" />
                    <span className="truncate max-w-[90px]">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleContact(c)}
                      className="text-[#8696A0] hover:text-white ml-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="px-4 py-2 border-b border-[#2A3942] bg-[#111B21]">
              <div className="flex items-center bg-[#202C33] rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#00A884]">
                <Search className="w-4 h-4 text-[#8696A0] mr-2 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type contact name..."
                  className="w-full bg-transparent text-sm text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#182229]">
              {filteredContacts.map((contact) => {
                const isSelected = selectedContacts.some(
                  (c) => (c.id || c._id) === (contact.id || contact._id)
                );
                return (
                  <div
                    key={contact.id || contact._id}
                    onClick={() => toggleContact(contact)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#202C33] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={contact.avatar} name={contact.name} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#E9EDEF] truncate">
                          {contact.name}
                        </p>
                        <p className="text-xs text-[#8696A0] truncate">
                          {contact.about || contact.department || 'PulseChat User'}
                        </p>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-[#00A884] border-[#00A884] text-white'
                          : 'border-[#8696A0]/50'
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Next Button */}
            <div className="p-4 border-t border-[#2A3942] bg-[#111B21] flex justify-end">
              <button
                type="button"
                disabled={selectedContacts.length === 0}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Group Details */}
        {step === 2 && (
          <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 p-5 gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full bg-[#111B21] border border-[#2A3942] flex items-center justify-center text-[#8696A0] overflow-hidden">
                  {groupAvatar ? (
                    <img src={groupAvatar} alt="Group" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8" />
                  )}
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#8696A0] mb-1">
                  Group Subject *
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. CS Study Group"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#111B21] border border-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] text-sm focus:outline-none focus:border-[#00A884]"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8696A0] mb-1">
                Group Icon URL (Optional)
              </label>
              <input
                type="url"
                value={groupAvatar}
                onChange={(e) => setGroupAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#111B21] border border-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] text-sm focus:outline-none focus:border-[#00A884]"
              />
            </div>

            {/* Selected Members Summary */}
            <div>
              <p className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider mb-2">
                Members: {selectedContacts.length}
              </p>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-[#111B21] rounded-xl border border-[#2A3942]">
                {selectedContacts.map((c) => (
                  <div
                    key={c.id || c._id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#202C33] text-xs text-[#E9EDEF]"
                  >
                    <Avatar src={c.avatar} name={c.name} size="xs" />
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A3942] mt-auto">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-[#8696A0] hover:text-[#E9EDEF]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !groupName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>{isLoading ? 'Creating...' : 'Create Group'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewGroupModal;
