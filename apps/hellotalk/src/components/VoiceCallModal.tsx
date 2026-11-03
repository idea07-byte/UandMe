import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Sparkles, Clock, Globe } from 'lucide-react';
import { User } from '../types';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: User;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ isOpen, onClose, partner }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [currentLanguagePhase, setCurrentLanguagePhase] = useState<'A' | 'B'>('A');

  // Call duration counter
  useEffect(() => {
    if (!isOpen) {
      setDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const langAName = partner.nativeLang.name; // e.g. Japanese
  const langBName = 'English'; // user's native

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-8 text-center">
        {/* Top Encrypted & HelloTalk Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 mb-6">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span>HelloTalk Language Exchange Call</span>
        </div>

        {/* 50/50 Balance Exchange Indicator */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-6 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 font-semibold">
            <span>50/50 Balance Exchange</span>
            <span className="text-sky-400 font-bold">Phase: {currentLanguagePhase === 'A' ? langAName : langBName}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              className={`h-full transition-all ${
                currentLanguagePhase === 'A' ? 'bg-sky-500 w-1/2' : 'bg-emerald-500 w-full'
              }`}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Switching language in 10 minutes to guarantee equal practice time!
          </p>
        </div>

        {/* Partner Avatar with pulsating ring */}
        <div className="relative my-4">
          <span className="absolute -inset-3 rounded-full bg-sky-500/20 animate-ping" />
          <span className="absolute -inset-1.5 rounded-full bg-sky-500/30 animate-pulse" />
          <img
            src={partner.avatar}
            alt={partner.name}
            className="w-28 h-28 rounded-full object-cover ring-4 ring-slate-800 shadow-2xl relative z-10"
          />
        </div>

        {/* Partner Name & Language Flags */}
        <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{partner.name}</h3>
        <p className="text-xs text-sky-400 font-semibold mt-1 flex items-center justify-center gap-1.5">
          <span>{partner.nativeLang.flag} {partner.nativeLang.name}</span>
          <span className="text-slate-500">↔</span>
          <span>🇺🇸 English</span>
        </p>

        {/* Duration Timer */}
        <div className="flex items-center gap-2 mt-4 text-slate-400 text-sm font-mono font-bold bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>{timeFormatted}</span>
        </div>

        {/* Simulated Waveform Visualizer */}
        <div className="flex items-center justify-center gap-1.5 my-8 h-8">
          {[16, 28, 12, 34, 22, 10, 30, 18, 26, 14].map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}px` }}
              className="w-1 rounded-full bg-sky-400 animate-pulse"
            />
          ))}
        </div>

        {/* Controls Dock */}
        <div className="flex items-center justify-center gap-6 w-full pt-4 border-t border-slate-800">
          {/* Mute Mic */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* End Call */}
          <button
            type="button"
            onClick={onClose}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Speaker Mute */}
          <button
            type="button"
            onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isSpeakerMuted
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
          >
            {isSpeakerMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};

