import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Phone,
  Video,
  Delete,
  X,
  User,
  Shield,
  Search,
  Sparkles,
  Building,
  Hash,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import useToast from '../../hooks/useToast';
import { cn } from '../../utils/cn';

/**
 * Standard DTMF frequencies for authentic touch-tone audio feedback.
 */
const DTMF_FREQUENCIES = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

const KEYPAD_BUTTONS = [
  { digit: '1', subtext: '' },
  { digit: '2', subtext: 'ABC' },
  { digit: '3', subtext: 'DEF' },
  { digit: '4', subtext: 'GHI' },
  { digit: '5', subtext: 'JKL' },
  { digit: '6', subtext: 'MNO' },
  { digit: '7', subtext: 'PQRS' },
  { digit: '8', subtext: 'TUV' },
  { digit: '9', subtext: 'WXYZ' },
  { digit: '*', subtext: '' },
  { digit: '0', subtext: '+' },
  { digit: '#', subtext: '' },
];

const CAMPUS_SPEED_DIALS = [
  { label: 'Campus IT', number: '4357', dept: 'IT Services' },
  { label: 'Registrar', number: '2201', dept: 'Student Affairs' },
  { label: 'Helpdesk', number: '1004', dept: 'Campus Support' },
  { label: 'Security', number: '9110', dept: 'Campus Safety' },
];

/**
 * Synthesize touch-tone DTMF sounds using Web Audio API.
 */
function playDTMF(digit) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const freqs = DTMF_FREQUENCIES[digit];
    if (!freqs) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freqs[0], ctx.currentTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freqs[1], ctx.currentTime);

    gainNode.gain.setValueAtTime(0.09, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.14);
    osc2.stop(ctx.currentTime + 0.14);
  } catch {
    // Graceful fallback if AudioContext is not permitted before user interaction
  }
}

/**
 * WhatsApp Desktop Style Dialpad Modal.
 * Enables dialing phone numbers, extensions, DTMF audio touch-tones,
 * live directory contact auto-matching, and 1-tap voice / video calls.
 */
export const WhatsAppDialpadModal = ({
  isOpen,
  onClose,
  onStartCall,
  contacts = [],
}) => {
  const [dialedNumber, setDialedNumber] = useState('');
  const [activeTab, setActiveTab] = useState('keypad'); // 'keypad' | 'directory'
  const toast = useToast();
  const inputRef = useRef(null);
  const zeroPressTimerRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setDialedNumber('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Clean phone string for comparison
  const cleanDigits = (str) => (str || '').replace(/\D/g, '');

  // Live filter contacts matching dialed digits or name
  const matchedContacts = contacts.filter((c) => {
    if (!dialedNumber.trim()) return false;
    const searchClean = cleanDigits(dialedNumber);
    const phoneClean = cleanDigits(c.phone);

    // Direct phone number matching
    if (searchClean && phoneClean.includes(searchClean)) return true;

    // Direct name / handle match (case-insensitive)
    const nameMatch = c.name?.toLowerCase().includes(dialedNumber.toLowerCase());
    const handleMatch = c.handle?.toLowerCase().includes(dialedNumber.toLowerCase());
    return nameMatch || handleMatch;
  });

  // Handle digit click
  const handleDigitClick = (digit) => {
    playDTMF(digit);
    setDialedNumber((prev) => prev + digit);
  };

  // Handle long press on 0 to insert '+'
  const handleZeroTouchStart = () => {
    zeroPressTimerRef.current = setTimeout(() => {
      setDialedNumber((prev) => {
        // Replace last trailing 0 with + or append +
        return prev.endsWith('0') ? prev.slice(0, -1) + '+' : prev + '+';
      });
      playDTMF('0');
      toast.info('Added international prefix (+)');
    }, 600);
  };

  const handleZeroTouchEnd = () => {
    if (zeroPressTimerRef.current) {
      clearTimeout(zeroPressTimerRef.current);
      zeroPressTimerRef.current = null;
    }
  };

  // Backspace / Clear
  const handleBackspace = () => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDialedNumber('');
    inputRef.current?.focus();
  };

  // Initiate call to dialed number or selected contact
  const handleInitiateCall = (type = 'voice', contactOverride = null) => {
    const contact = contactOverride || matchedContacts[0];
    const numberToCall = dialedNumber.trim();

    if (!numberToCall && !contact) {
      toast.warning('Please enter a phone number or select a contact.');
      return;
    }

    if (contact) {
      onStartCall?.(
        {
          recipientId: contact.id || contact._id,
          recipientName: contact.name,
          recipientAvatar: contact.avatar,
          phone: contact.phone,
        },
        type
      );
    } else {
      // Dial custom phone number / campus extension
      onStartCall?.(
        {
          recipientId: `dial_${cleanDigits(numberToCall) || Date.now()}`,
          recipientName: numberToCall,
          recipientAvatar: null,
          phone: numberToCall,
        },
        type
      );
    }

    onClose();
  };

  // Keyboard navigation & typing
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInitiateCall('voice');
      } else if (/^[0-9*#+]$/.test(e.key)) {
        playDTMF(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dialedNumber, matchedContacts]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialpad-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
    >
      <div className="relative w-full max-w-sm bg-[#111B21] border border-[#222D34] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#E9EDEF]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#202C33] border-b border-[#2A3942]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00A884]/20 border border-[#00A884]/30 flex items-center justify-center text-[#00A884]">
              <Phone className="w-4 h-4 fill-current/30" />
            </div>
            <div>
              <h2 id="dialpad-title" className="text-sm font-bold text-[#E9EDEF]">
                Dialpad
              </h2>
              <p className="text-[11px] text-[#8696A0]">Enter campus number or extension</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942] transition-colors"
              aria-label="Close dialpad"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch (Keypad / Speed Dial) */}
        <div className="flex border-b border-[#222D34] bg-[#111B21]">
          <button
            type="button"
            onClick={() => setActiveTab('keypad')}
            className={cn(
              'flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors',
              activeTab === 'keypad'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-[#E9EDEF]'
            )}
          >
            Keypad
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={cn(
              'flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors',
              activeTab === 'directory'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-[#E9EDEF]'
            )}
          >
            Campus Directory ({contacts.length})
          </button>
        </div>

        {/* Display Screen */}
        <div className="px-5 pt-4 pb-2 flex flex-col items-center">
          <div className="relative w-full flex items-center justify-center min-h-[56px] border-b border-[#222D34] pb-2">
            <input
              ref={inputRef}
              type="text"
              value={dialedNumber}
              onChange={(e) => setDialedNumber(e.target.value)}
              placeholder="Enter number or name..."
              className="w-full bg-transparent text-center text-2xl font-mono font-bold tracking-widest text-[#E9EDEF] placeholder-[#8696A0]/50 focus:outline-none"
            />
            {dialedNumber && (
              <button
                type="button"
                onClick={handleBackspace}
                onDoubleClick={handleClear}
                className="absolute right-0 p-1.5 text-[#8696A0] hover:text-[#E9EDEF] active:text-rose-400 transition-colors"
                title="Backspace (double click to clear all)"
              >
                <Delete className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Live Contact Match Banner */}
          {matchedContacts.length > 0 && (
            <div className="w-full mt-2 p-2 bg-[#202C33] rounded-xl border border-[#00A884]/40 flex items-center justify-between animate-fade-in">
              <div
                onClick={() => handleInitiateCall('voice', matchedContacts[0])}
                className="flex items-center gap-2.5 cursor-pointer overflow-hidden flex-1"
              >
                <Avatar
                  src={matchedContacts[0].avatar}
                  name={matchedContacts[0].name}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#E9EDEF] truncate">
                    {matchedContacts[0].name}
                  </p>
                  <p className="text-[11px] text-[#00A884] truncate">
                    {matchedContacts[0].phone || matchedContacts[0].department}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => handleInitiateCall('voice', matchedContacts[0])}
                  className="p-1.5 rounded-full bg-[#00A884]/20 text-[#00A884] hover:bg-[#00A884] hover:text-white transition-colors"
                  title="Voice Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInitiateCall('video', matchedContacts[0])}
                  className="p-1.5 rounded-full bg-[#2A3942] text-[#8696A0] hover:text-white transition-colors"
                  title="Video Call"
                >
                  <Video className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Content: Keypad or Directory */}
        {activeTab === 'keypad' ? (
          <div className="p-4 flex flex-col items-center">
            {/* Speed Dial Chips */}
            <div className="w-full flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 no-scrollbar">
              {CAMPUS_SPEED_DIALS.map((speed) => (
                <button
                  key={speed.number}
                  type="button"
                  onClick={() => {
                    playDTMF('1');
                    setDialedNumber(speed.number);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#202C33] hover:bg-[#2A3942] border border-[#2A3942] text-[11px] text-[#8696A0] hover:text-[#E9EDEF] shrink-0 transition-colors"
                >
                  {speed.label} ({speed.number})
                </button>
              ))}
            </div>

            {/* 3x4 Touchpad Grid */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {KEYPAD_BUTTONS.map(({ digit, subtext }) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitClick(digit)}
                  onMouseDown={digit === '0' ? handleZeroTouchStart : undefined}
                  onMouseUp={digit === '0' ? handleZeroTouchEnd : undefined}
                  onTouchStart={digit === '0' ? handleZeroTouchStart : undefined}
                  onTouchEnd={digit === '0' ? handleZeroTouchEnd : undefined}
                  className="h-14 rounded-2xl bg-[#202C33] hover:bg-[#2A3942] active:scale-95 active:bg-[#00A884]/20 transition-all flex flex-col items-center justify-center border border-[#222D34] shadow-sm group select-none"
                >
                  <span className="text-xl font-bold text-[#E9EDEF] group-hover:text-white leading-tight">
                    {digit}
                  </span>
                  {subtext && (
                    <span className="text-[9px] font-semibold text-[#8696A0] tracking-widest leading-none mt-0.5">
                      {subtext}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Call Action Buttons */}
            <div className="flex items-center justify-center gap-4 mt-5 w-full">
              <button
                type="button"
                onClick={() => handleInitiateCall('voice')}
                className="flex-1 max-w-[150px] py-3 rounded-full bg-[#00A884] hover:bg-[#008f6f] active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00A884]/20 transition-all"
              >
                <Phone className="w-4 h-4 fill-current" />
                <span>Voice Call</span>
              </button>

              <button
                type="button"
                onClick={() => handleInitiateCall('video')}
                className="py-3 px-4 rounded-full bg-[#202C33] hover:bg-[#2A3942] border border-[#2A3942] text-[#E9EDEF] hover:text-[#00A884] active:scale-95 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
                <span>Video</span>
              </button>
            </div>
          </div>
        ) : (
          /* Directory List Tab */
          <div className="max-h-[340px] overflow-y-auto px-4 py-2 divide-y divide-[#222D34]">
            {contacts.length === 0 ? (
              <p className="text-center text-xs text-[#8696A0] py-8">
                No campus contacts found.
              </p>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id || contact._id}
                  className="py-2.5 flex items-center justify-between hover:bg-[#202C33]/60 px-2 rounded-lg cursor-pointer transition-colors"
                  onClick={() => {
                    setDialedNumber(contact.phone || contact.name);
                    setActiveTab('keypad');
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={contact.avatar} name={contact.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#E9EDEF] truncate">
                        {contact.name}
                      </p>
                      <p className="text-[11px] text-[#8696A0] truncate">
                        {contact.phone || contact.department || 'Campus Member'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInitiateCall('voice', contact);
                      }}
                      className="p-1.5 rounded-full text-[#8696A0] hover:text-[#00A884] hover:bg-[#2A3942] transition-colors"
                      title={`Call ${contact.name}`}
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInitiateCall('video', contact);
                      }}
                      className="p-1.5 rounded-full text-[#8696A0] hover:text-[#00A884] hover:bg-[#2A3942] transition-colors"
                      title={`Video call ${contact.name}`}
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* E2EE Footer */}
        <div className="px-4 py-2 bg-[#202C33]/50 border-t border-[#222D34] flex items-center justify-center gap-1.5 text-[11px] text-[#8696A0]">
          <Shield className="w-3 h-3 text-[#00A884]" />
          <span>Campus calls are end-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppDialpadModal;
