import presenceManager from './presenceManager.js';

// In-memory active calls registry
// callId -> { callId, callerId, recipientId, callType, conversationId, status, timeoutId, createdAt }
const activeCalls = new Map();

// userId -> callId (ensures 1 active call per user)
const userActiveCall = new Map();

/**
 * Clean up a call completely from in-memory tracking.
 * @param {string} callId
 */
export const cleanupCall = (callId) => {
  if (!callId) return null;
  const call = activeCalls.get(callId);
  if (!call) return null;

  if (call.timeoutId) {
    clearTimeout(call.timeoutId);
  }

  activeCalls.delete(callId);
  userActiveCall.delete(call.callerId);
  userActiveCall.delete(call.recipientId);

  return call;
};

/**
 * Get the active call for a user if any.
 * @param {string} userId
 */
export const getUserCall = (userId) => {
  const callId = userActiveCall.get(userId);
  return callId ? activeCalls.get(callId) : null;
};

/**
 * Register WhatsApp-style WebRTC Call Signaling Handlers.
 *
 * Supported Events:
 * - 'call:initiate' -> notifies recipient with 'call:incoming', caller with 'call:ringing'
 * - 'call:accept'   -> clears timeout, notifies caller with 'call:accepted'
 * - 'call:reject'   -> notifies caller with 'call:rejected'
 * - 'call:cancel'   -> caller cancelled; notifies recipient with 'call:cancelled'
 * - 'call:end'      -> either party ends; notifies peer with 'call:ended'
 * - 'call:offer'    -> relays WebRTC SDP offer to recipient
 * - 'call:answer'   -> relays WebRTC SDP answer to caller
 * - 'call:ice_candidate' -> relays ICE candidates between peers
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export const registerCallHandlers = (io, socket) => {
  const currentUserId = socket.userId;

  // 1. Initiate Outgoing Call
  socket.on('call:initiate', (payload, callback) => {
    try {
      const { callId, recipientId, callType = 'voice', conversationId } = payload || {};

      if (!recipientId || !callId) {
        const err = { status: 'error', message: 'callId and recipientId are required' };
        socket.emit('call:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      if (recipientId.toString() === currentUserId.toString()) {
        const err = { status: 'error', message: 'Cannot call yourself' };
        socket.emit('call:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      // Check if caller is already in a call
      if (userActiveCall.has(currentUserId)) {
        const err = { status: 'error', message: 'You are already in an active call' };
        socket.emit('call:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      // Check recipient online presence
      const isOnline = presenceManager.isUserOnline(recipientId);
      if (!isOnline) {
        const res = {
          callId,
          recipientId,
          status: 'unavailable',
          reason: 'Recipient is currently offline',
        };
        socket.emit('call:unavailable', res);
        if (typeof callback === 'function') callback(res);
        return;
      }

      // Check if recipient is busy on another call
      if (userActiveCall.has(recipientId.toString())) {
        const res = {
          callId,
          recipientId,
          status: 'busy',
          reason: 'Recipient is currently on another call',
        };
        socket.emit('call:busy', res);
        if (typeof callback === 'function') callback(res);
        return;
      }

      // 35-second ringing timeout
      const timeoutId = setTimeout(() => {
        const expiredCall = activeCalls.get(callId);
        if (expiredCall && expiredCall.status === 'ringing') {
          cleanupCall(callId);

          // Notify caller of timeout
          io.to(`user:${currentUserId}`).to(currentUserId).emit('call:timeout', {
            callId,
            recipientId,
            reason: 'Call timed out (no answer)',
          });

          // Cancel ringing on recipient's end
          io.to(`user:${recipientId}`).to(recipientId).emit('call:cancelled', {
            callId,
            reason: 'Call timed out',
          });
        }
      }, 35000);

      // Register active call record
      const callRecord = {
        callId,
        callerId: currentUserId,
        recipientId: recipientId.toString(),
        callType: callType === 'video' ? 'video' : 'voice',
        conversationId,
        status: 'ringing',
        timeoutId,
        createdAt: new Date(),
      };

      activeCalls.set(callId, callRecord);
      userActiveCall.set(currentUserId, callId);
      userActiveCall.set(recipientId.toString(), callId);

      // Notify caller that call has started ringing
      socket.emit('call:ringing', {
        callId,
        recipientId,
        callType: callRecord.callType,
      });

      // Dispatch incoming call alert to recipient's private rooms
      io.to(`user:${recipientId}`).to(recipientId).emit('call:incoming', {
        callId,
        callType: callRecord.callType,
        conversationId,
        caller: {
          id: currentUserId,
          _id: currentUserId,
          name: socket.user?.name || socket.user?.username || 'Caller',
          avatar: socket.user?.avatar || null,
          email: socket.user?.email || null,
        },
        timestamp: new Date().toISOString(),
      });

      console.log(
        `📞 [Call] Initiated: callId=${callId}, type=${callType}, from=${currentUserId} (${socket.user?.name}) to=${recipientId}`
      );

      if (typeof callback === 'function') {
        callback({ status: 'success', callId, callType });
      }
    } catch (err) {
      console.error('❌ [Call] Error initiating call:', err);
      socket.emit('call:error', { status: 'error', message: err.message });
    }
  });

  // 2. Accept Incoming Call
  socket.on('call:accept', (payload, callback) => {
    try {
      const { callId } = payload || {};
      const call = activeCalls.get(callId);

      if (!call) {
        const err = { status: 'error', message: 'Call does not exist or has already ended' };
        socket.emit('call:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      if (call.recipientId !== currentUserId) {
        const err = { status: 'error', message: 'You are not the recipient of this call' };
        socket.emit('call:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      // Clear ringing timeout
      if (call.timeoutId) {
        clearTimeout(call.timeoutId);
        call.timeoutId = null;
      }

      call.status = 'connected';
      call.connectedAt = new Date();

      // Notify caller that recipient accepted
      io.to(`user:${call.callerId}`).to(call.callerId).emit('call:accepted', {
        callId,
        recipient: {
          id: currentUserId,
          _id: currentUserId,
          name: socket.user?.name || socket.user?.username || 'Recipient',
          avatar: socket.user?.avatar || null,
        },
      });

      console.log(`✅ [Call] Accepted: callId=${callId} by ${currentUserId}`);
      if (typeof callback === 'function') callback({ status: 'success', callId });
    } catch (err) {
      console.error('❌ [Call] Error accepting call:', err);
    }
  });

  // 3. Reject Incoming Call
  socket.on('call:reject', (payload, callback) => {
    try {
      const { callId, reason = 'declined' } = payload || {};
      const call = cleanupCall(callId);

      if (call) {
        io.to(`user:${call.callerId}`).to(call.callerId).emit('call:rejected', {
          callId,
          reason,
        });
        console.log(`❌ [Call] Rejected: callId=${callId} by ${currentUserId} (reason: ${reason})`);
      }

      if (typeof callback === 'function') callback({ status: 'success' });
    } catch (err) {
      console.error('❌ [Call] Error rejecting call:', err);
    }
  });

  // 4. Cancel Outgoing Call (Caller hangs up while ringing)
  socket.on('call:cancel', (payload, callback) => {
    try {
      const { callId } = payload || {};
      const call = cleanupCall(callId);

      if (call) {
        io.to(`user:${call.recipientId}`).to(call.recipientId).emit('call:cancelled', {
          callId,
          reason: 'Caller cancelled the call',
        });
        console.log(`🚫 [Call] Cancelled: callId=${callId} by caller ${currentUserId}`);
      }

      if (typeof callback === 'function') callback({ status: 'success' });
    } catch (err) {
      console.error('❌ [Call] Error cancelling call:', err);
    }
  });

  // 5. End Connected Call
  socket.on('call:end', (payload, callback) => {
    try {
      const { callId, duration = 0 } = payload || {};
      const call = cleanupCall(callId);

      if (call) {
        const peerId = currentUserId === call.callerId ? call.recipientId : call.callerId;
        io.to(`user:${peerId}`).to(peerId).emit('call:ended', {
          callId,
          duration,
          endedBy: currentUserId,
        });
        console.log(`📴 [Call] Ended: callId=${callId} by ${currentUserId} (duration: ${duration}s)`);
      }

      if (typeof callback === 'function') callback({ status: 'success' });
    } catch (err) {
      console.error('❌ [Call] Error ending call:', err);
    }
  });

  // 6. WebRTC Signaling: SDP Offer
  socket.on('call:offer', (payload) => {
    try {
      const { callId, targetUserId, sdp } = payload || {};
      const call = activeCalls.get(callId);

      if (!call || (call.callerId !== currentUserId && call.recipientId !== currentUserId)) {
        return socket.emit('call:error', { message: 'Invalid or inactive call for SDP offer' });
      }

      const dest = targetUserId || (currentUserId === call.callerId ? call.recipientId : call.callerId);
      io.to(`user:${dest}`).to(dest).emit('call:offer', {
        callId,
        senderId: currentUserId,
        sdp,
      });
    } catch (err) {
      console.error('❌ [Call] Error relaying SDP offer:', err);
    }
  });

  // 7. WebRTC Signaling: SDP Answer
  socket.on('call:answer', (payload) => {
    try {
      const { callId, targetUserId, sdp } = payload || {};
      const call = activeCalls.get(callId);

      if (!call || (call.callerId !== currentUserId && call.recipientId !== currentUserId)) {
        return socket.emit('call:error', { message: 'Invalid or inactive call for SDP answer' });
      }

      const dest = targetUserId || (currentUserId === call.callerId ? call.recipientId : call.callerId);
      io.to(`user:${dest}`).to(dest).emit('call:answer', {
        callId,
        senderId: currentUserId,
        sdp,
      });
    } catch (err) {
      console.error('❌ [Call] Error relaying SDP answer:', err);
    }
  });

  // 8. WebRTC Signaling: ICE Candidate
  socket.on('call:ice_candidate', (payload) => {
    try {
      const { callId, targetUserId, candidate } = payload || {};
      const call = activeCalls.get(callId);

      if (!call || !candidate) return;

      const dest = targetUserId || (currentUserId === call.callerId ? call.recipientId : call.callerId);
      io.to(`user:${dest}`).to(dest).emit('call:ice_candidate', {
        callId,
        senderId: currentUserId,
        candidate,
      });
    } catch (err) {
      console.error('❌ [Call] Error relaying ICE candidate:', err);
    }
  });

  // 9. Handle Disconnect - Clean up any active call if user disconnects unexpectedly
  socket.on('disconnect', () => {
    const activeCallId = userActiveCall.get(currentUserId);
    if (activeCallId) {
      const remainingSockets = presenceManager.getUserSocketCount(currentUserId);
      // Only end call if the user has no remaining sockets (completely disconnected)
      if (remainingSockets <= 1) {
        const call = cleanupCall(activeCallId);
        if (call) {
          const peerId = currentUserId === call.callerId ? call.recipientId : call.callerId;
          io.to(`user:${peerId}`).to(peerId).emit('call:ended', {
            callId: activeCallId,
            reason: 'Remote user disconnected unexpectedly',
            endedBy: currentUserId,
          });
          console.log(`⚠️ [Call] Call ${activeCallId} ended due to unexpected disconnect of ${currentUserId}`);
        }
      }
    }
  });
};

export default registerCallHandlers;
