import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, ArrowRight } from 'lucide-react';
import Avatar from '../common/Avatar';
import notificationService from '../../services/notificationService';

/**
 * WhatsApp-style Floating In-App Pop-up Notification Banner.
 * Appears at the top of the viewport when a new message arrives for a chat
 * other than the currently active one, or while the user is on another screen.
 */
export const InAppNotificationBanner = () => {
  const navigate = useNavigate();
  const [activeBanner, setActiveBanner] = useState(null);

  useEffect(() => {
    const unsub = notificationService.onInAppBanner((banner) => {
      setActiveBanner(banner);
    });

    const handleCustomEvent = (e) => {
      if (e.detail) {
        setActiveBanner(e.detail);
      }
    };

    window.addEventListener('uandi:in-app-notification', handleCustomEvent);

    return () => {
      unsub();
      window.removeEventListener('uandi:in-app-notification', handleCustomEvent);
    };
  }, []);

  // Auto-dismiss banner after 5 seconds
  useEffect(() => {
    if (!activeBanner) return;

    const timer = setTimeout(() => {
      setActiveBanner(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeBanner]);

  if (!activeBanner) return null;

  const handleOpenChat = () => {
    const convId = activeBanner.conversationId;
    setActiveBanner(null);
    navigate(`/chat/${convId}`);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-slide-down">
      <div
        onClick={handleOpenChat}
        className="flex items-center justify-between p-3.5 rounded-2xl bg-[#202C33] border border-[#2A3942] shadow-2xl text-[#E9EDEF] cursor-pointer hover:bg-[#233138] transition-all group backdrop-blur-md"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
          {/* Sender Avatar */}
          <div className="relative shrink-0">
            <Avatar
              src={activeBanner.senderAvatar}
              name={activeBanner.senderName}
              size="md"
              className="w-10 h-10 ring-2 ring-[#00A884]/40"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00A884] text-white flex items-center justify-center text-[9px] shadow-sm">
              <MessageSquare className="w-2.5 h-2.5" />
            </div>
          </div>

          {/* Sender info & message snippet */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-[#E9EDEF] truncate">
                {activeBanner.senderName}
              </h4>
              {activeBanner.isGroup && (
                <span className="text-[10px] text-[#8696A0] truncate">
                  in {activeBanner.conversationName}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8696A0] truncate mt-0.5 group-hover:text-[#E9EDEF] transition-colors">
              {activeBanner.textPreview}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleOpenChat}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-[11px] font-bold transition-all shadow-sm"
          >
            <span>Reply</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => setActiveBanner(null)}
            className="p-1.5 rounded-lg text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#111B21] transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InAppNotificationBanner;

