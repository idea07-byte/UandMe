# API Spec — v1

Base: `http://localhost:3000/api/v1`  Swagger: `/api/v1/docs`

## Auth (§1)
`POST /auth/signup` `{provider, token, displayName, age, nativeLanguages, learningLanguages}` → `{accessToken, userId}`
`POST /auth/login` `POST /auth/phone/verify` `POST /auth/oauth/:provider`

## Users (§1,§9,§12)
`GET /users/me` `GET /users/:id` `PATCH /users/me` `POST /users/me/avatar` (multipart) `POST /users/me/verify-photo` `PATCH /users/me/privacy` `DELETE /users/me` `GET /users/me/export` `POST /users/block` `POST /users/report`

## Matching (§2)
`GET /matching/recommend?language=&onlineOnly=` `GET /matching/search` `GET /matching/nearby?lat=&lng=` `GET /matching/featured`

## Chat (§3)
`GET /chat/conversations` `POST /chat/conversations` `GET /chat/conversations/:id/messages?cursor=` `POST /chat/messages` `POST /chat/messages/:id/read` `POST /chat/messages/:id/react` `POST /chat/messages/:id/star` `GET /chat/search?q=` `POST /chat/upload` `POST /chat/translate` `POST /chat/transliterate` `POST /chat/tts` `POST /chat/corrections` `POST /chat/corrections/:id/helpful`
WS `chat` namespace: `message:send`, `typing:start`, `message:read` → `message:new`, `typing`, `message:read`

## Moments (§5)
`POST /moments` `GET /moments/feed` `GET /moments/explore?lang=&hashtag=` `POST /moments/:id/like` `POST /moments/:id/comments` `POST /moments/comments/:id/correct` `GET /moments/:id/translate?lang=`

## Groups (§6)
`POST /groups` `GET /groups` `POST /groups/:id/join` `POST /groups/:id/leave` `GET /groups/:id/messages` `POST /groups/:id/messages` `GET /groups/:id/voice-rooms` `POST /groups/:id/voice-rooms`

## Calls (§4)
`POST /calls/initiate` `{initiatorId, peerId, type}` `POST /calls/:id/accept` `POST /calls/:id/end` `POST /calls/:id/record` `POST /calls/group-room`

## Learning (§7)
`POST /learning/bookmark` `GET /learning/phrasebook` `GET /learning/flashcards` `POST /learning/flashcards/:id/review` `GET /learning/daily-word` `GET /learning/grammar-tips?lang=` `GET /learning/progress`

## Gamification (§8)
`POST /gamification/xp` `GET /gamification/streak` `GET /gamification/badges` `GET /gamification/leaderboard` `GET /gamification/reputation/:id`

## Moderation (§9)
`POST /moderation/text` `POST /moderation/image` `GET /moderation/queue` `POST /moderation/reports/:id/resolve`

## Monetization (§10)
`GET /monetization/subscription` `POST /monetization/checkout` `POST /monetization/webhook/:provider` `GET /monetization/limits` `GET /monetization/tutors` `POST /monetization/tutors/book`

## Notifications (§11)
`POST /notifications/devices` `POST /notifications/push` `GET /notifications/inbox` `POST /notifications/:id/read`

## Admin (§13)
`GET /admin/users` `POST /admin/users/:id/ban` `GET /admin/analytics` `GET /admin/ab-tests` `POST /admin/ab-tests`
