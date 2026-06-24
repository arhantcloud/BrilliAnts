# Counting & Combinatorics

A mobile-first, interactive course that teaches the foundations of combinatorics and
probability through short, hands-on lessons. Built with Vite + React + TypeScript and
Firebase (Auth + Firestore). See [PRD.md](./PRD.md) for the full product spec.

## Features

- Email/password accounts (Firebase Auth) with cross-device progress sync (Firestore).
- One course, five short lessons covering the four combinatorics problem types plus the
  Choice-vs-Distribution connection.
- Ordered, unlockable lesson path with completion status and a course progress bar.
- Interactive lesson player: concept steps, multiple-choice, and a drag-to-build
  sequence with a live visual that responds as you arrange items.
- Instant feedback with hints/explanations on wrong answers and unlimited retries.
- Daily streak and a satisfying lesson-complete screen that recommends the next lesson.
- Resume from the first incomplete step; progress and streak persist across sessions.
- Mobile-first responsive UI.

## Tech stack

- TypeScript (strict) + Vite + React 18
- React Router, Tailwind CSS
- dnd-kit (touch-friendly drag and drop)
- Firebase Authentication + Cloud Firestore

## Getting started

```bash
npm install
npm run dev
```

The app runs at the URL Vite prints (default http://localhost:5173).

### Firebase (optional for local dev)

Without Firebase keys the app runs in **offline mode**: accounts and progress are
stored in `localStorage` on the current device, so you can develop and test the full
flow immediately.

For real accounts and cross-device sync, create a Firebase project, enable
Email/Password auth and Cloud Firestore, then copy `.env.example` to `.env` and fill in:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

User data is stored at `users/{uid}` as `{ progress, stats }`.

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - type-check and build for production
- `npm run preview` - preview the production build
