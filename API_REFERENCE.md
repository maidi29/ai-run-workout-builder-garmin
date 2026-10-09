# API Reference

This document describes the HTTP APIs used by the Garmin Workouts AI app — the backend's own routes, the Garmin Connect Mobile endpoints called from the device, and OpenAI calls made from the backend.

## Table of Contents

1. [Garmin Authentication (SSO Ticket Flow)](#garmin-authentication-sso-ticket-flow)
2. [Backend: AI API](#backend-ai-api)
3. [Garmin Connect API (called from the app)](#garmin-connect-api-called-from-the-app)
4. [OpenAI](#openai)
5. [Rate Limiting](#rate-limiting)
6. [Endpoints Summary](#endpoints-summary)

## Garmin Authentication (SSO Ticket Flow)

### Overview

The app uses the **Garmin Connect Mobile** OAuth flow, not Garmin's public Health/Connect Developer Program PKCE flow. The user signs into Garmin SSO inside an in-app WebView, the device captures the CAS service ticket from the redirect, and the backend exchanges that ticket for OAuth2 tokens via Garmin's OAuth1 → OAuth2 endpoints (signed with the Connect Mobile consumer key/secret).

The backend is **stateless**: it forwards the tokens to the device, which stores them in `expo-secure-store`. Refresh is also proxied through the backend because it requires OAuth1 consumer-secret signing.

### Login Flow

1. User taps "Sign in with Garmin" → app opens WebView at `https://sso.garmin.com/sso/embed`.
2. User completes Garmin login (incl. MFA if enabled).
3. WebView intercepts the redirect URL, extracts the `ticket=ST-...` query param.
4. App posts the ticket to backend `POST /api/garmin/exchange-ticket`.
5. Backend signs OAuth1 requests with the Connect Mobile consumer key/secret to:
   - `GET https://connectapi.garmin.com/oauth-service/oauth/preauthorized?ticket=...` → OAuth1 token
   - `POST https://connectapi.garmin.com/oauth-service/oauth/exchange/user/2.0` → OAuth2 access/refresh tokens
   - `GET https://connectapi.garmin.com/userprofile-service/socialProfile` → user ID / display name
6. Backend returns OAuth2 tokens + profile to the device. Device persists them in SecureStore.

### Backend: Exchange Ticket

**Method**: `POST`
**URL**: `${BACKEND_URL}/api/garmin/exchange-ticket`
**Rate limit**: 10 req/min per IP

**Body**:

```json
{ "ticket": "ST-1234567-abcdef-cas" }
```

The ticket must match `^ST-[A-Za-z0-9._-]+$` (Garmin CAS service-ticket format) and is single-use.

**Response**:

```json
{
  "success": true,
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 86400,
  "userId": "<garmin-user-id>",
  "displayName": "Jane Doe"
}
```

### Backend: Refresh Token

**Method**: `POST`
**URL**: `${BACKEND_URL}/api/garmin/refresh-token`
**Rate limit**: 30 req/min per IP

Garmin's refresh endpoint requires OAuth1 consumer-secret signing, so the call cannot be made from the device. The backend signs the request with consumer-only OAuth1 (no per-user token):

```text
POST https://connectapi.garmin.com/oauth-service/oauth/exchange/user/2.0
Authorization: OAuth oauth_consumer_key=..., oauth_signature=..., ...
Content-Type: application/x-www-form-urlencoded

refresh_token=<token>
```

**Body** (to backend):

```json
{ "refresh_token": "..." }
```

**Response**:

```json
{
  "success": true,
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 86400
}
```

A new `refresh_token` is returned on each refresh; the device replaces the stored value.

### Token Lifetimes

- **Access token**: ~24 hours (`expires_in` in seconds; trust the value Garmin returns rather than hardcoding).
- **Refresh token**: long-lived (months). Replaced on every refresh, so as long as the user opens the app at least once before the refresh token itself ages out, the session persists indefinitely.
- The client refreshes 5 minutes before access-token expiry (`CONFIG.TIMEOUTS.TOKEN_REFRESH`).

### Backend Environment

- `GARMIN_OAUTH_CONSUMER_KEY` — Connect Mobile OAuth1 consumer key
- `GARMIN_OAUTH_CONSUMER_SECRET` — Connect Mobile OAuth1 consumer secret

The User-Agent on all upstream calls is `com.garmin.android.apps.connectmobile` and must match the consumer key.

## Backend: AI API

All `/api/ai/*` routes require:

- `Authorization: Bearer <Garmin access token>` — validated by hitting `https://connectapi.garmin.com/userprofile-service/socialProfile` (`backend/src/middleware/aiAuth.ts`).
- `X-API-Key: <APP_API_KEY>` — required when `APP_API_KEY` is set on the backend (always required in production via `assertProductionSecrets`).

Rate limits (see [Rate Limiting](#rate-limiting)) apply per IP and per Garmin user.

### Generate from Context

**Method**: `POST`
**URL**: `${BACKEND_URL}/api/ai/generate-from-context`

Generates a single running workout from how the user feels, what they want to do, and how long they have. Used by suggest-mode.

**Body**:

```json
{
  "feeling": "tired but motivated",
  "goal": "easy aerobic run",
  "durationMinutes": 45,
  "thresholdPace": "4:30",
  "easyPace": "5:30"
}
```

| Field             | Type    | Constraints            |
| ----------------- | ------- | ---------------------- |
| `feeling`         | string  | required, 1–200 chars  |
| `goal`            | string  | required, 1–200 chars  |
| `durationMinutes` | integer | required, 15–180       |
| `thresholdPace`   | string? | optional, max 32 chars |
| `easyPace`        | string? | optional, max 32 chars |

**Response**:

```text
{
  "success": true,
  "data": <WorkoutData>   // see types/index.ts
}
```

### Process Text (multiple)

**Method**: `POST`
**URL**: `${BACKEND_URL}/api/ai/process-text-multiple`

Extracts one or more workouts from a pasted plan or weekly schedule.

**Body**:

```json
{ "description": "Mon 5k easy. Wed 6x800m @ 4:00. Sat long run 90 min." }
```

`description` is required, max **5000 characters** (`MAX_AI_TEXT_LENGTH`).

**Response**:

```text
{
  "success": true,
  "workouts": <WorkoutData[]>   // see types/index.ts
}
```

### Process Image (multiple)

**Method**: `POST`
**URL**: `${BACKEND_URL}/api/ai/process-image-multiple`

Extracts one or more workouts from an image (a screenshot of a coach's plan, a photo of a whiteboard, etc.). The AI auto-detects how many workouts are present.

**Body**:

```json
{
  "imageBase64": "/9j/4AAQSkZJRg...",
  "mimeType": "image/jpeg"
}
```

| Field         | Type                                                       | Constraints                                |
| ------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `imageBase64` | string                                                     | required, ≤ ~5.5 MB base64 (~4 MB decoded) |
| `mimeType`    | `image/jpeg` \| `image/jpg` \| `image/png` \| `image/webp` | optional, defaults to `image/jpeg`         |

**Response**:

```text
{
  "success": true,
  "workouts": <WorkoutData[]>   // see types/index.ts
}
```

## Garmin Connect API (called from the app)

Workout create/list/schedule are called **directly from the device** (not through the backend) using the Garmin Connect Mobile-style API at `https://connectapi.garmin.com`. All three endpoints take `Authorization: Bearer <access_token>`. See `api/client.ts`.

The full workout payload schema is documented separately in [GARMIN_JSON_SPEC.md](GARMIN_JSON_SPEC.md).

### Create Workout

**Method**: `POST`
**URL**: `https://connectapi.garmin.com/workout-service/workout`

**Body**: Garmin Connect Mobile workout JSON (`workoutSegments`, `workoutSteps`, `executableStepType`, etc.). See `services/workoutService.ts` and `GARMIN_JSON_SPEC.md`.

**Response**:

```json
{ "workoutId": 123456789, "workoutName": "Morning Run" }
```

### List Workouts

**Method**: `GET`
**URL**: `https://connectapi.garmin.com/workout-service/workouts?limit={limit}`

Returns up to `limit` recent workouts (default 20).

**Response**:

```json
[
  {
    "workoutId": 123456789,
    "workoutName": "Morning Run",
    "sportType": { "sportTypeKey": "running" }
  }
]
```

### Schedule Workout

**Method**: `POST`
**URL**: `https://connectapi.garmin.com/workout-service/schedule/{workoutId}`

Pins a previously created workout to a date on the Connect calendar.

**Body**:

```json
{ "date": "2026-05-10" }
```

**Response**:

```json
{ "scheduledDate": "2026-05-10" }
```

## OpenAI

The backend calls OpenAI directly (`backend/src/services/aiService.ts`) — the device never talks to OpenAI. Models in use:

- `gpt-4o` for image extraction (`processImageMultiple`)
- `gpt-4o-mini` for text extraction and suggest-mode generation (`processTextMultiple`, `generateFromContext`)

Standard `POST https://api.openai.com/v1/chat/completions` with `Authorization: Bearer ${OPENAI_API_KEY}`. Prompt construction and JSON-shape parsing live in `aiService.ts`.

## Rate Limiting

### Backend (express-rate-limit)

| Route                              | Scope           | Limit      |
| ---------------------------------- | --------------- | ---------- |
| `POST /api/garmin/exchange-ticket` | per IP          | 10 req/min |
| `POST /api/garmin/refresh-token`   | per IP          | 30 req/min |
| `POST /api/ai/*`                   | per IP          | 20 req/min |
| `POST /api/ai/*`                   | per Garmin user | 20 req/min |

The per-user AI limit is enforced by `userRateLimiter` in `backend/src/routes/ai.ts` and keys off the `userId` returned by Garmin token validation.

### Garmin and OpenAI (upstream)

Both enforce their own server-side limits; the backend does not mirror them.

## Endpoints Summary

| Service | Method    | Endpoint                                                             | Purpose                              |
| ------- | --------- | -------------------------------------------------------------------- | ------------------------------------ |
| Backend | POST      | `/api/garmin/exchange-ticket`                                        | CAS ticket → OAuth2 tokens           |
| Backend | POST      | `/api/garmin/refresh-token`                                          | Refresh access_token (OAuth1-signed) |
| Backend | POST      | `/api/ai/generate-from-context`                                      | Suggest a workout from context       |
| Backend | POST      | `/api/ai/process-text-multiple`                                      | Extract workouts from text           |
| Backend | POST      | `/api/ai/process-image-multiple`                                     | Extract workouts from an image       |
| Garmin  | (WebView) | `https://sso.garmin.com/sso/embed`                                   | SSO login + ticket capture           |
| Garmin  | POST      | `https://connectapi.garmin.com/workout-service/workout`              | Create workout                       |
| Garmin  | GET       | `https://connectapi.garmin.com/workout-service/workouts`             | List workouts                        |
| Garmin  | POST      | `https://connectapi.garmin.com/workout-service/schedule/{workoutId}` | Schedule workout                     |
| OpenAI  | POST      | `https://api.openai.com/v1/chat/completions`                         | Text / vision analysis               |

---

**Last Updated**: 2026-05-03
**Documentation Version**: 2.0
