/**
 * WebRTC Configuration & ICE Discovery Settings.
 * Includes Google STUN, Mozilla STUN, Cloudflare STUN, and environment-configured TURN
 * for reliable NAT traversal and firewall bypass.
 */

export const getIceServers = () => {
  const servers = [
    // Primary Google STUN cluster
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },

    // Cloudflare & Mozilla STUN fallbacks
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' },
  ];

  // Optional TURN relay server credentials (configured via .env for production networks)
  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrl) {
    const turnConfig = { urls: turnUrl };
    if (turnUsername) turnConfig.username = turnUsername;
    if (turnCredential) turnConfig.credential = turnCredential;
    servers.push(turnConfig);
  }

  return servers;
};

export const defaultRTCConfiguration = {
  iceServers: getIceServers(),
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceTransportPolicy: 'all',
};

export const getMediaConstraints = (callType = 'voice') => {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video:
      callType === 'video'
        ? {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: 'user',
          }
        : false,
  };
};

export default defaultRTCConfiguration;
