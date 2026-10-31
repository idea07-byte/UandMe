import React, { useState } from 'react';
import { X, Send, Image, Type, Palette } from 'lucide-react';
import { cn } from '../../utils/cn';

const COLOR_PRESETS = [
  { id: 'emerald', bg: '#005C4B', label: 'Classic Teal' },
  { id: 'purple', bg: '#4A154B', label: 'Deep Purple' },
  { id: 'teal', bg: '#0E7490', label: 'Ocean Cyan' },
  { id: 'rose', bg: '#881337', label: 'Burgundy' },
  { id: 'slate', bg: '#1E293B', label: 'Midnight Slate' },
  { id: 'amber', bg: '#92400E', label: 'Warm Amber' },
];

export const WhatsAppAddStatusModal = ({ isOpen, onClose, onAddStatus, user }) => {
  const [mode, setMode] = useState('text'); // 'text' | 'image'
  const [textContent, setTextContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0].bg);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'text' && !textContent.trim()) return;
    if (mode === 'image' && !imageUrl.trim()) return;

    const newStatus = {
      id: `status_user_${Date.now()}`,
      userId: user?.id || 'me',
      name: user?.name || 'My status',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      time: 'Just now',
      hasUnseen: false,
      items: [
        {
          id: `item_${Date.now()}`,
          type: mode,
          content: mode === 'text' ? textContent.trim() : caption.trim(),
          bgColor: mode === 'text' ? selectedColor : undefined,
          url: mode === 'image' ? imageUrl.trim() : undefined,
          timestamp: 'Just now',
        },
      ],
    };

    onAddStatus(newStatus);
    setTextContent('');
    setImageUrl('');
    setCaption('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#202C33] border border-[#2A3942] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A3942] bg-[#111B21]">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-[#E9EDEF]">New Status Update</h3>
            <div className="flex rounded-lg bg-[#202C33] p-0.5 border border-[#2A3942]">
              <button
                type="button"
                onClick={() => setMode('text')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors',
                  mode === 'text' ? 'bg-[#00A884] text-white' : 'text-[#8696A0] hover:text-[#E9EDEF]'
                )}
              >
                <Type className="w-3.5 h-3.5" />
                Text
              </button>
              <button
                type="button"
                onClick={() => setMode('image')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors',
                  mode === 'image' ? 'bg-[#00A884] text-white' : 'text-[#8696A0] hover:text-[#E9EDEF]'
                )}
              >
                <Image className="w-3.5 h-3.5" />
                Photo
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 p-5 gap-4 overflow-y-auto">
          {mode === 'text' ? (
            <div className="flex flex-col gap-4">
              {/* Text Status Preview Canvas */}
              <div
                style={{ backgroundColor: selectedColor }}
                className="w-full h-56 rounded-xl flex items-center justify-center p-6 text-white text-center shadow-inner transition-colors duration-300"
              >
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Type a status..."
                  rows={4}
                  maxLength={400}
                  className="w-full bg-transparent text-white placeholder-white/60 text-lg font-medium text-center resize-none border-none outline-none focus:ring-0"
                  autoFocus
                />
              </div>

              {/* Color Presets Picker */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-[#8696A0] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Background color:
                </span>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedColor(p.bg)}
                      style={{ backgroundColor: p.bg }}
                      className={cn(
                        'w-7 h-7 rounded-full border-2 transition-transform',
                        selectedColor === p.bg
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
                      )}
                      title={p.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8696A0] mb-1.5">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111B21] border border-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] text-sm focus:outline-none focus:border-[#00A884]"
                  autoFocus
                />
              </div>

              {/* Image Preview */}
              {imageUrl && (
                <div className="w-full h-48 rounded-xl bg-[#111B21] border border-[#2A3942] overflow-hidden flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Status Preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#8696A0] mb-1.5">
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  maxLength={150}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111B21] border border-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] text-sm focus:outline-none focus:border-[#00A884]"
                />
              </div>
            </div>
          )}

          {/* Footer Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A3942] mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#8696A0] hover:text-[#E9EDEF] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mode === 'text' ? !textContent.trim() : !imageUrl.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              Post Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppAddStatusModal;

