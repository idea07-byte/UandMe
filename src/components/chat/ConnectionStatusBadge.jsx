import { RefreshCw, ShieldCheck } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { SOCKET_STATUS } from '../../utils/constants';
import { cn } from '../../utils/cn';

/**
 * Reusable Connection Status Badge.
 * Visualizes the live Socket.IO connection state, reconnection attempts,
 * and dev mock sandbox fallback mode with manual retry support.
 */
export const ConnectionStatusBadge = ({ size = 'md', showRetry = true, className }) => {
  const { status, reconnect } = useSocket();

  const isSmall = size === 'sm';

  switch (status) {
    case SOCKET_STATUS.CONNECTED:
      return (
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold select-none transition-colors',
            isSmall ? 'text-[10px] py-0.5' : 'text-xs',
            className
          )}
          title="Connected to backend WebSocket gateway"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>{isSmall ? 'Live' : 'Live Socket'}</span>
        </div>
      );

    case SOCKET_STATUS.CONNECTING:
    case SOCKET_STATUS.RECONNECTING:
      return (
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-medium select-none animate-pulse',
            isSmall ? 'text-[10px] py-0.5' : 'text-xs',
            className
          )}
          title="Connecting to WebSocket gateway..."
        >
          <RefreshCw className={cn('animate-spin text-amber-600', isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
          <span>{status === SOCKET_STATUS.RECONNECTING ? 'Reconnecting...' : 'Connecting...'}</span>
        </div>
      );

    case SOCKET_STATUS.MOCK_MODE:
      return (
        <div
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-charcoal-100 dark:bg-charcoal-800 border border-charcoal-300 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-300 font-semibold select-none',
            isSmall ? 'text-[10px]' : 'text-xs',
            className
          )}
          title="Backend offline: Running in Dev Mock Sandbox mode. Messages are simulated locally."
        >
          <ShieldCheck className={cn('text-primary-600 dark:text-primary-400', isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
          <span>{isSmall ? 'Sandbox' : 'Dev Sandbox'}</span>
        </div>
      );

    case SOCKET_STATUS.DISCONNECTED:
    default:
      return (
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold select-none',
            isSmall ? 'text-[10px]' : 'text-xs',
            className
          )}
          title="WebSocket disconnected from server"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span>Offline</span>
          {showRetry && (
            <button
              type="button"
              onClick={reconnect}
              className="ml-1 px-1 py-0.2 rounded hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 underline font-bold cursor-pointer"
              title="Retry socket connection"
            >
              Retry
            </button>
          )}
        </div>
      );
  }
};

export default ConnectionStatusBadge;
