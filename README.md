# UandMe (PulseChat) — Real-Time Messaging & Calling Platform

![UandMe Banner](docs/assets/banner.jpg)

> A modern, high-performance real-time messaging and WebRTC audio/video calling application inspired by WhatsApp Web.

---

## 🎯 Project Overview

**UandMe** is an ultra-responsive, secure, and intuitive web messaging and calling platform. It combines a clean, accessible **Emerald Green** brand design system with an eye-friendly **Deep Charcoal** dark mode, comprehensive UI component library, and future-proof architectural foundations for real-time WebSocket communication and RESTful APIs.

---

## 🚀 Tech Stack

| Technology | Purpose | Version |
| :--- | :--- | :--- |
| **React.js** | Declarative Component-Based UI | `^18.3.1` |
| **Vite** | Lightning-fast Build Tool & Dev Server | `^5.4.10` |
| **Tailwind CSS** | Utility-first Design System Engine | `^3.4.17` |
| **React Router DOM** | Client-Side SPA Routing & Navigation | `^7.18.4` |
| **Lucide React** | Consistent, Scalable SVG Iconography | `^1.60.0` |
| **Axios** | HTTP Client with Interceptors for Backend Integration | `^1.20.0` |
| **Socket.IO Client** | Real-Time Bidirectional Event Streaming Wrapper | `^4.8.4` |

---

## 📂 Scalable Project Architecture

```text
iAndU/
├── frontend/                   # React.js + Vite + Tailwind CSS Single Page Application
│   ├── public/                 # Static assets and icons
│   ├── src/
│   │   ├── components/         # Chat, common, contacts, forms, layout, settings
│   │   ├── context/            # AuthContext, ThemeContext, ToastContext, SocketContext
│   │   ├── hooks/              # useAuth, useDebounce, useSocket, useTheme, useToast
│   │   ├── layouts/            # AuthLayout, MainLayout, SettingsLayout
│   │   ├── pages/              # ChatPage, ContactsPage, Settings, Auth pages
│   │   ├── services/           # api, authService, chatService, messagingService, socket
│   │   ├── styles/             # index.css with design tokens
│   │   └── utils/              # cn, constants, formatters, validators
│   ├── index.html              # HTML entry point
│   ├── vite.config.js          # Vite build config
│   ├── tailwind.config.js      # Tailwind design system configuration
│   ├── package.json            # Frontend dependencies & scripts
│   └── .env                    # Frontend environment variables
│
├── backend/                    # Node.js + Express + Socket.IO + MongoDB Server
│   ├── src/
│   │   ├── config/             # DB connection & environment validation
│   │   ├── controllers/        # auth, user, chat, message controllers
│   │   ├── middleware/         # authMiddleware, helmet, rateLimiter, dbGuard, mongoSanitize
│   │   ├── models/             # Mongoose schemas (User, Conversation, Message)
│   │   ├── routes/             # REST endpoints (/api/auth, /api/users, /api/chats, /api/messages)
│   │   ├── services/           # messageService and conversation queries
│   │   ├── socket/             # Socket.IO handlers (room join, send, typing, read, presence)
│   │   └── utils/              # validators, safe logger
│   ├── tests/                  # Vitest + Supertest automated integration test suite
│   ├── vitest.config.js        # Test runner configuration
│   ├── package.json            # Backend dependencies & test scripts
│   └── .env                    # Backend environment variables
│
├── package.json                # Root workspace orchestration scripts
└── README.md                   # Project documentation & architectural specification
```

---

## 🎨 Contacts & Conversation Management

### 1. Contacts Management Workspace (`/contacts`)
* **Alphabetical Grouping**: Contacts are automatically categorized into sticky alphabetical sections (`A`, `B`, `C`...) with contact counts.
* **A–Z Jump Rail**: Instant letter navigation bar to jump directly to any alphabet section.
* **Live Search**: Multi-field search across full name, email address, handle, and team/department.
* **Status Filter Tabs**: Instant filtering by `All Contacts`, `Online`, and `Offline`.
* **Profile Details Panel**: Side-by-side preview showing avatar, presence indicator, about bio, email, phone, department/organization, joined date, and 256-bit encryption badge.
* **Direct Conversation Initiation**: One-click "Message" trigger opens or creates the conversation thread and navigates to [`/chat/:chatId`](file:///d:/java/iAndU/src/pages/ChatPage.jsx).
* **Resilience Sandbox Bar**: Includes "Simulate Loading" and "Test Error State" controls with retry buttons for testing network states.

### 2. New Chat Interface (`NewChatModal.jsx`)
* **Registered Users Directory**: Search verified team members, colleagues, and contacts.
* **Search by Name or Email**: Fast dual search filtering with query matching.
* **Live Profile Preview**: Displays selected user details (avatar, role badge, department, bio) before messaging.
* **Clear User Feedback**: Instant selection highlights, toast notification, and automatic redirection to chat.

### 3. Comprehensive Conversation Controls
* **Pin Conversation**: Keeps priority chats pinned to the top of the conversation list with a diagonal `Pin` badge.
* **Mute Notifications**: Toggles notification state, displaying a `BellOff` icon badge on the conversation item.
* **Archive Conversation**: Moves inactive threads into the dedicated "Archived" view.
* **Mark as Unread**: Toggles unread message counter badge (`1` / `0`) on the conversation item.
* **Clear Messages**: Destructive action guarded by `ConfirmationModal` (`variant="warning"`, `Eraser` icon) that clears message history.
* **Delete Conversation**: Destructive action guarded by `ConfirmationModal` (`variant="danger"`, `Trash2` icon) that removes the chat from the inbox.
* **Block Contact**: Destructive action guarded by `ConfirmationModal` (`variant="danger"`, `Ban` icon) that restricts messages, shows an alert banner in the chat header, disables the message composer, and enables quick unblocking.

---

## ⚙️ Profile & Settings Suite

### 1. My Profile (`/settings/profile`)
* **Avatar Management**: Displays current photo with live presence dot. Includes the `AvatarPickerModal` allowing users to upload custom image files (with 3MB check and DataURL reader), pick from 8 diverse preset portraits, enter a custom image URL, or remove the avatar.
* **Identity Form**: Editable display name, verified email address, customizable about/status message with a 120-character counter, department/organization, and title.
* **Presence Status**: Interactive buttons to switch between `Online`, `Away`, `Busy`, and `Offline`.
* **Form Validation & Actions**: Real-time validation requiring names >= 2 chars; Save and Cancel buttons (Cancel resets to current user data).

### 2. Account Settings (`/settings/account`)
* **Account Information**: User ID, verification status, user handle, and account creation date.
* **Media & Cloud Quota**: Visual progress bar showing storage quota utilization (`142 MB / 5.0 GB used • 2.8%`).
* **Data Portability**: "Request Export" button that prepares a machine-readable JSON archive of chat history and metadata.
* **Sign Out**: Explicit logout button with confirmation dialog.
* **Danger Zone**: Delete Account card with `ConfirmationModal` explaining permanent removal policies.

### 3. Appearance & Theme Settings (`/settings/appearance`)
* **Theme Modes**: One-click switching between **Light Theme**, **Dark Mode** (deep charcoal), and **System Sync** (dynamically listens to OS `prefers-color-scheme`).
* **Visual Theme Cards**: Interactive preview cards showing color palette swatches and mini message previews.
* **Theme Persistence**: Theme preferences are persisted in `localStorage` under `pulsechat_theme` and applied consistently across all routes.
* **Message Bubble Density**: Radio options for `Compact`, `Comfortable` (default), and `Spacious`.
* **Chat Typography**: Font scaling presets (`Small 13px`, `Medium 14px`, `Large 16px`).

### 4. Notification Settings (`/settings/notifications`)
* **Message Alerts**: Granular toggles for desktop push notifications, direct messages, group chats, and `@mentions` only.
* **Audio Chimes**: Play chime on incoming messages, tone selection (`Pulse Emerald`, `Classic Ding`, `Subtle Tick`), and a "Test Tone" button that plays an audio chime using the Web Audio API.
* **Preview Privacy**: Radio choices for notification previews (`Full Details`, `Sender Name Only`, `Completely Hidden`).
* **Accessible Toggles**: Built using `SettingsToggle` with `role="switch"`, `aria-checked`, and keyboard controls.

### 5. Privacy Settings (`/settings/privacy`)
* **Last-Seen Visibility**: Choose who can see your last-seen timestamp (`Everyone`, `My Contacts Only`, `Nobody`).
* **Online Status Visibility**: Stealth mode option to hide active online presence indicator.
* **Profile Visibility**: Granular controls for profile photo visibility and about/status visibility.
* **Read Receipts**: Toggle sending and receiving double emerald checkmarks (`✓✓`).
* **Blocked Contacts Manager**: Live list of blocked contacts with one-click "Unblock" action.

### 6. Security Settings (`/settings/security`)
* **Change Password**: Form with Current Password, New Password, and Confirm Password fields.
* **Password Validation**: Live 4-tier visual `PasswordStrengthIndicator` evaluating length, casing, numbers, and symbols.
* **Safe Client Architecture**: In accordance with security standards, passwords and authentication tokens are never saved in insecure plaintext storage.
* **Two-Factor Authentication (2FA)**: Toggle setting for Duo Mobile and TOTP authenticator apps.
* **Active Devices & Sessions**: Device cards showing the current browser session (`Chrome on Windows 11 • This Device`) alongside other authenticated devices, with a "Sign Out of All Other Devices" confirmation button.

---

## ⚡ Phase 6: Frontend Real-Time Messaging Behavior

Phase 6 implements the complete real-time networking and state reconciliation architecture needed for high-throughput, low-latency messaging while preserving the existing UI design system.

### 🌐 Architectural Overview

```text
┌────────────────────────────────────────────────────────┐
│                   React Component Tree                 │
│  (ChatPage, ChatArea, MessageList, MessageComposer)    │
└────────────▲───────────────────────────────▲───────────┘
             │ (State / Callbacks)           │
┌────────────▼───────────────────────────────▼───────────┐
│                      SocketContext                     │
│      Provides connection status, reconnect, service     │
└────────────▲───────────────────────────────▲───────────┘
             │                               │
┌────────────▼──────────────┐   ┌────────────▼───────────┐
│     messagingService      │   │      socketService     │
│  • Optimistic UI queue    │   │  • Singleton Socket.IO │
│  • Server ack reconcile   │   │  • Authenticated auth  │
│  • Typing debouncers      │   │  • Reconnection logic  │
│  • Sandbox mock fallback  │   │  • Leak-free listeners │
└────────────▲──────────────┘   └────────────▲───────────┘
             │                               │
             └───────────────┬───────────────┘
                             ▼
              WebSocket / Polling Gateway
               (http://localhost:5000)
```

### 🔑 Environment Variables

The frontend reads configuration through Vite environment variables (`import.meta.env`):

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `string` | `http://localhost:5000/api` | Base URL for RESTful endpoints |
| `VITE_SOCKET_URL` | `string` | `http://localhost:5000` | Gateway URL for Socket.IO connection |
| `VITE_ENABLE_MOCK_FALLBACK` | `boolean` | `true` | When `true`, activates Dev Mock Sandbox mode when the backend is offline so testers can test all messaging behaviors offline. In production, set to `false`. |
| `VITE_SOCKET_RECONNECT_ATTEMPTS` | `number` | `5` | Maximum reconnection attempts before switching to offline/fallback state |
| `VITE_SOCKET_RECONNECT_DELAY` | `number` | `2000` | Milliseconds backoff between reconnection attempts |

---

## 📋 Proposed Frontend-Backend Contract

To allow backend developers to seamlessly connect their server implementation to this frontend, PulseChat adheres to the following contract specification:

### 1. REST Endpoints

All protected endpoints require the HTTP header: `Authorization: Bearer <JWT_TOKEN>`.

| Method | Endpoint | Description | Request Body | Response Body |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user | `{ email, password }` | `{ user, token }` |
| `POST` | `/api/auth/register` | Register new account | `{ name, email, password }` | `{ user, token }` |
| `GET` | `/api/chats` | List user's conversations | `?filter=all&search=&view=chats` | `Array<Conversation>` |
| `GET` | `/api/chats/:id/messages` | Message history for room | `?limit=50&before=` | `Array<Message>` |
| `POST` | `/api/chats/:id/messages` | Send message (REST fallback) | `{ text, attachments }` | `Message` |
| `GET` | `/api/contacts` | List contacts directory | `?search=&status=all` | `Array<Contact>` |
| `GET` | `/api/users/search` | Directory search | `?q=<term>` | `Array<UserPreview>` |

### 2. Socket.IO Connection Handshake

* **URL**: `SOCKET_URL` (e.g. `http://localhost:5000`)
* **Transport**: `['websocket', 'polling']`
* **Auth payload**:
  ```json
  {
    "token": "Bearer <JWT_TOKEN>"
  }
  ```
* **Server Verification**: The server extracts and verifies the JWT token. If invalid or expired, the server emits `connect_error` with `status: 401 Unauthorized` and disconnects the client.

### 3. Socket.IO Client ➔ Server Events

#### `join_conversation`
Request to join an authorized conversation room.
* **Payload**:
  ```json
  {
    "conversationId": "conv_1"
  }
  ```
* **Acknowledgement**:
  - Success: `{ "status": "ok", "conversationId": "conv_1" }`
  - Rejection: `{ "status": "error", "message": "Access forbidden: you are not a member of this conversation" }`

#### `leave_conversation`
Notify server the user has switched out of this conversation view.
* **Payload**:
  ```json
  {
    "conversationId": "conv_1"
  }
  ```

#### `send_message`
Emit a new message with optimistic client tracking.
* **Payload**:
  ```json
  {
    "conversationId": "conv_1",
    "text": "Hello world!",
    "attachments": [
      { "type": "image", "name": "screenshot.png", "size": "1.2 MB" }
    ],
    "clientMessageId": "msg_client_1729500000000_abc12"
  }
  ```
* **Server Acknowledgement Callback**:
  - Success:
    ```json
    {
      "status": "ok",
      "message": {
        "id": "msg_srv_987654",
        "clientMessageId": "msg_client_1729500000000_abc12",
        "conversationId": "conv_1",
        "senderId": "usr_me_1",
        "text": "Hello world!",
        "attachments": [],
        "timestamp": "2026-10-21T15:30:00.000Z",
        "status": "sent"
      }
    }
    ```
  - Rejection: `{ "status": "error", "message": "Failed to persist message" }`

#### `typing` & `stop_typing`
Notify other participants that the user is typing.
* **Payload**:
  ```json
  {
    "conversationId": "conv_1"
  }
  ```

#### `mark_read`
Request the server to authoritatively mark conversation messages as read.
* **Payload**:
  ```json
  {
    "conversationId": "conv_1",
    "messageIds": ["msg_srv_987654"]
  }
  ```

### 4. Socket.IO Server ➔ Client Events

#### `receive_message`
Broadcast when any authorized member sends a message in the room.
* **Payload**:
  ```json
  {
    "id": "msg_srv_987654",
    "conversationId": "conv_1",
    "senderId": "usr_peer_2",
    "senderName": "Sarah Jenkins",
    "text": "Hey there! Looking forward to the review.",
    "attachments": [],
    "timestamp": "2026-10-21T15:30:05.000Z",
    "status": "sent"
  }
  ```

#### `message_status_updated`
Broadcast authoritative delivery and read updates.
* **Payload**:
  ```json
  {
    "messageId": "msg_srv_987654",
    "clientMessageId": "msg_client_1729500000000_abc12",
    "conversationId": "conv_1",
    "status": "delivered" // "sent" | "delivered" | "read" | "failed"
  }
  ```

#### `typing` & `stop_typing`
Broadcast peer typing state to members currently in `conversationId`.
* **Payload (`typing`)**:
  ```json
  {
    "conversationId": "conv_1",
    "userId": "usr_peer_2",
    "userName": "Sarah Jenkins"
  }
  ```
* **Payload (`stop_typing`)**:
  ```json
  {
    "conversationId": "conv_1",
    "userId": "usr_peer_2"
  }
  ```

---

## 📞 WebRTC 1-to-1 Audio & Video Calling

UandMe features a full-fidelity WhatsApp-style peer-to-peer calling system built on WebRTC and Socket.IO real-time signaling:
* **Audio & HD Video Modes**: Initiate 1-on-1 voice or video calls directly from the chat header or contact details panel.
* **Signaling Pipeline**: Low-latency bi-directional negotiation of SDP offers, answers, and ICE discovery candidates via Socket.IO events (`call:initiate`, `call:incoming`, `call:accept`, `call:reject`, `call:busy`, `call:offer`, `call:answer`, `call:ice_candidate`, `call:end`, `call:cancel`).
* **Real-Time Presence & Busy State**: `PresenceManager` tracks active user sockets, preventing call collisions by emitting `call:busy` if the recipient is engaged on another call.
* **WhatsApp Desktop Call Modal**: Floating overlay window with incoming and outgoing states, synthetic ringtones generated via Web Audio API, Picture-in-Picture (PiP) local preview, remote video stream rendering, microphone mute, camera toggle, and screen sharing.
* **Signaling Test Automation**: Validated through `backend/test_webrtc_calls.js` verifying offline routing, call ringing, peer answering, candidate signaling, call termination, and caller cancellation.

---

## 🛡️ Critical Security Rules & Safeguards

1. **Server-Side Room Authorization**: The client never blindly asserts room presence. Joining a room emits `join_conversation` with an acknowledgement; the server inspects the authenticated JWT user and rejects unauthorized room join requests.
2. **Authoritative Status Ticks**: Client-generated ticks are strictly temporary optimistic hints (`sending`). The client waits for server-originated `message_status_updated` broadcasts before rendering permanent `delivered` (`✓✓`) or `read` (`✓✓` colored) checkmarks.
3. **No Hardcoded Secrets**: All backend URIs and configuration parameters are loaded via environment variables (`.env`). Tokens are obtained only after cryptographically validated login/registration handshakes.
4. **Segregated Dev Mock Sandbox**: When `VITE_ENABLE_MOCK_FALLBACK=true` and the backend is unreachable, the client enters `mock_mode`. Mock messages and simulated replies are explicitly tagged with `[Dev Mock Sandbox]` pills and prefixed so users are never misled into believing simulated messages are real peers.
5. **Leak-Free Event Subscriptions**: Every subscription method in `messagingService` and `socketService` returns a self-contained teardown function (`() => unsub()`) invoked on React component unmount, preventing memory leaks and duplicate listeners.

---

## 🛠️ Installation & Getting Started

### 1. Prerequisites
Ensure you have **Node.js** (version `18.0.0` or higher) and **MongoDB** running:
```bash
node -v
npm -v
```

### 2. Configure Environment Files
Configure both the frontend and backend environment files:
```bash
# Frontend environment
cp frontend/.env.example frontend/.env

# Backend environment
cp backend/.env.example backend/.env
```

### 3. Install Dependencies
Install dependencies for both workspaces:
```bash
npm run install:all
```
*(Or navigate to `frontend` and `backend` separately and run `npm install`).*

### 4. Running the Development Servers
In the project root, start both the backend and frontend servers with a single command:
```bash
npm run dev
```
*(Backend runs on `http://localhost:5000` and Frontend runs on `http://localhost:5173`).*

### 5. Running Automated Backend & WebRTC Tests
Run the complete integration test suites:
```bash
# Vitest + Supertest integration test suite (24 tests across auth, users, chats, messages, and sockets)
npm run test:backend

# WebRTC signaling integration tests
node backend/test_webrtc_calls.js
```

### 6. Build Frontend for Production
```bash
npm run build:frontend
```
*(Compiles cleanly with zero errors).*

---

## 🧪 Quick Test & Verification Checklist

1. **Real-Time Connection Badge**:
   - In `/chat`, observe the `ConnectionStatusBadge` rendered in both the Conversation List header and the Active Chat header.
   - When running offline without a live backend, notice the indicator: **`Dev Sandbox`** / **`Sandbox`**.
2. **Optimistic Message Sending & Server Reconciliation**:
   - Type a message in the composer and press Enter.
   - Observe the message rendering instantly with the clock icon (`sending`).
   - Within 250ms, notice the server reconciliation updating the bubble to a single check (`sent`).
   - Within 900ms, notice the tick updating to a double check (`delivered`).
3. **Typing Indicators**:
   - Type into the composer: notice `messagingService.startTyping` triggers, with an automatic 1.8s debounce stop.
   - In sandbox mode, after sending a message, notice the incoming simulated typing indicator.
4. **Audio & Video Calling**:
   - Click the Phone or Video Camera icon in the chat header to initiate a 1-to-1 WebRTC call.
   - Test audio ringing, call accept/reject, mute, camera toggle, and screen share controls.
5. **Failed Message & Retry**:
   - If an error or rejection occurs, observe the bubble displaying an alert icon and "Failed to send - Tap to retry".
   - Clicking "Retry" triggers `messagingService.retryMessage()` and re-queues the message.

