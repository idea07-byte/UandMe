import React, { useState, useMemo } from 'react';
import { Search, Filter, Globe2, Sparkles, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { MOCK_PARTNERS, CURRENT_USER, LANGUAGES } from '../services/mockHelloTalkData';
import { PartnerCard } from '../components/PartnerCard';

interface DiscoveryViewProps {
  onStartChat: (partner: User) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ onStartChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [onlineOnly, setOnlineOnly] = useState(false);

  const filteredPartners = useMemo(() => {
    return MOCK_PARTNERS.filter((partner) => {
      // Language filter
      if (selectedLang !== 'all' && partner.nativeLang.code !== selectedLang) {
        return false;
      }

      // Online filter
      if (onlineOnly && !partner.online) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = partner.name.toLowerCase().includes(q);
        const matchCity = partner.city.toLowerCase().includes(q);
        const matchBio = partner.bio.toLowerCase().includes(q);
        const matchLang = partner.nativeLang.name.toLowerCase().includes(q);
        return matchName || matchCity || matchBio || matchLang;
      }

      return true;
    });
  }, [searchQuery, selectedLang, onlineOnly]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
      {/* Top Hero Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-600 via-sky-600 to-teal-500 shadow-2xl overflow-hidden text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Reciprocal Language Exchange</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Find Native Speakers Who Want to Learn English
          </h2>
          <p className="text-sm text-sky-100 leading-relaxed">
            Practice 50% in your target language and 50% in English. Native corrections, voice notes, and cultural exchange with real friends worldwide.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shrink-0">
          <div className="text-center">
            <span className="text-2xl font-black block">40M+</span>
            <span className="text-[11px] text-sky-200 uppercase font-semibold">Learners</span>
          </div>
          <div className="w-[1px] h-8 bg-white/20" />
          <div className="text-center">
            <span className="text-2xl font-black block">150+</span>
            <span className="text-[11px] text-sky-200 uppercase font-semibold">Languages</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, city, language, or hobby..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#1E293B] border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-sky-500 transition-all font-medium"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Language filter pills */}
          <button
            type="button"
            onClick={() => setSelectedLang('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedLang === 'all'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-[#1E293B] text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            All Languages
          </button>

          {Object.values(LANGUAGES).filter(l => l.code !== 'en').map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLang(lang.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedLang === lang.code
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-[#1E293B] text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}

          {/* Online Only Toggle */}
          <button
            type="button"
            onClick={() => setOnlineOnly(!onlineOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              onlineOnly
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-[#1E293B] text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${onlineOnly ? 'bg-white' : 'bg-emerald-500'}`} />
            <span>Online Only</span>
          </button>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPartners.map((partner) => (
          <PartnerCard
            key={partner.id}
            partner={partner}
            onStartChat={onStartChat}
          />
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <div className="p-12 text-center text-slate-400 bg-[#1E293B] border border-slate-700 rounded-3xl">
          <Globe2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-white mb-1">No language partners found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms or clearing the language filter.
          </p>
        </div>
      )}
    </div>
  );
};

