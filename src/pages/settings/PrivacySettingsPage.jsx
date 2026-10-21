import React, { useState, useEffect } from 'react';
import {
  Eye,
  CheckCheck,
  Ban,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { SettingsCard, SettingsToggle, SettingsRadioGroup } from '../../components/settings';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import chatService from '../../services/chatService';
import useToast from '../../hooks/useToast';

export const PrivacySettingsPage = () => {
  const toast = useToast();

  // Load preferences from local storage
  const [lastSeen, setLastSeen] = useState(() => {
    return localStorage.getItem('pulsechat_priv_last_seen') || 'contacts';
  });

  const [onlineStatus, setOnlineStatus] = useState(() => {
    return localStorage.getItem('pulsechat_priv_online') || 'same_as_last_seen';
  });

  const [photoVisibility, setPhotoVisibility] = useState(() => {
    return localStorage.getItem('pulsechat_priv_photo') || 'everyone';
  });

  const [aboutVisibility, setAboutVisibility] = useState(() => {
    return localStorage.getItem('pulsechat_priv_about') || 'everyone';
  });

  const [readReceipts, setReadReceipts] = useState(() => {
    return localStorage.getItem('pulsechat_priv_receipts') !== 'false';
  });

  // Blocked Contacts List from service
  const [blockedContacts, setBlockedContacts] = useState([]);

  useEffect(() => {
    chatService.getContacts().then((all) => {
      setBlockedContacts(all.filter((c) => c.isBlocked));
    });
  }, []);

  const handleLastSeenChange = (val) => {
    setLastSeen(val);
    localStorage.setItem('pulsechat_priv_last_seen', val);
    toast.success('Last seen visibility updated.');
  };

  const handleOnlineStatusChange = (val) => {
    setOnlineStatus(val);
    localStorage.setItem('pulsechat_priv_online', val);
    toast.success('Online presence visibility updated.');
  };

  const handlePhotoVisibilityChange = (val) => {
    setPhotoVisibility(val);
    localStorage.setItem('pulsechat_priv_photo', val);
    toast.success('Profile photo visibility updated.');
  };

  const handleAboutVisibilityChange = (val) => {
    setAboutVisibility(val);
    localStorage.setItem('pulsechat_priv_about', val);
    toast.success('About text visibility updated.');
  };

  const handleReadReceiptsToggle = (val) => {
    setReadReceipts(val);
    localStorage.setItem('pulsechat_priv_receipts', String(val));
    toast.info(
      val
        ? 'Read receipts enabled (emerald checkmarks ✓✓ will be shown).'
        : 'Read receipts disabled. You will not send or see read checkmarks.'
    );
  };

  const handleUnblock = async (contact) => {
    await chatService.unblockContact(contact.id);
    setBlockedContacts((prev) => prev.filter((c) => c.id !== contact.id));
    toast.success(`${contact.name} has been unblocked.`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-charcoal-900 dark:text-white tracking-tight">
          Privacy Settings
        </h2>
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          Manage who can see your online status, presence timestamps, read receipts, and profile details.
        </p>
      </div>

      {/* Last Seen & Online Visibility */}
      <SettingsCard
        title="Last Seen & Online Presence"
        description="Choose who can see when you were last active and whether you are currently online."
        icon={Eye}
      >
        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400 block mb-2">
              Who can see my "Last Seen" timestamp
            </label>
            <SettingsRadioGroup
              name="lastSeen"
              value={lastSeen}
              onChange={handleLastSeenChange}
              options={[
                {
                  value: 'everyone',
                  label: 'Everyone on Campus',
                  description: 'Any registered student or faculty member can see your last seen time.',
                },
                {
                  value: 'contacts',
                  label: 'My Contacts Only (Recommended)',
                  description: 'Only peers in your saved address book can view your activity timestamp.',
                },
                {
                  value: 'nobody',
                  label: 'Nobody',
                  description: 'Hide your last seen timestamp from all users. (You will not see others\' either).',
                },
              ]}
            />
          </div>

          <div className="pt-2 border-t border-charcoal-100 dark:border-charcoal-800/80">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400 block mb-2">
              Who can see when I'm "Online"
            </label>
            <SettingsRadioGroup
              name="onlineStatus"
              value={onlineStatus}
              onChange={handleOnlineStatusChange}
              options={[
                {
                  value: 'same_as_last_seen',
                  label: 'Same as Last Seen (Default)',
                  description: 'Applies your "Last Seen" permission rule to active online status.',
                },
                {
                  value: 'everyone',
                  label: 'Everyone',
                  description: 'Pulsing green presence indicator visible to all active campus users.',
                },
                {
                  value: 'nobody',
                  label: 'Nobody (Stealth Mode)',
                  description: 'Always appear offline even when actively reading and composing messages.',
                },
              ]}
            />
          </div>
        </div>
      </SettingsCard>

      {/* Profile Details Visibility */}
      <SettingsCard
        title="Profile Information Visibility"
        description="Control the visibility of your profile photo and about status quote."
        icon={UserCheck}
      >
        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400 block mb-2">
              Who can see my profile photo
            </label>
            <SettingsRadioGroup
              name="photoVisibility"
              value={photoVisibility}
              onChange={handlePhotoVisibilityChange}
              options={[
                {
                  value: 'everyone',
                  label: 'Everyone on Campus',
                  description: 'Visible across all student searches and group participant rosters.',
                },
                {
                  value: 'contacts',
                  label: 'My Contacts Only',
                  description: 'Visible only to students and faculty added to your contacts.',
                },
                {
                  value: 'nobody',
                  label: 'Nobody',
                  description: 'Shows generic initials avatar to all other users.',
                },
              ]}
            />
          </div>

          <div className="pt-2 border-t border-charcoal-100 dark:border-charcoal-800/80">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-400 block mb-2">
              Who can see my "About / Status" text
            </label>
            <SettingsRadioGroup
              name="aboutVisibility"
              value={aboutVisibility}
              onChange={handleAboutVisibilityChange}
              options={[
                {
                  value: 'everyone',
                  label: 'Everyone on Campus',
                  description: 'Displays status quote on direct chat headers and search previews.',
                },
                {
                  value: 'contacts',
                  label: 'My Contacts Only',
                  description: 'Restricted to users in your address book.',
                },
                {
                  value: 'nobody',
                  label: 'Nobody',
                  description: 'Hides about text from profile previews.',
                },
              ]}
            />
          </div>
        </div>
      </SettingsCard>

      {/* Read Receipts */}
      <SettingsCard
        title="Message Read Receipts"
        description="Display double checkmarks when messages are delivered and read."
        icon={CheckCheck}
      >
        <SettingsToggle
          id="toggle-read-receipts"
          checked={readReceipts}
          onChange={handleReadReceiptsToggle}
          title="Send and Receive Read Receipts (✓✓)"
          description="If turned off, you won't send read receipts to others, and you won't see when they read your messages. (Read receipts are always sent in group chats)."
          icon={CheckCheck}
        />
      </SettingsCard>

      {/* Blocked Contacts Summary */}
      <SettingsCard
        title="Blocked Contacts"
        description="Blocked users cannot message, call, or see your online status."
        icon={Ban}
      >
        {blockedContacts.length > 0 ? (
          <div className="space-y-2">
            {blockedContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-100 dark:border-charcoal-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={contact.avatar} name={contact.name} size="sm" />
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-charcoal-900 dark:text-white truncate">
                      {contact.name}
                    </h5>
                    <p className="text-[10px] text-charcoal-400 truncate font-mono">
                      {contact.email}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={() => handleUnblock(contact)}
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center rounded-2xl bg-charcoal-50 dark:bg-charcoal-800/40 border border-charcoal-100 dark:border-charcoal-800 text-xs text-charcoal-500">
            <span>You have not blocked any campus contacts.</span>
          </div>
        )}
      </SettingsCard>

      {/* Privacy Note */}
      <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-900/60 flex items-center gap-3 text-xs text-primary-800 dark:text-primary-300">
        <Sparkles className="w-4 h-4 shrink-0 text-primary-600" />
        <span>
          PulseChat privacy rules are enforced on both the client side and WebSocket message gateways.
        </span>
      </div>
    </div>
  );
};

export default PrivacySettingsPage;
