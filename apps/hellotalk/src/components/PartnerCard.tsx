import React from 'react';
import { MessageSquare, Flame, CheckCircle, MapPin, Sparkles } from 'lucide-react';
import { User } from '../types';

interface PartnerCardProps {
  partner: User;
  onStartChat: (partner: User) => void;
}

export const PartnerCard: React.FC<PartnerCardProps> = ({ partner, onStartChat }) => {
  const primaryLearning = partner.learningLangs[0];

  return (
    <div className="bg-[#1E293B] border border-slate-700/80 hover:border-sky-500/50 rounded-3xl p-5 shadow-lg transition-all hover:shadow-sky-500/10 hover:-translate-y-0.5 flex flex-col justify-between group">
      <div>
        {/* User Info Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={partner.avatar}
                alt={partner.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-700"
              />
              {partner.online && (
                <span
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[#1E293B]"
                  title="Online now"
                />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-white text-base group-hover:text-sky-400 transition-colors">
                  {partner.name}
                </h4>
                {partner.verified && (
                  <span title="Verified Member" className="inline-flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>{partner.city}, {partner.country}</span>
              </p>
            </div>
          </div>

          {/* Streak Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{partner.dailyStreak}d</span>
          </div>
        </div>

        {/* Language Exchange Pairing Matrix */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 mb-3">
          {/* Native Language */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Native:</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <span className="text-sm">{partner.nativeLang.flag}</span>
              <span>{partner.nativeLang.name}</span>
            </div>
          </div>

          {/* Learning Language with CEFR progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Learning:</span>
              <div className="flex items-center gap-1.5 font-bold text-sky-400">
                <span className="text-sm">{primaryLearning.lang.flag}</span>
                <span>{primaryLearning.lang.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">
                  {primaryLearning.cefr}
                </span>
              </div>
            </div>
            {/* Visual Level Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                style={{ width: `${primaryLearning.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
          {partner.bio}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
        <span className="text-[11px] text-slate-500">
          <span className="font-semibold text-slate-400">{partner.totalCorrectionsGiven}</span> corrections given
        </span>

        <button
          type="button"
          onClick={() => onStartChat(partner)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all shadow-md shadow-sky-500/20"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Say Hello</span>
        </button>
      </div>
    </div>
  );
};

