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
  SwitchCamera,
  LayoutGrid,
  RefreshCw,
  ArrowLeftRight,
  WifiOff,
  Move,
  Scan,
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
 * - Incoming call screen (Ringing with Accept & Decline)
 * - Connected Audio call (Waveform, avatar, timer, controls dock)
 * - Connected Video call:
 *    * Draggable PiP local/remote preview window (mouse & touch support)
 *    * Stream swap between local and remote
 *    * Split responsive Grid layout vs Spotlight layout
 *    * Camera flip (user / environment)
 *    * Low-bandwidth fallback badge & audio priority
 *    * Video Fit / Fill aspect ratio toggle
 *    * Screen sharing and in-call controls dock
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
    facingMode,
    isLowBandwidth,
    bandwidthQuality,
    videoFitMode,
    layoutMode,
    isLocalSwapped,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    switchToVideo,
    flipCamera,
    toggleVideoFit,
    toggleLayoutMode,
    toggleSwapVideo,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    toggleScreenShare,
  } = useCall();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pipPos, setPipPos] = useState({ x: 20, y: 70 }); // offset from right & top in px
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, pipX: 0, pipY: 0 });

  const modalContainerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, callState, layoutMode, isLocalSwapped]);

  // Attach remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, callState, layoutMode, isLocalSwapped]);

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

  // Draggable PiP handlers for mouse & touch
  const handleDragStart = (e) => {
    isDraggingRef.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      pipX: pipPos.x,
      pipY: pipPos.y,
    };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaX = dragStartRef.current.mouseX - clientX;
      const deltaY = clientY - dragStartRef.current.mouseY;

      setPipPos({
        x: Math.max(8, Math.min(window.innerWidth - 180, dragStartRef.current.pipX + deltaX)),
        y: Math.max(64, Math.min(window.innerHeight - 260, dragStartRef.current.pipY + deltaY)),
      });
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

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
            ? 'max-w-4xl h-[85vh] min-h-[540px]'
            : 'max-w-md h-[580px]'
        )}
      >
        {/* =================================================================== */}
        {/* TOP HEADER BAR                                                      */}
        {/* =================================================================== */}
        <div className="absolute top-0 inset-x-0 h-16 px-4 flex items-center justify-between z-40 bg-gradient-to-b from-[#111B21]/95 via-[#111B21]/70 to-transparent">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8696A0] bg-[#111B21]/60 px-2.5 py-1 rounded-full backdrop-blur-sm border border-[#2A3942]/40">
              <Lock className="w-3.5 h-3.5 text-[#00A884]" />
              <span className="hidden sm:inline">End-to-end encrypted</span>
            </div>

            {/* Low-bandwidth alert pill */}
            {isLowBandwidth && callState === 'connected' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Low Bandwidth • Prioritizing Audio</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {substate === 'reconnecting' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse font-semibold">
                Reconnecting...
              </span>
            )}

            {callState === 'connected' && substate !== 'reconnecting' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#202C33]/90 text-[#00A884] font-mono border border-[#2A3942]/60">
                {connectionStatus === 'connected' ? formatDuration(duration) : 'Connecting...'}
              </span>
            )}

            {/* Video-specific header quick actions */}
            {isVideo && callState === 'connected' && (
              <>
                {/* Fit / Fill Toggle */}
                <button
                  type="button"
                  onClick={toggleVideoFit}
                  className="p-2 rounded-xl text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33] transition-colors"
                  title={videoFitMode === 'cover' ? 'Fit to Screen' : 'Fill Screen'}
                >
                  <Scan className="w-4 h-4" />
                </button>

                {/* Grid / Spotlight View Toggle */}
                <button
                  type="button"
                  onClick={toggleLayoutMode}
                  className={cn(
                    'p-2 rounded-xl transition-colors',
                    layoutMode === 'grid'
                      ? 'bg-[#00A884]/20 text-[#00A884]'
                      : 'text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33]'
                  )}
                  title={layoutMode === 'spotlight' ? 'Switch to Grid Layout' : 'Switch to Spotlight'}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>

                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className="p-2 rounded-xl text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33] transition-colors"
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* VIEW 1: INCOMING CALL SCREEN                                        */}
        {/* =================================================================== */}
        {callState === 'incoming' && (
          <div className="flex-1 flex flex-col items-center justify-between p-8 pt-20 text-center animate-fade-in">
            <div className="space-y-4 flex flex-col items-center">
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
          <div className="flex-1 flex flex-col items-center justify-between p-8 pt-20 text-center animate-fade-in">
            <div className="space-y-4 flex flex-col items-center">
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
        {/* VIEW 3: ACTIVE VIDEO CALL                                           */}
        {/* =================================================================== */}
        {callState === 'connected' && isVideo && (
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            {/* ------------------------------------------------------------- */}
            {/* SUB-VIEW 3A: GRID LAYOUT (Responsive side-by-side or stacked) */}
            {/* ------------------------------------------------------------- */}
            {layoutMode === 'grid' ? (
              <div className="w-full h-full p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Tile 1: Remote Participant */}
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#111B21] border-2 border-[#202C33] flex items-center justify-center group ring-2 ring-transparent">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={cn(
                      'w-full h-full',
                      videoFitMode === 'contain' ? 'object-contain' : 'object-cover'
                    )}
                  />
                  {(!remoteStream || remoteStream.getVideoTracks().length === 0) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111B21] z-10">
                      <Avatar src={peerAvatar} name={peerName} size="xl" className="w-20 h-20 mb-2 shadow-xl" />
                      <span className="text-sm font-semibold text-[#E9EDEF]">{peerName}</span>
                      <span className="text-xs text-[#8696A0]">Camera off</span>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-3 text-xs font-semibold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
                    {peerName}
                  </span>
                </div>

                {/* Tile 2: Local User */}
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#111B21] border-2 border-[#00A884]/40 flex items-center justify-center group">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      'w-full h-full',
                      videoFitMode === 'contain' ? 'object-contain' : 'object-cover',
                      !isVideoEnabled && 'hidden'
                    )}
                  />
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111B21] z-10">
                      <VideoOff className="w-10 h-10 text-[#8696A0] mb-2" />
                      <span className="text-xs text-[#8696A0] font-semibold">Camera is off</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 text-white text-xs font-semibold backdrop-blur-sm">
                    <span>You</span>
                    {isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
                  </div>
                </div>
              </div>
            ) : (
              /* ------------------------------------------------------------- */
              /* SUB-VIEW 3B: SPOTLIGHT VIEW (Main Stream + Draggable PiP)     */
              /* ------------------------------------------------------------- */
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Main Full-Screen Stream */}
                {isLocalSwapped ? (
                  /* Main: Local User */
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      'w-full h-full',
                      videoFitMode === 'contain' ? 'object-contain' : 'object-cover',
                      !isVideoEnabled && 'hidden'
                    )}
                  />
                ) : (
                  /* Main: Remote Peer */
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={cn(
                      'w-full h-full',
                      videoFitMode === 'contain' ? 'object-contain' : 'object-cover'
                    )}
                  />
                )}

                {/* Main View Fallback when remote video stream isn't rendering */}
                {!isLocalSwapped && (!remoteStream || remoteStream.getVideoTracks().length === 0) && (
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

                {/* Main View Fallback when local video is main and turned off */}
                {isLocalSwapped && !isVideoEnabled && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111B21] z-10">
                    <VideoOff className="w-14 h-14 text-[#8696A0] mb-3" />
                    <h4 className="text-lg font-bold text-[#E9EDEF]">Your camera is off</h4>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* DRAGGABLE PICTURE-IN-PICTURE (PiP) PREVIEW WINDOW             */}
                {/* ------------------------------------------------------------- */}
                <div
                  style={{
                    position: 'absolute',
                    top: `${pipPos.y}px`,
                    right: `${pipPos.x}px`,
                  }}
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  className="w-36 sm:w-48 h-52 sm:h-64 rounded-2xl overflow-hidden border-2 border-[#00A884]/70 shadow-2xl bg-[#111B21] z-30 cursor-grab active:cursor-grabbing group transition-shadow select-none hover:shadow-[#00A884]/20 hover:shadow-xl"
                  title="Drag to reposition window"
                >
                  {/* Swap Streams Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSwapVideo();
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white z-40 transition-colors opacity-80 group-hover:opacity-100"
                    title="Swap preview & main video"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Drag Handle Indicator */}
                  <div className="absolute top-2 left-2 p-1 rounded-md bg-black/50 text-[#8696A0] z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Move className="w-3 h-3" />
                  </div>

                  {/* PiP Stream Video */}
                  {isLocalSwapped ? (
                    /* PiP: Remote */
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* PiP: Local */
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={cn('w-full h-full object-cover', !isVideoEnabled && 'hidden')}
                    />
                  )}

                  {/* PiP Camera Off Fallback */}
                  {!isLocalSwapped && !isVideoEnabled && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#202C33] p-2 text-center">
                      <VideoOff className="w-6 h-6 text-[#8696A0] mb-2" />
                      <span className="text-[10px] text-[#8696A0] font-semibold">Camera Off</span>
                    </div>
                  )}

                  {/* PiP Label Badge */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-sm z-40">
                    <span>{isLocalSwapped ? peerName : 'You'}</span>
                    {!isLocalSwapped && isMuted && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 4: ACTIVE VOICE CALL (Audio Waveform, Avatar, Duration)         */}
        {/* =================================================================== */}
        {callState === 'connected' && !isVideo && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#111B21] to-[#0B141A]">
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
          <div className="h-24 px-4 sm:px-6 flex items-center justify-center gap-3 sm:gap-5 bg-[#111B21]/95 border-t border-[#222D34] z-40 shrink-0">
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

            {/* Flip Camera (Front vs Back) */}
            {isVideo && (
              <button
                type="button"
                onClick={flipCamera}
                className="w-12 h-12 rounded-full bg-[#202C33] text-[#E9EDEF] hover:bg-[#2A3942] hover:text-[#00A884] flex items-center justify-center transition-all"
                title={`Flip Camera (${facingMode === 'user' ? 'Front' : 'Back'})`}
                aria-label="Flip Camera"
              >
                <SwitchCamera className="w-5 h-5" />
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

            {/* Switch to Video Call (Voice Call Mode) */}
            {!isVideo && (
              <button
                type="button"
                onClick={switchToVideo}
                className="w-12 h-12 rounded-full bg-[#202C33] text-[#E9EDEF] hover:bg-[#2A3942] hover:text-[#00A884] flex items-center justify-center transition-all shadow-md"
                title="Switch to Video Call"
                aria-label="Switch to Video Call"
              >
                <Video className="w-5 h-5" />
              </button>
            )}

            {/* End Call Button */}
            <button
              type="button"
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-[#EA0038] hover:bg-[#C90030] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all ml-1 sm:ml-2"
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
