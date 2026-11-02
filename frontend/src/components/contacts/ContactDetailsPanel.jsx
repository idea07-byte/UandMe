import React, { useState } from 'react';
import {
  MessageSquare,
  Phone,
  Video,
  Star,
  Ban,
  ShieldCheck,
  Mail,
  Smartphone,
  Building,
  Calendar,
  X,
  Share2,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Sparkles,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import OnlineIndicator from '../chat/OnlineIndicator';
import Button from '../common/Button';
import ConfirmationModal from '../common/ConfirmationModal';
import useToast from '../../hooks/useToast';
import { cn } from '../../utils/cn';

/**
 * Profile Details Panel for displaying rich contact information,
 * status, attributes, and actions (Start conversation, audio/video call, mute, favorite, block, edit, delete).
 */
export const ContactDetailsPanel = ({
  contact,
  onClose,
  onStartChat,
  onStartVoiceCall,
  onStartVideoCall,
  onToggleFavorite,
  onToggleBlock,
  onEditContact,
  onDeleteContact,
  onInviteContact,
  className,
}) => {
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const toast = useToast();

  if (!contact) {
    return (
      <div
        className={cn(
          'h-full flex flex-col items-center justify-center p-8 text-center text-charcoal-400 dark:text-charcoal-500 bg-charcoal-50/50 dark:bg-[#111B21]',
          className
        )}
      >
        <div className="w-16 h-16 rounded-3xl bg-charcoal-200/50 dark:bg-charcoal-800/50 flex items-center justify-center mb-3 text-charcoal-400">
          <MessageSquare className="w-8 h-8 opacity-40" />
        </div>
        <h4 className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
          No Contact Selected
        </h4>
        <p className="text-xs text-charcoal-500 max-w-xs mt-1">
          Choose a contact from your contacts list to view profile details and start messaging.
        </p>
      </div>
    );
  }

  const {
    id,
    name,
    phone,
    formattedPhone,
    contactUser,
    isRegistered = true,
    isFavorite = false,
    isBlocked = false,
  } = contact;

  const displayAvatar = contactUser?.avatar || contact.avatar;
  const displayStatus = contactUser?.status || contact.status || 'offline';
  const displayAbout = contactUser?.about || contact.about || 'Available on uandi 🚀';
  const displayPhone = formattedPhone || phone || contact.email || 'No phone registered';
  const displayRole = contactUser?.role || contact.role || 'Member';
  const displayDepartment = contactUser?.department || contact.department || 'General';

  const handleVoiceCall = () => {
    if (onStartVoiceCall) {
      onStartVoiceCall(contactUser || contact);
    } else {
      toast.info(`Starting voice call with ${name}...`, 'Voice Call');
    }
  };

  const handleVideoCall = () => {
    if (onStartVideoCall) {
      onStartVideoCall(contactUser || contact);
    } else {
      toast.info(`Starting video call with ${name}...`, 'Video Call');
    }
  };

  const handleConfirmBlock = () => {
    onToggleBlock?.(contact);
    setIsBlockModalOpen(false);
  };

  const handleConfirmDelete = () => {
    onDeleteContact?.(contact);
    setIsDeleteModalOpen(false);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(`${name} - ${displayPhone}`);
    toast.success('Contact info copied to clipboard!');
  };

  return (
    <div
      className={cn(
        'h-full flex flex-col bg-white dark:bg-[#111B21] border-l border-charcoal-200 dark:border-[#222D34] overflow-y-auto transition-colors select-none',
        className
      )}
    >
      {/* Top Header */}
      <div className="p-4 sm:px-6 border-b border-charcoal-100 dark:border-[#222D34] bg-charcoal-50/70 dark:bg-[#202C33] flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold text-charcoal-900 dark:text-[#E9EDEF] uppercase tracking-wider">
          Contact Info
        </h3>

        <div className="flex items-center gap-1">
          {/* Edit Contact Button */}
          <button
            type="button"
            onClick={() => onEditContact?.(contact)}
            className="p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-[#E9EDEF] hover:bg-charcoal-100 dark:hover:bg-[#2A3942] transition-colors"
            title="Edit contact"
            aria-label="Edit contact"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Share Contact Button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-[#E9EDEF] hover:bg-charcoal-100 dark:hover:bg-[#2A3942] transition-colors"
            title="Share contact info"
            aria-label="Share contact info"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-[#E9EDEF] hover:bg-charcoal-100 dark:hover:bg-[#2A3942] transition-colors"
              title="Close details"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Info */}
      <div className="p-6 space-y-6">
        {/* Avatar & Presence Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-block mx-auto">
            <Avatar src={displayAvatar} name={name} size="2xl" className="w-24 h-24 text-2xl shadow-xl ring-4 ring-charcoal-100 dark:ring-[#202C33]" />
            {isRegistered && (
              <div className="absolute bottom-1 right-1">
                <OnlineIndicator status={displayStatus} size="md" pulse={displayStatus === 'online'} />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h4 className="text-xl font-bold text-charcoal-900 dark:text-[#E9EDEF] leading-tight">
                {name}
              </h4>
              {isFavorite && (
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
              )}
            </div>

            <p className="text-xs font-mono text-charcoal-500 dark:text-[#8696A0] mt-0.5">
              {displayPhone}
            </p>

            <div className="flex items-center justify-center gap-2 mt-2">
              <span
                className={cn(
                  'text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1',
                  isRegistered
                    ? 'bg-emerald-100 dark:bg-[#00A884]/20 text-emerald-800 dark:text-[#00A884]'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                )}
              >
                {isRegistered ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                <span>{isRegistered ? 'uandi Member' : 'Not Registered'}</span>
              </span>

              {isBlocked && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white flex items-center gap-1">
                  <Ban className="w-3 h-3" /> Blocked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        {isRegistered ? (
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onStartChat?.(contactUser || contact)}
              className="flex-col h-auto py-2.5 px-2 gap-1 justify-center rounded-2xl shadow-soft"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[11px] font-bold">Message</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleVoiceCall}
              className="flex-col h-auto py-2.5 px-2 gap-1 justify-center rounded-2xl"
            >
              <Phone className="w-5 h-5 text-[#00A884]" />
              <span className="text-[11px] font-bold">Audio Call</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleVideoCall}
              className="flex-col h-auto py-2.5 px-2 gap-1 justify-center rounded-2xl"
            >
              <Video className="w-5 h-5 text-[#00A884]" />
              <span className="text-[11px] font-bold">Video Call</span>
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-[#202C33] border border-amber-200 dark:border-[#2A3942] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Not registered on uandi</span>
            </div>
            <p className="text-xs text-charcoal-600 dark:text-[#8696A0]">
              Invite {name} to join uandi so you can chat and call with end-to-end encryption.
            </p>
            <button
              type="button"
              onClick={() => onInviteContact?.(contact)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-all shadow-md"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Invite {name} to App</span>
            </button>
          </div>
        )}

        {/* About / Status Message Card */}
        <div className="p-4 rounded-2xl bg-charcoal-50 dark:bg-[#202C33] border border-charcoal-200/70 dark:border-[#2A3942] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 dark:text-[#8696A0]">
            About / Bio
          </span>
          <p className="text-xs text-charcoal-800 dark:text-[#E9EDEF] leading-relaxed font-medium">
            &quot;{displayAbout}&quot;
          </p>
        </div>

        {/* Contact Details List */}
        <div className="space-y-3 pt-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 dark:text-[#8696A0]">
            Contact Details
          </h5>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-charcoal-50/70 dark:bg-[#202C33]/60 border border-charcoal-100 dark:border-[#2A3942] text-charcoal-700 dark:text-charcoal-300">
              <Smartphone className="w-4 h-4 text-[#00A884] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-charcoal-400 dark:text-[#8696A0] block font-medium">Phone Number</span>
                <span className="truncate font-semibold text-charcoal-900 dark:text-[#E9EDEF] font-mono block">
                  {displayPhone}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-charcoal-50/70 dark:bg-[#202C33]/60 border border-charcoal-100 dark:border-[#2A3942] text-charcoal-700 dark:text-charcoal-300">
              <Building className="w-4 h-4 text-sky-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-charcoal-400 dark:text-[#8696A0] block font-medium">Department & Role</span>
                <span className="truncate font-semibold text-charcoal-900 dark:text-[#E9EDEF] block">
                  {displayDepartment} • {displayRole}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-charcoal-50/70 dark:bg-[#202C33]/60 border border-charcoal-100 dark:border-[#2A3942] text-charcoal-700 dark:text-charcoal-300">
              <ShieldCheck className="w-4 h-4 text-[#00A884] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-charcoal-400 dark:text-[#8696A0] block font-medium">Encryption & Privacy</span>
                <span className="text-emerald-700 dark:text-[#00A884] font-semibold block">
                  256-bit End-to-End Encrypted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Management Actions */}
        <div className="space-y-2 pt-2 border-t border-charcoal-100 dark:border-[#2A3942]">
          <h5 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 dark:text-[#8696A0] mb-2">
            Contact Actions
          </h5>

          {/* Toggle Favorite */}
          <button
            type="button"
            onClick={() => onToggleFavorite?.(contact)}
            className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-[#202C33] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Star
                className={cn(
                  'w-4 h-4',
                  isFavorite ? 'fill-amber-400 text-amber-400' : 'text-charcoal-400'
                )}
              />
              <span>{isFavorite ? 'Favorited Contact' : 'Add to Favorites'}</span>
            </div>
            <span className="text-[11px] text-charcoal-400 font-normal">
              {isFavorite ? 'Starred' : 'Off'}
            </span>
          </button>

          {/* Block / Unblock Contact */}
          <button
            type="button"
            onClick={() => setIsBlockModalOpen(true)}
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-colors',
              isBlocked
                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            )}
          >
            <div className="flex items-center gap-3">
              <Ban className="w-4 h-4" />
              <span>{isBlocked ? 'Unblock Contact' : 'Block Contact'}</span>
            </div>
            <span className="text-[11px] font-normal">
              {isBlocked ? 'Currently Blocked' : 'Block calls & messages'}
            </span>
          </button>

          {/* Delete Contact */}
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4" />
              <span>Delete Contact</span>
            </div>
            <span className="text-[11px] font-normal text-rose-500">
              Remove from list
            </span>
          </button>
        </div>
      </div>

      {/* Block Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onConfirm={handleConfirmBlock}
        title={isBlocked ? `Unblock ${name}?` : `Block ${name}?`}
        message={
          isBlocked
            ? `${name} will be able to send you messages and initiate audio/video calls again.`
            : `Blocked contacts cannot send you messages or start calls. They will not be notified that you blocked them.`
        }
        confirmText={isBlocked ? 'Unblock Contact' : 'Block Contact'}
        variant={isBlocked ? 'primary' : 'danger'}
        icon={Ban}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete contact "${name}"?`}
        message={`Are you sure you want to remove ${name} from your contacts book? This will not delete your chat history with them.`}
        confirmText="Delete Contact"
        variant="danger"
        icon={Trash2}
      />
    </div>
  );
};

export default ContactDetailsPanel;
