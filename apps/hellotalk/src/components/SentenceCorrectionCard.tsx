import React, { useState } from 'react';
import { ThumbsUp, Bookmark, Sparkles, Check } from 'lucide-react';
import { SentenceCorrection } from '../types';
import { computeSentenceDiff } from '../services/translationService';

interface SentenceCorrectionCardProps {
  correction: SentenceCorrection;
  onSaveToVocab?: () => void;
  isSaved?: boolean;
}

export const SentenceCorrectionCard: React.FC<SentenceCorrectionCardProps> = ({
  correction,
  onSaveToVocab,
  isSaved = false,
}) => {
  const [helpfulCount, setHelpfulCount] = useState(correction.helpfulCount || 0);
  const [isHelpful, setIsHelpful] = useState(correction.isHelpfulByMe || false);
  const [saved, setSaved] = useState(isSaved);

  const diff = computeSentenceDiff(correction.originalText, correction.correctedText);

  const toggleHelpful = () => {
    if (isHelpful) {
      setIsHelpful(false);
      setHelpfulCount((c) => Math.max(0, c - 1));
    } else {
      setIsHelpful(true);
      setHelpfulCount((c) => c + 1);
    }
  };

  const handleSave = () => {
    setSaved(true);
    onSaveToVocab?.();
  };

  return (
    <div className="w-full max-w-md my-2 rounded-2xl bg-gradient-to-b from-[#1E293B] to-[#0F172A] border-2 border-emerald-500/40 p-4 shadow-xl select-text">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
            ✓
          </span>
          <span className="font-bold text-emerald-400">Sentence Correction</span>
        </div>
        <span className="text-[11px] text-slate-400">by {correction.correctedBy.name}</span>
      </div>

      {/* Visual Diff Output */}
      <div className="text-sm leading-relaxed text-slate-200 my-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div dangerouslySetInnerHTML={{ __html: diff.diffHtml }} />
      </div>

      {/* Explanation Tip */}
      {correction.explanation && (
        <div className="text-xs text-slate-400 bg-sky-500/10 border border-sky-500/20 rounded-xl p-2.5 my-2 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
          <p className="leading-normal italic text-slate-300">{correction.explanation}</p>
        </div>
      )}

      {/* Actions: Helpful & Save to Vocab */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs select-none">
        <button
          type="button"
          onClick={toggleHelpful}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
            isHelpful
              ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Helpful ({helpfulCount})</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saved}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
            saved
              ? 'bg-sky-500/20 text-sky-400 font-semibold cursor-default'
              : 'text-slate-400 hover:text-sky-400 hover:bg-slate-800'
          }`}
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          <span>{saved ? 'Saved to Vocab' : 'Save to Vocab'}</span>
        </button>
      </div>
    </div>
  );
};

