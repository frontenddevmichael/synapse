# Synapse

**Synapse** is a room-based collaborative learning platform that helps small groups study more effectively by turning shared documents into AI-generated quizzes. It is designed for focus, structure, and correctness — not social feeds, not content discovery, and not noise.

---

## What Synapse Is

* A **collaborative learning tool**, not a social network
* A **room-first system** with clear ownership and enforced rules
* A **quiz-driven learning workflow** powered by AI
* A **Progressive Web App (PWA)** built for modern browsers and devices

Users create or join rooms, upload study materials, generate quizzes, and take them individually or competitively depending on the room’s configuration.

---

## Core Features

### Authentication

* Email and password sign-up / login
* Unique usernames
* Secure session persistence via Supabase Auth
* Light and dark mode support

---

### Rooms

* Create rooms and invite others using unique room codes
* Clear owner role with control over room settings
* Automatic member management

**Room Modes**

| Mode      | Description                                                    |
| --------- | -------------------------------------------------------------- |
| Study     | Answers visible, leaderboard optional                          |
| Challenge | Timed quizzes, leaderboard enabled                             |
| Exam      | Timed quizzes, answers hidden until completion, no leaderboard |

Room rules are enforced at both the backend and frontend level.

---

### Documents → AI Quizzes

* Upload PDFs or paste raw text
* Documents stored in Supabase Storage
* AI converts content into structured quizzes
* Supported question types:

  * Objective Qustions (multiple Choice)
  * True / False
* Difficulty levels: easy, medium, hard

---

### Quiz Experience

* One question displayed at a time
* Optional time limits
* Single attempt per user per quiz (soft enforced)
* Clear progress indicators and completion feedback

**Quiz lifecycle:**
Not Started → In Progress → Completed

---

### Leaderboards

* Per-room leaderboards
* Ranked by quiz score
* Enabled or disabled by room owner
* Automatically updated after quiz completion
* Visibility depends on room mode

---

### User Preferences

Each user can set persistent preferences:

* Default quiz difficulty
* Preferred time limits
* Answer reveal behavior

User preferences apply automatically but **never override room-level rules**.

---

## Tech Stack

### Frontend

* Vanilla HTML, CSS, and JavaScript (ES Modules)
* Modular component and style architecture
* Responsive and accessible UI
* Subtle, intentional animations (150–200ms)

### Backend

* Supabase Auth
* Supabase Postgres
* Supabase Storage

### AI

* First-party AI integration (OpenAI / Groq compatible)
* Deterministic, schema-based quiz generation

### PWA

* Installable on desktop and mobile
* Offline-ready application shell
* Cached access to previously synced rooms and quizzes

---

## Data Model (Supabase)

Core tables:

* Users
* Rooms
* RoomMembers
* Documents
* Quizzes
* Questions
* QuizAttempts
* UserPreferences

All relationships are normalized and enforced with foreign keys.

---

## Project Structure

```
/frontend
  /components
  /styles
  /utils
/backend
  supabase-scripts.sql
/manifest.json
/service-worker.js
```

---

## Local Development

1. Create a Supabase project
2. Run the SQL schema in `backend/supabase-scripts.sql`
3. Configure Supabase keys in the frontend
4. Serve the frontend using a local static server

---

## Product Principles

* Focus over feature bloat
* Explicit rules over implicit behavior
* Correctness and reliability over speed
* Calm, human-centered UX

Synapse is intentionally constrained. Every feature exists to support structured, room-based learning — nothing more.

---

## License

MIT
