import React, { useState } from 'react';
import { Upload, Trash2, Check } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Avatar from '../common/Avatar';
import Input from '../common/Input';
import useToast from '../../hooks/useToast';
import { cn } from '../../utils/cn';

// Diverse set of preset student/faculty avatars
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
];

/**
 * Avatar Picker Modal.
 * Allows uploading custom image, picking from presets, or entering custom image URL.
 */
export const AvatarPickerModal = ({
  isOpen,
  onClose,
  currentAvatar,
  userName = 'User',
  onSaveAvatar,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '');
  const [customUrl, setCustomUrl] = useState('');
  const toast = useToast();

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.warning('Image exceeds 3MB limit. Please choose a smaller image.');
      return;
    }

    // Read client-side as Data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedAvatar(event.target.result);
      toast.success('Image loaded for preview!');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setSelectedAvatar(customUrl.trim());
    setCustomUrl('');
  };

  const handleRemove = () => {
    setSelectedAvatar('');
    toast.info('Avatar removed. Your initials will be displayed.');
  };

  const handleConfirm = () => {
    onSaveAvatar?.(selectedAvatar);
    onClose?.();
    toast.success('Profile avatar updated successfully!');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Profile Photo"
      description="Select a student preset, upload an image from your computer, or enter an image link."
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm}>
            Save Photo
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Live Preview */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-charcoal-50 dark:bg-charcoal-800/50 border border-charcoal-200/60 dark:border-charcoal-800">
          <div className="relative mb-2">
            <Avatar src={selectedAvatar} name={userName} size="2xl" />
          </div>
          <p className="text-xs font-semibold text-charcoal-700 dark:text-charcoal-300">
            {selectedAvatar ? 'Current Preview' : 'Initials Placeholder'}
          </p>
        </div>

        {/* Upload Trigger & Remove */}
        <div className="flex items-center gap-3">
          <label className="flex-1 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="sr-only"
            />
            <div className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 text-xs font-bold hover:bg-primary-100 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload Image File</span>
            </div>
          </label>

          {selectedAvatar && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleRemove}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Remove
            </Button>
          )}
        </div>

        {/* Preset Avatars */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400 block">
            Choose from Campus Presets
          </label>
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_PRESETS.map((presetUrl, idx) => {
              const isSelected = selectedAvatar === presetUrl;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(presetUrl)}
                  className={cn(
                    'relative rounded-full p-1 transition-all group overflow-hidden',
                    isSelected
                      ? 'ring-2 ring-primary-500 scale-105'
                      : 'hover:opacity-80'
                  )}
                >
                  <img
                    src={presetUrl}
                    alt={`Preset ${idx + 1}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary-600/40 rounded-full flex items-center justify-center text-white">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Image URL */}
        <div className="space-y-1.5 pt-2 border-t border-charcoal-100 dark:border-charcoal-800/80">
          <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400 block">
            Or paste Image URL
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/avatar.jpg"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="text-xs"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleApplyCustomUrl}
              disabled={!customUrl.trim()}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AvatarPickerModal;
