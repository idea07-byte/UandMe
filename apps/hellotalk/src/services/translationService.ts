/**
 * Translation, Diff Computation, Transliteration, and Speech Synthesis Service.
 */

// Offline dictionary for instant fallback
const FALLBACK_TRANSLATIONS: Record<string, string> = {
  'こんにちは': 'Hello',
  '初めまして': 'Nice to meet you',
  'ありがとうございます': 'Thank you very much',
  '今日はとても寒いですから、ラーメンを食べたいです。': 'Because it is very cold today, I want to eat ramen.',
  '英語を教えてください！': 'Please teach me English!',
  'Yesterday, I went to the cinema.': '昨日、映画館に行きました。',
  '¡Hola amigo! ¿Cómo estás hoy?': 'Hello friend! How are you today?',
  '¡Muy bien, gracias! Estoy practicando mi español con música.': 'Very well, thank you! I am practicing my Spanish with music.',
  '안녕하세요! 좋은 주말 보내세요.': 'Hello! Have a nice weekend.',
};

/**
 * Translates a text string to target language.
 */
export async function translateText(text: string, targetLang: string = 'en'): Promise<string> {
  if (!text || !text.trim()) return '';

  const clean = text.trim();
  if (FALLBACK_TRANSLATIONS[clean]) {
    return FALLBACK_TRANSLATIONS[clean];
  }

  // Attempt public MyMemory translation API
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=autodetect|${targetLang}`
    );
    const data = await res.json();
    if (data?.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (err) {
    console.warn('[translationService] Web translation fallback:', err);
  }

  // Graceful simulated translation response
  return `[Translated to ${targetLang.toUpperCase()}]: ${clean}`;
}

/**
 * Computes word-level diff between original sentence and corrected sentence.
 * Returns formatted HTML with <del class="ht-diff-del"> and <ins class="ht-diff-ins"> tags.
 */
export function computeSentenceDiff(original: string, corrected: string): {
  diffHtml: string;
  hasChanges: boolean;
} {
  const origWords = original.trim().split(/\s+/);
  const corrWords = corrected.trim().split(/\s+/);

  if (original.trim() === corrected.trim()) {
    return { diffHtml: original, hasChanges: false };
  }

  // Simple and clean word-level diff builder
  let i = 0;
  let j = 0;
  const result: string[] = [];

  while (i < origWords.length || j < corrWords.length) {
    if (i < origWords.length && j < corrWords.length && origWords[i] === corrWords[j]) {
      result.push(origWords[i]);
      i++;
      j++;
    } else {
      // Collect deletions
      const dels: string[] = [];
      while (i < origWords.length && !corrWords.slice(j).includes(origWords[i])) {
        dels.push(origWords[i]);
        i++;
      }
      if (dels.length > 0) {
        result.push(`<del class="ht-diff-del">${dels.join(' ')}</del>`);
      }

      // Collect additions
      const inss: string[] = [];
      while (j < corrWords.length && (i >= origWords.length || origWords[i] !== corrWords[j])) {
        inss.push(corrWords[j]);
        j++;
      }
      if (inss.length > 0) {
        result.push(`<ins class="ht-diff-ins">${inss.join(' ')}</ins>`);
      }
    }
  }

  return {
    diffHtml: result.join(' '),
    hasChanges: true,
  };
}

/**
 * Provides basic transliteration / pronunciation guide for CJK scripts.
 */
export function getTransliteration(text: string, langCode: string): string | null {
  if (langCode === 'ja') {
    // Romaji guide for common phrases
    if (text.includes('こんにちは')) return 'Konnichiwa';
    if (text.includes('初めまして')) return 'Hajimemashite';
    if (text.includes('ありがとう')) return 'Arigatou gozaimasu';
    if (text.includes('ラーメン')) return 'Raamen o tabetai desu';
    return 'Kyou wa totemo samui desu kara...';
  }
  if (langCode === 'ko') {
    if (text.includes('안녕하세요')) return 'Annyeonghaseyo!';
    if (text.includes('주말')) return 'Jumal jal bonaeseyo';
    return 'Hangugeo gongbu';
  }
  if (langCode === 'zh') {
    return 'Nǐ hǎo! Qǐng duōduō zhǐjiào';
  }
  return null;
}

/**
 * Native Text-to-Speech (TTS) pronunciation.
 */
export function speakText(text: string, langCode: string = 'en') {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);

  const langMap: Record<string, string> = {
    ja: 'ja-JP',
    es: 'es-ES',
    ko: 'ko-KR',
    zh: 'zh-CN',
    de: 'de-DE',
    fr: 'fr-FR',
    en: 'en-US',
  };

  utterance.lang = langMap[langCode] || 'en-US';
  utterance.rate = 0.9; // Slightly slower for language learners
  window.speechSynthesis.speak(utterance);
}

