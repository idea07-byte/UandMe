import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DiscoveryView } from './views/DiscoveryView';
import { ChatView } from './views/ChatView';
import { MomentsView } from './views/MomentsView';
import { VocabularyView } from './views/VocabularyView';
import { ProfileView } from './views/ProfileView';
import { User, Conversation, ChatMessage, SentenceCorrection, VocabCard } from './types';
import {
  MOCK_CONVERSATIONS,
  MOCK_INITIAL_MESSAGES,
  MOCK_VOCAB_CARDS,
  CURRENT_USER,
  LANGUAGES,
} from './services/mockHelloTalkData';
import { Sparkles, CheckCircle, Bookmark } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discovery' | 'chat' | 'moments' | 'vocab' | 'profile'>('discovery');
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string | null>('usr_yui');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(MOCK_INITIAL_MESSAGES);
  const [vocabCards, setVocabCards] = useState<VocabCard[]>(MOCK_VOCAB_CARDS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleStartChat = (partner: User) => {
    // Check if conversation exists
    let existing = conversations.find((c) => c.partner.id === partner.id);
    if (!existing) {
      existing = {
        id: partner.id,
        partner,
        unreadCount: 0,
        updatedAt: 'Just now',
      };
      setConversations([existing, ...conversations]);
    }

    setActiveConversationId(partner.id);
    setActiveTab('chat');
  };

  const handleSendMessage = (text: string) => {
    if (!activeConversationId) return;

    const newMsg: ChatMessage = {
      id: `msg_me_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: CURRENT_USER.id,
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), newMsg],
    }));

    // Update conversation last message preview
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? { ...c, lastMessage: newMsg, updatedAt: 'Just now' }
          : c
      )
    );

    // Auto partner reply after 1.5s to simulate live exchange
    setTimeout(() => {
      const activeConv = conversations.find((c) => c.id === activeConversationId);
      if (!activeConv) return;

      const partner = activeConv.partner;
      const sampleReplies: Record<string, { text: string; trans: string; romaji?: string }> = {
        ja: {
          text: 'とても上手な日本語ですね！一緒に勉強を続けましょう。',
          trans: 'Your Japanese is very good! Let us keep studying together.',
          romaji: 'Totemo jouzu na nihongo desu ne! Issho ni benkyou o tsuzukemashou.',
        },
        es: {
          text: '¡Exacto! Me alegra mucho que podamos practicar juntos.',
          trans: 'Exactly! I am very glad we can practice together.',
        },
        ko: {
          text: '정말 잘하셨어요! 다음에도 한국어로 이야기해요.',
          trans: 'You did really well! Let us talk in Korean next time too.',
        },
      };

      const replyData = sampleReplies[partner.nativeLang.code] || {
        text: 'That sounds wonderful! Let us keep practicing!',
        trans: 'That sounds wonderful! Let us keep practicing!',
      };

      const replyMsg: ChatMessage = {
        id: `msg_partner_${Date.now()}`,
        conversationId: activeConversationId,
        senderId: partner.id,
        text: replyData.text,
        translation: replyData.trans,
        transliteration: replyData.romaji,
        showTranslation: false,
        timestamp: 'Just now',
      };

      setMessages((prev) => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), replyMsg],
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: replyMsg, updatedAt: 'Just now' }
            : c
        )
      );
    }, 1500);
  };

  const handleSendCorrection = (correction: SentenceCorrection) => {
    if (!activeConversationId) return;

    const correctionMsg: ChatMessage = {
      id: `msg_cor_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: CURRENT_USER.id,
      text: `Corrected: "${correction.correctedText}"`,
      correction,
      timestamp: 'Just now',
    };

    setMessages((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), correctionMsg],
    }));

    showToast('Sentence correction sent! +10 helpfulness points awarded ✨');
  };

  const handleSaveToVocab = (term: string, translation: string, sourceText?: string) => {
    const newCard: VocabCard = {
      id: `voc_${Date.now()}`,
      term,
      translation,
      sourceText,
      language: LANGUAGES.ja,
      srsInterval: 1,
      srsRepetitions: 0,
      easeFactor: 2.5,
      nextReviewDate: 'Today',
      tags: ['Chat Saved'],
      createdAt: 'Just now',
    };

    setVocabCards((prev) => [newCard, ...prev]);
    showToast('Saved phrase to your Vocabulary Review deck 📖');
  };

  const handleDeleteVocabCard = (id: string) => {
    setVocabCards((prev) => prev.filter((c) => c.id !== id));
    showToast('Vocabulary card removed');
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0B1120] text-slate-100 font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadCount={conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
        vocabDueCount={vocabCards.length}
      />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'discovery' && (
          <DiscoveryView onStartChat={handleStartChat} />
        )}

        {activeTab === 'chat' && (
          <ChatView
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            messages={messages}
            onSendMessage={handleSendMessage}
            onSendCorrection={handleSendCorrection}
            onSaveToVocab={handleSaveToVocab}
            onDiscoverPartners={() => setActiveTab('discovery')}
          />
        )}

        {activeTab === 'moments' && <MomentsView />}

        {activeTab === 'vocab' && (
          <VocabularyView
            cards={vocabCards}
            onDeleteCard={handleDeleteVocabCard}
          />
        )}

        {activeTab === 'profile' && <ProfileView />}

        {/* Global Toast Alert Banner */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl bg-emerald-500 text-white text-xs font-bold shadow-2xl flex items-center gap-2 z-50 animate-bounce">
            <CheckCircle className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

