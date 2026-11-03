import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, AlertCircle } from 'lucide-react';
import { computeSentenceDiff } from '../services/translationService';
import { SentenceCorrection } from '../types';
import { CURRENT_USER } from '../services/mockHelloTalkData';

interface SentenceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onSendCorrection: (correction: SentenceCorrection) => void;
}

export const SentenceCorrectionModal: React.FC<SentenceCorrectionModalProps> = ({
  isOpen,
  onClose,
  originalText,
  onSendCorrection,
}) => {
  const [correctedText, setCorrectedText] = useState(originalText);
  const [explanation, setExplanation] = useState('');
  const [diffPreview, setDiffPreview] = useState<{ diffHtml: string; hasChanges: boolean }>({
    diffHtml: originalText,
    hasChanges: false,
  });

  useEffect(() => {
    if (isOpen) {
      setCorrectedText(originalText);
      setExplanation('');
      setDiffPreview({ diffHtml: originalText, hasChanges: false });
    }
  }, [isOpen, originalText]);

  useEffect(() => {
    const diff = computeSentenceDiff(originalText, correctedText);
    setDiffPreview(diff);
  }, [originalText, correctedText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diffPreview.hasChanges) return;

    const newCorrection: SentenceCorrection = {
      id: `cor_${Date.now()}`,
      originalText: originalText.trim(),
      correctedText: correctedText.trim(),
      explanation: explanation.trim() || undefined,
      correctedBy: {
        id: CURRENT_USER.id,
        name: CURRENT_USER.name,
        avatar: CURRENT_USER.avatar,
      },
      createdAt: 'Just now',
      helpfulCount: 0,
      isHelpfulByMe: false,
    };

    onSendCorrection(newCorrection);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#1E293B] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 bg-[#0F172A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Help Correct Sentence</h3>
              <p className="text-[11px] text-slate-400">HelloTalk Language Partner Correction</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Original Sentence Display */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Original Sentence
            </label>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm text-slate-300 font-medium leading-relaxed">
              {originalText}
            </div>
          </div>

          {/* Corrected Text Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Your Corrected Version <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={correctedText}
              onChange={(e) => setCorrectedText(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
              placeholder="Edit the sentence to make it natural and correct..."
              autoFocus
            />
          </div>

          {/* Grammar Explanation Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Explanation & Tips (Optional)
            </label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="e.g. Use simple past 'went' instead of 'have went' here."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>

          {/* Real-Time Visual Diff Preview */}
          {diffPreview.hasChanges && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Visual Diff Preview:
              </span>
              <div
                className="text-sm leading-relaxed text-slate-200"
                dangerouslySetInnerHTML={{ __html: diffPreview.diffHtml }}
              />
            </div>
          )}

          {!diffPreview.hasChanges && (
            <p className="text-[11px] text-amber-400/80 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Make changes in the box above to generate the correction diff.</span>
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!diffPreview.hasChanges}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Send Correction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

