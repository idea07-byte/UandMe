import React, { useState } from 'react';
import {
  Bell,
  Volume2,
  Eye,
  MessageSquare,
  Users,
  AtSign,
  Play,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { SettingsCard, SettingsToggle, SettingsRadioGroup } from '../../components/settings';
import Button from '../../components/common/Button';
import useToast from '../../hooks/useToast';

export const NotificationSettingsPage = () => {
  const toast = useToast();

  // Load preferences from local storage or default
  const [pushEnabled, setPushEnabled] = useState(() => {
    return localStorage.getItem('pulsechat_notif_push') !== 'false';
  });

  const [directMessages, setDirectMessages] = useState(() => {
    return localStorage.getItem('pulsechat_notif_dm') !== 'false';
  });

  const [groupMessages, setGroupMessages] = useState(() => {
    return localStorage.getItem('pulsechat_notif_groups') !== 'false';
  });

  const [mentionsOnly, setMentionsOnly] = useState(() => {
    return localStorage.getItem('pulsechat_notif_mentions') === 'true';
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('pulsechat_notif_sound') !== 'false';
  });

  const [soundTone, setSoundTone] = useState(() => {
    return localStorage.getItem('pulsechat_notif_tone') || 'emerald';
  });

  const [previewMode, setPreviewMode] = useState(() => {
    return localStorage.getItem('pulsechat_notif_preview') || 'full';
  });

  // Toggle handlers with persistence
  const updatePush = (val) => {
    setPushEnabled(val);
    localStorage.setItem('pulsechat_notif_push', String(val));
    toast.success(`Desktop notifications ${val ? 'enabled' : 'disabled'}.`);
  };

  const updateDM = (val) => {
    setDirectMessages(val);
    localStorage.setItem('pulsechat_notif_dm', String(val));
    toast.info(`Direct message notifications ${val ? 'enabled' : 'disabled'}.`);
  };

  const updateGroups = (val) => {
    setGroupMessages(val);
    localStorage.setItem('pulsechat_notif_groups', String(val));
    toast.info(`Group chat notifications ${val ? 'enabled' : 'disabled'}.`);
  };

  const updateMentions = (val) => {
    setMentionsOnly(val);
    localStorage.setItem('pulsechat_notif_mentions', String(val));
    toast.info(val ? 'Notifications restricted to @mentions only.' : 'All messages will notify.');
  };

  const updateSound = (val) => {
    setSoundEnabled(val);
    localStorage.setItem('pulsechat_notif_sound', String(val));
    toast.success(`Notification audio chime ${val ? 'unmuted' : 'muted'}.`);
  };

  const updateTone = (tone) => {
    setSoundTone(tone);
    localStorage.setItem('pulsechat_notif_tone', tone);
    toast.success(`Notification tone changed to ${tone}.`);
  };

  const updatePreview = (mode) => {
    setPreviewMode(mode);
    localStorage.setItem('pulsechat_notif_preview', mode);
    toast.success('Notification preview setting updated.');
  };

  // Play audio chime test (using Web Audio API synthesised bell chime)
  const handleTestSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(soundTone === 'emerald' ? 587.33 : soundTone === 'classic' ? 880 : 440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
      toast.info(`Playing preview for tone: "${soundTone}"`);
    } catch {
      toast.info(`Simulated chime played for tone: "${soundTone}"`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-charcoal-900 dark:text-white tracking-tight">
          Notification Preferences
        </h2>
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          Configure how and when PulseChat alerts you about new messages, team mentions, and incoming calls.
        </p>
      </div>

      {/* Message Notifications */}
      <SettingsCard
        title="Message Notifications"
        description="Choose which types of conversations trigger alerts on this device."
        icon={Bell}
      >
        <div className="space-y-3">
          <SettingsToggle
            id="toggle-push"
            checked={pushEnabled}
            onChange={updatePush}
            title="Desktop Browser Push Notifications"
            description="Display floating system notifications when messages arrive while PulseChat is in the background."
            icon={Bell}
          />

          <SettingsToggle
            id="toggle-dm"
            checked={directMessages}
            onChange={updateDM}
            title="Direct Messages"
            description="Receive immediate alerts for 1-on-1 conversations from classmates and advisors."
            icon={MessageSquare}
          />

          <SettingsToggle
            id="toggle-groups"
            checked={groupMessages}
            onChange={updateGroups}
            title="Group Chat Messages"
            description="Receive alerts for messages in project teams and collaboration groups."
            icon={Users}
          />

          <SettingsToggle
            id="toggle-mentions"
            checked={mentionsOnly}
            onChange={updateMentions}
            title="Only Notify for Direct Mentions (@me)"
            description="Mute general team messages unless your name or @all is explicitly tagged."
            icon={AtSign}
          />
        </div>
      </SettingsCard>

      {/* Sound Chimes */}
      <SettingsCard
        title="Audio Chimes & Sound Preferences"
        description="Play subtle notification chimes when receiving incoming messages."
        icon={Volume2}
      >
        <div className="space-y-4">
          <SettingsToggle
            id="toggle-sound"
            checked={soundEnabled}
            onChange={updateSound}
            title="Play Audio Notification Chimes"
            description="Audible alert on incoming messages and call requests."
            icon={soundEnabled ? Volume2 : VolumeX}
          />

          {soundEnabled && (
            <div className="p-4 rounded-2xl bg-charcoal-50/70 dark:bg-charcoal-800/40 border border-charcoal-100 dark:border-charcoal-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-charcoal-900 dark:text-white uppercase tracking-wider">
                    Chime Tone Selector
                  </h4>
                  <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                    Pick an audio tone that suits your study environment.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={handleTestSound}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                >
                  Test Tone
                </Button>
              </div>

              <SettingsRadioGroup
                name="soundTone"
                value={soundTone}
                onChange={updateTone}
                options={[
                  {
                    value: 'emerald',
                    label: 'Pulse Emerald (Modern)',
                    description: 'A crisp, gentle two-tone chime designed for all-day focus.',
                  },
                  {
                    value: 'classic',
                    label: 'Classic Ding (Standard)',
                    description: 'Traditional notification ping with clear high-frequency resonance.',
                  },
                  {
                    value: 'minimal',
                    label: 'Subtle Tick (Minimalist)',
                    description: 'Low-profile click ideal for quiet library study rooms.',
                  },
                ]}
              />
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Message Previews */}
      <SettingsCard
        title="Notification Preview Privacy"
        description="Control what information appears in floating browser popups and system notification banners."
        icon={Eye}
      >
        <SettingsRadioGroup
          name="previewMode"
          value={previewMode}
          onChange={updatePreview}
          options={[
            {
              value: 'full',
              label: 'Full Details (Default)',
              description: 'Show contact name, avatar, and message snippet in notification popups.',
            },
            {
              value: 'sender_only',
              label: 'Sender Name Only',
              description: 'Show who messaged you, but hide message text until you open the chat.',
            },
            {
              value: 'hidden',
              label: 'Completely Hidden',
              description: 'Show "New Message" without revealing the contact name or message content.',
            },
          ]}
        />
      </SettingsCard>

      {/* Privacy Note */}
      <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-900/60 flex items-center gap-3 text-xs text-primary-800 dark:text-primary-300">
        <Sparkles className="w-4 h-4 shrink-0 text-primary-600" />
        <span>
          Notification preferences are persisted in safe local storage and do not transmit sensitive personal information.
        </span>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
