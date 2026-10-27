# 🌍 GlobeTalk — The 24/7 Virtual Language Cafe

> **A browser-based, real-time social voice chat platform for global language exchange and speaking practice (inspired by Free4Talk).**

---

## 🎯 Purpose & Philosophy

Millions of language learners study grammar rules and flashcards in isolation, but freeze up when speaking with real humans. **GlobeTalk** exists to eliminate that friction:

- **24/7 Virtual Language Cafe:** Drop into active voice rooms organized by target language and proficiency level with a single click.
- **Zero Friction Access:** No scheduling, no expensive tutoring fees, no algorithmic matching delays. Drop straight into speaking.
- **Communication Over Perfection:** A supportive peer-to-peer community where making mistakes is welcomed and natural cultural exchange thrives across 100+ countries.

---

## 🚀 Core Features Implemented

### 1. Frictionless Onboarding & Identity
- **One-Click Sign-In:** Instant Google OAuth authentication and instant demo profile switching.
- **Peer Verification System:** New learners start as *Unverified*. By engaging in respectful conversations and receiving **3 vouches** from verified community members, they earn **Verified** status with a verified shield badge and moderation privileges.

### 2. The Live Lobby (Discovery Dashboard)
- **Active Room Grid:** Real-time visual dashboard showcasing active voice rooms.
- **Visual Capacity Slots:** Each card displays circular avatar slots for active speakers alongside dashed empty seats (e.g. *3 of 6 seats filled*), allowing users to see room availability at a glance.
- **Smart Filtering:** Instant filtering by **Target Language** (English, Spanish, French, German, Japanese, Hindi, Korean, etc.), **Proficiency Level** (Beginner, Intermediate, Advanced, All), or search by topic keyword (e.g., *IELTS, Coffee, JLPT*).
- **Instant Join:** Direct **"Join and Talk Now"** button on every open card, plus **"Listen In"** for silent learners.

### 3. Custom Room Creation
- **Custom Topic / Headline:** Set custom topics like *"IELTS Band 7+ Speaking Practice"* or *"Casual Late-Night Coffee Chat ☕"*.
- **Bilingual Exchange Support:** Choose up to 2 languages for mutual language exchange (e.g. Spanish & English).
- **Participant Capacity Slider:** Flexible limit from 1-on-1 practice up to small groups of 10 speakers, plus unlimited silent listeners.
- **Privacy Controls:** Public room or Locked/Private room.
- **Starter Conversation Prompts:** Seed discussion questions for immediate conversation starters.

### 4. Inside the Voice Room (The Speaking Experience)
- **Low-Latency WebRTC Voice Grid:** Real-time mesh peer-to-peer audio with animated glowing neon-green rings around active speakers using the Web Audio API.
- **Comprehensive Audio Toolbar:**
  - One-click **Mute / Unmute** microphone with state indicator
  - **Deafen** (mute incoming sound)
  - **Bandwidth & Stability Selector** (*High*, *Standard*, *Low-Bandwidth*)
  - **Leave Room** button
- **Collaborative Media & Text Sidebar:**
  - **Live Chat:** Real-time messaging with quick emoji reactions.
  - **Vocab & Corrections:** Dedicated card format designed specifically for language learners (*Original mistake* ➔ *Native phrasing* ➔ *Grammar explanation note*) with a **"Save to Flashcards"** bookmark.
  - **Shared Notes & Prompts:** Live conversation starter prompts and a collaborative vocabulary scratchpad synchronized across all participants.
- **Host Self-Moderation:** The room host can force-mute disruptive microphones, kick misbehaving users, transfer host status, or lock the room.

### 5. Social Graph & Community Retention
- **Follow & Friends System:** Click any speaker's avatar to view their language profile and follow them.
- **Live Friend Presence:** Dedicated sidebar drawer showing which friends are online, which voice room they are currently sitting in, and a 1-click **"Join Room"** button.
- **Peer Vouching:** Verified community members can vouch for unverified peers directly inside rooms or via user profiles.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS v4, Lucide React |
| **State Management** | Zustand (persistent auth, active voice room, WebRTC stream state) |
| **Real-Time Signaling** | Node.js, Express, Socket.IO 4.x (WebRTC offer/answer/ICE exchange, room presence, chat broadcast) |
| **Voice Engine** | Browser Native WebRTC (Mesh P2P Audio, STUN servers) + Web Audio API Voice Activity Detection (VAD) |
| **Styling & UX** | Glassmorphic dark UI, animated speaking pulse rings, scannable flags, responsive mobile & desktop layout |

---

## ⚡ Quick Start

### 1. Start the Signaling & API Server
```powershell
cd server
npm run dev
```
*Server runs on `http://localhost:3001`.*

### 2. Start the Client
```powershell
cd client
npm run dev
```
*Client runs on `http://localhost:5173`.*

Open your browser to `http://localhost:5173` and click **"Join and Talk Now"** on any room to start speaking!
