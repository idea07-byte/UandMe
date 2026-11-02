/**
 * WhatsApp-style Notification Service.
 * - Handles Native Browser Web Notifications (Web Push / Desktop Push)
 * - In-App Pop-up Banners when viewing other chats or screens
 * - Notification grouping per conversation (tag)
 * - Mute chat support
 * - Do NOT notify if user is currently active in that conversation
 * - Web Audio API synthesized WhatsApp message chime
 */

class NotificationService {
  constructor() {
    this.activeConversationId = null;
    this.audioContext = null;
    this.bannerListeners = new Set();
    this.hasRequestedPermission = false;
  }

  /**
   * Set active conversation being viewed by user
   * @param {string|null} conversationId
   */
  setActiveConversation(conversationId) {
    this.activeConversationId = conversationId;
  }

  /**
   * Check if notifications are supported
   * @returns {boolean}
   */
  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Request native browser notification permission
   * @returns {Promise<NotificationPermission>}
   */
  async requestPermission() {
    if (!this.isSupported()) return 'denied';
    try {
      const perm = await Notification.requestPermission();
      this.hasRequestedPermission = true;
      return perm;
    } catch {
      return 'default';
    }
  }

  /**
   * Check if browser notification permission is granted
   * @returns {boolean}
   */
  isPermissionGranted() {
    return this.isSupported() && Notification.permission === 'granted';
  }

  /**
   * Check if a conversation is muted
   * @param {string} conversationId
   * @returns {boolean}
   */
  isConversationMuted(conversationId) {
    try {
      const raw = localStorage.getItem('muted_chats');
      if (!raw) return false;
      const set = JSON.parse(raw);
      return Array.isArray(set) ? set.includes(conversationId) : false;
    } catch {
      return false;
    }
  }

  /**
   * Play WhatsApp-style crisp notification chime
   */
  playNotificationSound() {
    const isSoundEnabled = localStorage.getItem('pulsechat_notif_sound') !== 'false';
    if (!isSoundEnabled) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // WhatsApp two-tone bell chime (587.33Hz D5 -> 880Hz A5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.09, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.08);
      gain2.gain.setValueAtTime(0.09, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } catch (e) {
      // Audio autoplay may be constrained before first user gesture
    }
  }

  /**
   * Process an incoming message and decide whether to show notification
   * @param {Object} params
   * @param {Object} params.message
   * @param {Object} [params.conversation]
   * @param {string} [params.currentUserId]
   * @param {Function} [params.onNavigate]
   */
  notifyIncomingMessage({ message, conversation = null, currentUserId = null, onNavigate = null }) {
    if (!message) return;

    const senderId = message.senderId || message.sender?._id || message.sender?.id;
    if (currentUserId && (senderId === currentUserId || senderId === 'usr_me_1')) {
      // Don't notify own messages
      return;
    }

    const convId = message.conversationId || conversation?.id || conversation?._id;
    if (!convId) return;

    // Check if conversation is muted
    if (this.isConversationMuted(convId)) {
      return;
    }

    // Check if user already has THIS chat actively open and focused
    const isAppVisible = typeof document !== 'undefined' && document.visibilityState === 'visible';
    const isSameChatOpen = this.activeConversationId && this.activeConversationId.toString() === convId.toString();

    if (isAppVisible && isSameChatOpen) {
      // The user is actively looking at this conversation: DO NOT notify!
      return;
    }

    // Play notification sound
    this.playNotificationSound();

    const senderName =
      message.senderName ||
      message.sender?.name ||
      conversation?.name ||
      'New Message';

    const textPreview =
      message.text ||
      (message.attachments && message.attachments.length > 0
        ? `📎 ${message.attachments[0].name || 'Attachment'}`
        : 'New message received');

    const avatarUrl =
      message.senderAvatar ||
      message.sender?.avatar ||
      conversation?.avatar ||
      '/favicon.ico';

    // 1. Dispatch In-App Banner event (if app is visible but on another screen or conversation)
    if (isAppVisible) {
      const bannerDetail = {
        id: `banner_${Date.now()}_${Math.random()}`,
        conversationId: convId,
        senderName,
        senderAvatar: avatarUrl,
        textPreview,
        timestamp: message.timestamp || new Date().toISOString(),
        conversationName: conversation?.name || senderName,
        isGroup: Boolean(conversation?.isGroup),
      };

      this.bannerListeners.forEach((listener) => {
        try {
          listener(bannerDetail);
        } catch {}
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('uandi:in-app-notification', { detail: bannerDetail })
        );
      }
    }

    // 2. Dispatch Native Browser Push Notification (if in background or permitted)
    if (this.isPermissionGranted() && !isAppVisible) {
      try {
        const notif = new Notification(senderName, {
          body: textPreview,
          icon: avatarUrl,
          badge: '/favicon.ico',
          tag: `uandi_chat_${convId}`, // Group notifications per conversation
          renotify: true,
          silent: true, // We already synthesized sound
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
          if (onNavigate) {
            onNavigate(`/chat/${convId}`);
          } else if (typeof window !== 'undefined') {
            window.location.href = `/chat/${convId}`;
          }
        };
      } catch (err) {
        console.warn('[NotificationService] Desktop notification error:', err);
      }
    }
  }

  /**
   * Subscribe to in-app notification banners
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  onInAppBanner(callback) {
    this.bannerListeners.add(callback);
    return () => this.bannerListeners.delete(callback);
  }
}

export const notificationService = new NotificationService();
export default notificationService;

