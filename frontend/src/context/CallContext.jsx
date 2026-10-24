import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';
import { defaultRTCConfiguration, getMediaConstraints } from '../utils/webrtcConfig';
import useToast from '../hooks/useToast';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();

  // Call lifecycle state: 'idle' | 'outgoing' | 'incoming' | 'connected' | 'ended'
  const [callState, setCallState] = useState('idle');
  const [substate, setSubstate] = useState(''); // 'calling' | 'ringing' | 'connecting' | 'failed' | 'busy'
  const [callType, setCallType] = useState('voice'); // 'voice' | 'video'
  const [callId, setCallId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [peer, setPeer] = useState(null); // { id, name, avatar, email }

  // Media Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('new');

  // Media Streams & WebRTC refs
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const pcRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);

  // Audio Ringtones refs
  const audioContextRef = useRef(null);
  const ringtoneTimerRef = useRef(null);
  const durationTimerRef = useRef(null);

  // Hidden remote audio element to guarantee remote audio playback
  const remoteAudioRef = useRef(null);

  // =========================================================================
  // Web Audio API Ringtone & Call Tones Synthesizer (Zero external file dependencies)
  // =========================================================================
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
  }, []);

  const stopAllTones = useCallback(() => {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch {}
      audioContextRef.current = null;
    }
  }, []);

  // Outgoing European/US dual-frequency ring tone (440Hz + 480Hz)
  const playOutgoingRingtone = useCallback(() => {
    stopAllTones();
    const ctx = getAudioContext();
    if (!ctx) return;

    const playToneBurst = () => {
      try {
        if (!ctx || ctx.state === 'closed') return;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1.6);
        osc2.stop(ctx.currentTime + 1.6);
      } catch {}
    };

    playToneBurst();
    ringtoneTimerRef.current = setInterval(playToneBurst, 3200);
  }, [getAudioContext, stopAllTones]);

  // Incoming melody ringtone (vibrant chime pattern)
  const playIncomingRingtone = useCallback(() => {
    stopAllTones();
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const playChime = () => {
      try {
        if (!ctx || ctx.state === 'closed') return;
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);

          gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + idx * 0.15);
          osc.stop(ctx.currentTime + idx * 0.15 + 0.35);
        });
      } catch {}
    };

    playChime();
    ringtoneTimerRef.current = setInterval(playChime, 2400);
  }, [getAudioContext, stopAllTones]);

  // Busy/Unavailable fast beeps
  const playBusyTone = useCallback(() => {
    stopAllTones();
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      [0, 0.4, 0.8].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(480, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.25);
      });
    } catch {}
  }, [getAudioContext, stopAllTones]);

  // Hangup tone
  const playHangupTone = useCallback(() => {
    stopAllTones();
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }, [getAudioContext, stopAllTones]);

  // =========================================================================
  // Media Acquisition & Cleanup
  // =========================================================================
  const acquireMedia = useCallback(async (type) => {
    const constraints = getMediaConstraints(type);
    let stream = null;

    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } else {
        throw new Error('WebRTC getUserMedia is not supported in this browser environment');
      }
    } catch (mediaErr) {
      console.warn(`[CallContext] getUserMedia initial attempt failed (${mediaErr.name}):`, mediaErr.message);

      // If video failed (e.g. no camera attached), attempt audio only
      if (type === 'video') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          toast.warning('Camera was unavailable; connected with microphone only.');
        } catch (audioErr) {
          throw new Error('Microphone and Camera permission denied or device not found.');
        }
      } else {
        throw new Error('Microphone access denied or audio device not found.');
      }
    }

    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsMuted(false);
    setIsVideoEnabled(type === 'video' && stream.getVideoTracks().length > 0);

    return stream;
  }, [toast]);

  const cleanupMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      remoteStreamRef.current = null;
    }
    setRemoteStream(null);

    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    iceCandidateQueueRef.current = [];
    stopAllTones();
  }, [stopAllTones]);

  // Reset full state back to idle
  const resetCallState = useCallback(() => {
    cleanupMedia();
    setCallState('idle');
    setSubstate('');
    setCallId(null);
    setConversationId(null);
    setPeer(null);
    setDuration(0);
    setIsScreenSharing(false);
    setConnectionStatus('new');
  }, [cleanupMedia]);

  // =========================================================================
  // WebRTC PeerConnection Setup
  // =========================================================================
  const createPeerConnection = useCallback((targetCallId, targetPeerId) => {
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    const pc = new RTCPeerConnection(defaultRTCConfiguration);
    pcRef.current = pc;

    // Attach local media tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming remote media tracks
    pc.ontrack = (event) => {
      console.log('📡 [WebRTC] Remote media track received:', event.track.kind);
      const incomingStream = event.streams[0] || new MediaStream([event.track]);
      remoteStreamRef.current = incomingStream;
      setRemoteStream(incomingStream);

      // Connect to hidden remote audio tag for audio guarantee
      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== incomingStream) {
        remoteAudioRef.current.srcObject = incomingStream;
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    // Handle ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && targetPeerId) {
        socketService.emit('call:ice_candidate', {
          callId: targetCallId,
          targetUserId: targetPeerId,
          candidate: event.candidate,
        });
      }
    };

    // Connection state logging
    pc.onconnectionstatechange = () => {
      console.log('🔄 [WebRTC] Connection state:', pc.connectionState);
      setConnectionStatus(pc.connectionState);

      if (pc.connectionState === 'connected') {
        stopAllTones();
        setCallState('connected');
        setSubstate('connected');

        // Start call duration clock
        if (!durationTimerRef.current) {
          durationTimerRef.current = setInterval(() => {
            setDuration((prev) => prev + 1);
          }, 1000);
        }
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        console.warn('⚠️ [WebRTC] Connection failed or closed.');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 [WebRTC] ICE Connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        stopAllTones();
      }
    };

    return pc;
  }, [stopAllTones]);

  // Flush queued ICE candidates after setRemoteDescription
  const flushQueuedIceCandidates = useCallback(async () => {
    if (!pcRef.current || !pcRef.current.remoteDescription) return;
    const queue = iceCandidateQueueRef.current;
    iceCandidateQueueRef.current = [];

    for (const candidate of queue) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('❌ [WebRTC] Error adding queued ICE candidate:', err);
      }
    }
  }, []);

  // =========================================================================
  // Call Operations: Start, Accept, Reject, Cancel, End
  // =========================================================================

  // User A initiates call
  const startCall = useCallback(
    async ({ recipientId, recipientName, recipientAvatar, callType: requestedType = 'voice', conversationId: convId }) => {
      if (!recipientId) {
        toast.error('Recipient information missing');
        return;
      }

      const generatedCallId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const type = requestedType === 'video' ? 'video' : 'voice';

      setCallId(generatedCallId);
      setConversationId(convId || null);
      setCallType(type);
      setPeer({
        id: recipientId,
        _id: recipientId,
        name: recipientName || 'Contact',
        avatar: recipientAvatar || null,
      });

      setCallState('outgoing');
      setSubstate('calling');
      setDuration(0);

      // Play ringing audio
      playOutgoingRingtone();

      try {
        // 1. Acquire local microphone & camera
        await acquireMedia(type);

        // 2. Dispatch call:initiate through Socket.IO
        socketService.emit(
          'call:initiate',
          {
            callId: generatedCallId,
            recipientId,
            callType: type,
            conversationId: convId,
          },
          (response) => {
            if (response?.status === 'error') {
              playBusyTone();
              toast.error(response.message || 'Unable to place call');
              setTimeout(resetCallState, 2000);
            }
          }
        );
      } catch (err) {
        toast.error(err.message || 'Could not access media devices');
        resetCallState();
      }
    },
    [acquireMedia, playOutgoingRingtone, playBusyTone, resetCallState, toast]
  );

  // User B accepts incoming call
  const acceptCall = useCallback(async () => {
    if (!callId || !peer?.id) return;

    stopAllTones();
    setSubstate('connecting');

    try {
      // 1. Acquire User B local media
      await acquireMedia(callType);

      // 2. Create User B PeerConnection
      createPeerConnection(callId, peer.id);

      // 3. Emit call:accept to server
      socketService.emit('call:accept', { callId }, (ack) => {
        if (ack?.status === 'error') {
          toast.error(ack.message || 'Failed to accept call');
          resetCallState();
        }
      });
    } catch (err) {
      toast.error(err.message || 'Failed to access camera/microphone');
      rejectCall('device_error');
    }
  }, [callId, peer, callType, acquireMedia, createPeerConnection, stopAllTones, resetCallState, toast]);

  // User B rejects incoming call
  const rejectCall = useCallback(
    (reason = 'declined') => {
      if (!callId) return;
      socketService.emit('call:reject', { callId, reason });
      resetCallState();
    },
    [callId, resetCallState]
  );

  // User A cancels outgoing call
  const cancelCall = useCallback(() => {
    if (!callId) return;
    socketService.emit('call:cancel', { callId });
    resetCallState();
  }, [callId, resetCallState]);

  // Either party ends connected call
  const endCall = useCallback(() => {
    if (!callId) {
      resetCallState();
      return;
    }

    playHangupTone();
    socketService.emit('call:end', { callId, duration });
    toast.info(`Call ended (${duration}s)`);
    resetCallState();
  }, [callId, duration, playHangupTone, resetCallState, toast]);

  // =========================================================================
  // Media Toggle Controls
  // =========================================================================
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextMuted = !isMuted;
        audioTracks.forEach((track) => {
          track.enabled = !nextMuted;
        });
        setIsMuted(nextMuted);
      }
    }
  }, [isMuted]);

  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;

    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const nextVideo = !isVideoEnabled;
      videoTracks.forEach((track) => {
        track.enabled = nextVideo;
      });
      setIsVideoEnabled(nextVideo);
    } else if (!isVideoEnabled) {
      // If no video track exists yet, acquire camera track and add to peer connection
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (newVideoTrack) {
          localStreamRef.current.addTrack(newVideoTrack);
          if (pcRef.current) {
            pcRef.current.addTrack(newVideoTrack, localStreamRef.current);
          }
          setIsVideoEnabled(true);
        }
      } catch (err) {
        toast.warning('Unable to enable video camera');
      }
    }
  }, [isVideoEnabled, toast]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerMuted((prev) => {
      const next = !prev;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');

        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        } else {
          pcRef.current.addTrack(screenTrack, localStreamRef.current);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen sharing cancelled:', err);
      }
    } else {
      // Revert back to camera track
      const senders = pcRef.current.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];

      if (videoSender && cameraTrack) {
        await videoSender.replaceTrack(cameraTrack);
      }
      setIsScreenSharing(false);
    }
  }, [isScreenSharing]);

  // =========================================================================
  // Socket Signaling Event Listeners (Global App-Wide)
  // =========================================================================
  useEffect(() => {
    if (!user) return;

    // 1. Incoming Call Alert
    const unsubIncoming = socketService.on('call:incoming', (payload) => {
      console.log('📲 [Socket] call:incoming received:', payload);
      const { callId: incCallId, caller, callType: incType, conversationId: incConvId } = payload;

      setCallId(incCallId);
      setCallType(incType || 'voice');
      setConversationId(incConvId || null);
      setPeer(caller);
      setCallState('incoming');
      setSubstate('ringing');

      // Start ringing melody
      playIncomingRingtone();

      // Browser Notification if supported and permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`Incoming ${incType === 'video' ? 'Video' : 'Voice'} Call`, {
            body: `${caller.name} is calling you on PulseChat`,
            icon: caller.avatar || '/icon.png',
          });
        } catch {}
      }
    });

    // 2. Caller receives Ringing acknowledgement
    const unsubRinging = socketService.on('call:ringing', () => {
      setSubstate('ringing');
    });

    // 3. Caller receives Acceptance -> Create Offer
    const unsubAccepted = socketService.on('call:accepted', async (payload) => {
      console.log('📞 [Socket] call:accepted by recipient:', payload);
      stopAllTones();
      setSubstate('connecting');

      try {
        const pc = createPeerConnection(payload.callId, payload.recipient.id);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketService.emit('call:offer', {
          callId: payload.callId,
          targetUserId: payload.recipient.id,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error('❌ [WebRTC] Error creating SDP offer:', err);
        toast.error('Failed to establish peer connection.');
        resetCallState();
      }
    });

    // 4. Recipient receives SDP Offer -> Set Remote Desc & Create Answer
    const unsubOffer = socketService.on('call:offer', async (payload) => {
      console.log('📡 [Socket] call:offer received from caller:', payload.senderId);
      try {
        let pc = pcRef.current;
        if (!pc) {
          pc = createPeerConnection(payload.callId, payload.senderId);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushQueuedIceCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketService.emit('call:answer', {
          callId: payload.callId,
          targetUserId: payload.senderId,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error('❌ [WebRTC] Error handling SDP offer:', err);
      }
    });

    // 5. Caller receives SDP Answer -> Set Remote Desc
    const unsubAnswer = socketService.on('call:answer', async (payload) => {
      console.log('📡 [Socket] call:answer received from recipient');
      try {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          await flushQueuedIceCandidates();
        }
      } catch (err) {
        console.error('❌ [WebRTC] Error handling SDP answer:', err);
      }
    });

    // 6. ICE Candidate Exchange
    const unsubIce = socketService.on('call:ice_candidate', async (payload) => {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (err) {
          console.warn('❌ [WebRTC] Error adding ICE candidate:', err);
        }
      } else {
        iceCandidateQueueRef.current.push(payload.candidate);
      }
    });

    // 7. Call Rejected
    const unsubRejected = socketService.on('call:rejected', (payload) => {
      playBusyTone();
      toast.info(`Call declined (${payload.reason || 'user busy'})`);
      setTimeout(resetCallState, 2000);
    });

    // 8. Call Cancelled
    const unsubCancelled = socketService.on('call:cancelled', () => {
      toast.info('Call was cancelled by the caller');
      resetCallState();
    });

    // 9. Call Ended
    const unsubEnded = socketService.on('call:ended', (payload) => {
      playHangupTone();
      toast.info(`Call ended${payload.duration ? ` (${payload.duration}s)` : ''}`);
      resetCallState();
    });

    // 10. Recipient Unavailable / Offline
    const unsubUnavailable = socketService.on('call:unavailable', (payload) => {
      playBusyTone();
      toast.warning(payload.reason || 'Contact is offline');
      setTimeout(resetCallState, 2500);
    });

    // 11. Recipient Busy
    const unsubBusy = socketService.on('call:busy', (payload) => {
      playBusyTone();
      toast.warning(payload.reason || 'Contact is on another call');
      setTimeout(resetCallState, 2500);
    });

    // 12. Call Timeout
    const unsubTimeout = socketService.on('call:timeout', () => {
      playBusyTone();
      toast.info('No answer from contact');
      setTimeout(resetCallState, 2500);
    });

    return () => {
      unsubIncoming();
      unsubRinging();
      unsubAccepted();
      unsubOffer();
      unsubAnswer();
      unsubIce();
      unsubRejected();
      unsubCancelled();
      unsubEnded();
      unsubUnavailable();
      unsubBusy();
      unsubTimeout();
    };
  }, [
    user,
    createPeerConnection,
    flushQueuedIceCandidates,
    playIncomingRingtone,
    playBusyTone,
    playHangupTone,
    stopAllTones,
    resetCallState,
    toast,
  ]);

  const value = {
    callState,
    substate,
    callType,
    callId,
    conversationId,
    peer,
    isMuted,
    isVideoEnabled,
    isSpeakerMuted,
    isScreenSharing,
    duration,
    connectionStatus,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    toggleScreenShare,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      {/* Hidden remote audio tag for guaranteed real WebRTC audio playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export default CallContext;
