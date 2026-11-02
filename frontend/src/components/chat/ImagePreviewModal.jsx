import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Smile, Image as ImageIcon } from 'lucide-react';
import { EMOJI_CATEGORIES } from '../../services/mockChatData';

/**
 * WhatsApp Desktop Style Image Preview Modal.
 * Shows high-resolution image preview before sending with caption input and emoji picker.
 */
export const ImagePreviewModal = ({
  isOpen,
  onClose,
  imageFile,
  imagePreviewUrl,
  onSend,
}) => {
  const [caption, setCaption] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCaption('');
      setShowEmojiPicker(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen || !imagePreviewUrl) return null;

  const handleSend = () => {
    onSend({
      file: imageFile,
      previewUrl: imagePreviewUrl,
      caption: caption.trim(),
    });
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-[#111B21] border border-[#2A3942] rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222D34] bg-[#202C33]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#E9EDEF]">
            <ImageIcon className="w-4 h-4 text-[#00A884]" />
            <span>Send Photo</span>
            {imageFile?.name && (
              <span className="text-xs text-[#8696A0] truncate max-w-xs">
                • {imageFile.name}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#111B21] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview Box */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-[#0B141A] min-h-[300px]">
          <img
            src={imagePreviewUrl}
            alt="Preview"
            className="max-h-[50vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>

        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="p-3 bg-[#202C33] border-t border-[#2A3942] max-h-48 overflow-y-auto">
            <div className="grid grid-cols-10 gap-1 text-xl">
              {EMOJI_CATEGORIES[0]?.emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCaption((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded hover:bg-[#2A3942] hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Caption & Send Bar */}
        <div className="p-4 bg-[#202C33] border-t border-[#222D34] flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-xl text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942] transition-colors"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a caption..."
            maxLength={1000}
            className="flex-1 bg-[#111B21] border border-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] text-sm px-4 py-3 rounded-2xl focus:outline-none focus:border-[#00A884] transition-colors"
          />

          <button
            type="button"
            onClick={handleSend}
            className="w-12 h-12 rounded-full bg-[#00A884] hover:bg-[#02906F] text-white flex items-center justify-center shrink-0 shadow-lg transition-transform hover:scale-105 active:scale-95"
            title="Send photo"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
