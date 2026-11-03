# Architecture — Lingua (HelloTalk Clone)

## Stack (per spec)
- **Mobile**: Expo RN 51 (React Native) + React Navigation + Zustand + TanStack Query + Socket.io-client + Agora RTC. Path to Flutter rewrite preserved via shared DTOs.
- **Web companion**: Next.js (same shared + API) — stub `client/web/`.
- **API**: NestJS 10 modular monolith (`server/src/modules/*`), `helmet`, `ValidationPipe`, `Swagger` at `/api/v1/docs`.
- **Realtime**: Socket.io `chat` namespace + Redis adapter + presence Hash `presence:{userId}`.
- **DB**: PostgreSQL 16 (Prisma), Redis 7 (cache/rate-limit/BullMQ), Elasticsearch 8 (search/matching), S3 (MinIO) + CDN.
- **Push**: FCM + APNs via BullMQ workers.
- **WebRTC**: Agora (token server in `calls.service.ts`), fallback Twilio/Daily.co.
- **Translation/Speech**: Google Cloud Translation (primary) + DeepL fallback, Google STT, Polly/Google TTS, `kuroshiro` for furigana.
- **Moderation**: Perspective/OpenAI text + Rekognition image, human queue.

## Matching Engine (§2)
`server/src/modules/matching/engine.ts` — pure TS, extractable microservice:
score = 50 reciprocal + 15 interests + 10 proximity + 10 online + 5 verified + 5 recency → rank. Backed by ES `users` index.

## Scaling
- Stateless API → K8s HPA, Socket.io sticky via `IP-hash` + Redis adapter.
- Media via presigned S3 + CloudFront.
- Prisma migrations + seed.

## Security & Compliance
- JWT (7d) + refresh, bcrypt, rate-limit by IP/user, `helmet`, CORS allowlist.
- GDPR/CCPA: `users/delete` anonymize, `users/export` S3 zip, consent on signup, age-gating (<13 block, 13-17 limited).
- Photo verification: Rekognition CompareFaces.

## Observability
- Sentry (client+server), Datadog APM, Pino logs, Swagger + audit logs in Admin.

## Monorepo Contracts
`shared/src/*` is single source of truth — zod schemas → Prisma → API DTOs → client types.
