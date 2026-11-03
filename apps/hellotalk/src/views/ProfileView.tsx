import React, { useState } from 'react';
import {
  Flame,
  Award,
  Sparkles,
  CheckCircle,
  Globe2,
  MapPin,
  BookOpen,
  Edit3,
} from 'lucide-react';
import { CURRENT_USER } from '../services/mockHelloTalkData';

export const ProfileView: React.FC = () => {
  const [user, setUser] = useState(CURRENT_USER);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user.bio);

  const handleSaveBio = () => {
    setUser({ ...user, bio: bioInput.trim() });
    setIsEditingBio(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-3xl mx-auto select-none">
      {/* Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1E293B] border border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-sky-500/30 shadow-xl"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#1E293B]" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                  <span>{user.name}</span>
                  <CheckCircle className="w-5 h-5 text-sky-400" />
                </h2>
                <p className="text-xs text-slate-400">@{user.username}</p>
              </div>

              {/* Native Language Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700 mx-auto sm:mx-0">
                <span>Native:</span>
                <span className="text-base">{user.nativeLang.flag}</span>
                <span>{user.nativeLang.name}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{user.city}, {user.country}</span>
            </p>

            {/* Bio */}
            {!isEditingBio ? (
              <div className="pt-2 flex items-start gap-2">
                <p className="text-xs text-slate-300 leading-relaxed italic">{user.bio}</p>
                <button
                  type="button"
                  onClick={() => setIsEditingBio(true)}
                  className="p-1 rounded-md text-slate-400 hover:text-sky-400 shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                <textarea
                  rows={3}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingBio(false)}
                    className="px-3 py-1 text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBio}
                    className="px-3 py-1 rounded-lg bg-sky-500 text-white text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HelloTalk Gamification Badges */}
        <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-lg font-black mb-0.5">
              <Flame className="w-5 h-5 fill-amber-400" />
              <span>{user.dailyStreak}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Day Streak
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-lg font-black mb-0.5">
              <Award className="w-5 h-5" />
              <span>{user.helpfulnessScore}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Helpful Points
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-sky-400 text-lg font-black mb-0.5">
              <Sparkles className="w-5 h-5" />
              <span>{user.totalCorrectionsGiven}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Corrections Made
            </span>
          </div>
        </div>
      </div>

      {/* Target Learning Languages */}
      <div className="p-6 rounded-3xl bg-[#1E293B] border border-slate-700/80 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <span>My Target Languages</span>
        </h3>

        <div className="space-y-4">
          {user.learningLangs.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <span className="text-lg">{item.lang.flag}</span>
                  <span>{item.lang.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-sky-400 font-bold">{item.level}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                    {item.cefr}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>A1 Beginner</span>
                  <span>{item.progressPercent}% to next level</span>
                  <span>C2 Fluent</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

