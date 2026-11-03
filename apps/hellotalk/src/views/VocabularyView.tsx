import React, { useState } from 'react';
import { BookOpen, Sparkles, Volume2, RotateCw, CheckCircle2, Trash2, Flame } from 'lucide-react';
import { VocabCard } from '../types';
import { MOCK_VOCAB_CARDS } from '../services/mockHelloTalkData';
import { speakText } from '../services/translationService';

interface VocabularyViewProps {
  cards: VocabCard[];
  onDeleteCard: (id: string) => void;
}

export const VocabularyView: React.FC<VocabularyViewProps> = ({ cards, onDeleteCard }) => {
  const [vocabList, setVocabList] = useState<VocabCard[]>(cards.length > 0 ? cards : MOCK_VOCAB_CARDS);
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const activeCard = vocabList[currentCardIndex] || vocabList[0];

  const handleSrsAnswer = (quality: 'again' | 'good' | 'easy') => {
    setIsFlipped(false);
    if (currentCardIndex + 1 < vocabList.length) {
      setCurrentCardIndex((i) => i + 1);
    } else {
      setIsReviewing(false);
      setCurrentCardIndex(0);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-4xl mx-auto select-none">
      {/* Header & Stats Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-600 to-teal-700 shadow-xl text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Spaced Repetition System (SRS)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Vocabulary & Phrasebook
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-md">
            Sentences and corrections you save in chat are auto-added here for spaced repetition memory review.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3.5 rounded-2xl text-center">
            <span className="text-3xl font-black block">{vocabList.length}</span>
            <span className="text-[11px] text-emerald-200 uppercase font-semibold">Saved Cards</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsReviewing(true);
              setIsFlipped(false);
              setCurrentCardIndex(0);
            }}
            disabled={vocabList.length === 0}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white text-emerald-700 font-extrabold text-sm hover:bg-emerald-50 transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-40"
          >
            <RotateCw className="w-4 h-4" />
            <span>Start Review</span>
          </button>
        </div>
      </div>

      {/* SRS Flashcard Review Modal View */}
      {isReviewing && activeCard && (
        <div className="p-6 bg-[#1E293B] border-2 border-emerald-500/50 rounded-3xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3 text-xs text-slate-400 font-semibold">
            <span>
              Card {currentCardIndex + 1} of {vocabList.length}
            </span>
            <button
              type="button"
              onClick={() => setIsReviewing(false)}
              className="text-slate-400 hover:text-white"
            >
              Exit Review
            </button>
          </div>

          {/* Flip Flashcard */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[220px] rounded-3xl bg-slate-900/90 border border-slate-700/80 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/40 transition-all relative group shadow-inner"
          >
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest absolute top-4">
              {isFlipped ? 'Answer / Native Translation' : 'Target Phrase (Tap to Flip)'}
            </span>

            {/* Front Card */}
            {!isFlipped ? (
              <div className="space-y-4 my-auto">
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-relaxed">
                  {activeCard.term}
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(activeCard.term, activeCard.language.code);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Pronounce</span>
                </button>
              </div>
            ) : (
              /* Back Card */
              <div className="space-y-4 my-auto">
                <h3 className="text-2xl font-bold text-emerald-400 tracking-tight">
                  {activeCard.translation}
                </h3>

                {activeCard.explanation && (
                  <p className="text-xs text-slate-300 italic max-w-md bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    💡 {activeCard.explanation}
                  </p>
                )}
              </div>
            )}

            <span className="text-[11px] text-slate-500 absolute bottom-4">
              {isFlipped ? 'Rate how well you remembered this card:' : 'Tap anywhere to reveal answer'}
            </span>
          </div>

          {/* SRS Score Actions */}
          {isFlipped && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSrsAnswer('again')}
                className="py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all text-center"
              >
                Again (1 day)
              </button>
              <button
                type="button"
                onClick={() => handleSrsAnswer('good')}
                className="py-3 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all text-center"
              >
                Good (3 days)
              </button>
              <button
                type="button"
                onClick={() => handleSrsAnswer('easy')}
                className="py-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all text-center"
              >
                Easy (7 days)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Vocabulary List */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white tracking-tight">Saved Phrases & Sentences</h3>

        <div className="divide-y divide-slate-800 rounded-3xl bg-[#1E293B] border border-slate-700/80 overflow-hidden">
          {vocabList.map((card) => (
            <div
              key={card.id}
              className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-800/40 transition-colors"
            >
              <div className="space-y-1.5 flex-1 select-text">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{card.term}</span>
                  <button
                    type="button"
                    onClick={() => speakText(card.term, card.language.code)}
                    className="p-1 rounded-md text-slate-400 hover:text-emerald-400"
                    title="Speak"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-emerald-400 font-medium">{card.translation}</p>

                {card.explanation && (
                  <p className="text-[11px] text-slate-400 italic">💡 {card.explanation}</p>
                )}

                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    SRS Reps: {card.srsRepetitions}
                  </span>
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setVocabList((prev) => prev.filter((c) => c.id !== card.id));
                  onDeleteCard(card.id);
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Remove phrase"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

