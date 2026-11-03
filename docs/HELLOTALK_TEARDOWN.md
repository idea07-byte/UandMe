# HelloTalk Teardown — Feature Inventory (Source: HelloTalk 5.x + Tandem/Speaky/Bilingua secondary)

## 1. Auth & Onboarding
- Phone SMS (Firebase/Twilio), email, Google/Apple/Facebook OAuth, LINE/WeChat (APAC)
- Native/learn selection: multiple each, proficiency picker (Beginner→Native), self-assessment flow with CEFR tips
- Photo, bio, birthday, gender, city (city-level, optional lat/lng), interests (10 tags), learning goals (6)
- Verification: selfie vs avatar (photo badge), optional ID (gov ID blur)
- HelloTalk edge: "Levels" mandatory before chat unlocks — gated tutorial.

## 2. Discovery
- Tabs: Recommend / Nearby / Search / Language Exchange (reciprocal filter)
- Filters: language (native/learn), location, age, gender, online, verified, “recently active”
- Swipe cards vs list, daily “Featured” carousel, “who viewed me”
- Block/report from card (no contact needed)
- Tandem edge: Topics prompt cards to start convo.

## 3. Chat (core)
- Text, voice (60-120s), image, video, sticker, location, contact card
- Tap-to-translate (per-message, target = user’s native), transliteration (pinyin/furigana for CJK), TTS on any bubble
- Correction: select text → propose correction → diff (red strikethrough/green insert) + comment, auto-creates vocab card
- Reactions (5 emoji), star/pin, reply, forward, copy, delete, search (full-text), burn-after-reading (optional)
- Typing, read receipts (double check), online/last seen, keyboard language switcher
- Speaky edge: built-in correction templates.

## 4. Calls
- 1:1 voice/video, duration counter, mute/speaker/camera flip, call log
- Group voice rooms: 9 speakers + audience, hand-raise, Clubhouse-style
- Recording with double consent banner (HelloTalk V4 added)
- Agora SDK; Bilingua edge: call rating after.

## 5. Moments (Feed)
- Post: text + up to 9 images / audio (30s) / video (60s), language tag, hashtags
- Auto-translate feed based on viewer lang, comment correction (same diff), likes/comments/shares, hashtags, Explore by lang/interest
- moderation: pre-publish text/image check

## 6. Groups
- By language/city/interest, public/private, join request, 500 cap, admin roles, notice pinning
- Group chat + group voice room linkage

## 7. Learning Tools
- Vocab: auto-collect from corrections → phrasebook → flashcards (SRS), daily word push
- Grammar cards, streak, word count, correction stats
- Etiquette prompts: “Help first, then ask”

## 8. Gamification
- Daily streak, correction count, “Helpfulness” score → Teacher badge, XP/levels, leaderboard (opt-in)

## 9-13 Covered in ARCHITECTURE.md
