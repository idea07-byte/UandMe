/**
 * Call History Service.
 * Manages persistent call logs, missed call badges, and call activity.
 */

const STORAGE_PREFIX = 'uandi_call_history_';

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${remainingSecs.toString().padStart(2, '0')}s`;
  }
  return `${remainingSecs}s`;
}

function formatCallTime(isoString) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today, ${timeStr}`;
    if (isYesterday) return `Yesterday, ${timeStr}`;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  } catch {
    return 'Recently';
  }
}

class CallHistoryService {
  getStorageKey(userId) {
    return `${STORAGE_PREFIX}${userId || 'guest'}`;
  }

  getCalls(userId, filter = 'all') {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      const calls = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(calls)) return [];

      if (filter === 'missed') {
        return calls.filter((c) => c.direction === 'missed');
      }
      return calls;
    } catch {
      return [];
    }
  }

  addCall(userId, { peer, direction, status = 'completed', duration = 0, type = 'voice', timestamp = null }) {
    if (!peer) return null;

    const timeIso = timestamp || new Date().toISOString();
    const newEntry = {
      id: `call_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      peer: {
        id: peer.id || peer._id,
        _id: peer._id || peer.id,
        name: peer.name || peer.username || 'Contact',
        avatar: peer.avatar || null,
        phone: peer.phone || null,
      },
      name: peer.name || peer.username || 'Contact',
      avatar: peer.avatar || null,
      direction: direction || 'outgoing', // 'incoming' | 'outgoing' | 'missed'
      status, // 'completed' | 'declined' | 'missed' | 'cancelled'
      duration,
      durationFormatted: direction === 'missed' ? 'Missed' : formatDuration(duration),
      type: type === 'video' ? 'video' : 'voice',
      timestamp: timeIso,
      time: formatCallTime(timeIso),
    };

    try {
      const existing = this.getCalls(userId);
      const updated = [newEntry, ...existing.filter((c) => c.id !== newEntry.id)].slice(0, 100);
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(updated));

      // Dispatch custom event for UI reactive updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('uandi:call-history-updated', { detail: newEntry }));
      }
      return newEntry;
    } catch {
      return newEntry;
    }
  }

  deleteCall(userId, callLogId) {
    try {
      const existing = this.getCalls(userId);
      const updated = existing.filter((c) => c.id !== callLogId);
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(updated));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('uandi:call-history-updated', { detail: { deletedId: callLogId } }));
      }
      return true;
    } catch {
      return false;
    }
  }

  clearHistory(userId) {
    try {
      localStorage.removeItem(this.getStorageKey(userId));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('uandi:call-history-updated', { detail: { cleared: true } }));
      }
      return true;
    } catch {
      return false;
    }
  }

  getMissedCount(userId) {
    return this.getCalls(userId, 'missed').length;
  }
}

export const callHistoryService = new CallHistoryService();
export default callHistoryService;
