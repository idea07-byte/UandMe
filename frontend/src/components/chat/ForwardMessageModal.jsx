import React, { useState, useEffect } from 'react';
import { X, Search, Forward, Check, MessageSquare } from 'lucide-react';
import Avatar from '../common/Avatar';
import chatService from '../../services/chatService';
import useToast from '../../hooks/useToast';
import { cn } from '../../utils/cn';

export const ForwardMessageModal = ({ isOpen, onClose, message, onForwarded }) => {
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      chatService.getConversations().then((data) => {
        setConversations(data || []);
      });
      setSelectedTarget(null);
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen || !message) return null;

  const filteredConversations = conversations.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleForward = async () => {
    if (!selectedTarget) return;

    setIsSending(true);
    try {
      const forwardedText = message.text || message.content || (message.attachment?.name ? `[File: ${message.attachment.name}]` : 'Forwarded message');
      
      await chatService.sendMessage(selectedTarget.id, {
        text: forwardedText,
        attachments: message.attachments || (message.attachment ? [message.attachment] : []),
      });

      toast.success(`Message forwarded to ${selectedTarget.name}`, 'Message Forwarded');
      onForwarded?.(selectedTarget, forwardedText);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to forward message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#202C33] border border-[#2A3942] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A3942] bg-[#111B21]">
          <div className="flex items-center gap-2.5">
            <Forward className="w-5 h-5 text-[#00A884]" />
            <h3 className="text-base font-bold text-[#E9EDEF]">Forward message</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="p-3.5 bg-[#182229] border-b border-[#2A3942] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#202C33] flex items-center justify-center text-[#00A884] shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#00A884]">Selected message</p>
            <p className="text-xs text-[#E9EDEF] truncate">
              {message.text || message.content || message.attachment?.name || 'Voice Note / Media'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-[#2A3942] bg-[#111B21]">
          <div className="flex items-center bg-[#202C33] rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#00A884]">
            <Search className="w-4 h-4 text-[#8696A0] mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chat or contact..."
              className="w-full bg-transparent text-sm text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Target conversations list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#182229]">
          {filteredConversations.map((conv) => {
            const isSelected = selectedTarget?.id === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedTarget(conv)}
                className={cn(
                  'flex items-center justify-between px-4 py-3 hover:bg-[#202C33] cursor-pointer transition-colors',
                  isSelected && 'bg-[#2A3942]'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={conv.avatar} name={conv.name} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#E9EDEF] truncate">{conv.name}</p>
                    <p className="text-xs text-[#8696A0] truncate">
                      {conv.lastMessage?.text || 'Tap to select'}
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

        {/* Footer actions */}
        <div className="p-4 border-t border-[#2A3942] bg-[#111B21] flex items-center justify-between">
          <p className="text-xs text-[#8696A0]">
            {selectedTarget ? `Send to: ${selectedTarget.name}` : 'Select a recipient'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#8696A0] hover:text-[#E9EDEF]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedTarget || isSending}
              onClick={handleForward}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              <Forward className="w-4 h-4" />
              <span>{isSending ? 'Sending...' : 'Forward'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;

