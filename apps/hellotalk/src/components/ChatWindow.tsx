import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Phone,
  Languages,
  Volume2,
  Sparkles,
  Bookmark,
  Check,
  Smile,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { User, ChatMessage, SentenceCorrection } from '../types';
import { CURRENT_USER } from '../services/mockHelloTalkData';
import { translateText, getTransliteration, speakText } from '../services/translationService';
import { SentenceCorrectionModal } from './SentenceCorrectionModal';
import { SentenceCorrectionCard } from './SentenceCorrectionCard';
import { VoiceCallModal } from './VoiceCallModal';

interface ChatWindowProps {
  partner: User;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendCorrection: (correction: SentenceCorrection) => void;
  onSaveToVocab: (term: string, translation: string, sourceText?: string) => void;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  partner,
  messages,
  onSendMessage,
  onSendCorrection,
  onSaveToVocab,
  onBack,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeCorrectionOriginal, setActiveCorrectionOriginal] = useState<string | null>(null);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(messages);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleToggleTranslation = async (msg: ChatMessage) => {
    if (msg.translation && msg.showTranslation) {
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, showTranslation: false } : m))
      );
      return;
    }

    if (msg.translation) {
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, showTranslation: true } : m))
      );
      return;
    }

    setTranslatingId(msg.id);
    const targetLang = msg.senderId === CURRENT_USER.id ? partner.nativeLang.code : CURRENT_USER.nativeLang.code;
    const translated = await translateText(msg.text, targetLang);
    setTranslatingId(null);

    setLocalMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, translation: translated, showTranslation: true } : m))
    );
  };

  const handleToggleTransliteration = (msg: ChatMessage) => {
    if (msg.showTransliteration) {
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, showTransliteration: false } : m))
      );
      return;
    }

    const trans = msg.transliteration || getTransliteration(msg.text, partner.nativeLang.code);
    setLocalMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, transliteration: trans || undefined, showTransliteration: true } : m))
    );
  };

  const handleSpeak = (msg: ChatMessage) => {
    const langCode = msg.senderId === CURRENT_USER.id ? CURRENT_USER.nativeLang.code : partner.nativeLang.code;
    speakText(msg.text, langCode);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B1120] relative overflow-hidden select-none">
      {/* Header */}
      <div className="h-16 px-4 sm:px-6 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-1.5 rounded-full text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <img
              src={partner.avatar}
              alt={partner.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700"
            />
            {partner.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0F172A]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm sm:text-base">{partner.name}</h3>
              <div className="flex items-center gap-1 text-xs">
                <span>{partner.nativeLang.flag}</span>
                <span className="text-slate-500">↔</span>
                <span>{CURRENT_USER.nativeLang.flag}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              {partner.online ? 'Online now' : `Last active: ${partner.lastActive}`}
            </p>
          </div>
        </div>

        {/* Header Action: Voice Call */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsVoiceCallOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all shadow-sm"
            title="Start Language Exchange Voice Call"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Exchange Call</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* HelloTalk E2EE Language Tip Banner */}
        <div className="max-w-md mx-auto p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center text-xs text-sky-300">
          <span className="font-bold">💡 HelloTalk Exchange Tip:</span> Practice 50% in your native language and 50% in your target language! Tap <Languages className="w-3 h-3 inline mx-0.5 text-sky-400" /> to translate or <Sparkles className="w-3 h-3 inline mx-0.5 text-emerald-400" /> to correct.
        </div>

        {localMessages.map((msg) => {
          const isMine = msg.senderId === CURRENT_USER.id;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group max-w-xl ${
                isMine ? 'ml-auto' : 'mr-auto'
              }`}
            >
              {/* Message Bubble Container */}
              <div
                className={`relative p-3.5 rounded-2xl text-sm leading-relaxed shadow-md select-text ${
                  isMine
                    ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-br-sm'
                    : 'bg-[#1E293B] border border-slate-700/80 text-slate-100 rounded-bl-sm'
                }`}
              >
                {/* Bubble Text */}
                <p className="font-medium">{msg.text}</p>

                {/* Transliteration Guide (Pinyin / Romaji) */}
                {msg.showTransliteration && (msg.transliteration || getTransliteration(msg.text, partner.nativeLang.code)) && (
                  <div className="mt-1 pt-1 border-t border-white/20 text-xs font-mono text-amber-300 italic">
                    {msg.transliteration || getTransliteration(msg.text, partner.nativeLang.code)}
                  </div>
                )}

                {/* Inline Translation Display */}
                {msg.showTranslation && msg.translation && (
                  <div className="mt-2 pt-2 border-t border-white/20 text-xs text-slate-200 bg-black/20 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-sky-300 uppercase block mb-0.5">
                      Translation:
                    </span>
                    <p className="italic">{msg.translation}</p>
                  </div>
                )}

                {/* Timestamp */}
                <div
                  className={`text-[10px] text-right mt-1.5 ${
                    isMine ? 'text-sky-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* HelloTalk Learning Action Bar (under bubble) */}
              <div className="flex items-center gap-1.5 mt-1 text-slate-400 opacity-80 group-hover:opacity-100 transition-opacity text-xs select-none">
                {/* Translate Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleTranslation(msg)}
                  disabled={translatingId === msg.id}
                  className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-sky-400 transition-colors"
                  title="Translate message"
                >
                  <Languages className="w-3.5 h-3.5" />
                </button>

                {/* Transliteration Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleTransliteration(msg)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-amber-400 transition-colors font-mono font-bold text-[11px]"
                  title="Pronunciation / Romaji"
                >
                  aA
                </button>

                {/* TTS Audio Speak */}
                <button
                  type="button"
                  onClick={() => handleSpeak(msg)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-emerald-400 transition-colors"
                  title="Listen to pronunciation"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>

                {/* Sentence Correction Button (for partner's incoming messages) */}
                {!isMine && (
                  <button
                    type="button"
                    onClick={() => setActiveCorrectionOriginal(msg.text)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold transition-colors"
                    title="Correct partner sentence"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Correct</span>
                  </button>
                )}

                {/* Save to Vocab */}
                <button
                  type="button"
                  onClick={() => {
                    const trans = msg.translation || 'Saved phrase';
                    onSaveToVocab(msg.text, trans);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-sky-400 transition-colors"
                  title="Save to Vocabulary"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Render Correction Card if this message contains a correction */}
              {msg.correction && (
                <SentenceCorrectionCard
                  correction={msg.correction}
                  onSaveToVocab={() =>
                    onSaveToVocab(
                      msg.correction!.correctedText,
                      msg.correction!.originalText,
                      msg.correction!.originalText
                    )
                  }
                />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-[#0F172A] border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${partner.name} in ${partner.nativeLang.name} or English...`}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-sky-500/20 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Sentence Correction Modal */}
      {activeCorrectionOriginal && (
        <SentenceCorrectionModal
          isOpen={Boolean(activeCorrectionOriginal)}
          onClose={() => setActiveCorrectionOriginal(null)}
          originalText={activeCorrectionOriginal}
          onSendCorrection={(cor) => {
            onSendCorrection(cor);
            setActiveCorrectionOriginal(null);
          }}
        />
      )}

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        partner={partner}
      />
    </div>
  );
};

