import React, { useState } from 'react';
import {
  X,
  Phone,
  Video,
  Search,
  Bell,
  BellOff,
  Star,
  Clock,
  Shield,
  Palette,
  Ban,
  ThumbsDown,
  Lock,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Link,
  Copy,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import useToast from '../../hooks/useToast';
import { cn } from '../../utils/cn';

/**
 * WhatsApp Desktop Style 4th Sliding Pane (Contact Info).
 * Spec Page 2 & 4:
 * "Right panel opens beside the chat: avatar, name, phone number,
 *  Voice / Video / Search buttons, Media links and docs (count and thumbnails),
 *  Starred messages, Notification settings, Disappearing messages,
 *  Advanced chat privacy, Chat theme, Encryption note.
 *  Click the X to close it; the chat widens back."
 */
export const WhatsAppContactInfoPanel = ({
  contact,
  conversation,
  onClose,
  onToggleMute,
  onToggleBlock,
  isMuted = false,
  isBlocked = false,
}) => {
  const toast = useToast();
  const [activeMediaTab, setActiveMediaTab] = useState('media');
  const [disappearingMode, setDisappearingMode] = useState('Off');
  const [showDisappearingOptions, setShowDisappearingOptions] = useState(false);

  if (!contact && !conversation) return null;

  const target = contact || conversation;
  const name = target.name || 'Contact';
  const avatar = target.avatar;
  const phone = target.phone || target.email || '+1 (555) 234-5678';
  const about = target.about || target.statusMessage || 'Hey there! I am using PulseChat.';
  const memberCount = target.isGroup ? target.memberCount || 2 : null;

  const sampleMedia = [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=300&auto=format&fit=crop&q=80',
  ];

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText(phone);
    toast.success('Copied phone number to clipboard!');
  };

  return (
    <aside className="w-80 sm:w-96 h-full flex flex-col bg-[#111B21] border-l border-[#222D34] text-[#E9EDEF] shrink-0 select-none overflow-y-auto animate-fade-in z-20">
      {/* Header Bar */}
      <div className="h-[60px] px-4 flex items-center justify-between border-b border-[#222D34] bg-[#202C33] shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-semibold text-base text-[#E9EDEF]">Contact info</h3>
        </div>
      </div>

      {/* Main Profile Info Section */}
      <div className="p-6 flex flex-col items-center text-center bg-[#111B21] border-b border-[#222D34]">
        {/* Large WhatsApp Avatar ~100px */}
        <div className="relative mb-4">
          <img
            src={avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
            alt={name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-[#222D34] shadow-md"
          />
        </div>

        <h2 className="text-xl font-bold text-[#E9EDEF]">{name}</h2>
        <p className="text-sm text-[#8696A0] mt-0.5">{phone}</p>
        {memberCount && (
          <p className="text-xs text-[#00A884] font-medium mt-1">Group • {memberCount} participants</p>
        )}

        {/* Action Buttons: Audio, Video, Search */}
        <div className="flex items-center justify-center gap-6 mt-6 w-full">
          <button
            type="button"
            onClick={() => toast.info(`Starting voice call with ${name}...`)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-11 h-11 rounded-full bg-[#202C33] border border-[#2A3942] flex items-center justify-center text-[#00A884] group-hover:bg-[#00A884] group-hover:text-white transition-all shadow-sm">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-xs text-[#8696A0] group-hover:text-[#E9EDEF]">Audio</span>
          </button>

          <button
            type="button"
            onClick={() => toast.info(`Starting video call with ${name}...`)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-11 h-11 rounded-full bg-[#202C33] border border-[#2A3942] flex items-center justify-center text-[#00A884] group-hover:bg-[#00A884] group-hover:text-white transition-all shadow-sm">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xs text-[#8696A0] group-hover:text-[#E9EDEF]">Video</span>
          </button>

          <button
            type="button"
            onClick={() => toast.info('In-chat message search opened.')}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-11 h-11 rounded-full bg-[#202C33] border border-[#2A3942] flex items-center justify-center text-[#00A884] group-hover:bg-[#00A884] group-hover:text-white transition-all shadow-sm">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs text-[#8696A0] group-hover:text-[#E9EDEF]">Search</span>
          </button>
        </div>
      </div>

      {/* About & Phone Number Section */}
      <div className="p-4 border-b border-[#222D34] bg-[#111B21]">
        <span className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider block mb-2">About</span>
        <p className="text-sm text-[#E9EDEF] leading-relaxed mb-3">{about}</p>

        <div className="flex items-center justify-between pt-2 border-t border-[#182229]">
          <span className="text-sm text-[#E9EDEF]">{phone}</span>
          <button
            type="button"
            onClick={handleCopyPhone}
            className="text-[#8696A0] hover:text-[#00A884] p-1.5 transition-colors"
            title="Copy phone number"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Media, Links and Docs Gallery */}
      <div className="p-4 border-b border-[#222D34] bg-[#111B21]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">Media, links and docs</span>
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-[#202C33] text-[#8696A0]">24</span>
          </div>
          <button
            type="button"
            onClick={() => toast.info('Full media gallery view')}
            className="text-xs text-[#00A884] hover:underline flex items-center gap-0.5"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Media Thumbnails Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {sampleMedia.map((img, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[#202C33] cursor-pointer group">
              <img
                src={img}
                alt="Shared media"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Settings & Controls List */}
      <div className="divide-y divide-[#182229] border-b border-[#222D34] bg-[#111B21]">
        {/* Starred Messages */}
        <button
          type="button"
          onClick={() => toast.info('Starred messages view opened.')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#202C33] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-[#8696A0]" />
            <span className="text-sm font-medium text-[#E9EDEF]">Starred messages</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8696A0]" />
        </button>

        {/* Mute Notifications Toggle */}
        <div className="px-4 py-3.5 flex items-center justify-between hover:bg-[#202C33] transition-colors">
          <div className="flex items-center gap-3">
            {isMuted ? <BellOff className="w-5 h-5 text-amber-500" /> : <Bell className="w-5 h-5 text-[#8696A0]" />}
            <span className="text-sm font-medium text-[#E9EDEF]">Mute notifications</span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(isMuted)}
            onChange={() => onToggleMute?.(target.id)}
            className="w-4 h-4 accent-[#00A884] cursor-pointer"
          />
        </div>

        {/* Disappearing Messages */}
        <div className="px-4 py-3.5 hover:bg-[#202C33] transition-colors">
          <button
            type="button"
            onClick={() => setShowDisappearingOptions(!showDisappearingOptions)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#8696A0]" />
              <div>
                <p className="text-sm font-medium text-[#E9EDEF]">Disappearing messages</p>
                <p className="text-xs text-[#8696A0]">{disappearingMode}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8696A0]" />
          </button>

          {showDisappearingOptions && (
            <div className="mt-3 pl-8 flex gap-2">
              {['Off', '24 hours', '7 days', '90 days'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setDisappearingMode(opt);
                    setShowDisappearingOptions(false);
                    toast.info(`Disappearing messages set to ${opt}`);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                    disappearingMode === opt
                      ? 'bg-[#00A884] border-[#00A884] text-white'
                      : 'border-[#2A3942] text-[#8696A0] hover:text-[#E9EDEF]'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Chat Privacy */}
        <button
          type="button"
          onClick={() => toast.info('Advanced chat privacy: protect IP address in calls, disable link previews.')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#202C33] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#8696A0]" />
            <span className="text-sm font-medium text-[#E9EDEF]">Advanced chat privacy</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8696A0]" />
        </button>

        {/* Chat Theme */}
        <button
          type="button"
          onClick={() => toast.info('Customize wallpaper and bubble colors in Settings > Appearance.')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#202C33] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-[#8696A0]" />
            <span className="text-sm font-medium text-[#E9EDEF]">Chat theme</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8696A0]" />
        </button>
      </div>

      {/* Encryption Notice */}
      <div className="p-4 border-b border-[#222D34] bg-[#111B21]">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-[#8696A0] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#E9EDEF]">Encryption</p>
            <p className="text-xs text-[#8696A0] mt-0.5 leading-relaxed">
              Messages and calls are end-to-end encrypted. No one outside of this chat, not even PulseChat, can read or listen to them. Tap to verify.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone: Block & Report */}
      <div className="p-3 bg-[#111B21]">
        <button
          type="button"
          onClick={() => onToggleBlock?.(target)}
          className="w-full px-4 py-3 rounded-xl hover:bg-[#202C33] text-rose-500 flex items-center gap-3 text-sm font-medium transition-colors"
        >
          <Ban className="w-5 h-5" />
          <span>{isBlocked ? `Unblock ${name}` : `Block ${name}`}</span>
        </button>

        <button
          type="button"
          onClick={() => toast.warning(`Report submitted for ${name}.`)}
          className="w-full px-4 py-3 rounded-xl hover:bg-[#202C33] text-rose-500 flex items-center gap-3 text-sm font-medium transition-colors"
        >
          <ThumbsDown className="w-5 h-5" />
          <span>Report contact</span>
        </button>
      </div>
    </aside>
  );
};

export default WhatsAppContactInfoPanel;
