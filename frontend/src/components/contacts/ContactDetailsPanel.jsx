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
} from 'lucide-react';
import Avatar from '../common/Avatar';
import OnlineIndicator from '../chat/OnlineIndicator';
import Button from '../common/Button';
import ConfirmationModal from '../common/ConfirmationModal';
import useToast from '../../hooks/useToast';
import { cn } from '../../utils/cn';

/**
 * Profile Details Panel for displaying rich contact information,
 * status, attributes, and actions (Start conversation, audio/video call, mute, favorite, block).
 */
export const ContactDetailsPanel = ({
  contact,
  onClose,
  onStartChat,
  onStartVoiceCall,
  onStartVideoCall,
  onToggleFavorite,
  onToggleBlock,
  className,
}) => {
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const toast = useToast();

  if (!contact) {
    return (
      <div
        className={cn(
          'h-full flex flex-col items-center justify-center p-8 text-center text-charcoal-400 dark:text-charcoal-500 bg-charcoal-50/50 dark:bg-charcoal-950/40',
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
          Choose a classmate or faculty member from your contacts list to view profile details and start messaging.
        </p>
      </div>
    );
  }

  const {
    name,
    avatar,
    status = 'offline',
    statusMessage = 'Available on PulseChat',
    role = 'Student',
    department = 'Computer Science',
    handle = '@user',
    email = 'user@university.edu',
    phone = '+1 (555) 234-5678',
    joinedDate = 'Fall 2024',
    isFavorite = false,
    isBlocked = false,
  } = contact;

  const handleVoiceCall = () => {
    if (onStartVoiceCall) {
      onStartVoiceCall(contact);
    } else {
      toast.info(`Starting voice call with ${name}...`, 'Voice Call');
    }
  };

  const handleVideoCall = () => {
    if (onStartVideoCall) {
      onStartVideoCall(contact);
    } else {
      toast.info(`Starting video call with ${name}...`, 'Video Call');
    }
  };

  const handleConfirmBlock = () => {
    onToggleBlock?.(contact);
    setIsBlockModalOpen(false);
    toast.warning(`${name} has been ${isBlocked ? 'unblocked' : 'blocked'}. (Frontend demo)`);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(`${name} (${handle}) - ${email}`);
    toast.success('Contact information copied to clipboard!');
  };

  return (
    <div
      className={cn(
        'h-full flex flex-col bg-white dark:bg-charcoal-900 border-l border-charcoal-200 dark:border-charcoal-800 overflow-y-auto transition-colors',
        className
      )}
    >
      {/* Top Header */}
      <div className="p-4 sm:px-6 border-b border-charcoal-100 dark:border-charcoal-800/80 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-black text-charcoal-900 dark:text-white uppercase tracking-wider">
          Profile Details
        </h3>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
            title="Share contact"
            aria-label="Share contact"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
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
            <Avatar src={avatar} name={name} size="2xl" />
            <div className="absolute bottom-1 right-1">
              <OnlineIndicator status={status} size="md" pulse={status === 'online'} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h4 className="text-xl font-black text-charcoal-900 dark:text-white leading-tight">
                {name}
              </h4>
              {isFavorite && (
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
              )}
            </div>

            <p className="text-xs font-mono text-primary-600 dark:text-primary-400 mt-0.5">
              {handle}
            </p>

            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300">
                {role}
              </span>

              <span
                className={cn(
                  'text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize',
                  status === 'online'
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    : status === 'away'
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                    : status === 'busy'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                    : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400'
                )}
              >
                {status}
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
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onStartChat?.(contact)}
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
            <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold">Call</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleVideoCall}
            className="flex-col h-auto py-2.5 px-2 gap-1 justify-center rounded-2xl"
          >
            <Video className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span className="text-[11px] font-bold">Video</span>
          </Button>
        </div>

        {/* About / Status Message Card */}
        <div className="p-4 rounded-2xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-200/70 dark:border-charcoal-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
            About / Status
          </span>
          <p className="text-xs text-charcoal-800 dark:text-charcoal-200 leading-relaxed font-medium">
            "{statusMessage}"
          </p>
        </div>

        {/* Contact Details List */}
        <div className="space-y-3 pt-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-charcoal-400">
            Contact Information
          </h5>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-charcoal-50/70 dark:bg-charcoal-800/40 border border-charcoal-100 dark:border-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
              <Mail className="w-4 h-4 text-primary-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-charcoal-400 block font-medium">University Email</span>
                <span className="truncate font-semibold text-charcoal-900 dark:text-charcoal-100 block">
                  {email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-charcoal-50/70 dark:bg-charcoal-800/40 border border-charcoal-100 dark:border-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
              <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-charcoal-400 block font-medium">Phone Number</span>
                <span className="truncate font-semibold text-charcoal-900 dark:text-charcoal-100 block">
                  {phone}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-charcoal-50/70 dark:bg-charcoal-800/40 border border-charcoal-100 dark:border-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
              <Building className="w-4 h-4 text-sky-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-charcoal-400 block font-medium">Academic Department</span>
                <span className="truncate font-semibold text-charcoal-900 dark:text-charcoal-100 block">
                  {department}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-charcoal-50/70 dark:bg-charcoal-800/40 border border-charcoal-100 dark:border-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
              <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-charcoal-400 block font-medium">Member Since</span>
                <span className="truncate font-semibold text-charcoal-900 dark:text-charcoal-100 block">
                  {joinedDate}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-charcoal-50/70 dark:bg-charcoal-800/40 border border-charcoal-100 dark:border-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-charcoal-400 block font-medium">Encryption Status</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold block">
                  Verified 256-bit End-to-End Encrypted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Management Actions */}
        <div className="space-y-2 pt-2 border-t border-charcoal-100 dark:border-charcoal-800/80">
          <h5 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">
            Contact Actions
          </h5>

          {/* Toggle Favorite */}
          <button
            type="button"
            onClick={() => onToggleFavorite?.(contact)}
            className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
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

          {/* Block / Unblock Contact (Destructive Action with confirmation) */}
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
              {isBlocked ? 'Currently Blocked' : 'Confirmation required'}
            </span>
          </button>
        </div>
      </div>

      {/* Block Contact Confirmation Modal */}
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
        note="Blocked contacts will not be able to message or place calls to your account."
      />
    </div>
  );
};

export default ContactDetailsPanel;
