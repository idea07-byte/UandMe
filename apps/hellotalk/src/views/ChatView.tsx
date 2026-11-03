import React, { useState } from 'react';
import { MessageSquare, Users, Search, Sparkles } from 'lucide-react';
import { Conversation, User, ChatMessage, SentenceCorrection } from '../types';
import { ChatWindow } from '../components/ChatWindow';

interface ChatViewProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  messages: Record<string, ChatMessage[]>;
  onSendMessage: (text: string) => void;
  onSendCorrection: (correction: SentenceCorrection) => void;
  onSaveToVocab: (term: string, translation: string, sourceText?: string) => void;
  onDiscoverPartners: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  messages,
  onSendMessage,
  onSendCorrection,
  onSaveToVocab,
  onDiscoverPartners,
}) => {
  const [search, setSearch] = useState('');

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  const filteredConversations = conversations.filter((c) =>
    c.partner.name.toLowerCase().includes(search.toLowerCase()) ||
    c.partner.nativeLang.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex h-full overflow-hidden select-none">
      {/* Left Pane: Conversations List */}
      <div
        className={`w-full md:w-80 lg:w-96 h-full flex flex-col bg-[#0F172A] border-r border-slate-800 shrink-0 ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Search header */}
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats or languages..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>
        </div>

        {/* Conversations items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-sky-500/10 border-l-4 border-sky-500'
                    : 'hover:bg-slate-800/60'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={conv.partner.avatar}
                    alt={conv.partner.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-700"
                  />
                  {conv.partner.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0F172A]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-white text-sm truncate">{conv.partner.name}</span>
                      <span className="text-xs">{conv.partner.nativeLang.flag}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{conv.updatedAt}</span>
                  </div>

                  <p className="text-xs text-slate-400 truncate">
                    {conv.lastMessage?.text || 'Start your language exchange!'}
                  </p>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <p className="text-xs mb-3">No conversations yet.</p>
              <button
                type="button"
                onClick={onDiscoverPartners}
                className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20"
              >
                Find Language Partners
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Active Chat Window or Empty State */}
      <div
        className={`flex-1 h-full min-w-0 ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConv ? (
          <ChatWindow
            partner={activeConv.partner}
            messages={currentMessages}
            onSendMessage={onSendMessage}
            onSendCorrection={onSendCorrection}
            onSaveToVocab={onSaveToVocab}
            onBack={() => onSelectConversation('')}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0B1120] text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 shadow-xl">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">HelloTalk Language Exchange Chat</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
              Select a language partner from the left, or discover native speakers who are eager to practice with you!
            </p>
            <button
              type="button"
              onClick={onDiscoverPartners}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-500/25"
            >
              <Users className="w-4 h-4" />
              <span>Browse Language Partners</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

