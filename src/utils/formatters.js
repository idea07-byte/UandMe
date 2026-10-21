/**
 * Extracts initials from a user's name (up to 2 characters).
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns a consistent, vibrant background color class based on the name.
 * Uses emerald and harmonious matching tones.
 * @param {string} name
 * @returns {string} Tailwind CSS class for background
 */
export function getAvatarColor(name) {
  if (!name) return 'bg-emerald-600 text-white';

  const colorClasses = [
    'bg-emerald-600 text-white',
    'bg-teal-600 text-white',
    'bg-cyan-600 text-white',
    'bg-emerald-700 text-emerald-100',
    'bg-emerald-500 text-white',
    'bg-slate-700 text-emerald-300',
    'bg-emerald-800 text-emerald-100',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colorClasses.length;
  return colorClasses[index];
}

/**
 * Formats a timestamp into a human-friendly chat time.
 * @param {string|Date|number} timestamp
 * @returns {string}
 */
export function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formats calendar dates for date separators in chat history.
 * @param {string|Date|number} timestamp
 * @returns {string}
 */
export function formatDateDivider(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  const isCurrentYear = date.getFullYear() === now.getFullYear();
  if (isCurrentYear) {
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }

  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a short timestamp for chat list items.
 * @param {string|Date|number} timestamp
 * @returns {string}
 */
export function formatListTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Truncates text with an ellipsis if it exceeds maxLength.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 35) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
