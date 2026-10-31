import React, { useState } from 'react';
import { X, Users, Image, Send, ShieldCheck } from 'lucide-react';

export const WhatsAppNewCommunityModal = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCommunity = {
      id: `comm_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'A campus community to bring people together.',
      avatar: avatar.trim() || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
      membersCount: 1,
      groups: [
        { id: `grp_ann_${Date.now()}`, name: `${name.trim()} Announcements`, members: 1 },
        { id: `grp_gen_${Date.now()}`, name: 'General Discussions', members: 1 },
      ],
    };

    onCreated(newCommunity);
    setName('');
    setDescription('');
    setAvatar('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#202C33] border border-[#2A3942] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A3942] bg-[#111B21]">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#00A884]" />
            <h3 className="text-base font-bold text-[#E9EDEF]">New Community</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8696A0] mb-1.5">
              Community Name *
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Science Club"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111B21] border border-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] text-sm focus:outline-none focus:border-[#00A884]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8696A0] mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              maxLength={250}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this community about? Share guidelines or goals."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111B21] border border-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] text-sm focus:outline-none focus:border-[#00A884] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8696A0] mb-1.5">
              Community Icon URL (Optional)
            </label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111B21] border border-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] text-sm focus:outline-none focus:border-[#00A884]"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#111B21] border border-[#2A3942] flex items-center gap-2.5 text-xs text-[#8696A0]">
            <ShieldCheck className="w-4 h-4 text-[#00A884] shrink-0" />
            <span>As the creator, you can add and manage subgroups and post announcements.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A3942]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#8696A0] hover:text-[#E9EDEF] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              Create Community
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppNewCommunityModal;

