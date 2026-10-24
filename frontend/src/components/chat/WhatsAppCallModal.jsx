import React, { useRef, useEffect, useState } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Lock,
  Monitor,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useCall } from '../../context/CallContext';
import Avatar from '../common/Avatar';
import { cn } from '../../utils/cn';

/**
 * Format duration seconds into MM:SS or HH:MM:SS format.
 */
function formatDuration(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * WhatsApp Desktop Call Modal Component.
 * Supports:
 * - Outgoing call screen (Calling... / Ringing...)
 * - Incoming call screen (Ringing with Accept & Reject)
 * - Connected Audio call (Waveform, avatar, timer, controls dock)
 * - Connected Video call (Remote video main view, PiP local preview, controls dock)
 */
export const WhatsAppCallModal = () => {
  const {
    callState,
    substate,
    callType,
    peer,
    duration,
    connectionStatus,
    isMuted,
    isVideoEnabled,
    isSpeakerMuted,
    isScreenSharing,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    toggleScreenShare,
  } = useCall();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalContainerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local stream to local video preview element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, callState]);

  // Attach remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, callState]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // If no call is currently active or incoming, do not render modal
  if (callState === 'idle') {
    return null;
  }

  const peerName = peer?.name || peer?.username || 'Contact';
  const peerAvatar = peer?.avatar || null;
  const isVideo = callType === 'video';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        ref={modalContainerRef}
        className={cn(
          'relative w-full overflow-hidden rounded-3xl bg-[#111B21] border border-[#2A3942] shadow-2xl flex flex-col transition-all duration-300',
          isFullscreen
            ? 'w-screen h-screen rounded-none border-none'
            : isVideo && callState === 'connected'
            ? 'max-w-4xl h-[85vh] min-h-[520px]'
            : 'max-w-md h-[580px]'
        )}
      >
        {/* Top Header Bar */}
        <div className="absolute top-0 inset-x-0 h-14 px-4 flex items-center justify-between z-30 bg-gradient-to-b from-[#111B21]/90 to-transparent">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8696A0]">
            <Lock className="w-3.5 h-3.5 text-[#00A884]" />
            <span>End-to-end encrypted</span>
          </div>

          <div className="flex items-center gap-2">
            {callState === 'connected' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#202C33] text-[#00A884] font-mono">
                {connectionStatus === 'connected' ? formatDuration(duration) : 'Connecting...'}
              </span>
            )}

            {isVideo && callState === 'connected' && (
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-2 rounded-xl text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33] transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* VIEW 1: INCOMING CALL SCREEN                                        */}
        {/* =================================================================== */}
        {callState === 'incoming' && (
          <div className="flex-1 flex flex-col items-center justify-between p-8 pt-16 text-center animate-fade-in">
            <div className="space-y-4 flex flex-col items-center">
              {/* Ringing pulsating avatar */}
              <div className="relative">
                <span className="absolute -inset-3 rounded-full bg-[#00A884]/20 animate-ping" />
                <span className="absolute -inset-1.5 rounded-full bg-[#00A884]/30 animate-pulse" />
                <Avatar
                  src={peerAvatar}
                  name={peerName}
                  size="2xl"
                  className="w-28 h-28 border-4 border-[#202C33] shadow-xl relative z-10"
                />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#E9EDEF] tracking-tight">{peerName}</h3>
                <p className="text-sm text-[#00A884] font-medium mt-1 flex items-center justify-center gap-1.5">
                  {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  <span>Incoming {isVideo ? 'Video' : 'Voice'} Call...</span>
                </p>
              </div>
            </div>

            {/* Incoming Call Actions: Decline / Accept */}
            <div className="flex items-center justify-center gap-12 w-full pb-4">
              {/* Decline Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => rejectCall('declined')}
                  className="w-16 h-16 rounded-full bg-[#EA0038] hover:bg-[#C90030] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                  title="Decline"
                  aria-label="Decline Call"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
                <span className="text-xs text-[#8696A0]">Decline</span>
              </div>

              {/* Accept Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={acceptCall}
                  className="w-16 h-16 rounded-full bg-[#00A884] hover:bg-[#008F6F] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all animate-bounce"
                  title="Accept"
                  aria-label="Accept Call"
                >
                  {isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
                </button>
                <span className="text-xs text-[#00A884] font-semibold">Accept</span>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: OUTGOING CALL SCREEN (Calling... / Ringing...)               */}
        {/* =================================================================== */}
        {callState === 'outgoing' && (
          <div className="flex-1 flex flex-col items-center justify-between p-8 pt-16 text-center animate-fade-in">
            <div className="space-y-4 flex flex-col items-center">
              {/* Pulsing avatar */}
              <div className="relative">
                <span className="absolute -inset-2.5 rounded-full bg-[#00A884]/20 animate-pulse" />
                <Avatar
                  src={peerAvatar}
                  name={peerName}
                  size="2xl"
                  className="w-28 h-28 border-4 border-[#202C33] shadow-xl relative z-10"
                />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#E9EDEF] tracking-tight">{peerName}</h3>
                <p className="text-sm text-[#8696A0] font-medium mt-1">
                  {substate === 'ringing' ? 'Ringing...' : 'Calling...'}
                </p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-[#202C33] text-xs font-semibold text-[#00A884]">
                  {isVideo ? 'WhatsApp Video Call' : 'WhatsApp Voice Call'}
                </span>
              </div>
            </div>

            {/* Outgoing Call Action: Cancel */}
            <div className="flex flex-col items-center gap-2 pb-4">
              <button
                type="button"
                onClick={cancelCall}
                className="w-16 h-16 rounded-full bg-[#EA0038] hover:bg-[#C90030] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                title="Cancel Call"
                aria-label="Cancel Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs text-[#8696A0]">Cancel</span>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 3: ACTIVE VIDEO CALL (Remote Video Main + Local Preview PiP)    */}
        {/* =================================================================== */}
        {callState === 'connected' && isVideo && (
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            {/* Primary Remote Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Fallback if remote video is not streaming yet */}
            {(!remoteStream || remoteStream.getVideoTracks().length === 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#111B21] to-[#0B141A] z-10">
                <Avatar
                  src={peerAvatar}
                  name={peerName}
                  size="2xl"
                  className="w-28 h-28 border-4 border-[#202C33] shadow-2xl mb-4"
                />
                <h4 className="text-xl font-bold text-[#E9EDEF]">{peerName}</h4>
                <p className="text-xs text-[#8696A0] mt-1">Connecting remote video stream...</p>
              </div>
            )}

            {/* Local Video Stream Preview (Picture-in-Picture window) */}
            <div className="absolute top-16 right-4 w-32 sm:w-44 h-48 sm:h-60 rounded-2xl overflow-hidden border-2 border-[#00A884]/60 shadow-2xl bg-[#111B21] z-20 group">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn('w-full h-full object-cover', !isVideoEnabled && 'hidden')}
              />

              {!isVideoEnabled && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#202C33] p-2 text-center">
                  <VideoOff className="w-6 h-6 text-[#8696A0] mb-2" />
                  <span className="text-[10px] text-[#8696A0] font-semibold">Camera Off</span>
                </div>
              )}

              <span className="absolute bottom-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">
                You
              </span>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 4: ACTIVE VOICE CALL (Audio Waveform, Avatar, Duration)         */}
        {/* =================================================================== */}
        {callState === 'connected' && !isVideo && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#111B21] to-[#0B141A]">
            {/* Center Avatar with Dynamic Emerald Waves */}
            <div className="relative mb-6">
              <span className="absolute -inset-4 rounded-full bg-[#00A884]/15 animate-pulse" />
              <Avatar
                src={peerAvatar}
                name={peerName}
                size="2xl"
                className="w-32 h-32 border-4 border-[#202C33] shadow-2xl relative z-10"
              />
            </div>

            <h3 className="text-2xl font-bold text-[#E9EDEF] tracking-tight">{peerName}</h3>
            <p className="text-xs text-[#00A884] font-semibold mt-1">● Call Connected</p>

            {/* Audio Waveform visualization bars */}
            <div className="flex items-center justify-center gap-1.5 my-8 h-8">
              {[18, 28, 14, 32, 22, 12, 30, 16, 26, 12].map((height, i) => (
                <span
                  key={i}
                  style={{
                    height: isMuted ? '6px' : `${height}px`,
                    animationDelay: `${i * 100}ms`,
                  }}
                  className={cn(
                    'w-1 rounded-full transition-all duration-200',
                    isMuted ? 'bg-[#374248]' : 'bg-[#00A884] animate-pulse'
                  )}
                />
              ))}
            </div>

            <span className="text-sm font-mono text-[#8696A0] font-semibold">
              {formatDuration(duration)}
            </span>
          </div>
        )}

        {/* =================================================================== */}
        {/* BOTTOM CONTROLS DOCK (When call is active/connected)                 */}
        {/* =================================================================== */}
        {callState === 'connected' && (
          <div className="h-24 px-6 flex items-center justify-center gap-4 sm:gap-6 bg-[#111B21]/95 border-t border-[#222D34] z-30 shrink-0">
            {/* Mic Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                isMuted
                  ? 'bg-[#EA0038] text-white shadow-md'
                  : 'bg-[#202C33] text-[#E9EDEF] hover:bg-[#2A3942]'
              )}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera Toggle (Video Call Mode) */}
            {isVideo && (
              <button
                type="button"
                onClick={toggleVideo}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                  !isVideoEnabled
                    ? 'bg-[#EA0038] text-white shadow-md'
                    : 'bg-[#202C33] text-[#E9EDEF] hover:bg-[#2A3942]'
                )}
                title={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
                aria-label={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
              >
                {!isVideoEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            )}

            {/* Screen Share (Video Call Mode) */}
            {isVideo && (
              <button
                type="button"
                onClick={toggleScreenShare}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                  isScreenSharing
                    ? 'bg-[#00A884] text-white shadow-md'
                    : 'bg-[#202C33] text-[#E9EDEF] hover:bg-[#2A3942]'
                )}
                title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
                aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
              >
                <Monitor className="w-5 h-5" />
              </button>
            )}

            {/* Speaker Mute Toggle */}
            <button
              type="button"
              onClick={toggleSpeaker}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                isSpeakerMuted
                  ? 'bg-[#EA0038] text-white shadow-md'
                  : 'bg-[#202C33] text-[#E9EDEF] hover:bg-[#2A3942]'
              )}
              title={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
              aria-label={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
            >
              {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-[#EA0038] hover:bg-[#C90030] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all ml-2"
              title="End call"
              aria-label="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppCallModal;
