# PRD: Probability & Statistics Micro-Course (Brilliant-style)

## 1. Summary

A mobile-first, interactive learning web app that teaches the foundations of
combinatorics and probability through short, hands-on lessons. The MVP delivers a
single course, "Probability & Statistics: Counting & Combinatorics," made of
sequenced lessons that the learner unlocks in order. Each lesson is a sequence of
interactive slides that introduce an idea and then make the learner *do something*
with it, with instant feedback on every answer. Progress and streaks persist across
sessions and devices via real accounts and a backend.

## 2. Target User (Persona)

**"Maya," 16-18, self-driven STEM learner.**

- Strong general math foundation, but **new to combinatorics and statistics**.
- **Not enrolled** in a stats class; learning out of personal passion.
- Motivated by a **sense of commitment and visible progress** (streaks, completion).
- Often learns on a **phone**, in short sessions.

**Implications for the product**

- Lessons must be short (a few minutes) so finishing feels rewarding.
- No assumed prior combinatorics vocabulary; build concepts from scratch.
- Progress, ordering, and streaks must be obvious and motivating.
- Mobile-first UX is a hard requirement, not an afterthought.

## 3. Goals & Non-Goals

### Goals (MVP)

- Teach the **4 combinatorics problem types** and the **Choice vs. Distribution**
connection through interactive lessons.
- Make at least **one rich interactive problem type beyond multiple choice** that
*teaches* the concept (drag-and-drop / tap-to-build sequence).
- Provide **instant, constructive feedback** (hints/explanations, never just a red X).
- Enforce an **ordered, unlockable course path** with completion tracking.
- **Persist** progress and streak across sessions and devices (real accounts).
- Work well on **phone-sized screens**.

### Non-Goals (MVP)

- Multiple courses or subjects (only one course).
- Social features, leaderboards, comments, or sharing.
- XP/points, badges, daily-goal reminders, or spaced-repetition review engine
(deferred; habit loop is intentionally minimal for MVP).
- Content authoring/admin UI (lessons are seeded by developers).
- Native mobile apps (responsive web only).

## 4. Refined User Stories

Original stories are kept and sharpened with acceptance criteria.

### 4.1 Account & Access

- **As a learner, I can create an account and log in** so my progress is saved and
available on any device.
  - AC: Email/password sign-up and login with real backend auth.
  - AC: Session persists across reloads; logout clears the session.
  - AC: After login, the learner lands on the course path showing their progress.

### 4.2 Course & Lesson List

- **As a learner, I can view the course as an ordered list of lessons with completion
status**, and I can only open the next available lesson.
  - AC: Each lesson shows a state: `locked`, `available`, `in-progress`, `completed`.
  - AC: Lesson N becomes `available` only when lesson N-1 is `completed`.
  - AC: A course-level progress indicator shows lessons completed / total.

### 4.3 Lesson Player (Slides/Steps)

- **As a learner, I can start a lesson and move through its slides** to learn the
material step by step.
  - AC: A lesson is an ordered sequence of slides ("steps").
  - AC: Each slide either teaches an idea or asks the learner to act on it.
  - AC: Navigation shows position within the lesson (e.g., step 3 of 7).

### 4.4 Interactive Steps & Feedback

- **As a learner, I can interact with a slide using an interaction relevant to the
topic** to solve a problem and deepen understanding.
  - AC: At least two interaction types exist: multiple choice and a
  **drag-and-drop / tap-to-build sequence**.
  - AC: Every answer gets **instant feedback**.
  - AC: A wrong answer shows a **hint or explanation**, not just an error.
  - AC: The learner can retry after a wrong answer.

### 4.5 Visual & Hands-On

- **As a learner, I can manipulate an interactive element and watch a visual respond
in real time** so I can experiment and build intuition.
  - AC: At least one slide updates a visual (e.g., a sample-space tree or outcome
  count) live as the learner builds/reorders items.

### 4.6 Combinatorics Concepts

- **As a learner, I can learn the 4 combinatorics problem types** defined by two axes:
*order matters / doesn't matter* and *with / without replacement*.
- **As a learner, I can connect Choice experiments and Distribution experiments** and
see why they count the same structures.

### 4.7 Progress, Mastery & Persistence

- **As a learner, my lesson progress and completion are tracked and persist after
logout/login** (and across devices).
  - AC: A lesson is made of slides; the learner resumes from the **first incompleted
  slide**.
  - AC: Progress *within* a single slide need not be saved.
  - AC: Completing the last slide marks the lesson `completed` and unlocks the next.

### 4.8 Habit Loop (Minimal)

- **As a learner, I see a daily streak and my course progress** so I feel momentum.
  - AC: Streak increments on a day with at least one lesson interaction/completion.
  - AC: Finishing a lesson shows a satisfying completion screen with what's next.

## 5. MVP Scope

### 5.1 In Scope

- 1 course, 5 lessons (see Content Plan), each fully interactive.
- Email/password auth with real backend and cross-device sync.
- Ordered/unlockable lesson list with completion status.
- Lesson player with slide sequencing and resume-from-first-incomplete-slide.
- Interaction types: multiple choice + drag/tap-to-build sequence (with live visual).
- Instant feedback with hints/explanations on wrong answers.
- Minimal habit loop: daily streak + course/lesson progress + completion screen.
- Persistent progress, completion, and streak across sessions and devices.
- Responsive, mobile-first UI.

### 5.2 Out of Scope (Future)

- Additional rich interactions (sliders, number-line plotting, expanding trees).
- XP/badges, daily reminders, review/remediation engine, multiple courses.
- Admin/content authoring tools, analytics dashboards.

## 6. Content Plan (Course: Counting & Combinatorics)

Five sequenced lessons. Each lesson is 5-8 short slides, a few minutes total.

- **Lesson 1 - The Two Questions (Foundations)**
  - Idea: every counting problem asks (a) does **order matter**? and (b) is there
  **replacement**? Introduces the 2x2 grid of problem types.
  - Interaction: drag-to-classify scenarios into the 2x2 grid; live count of correct
  placements.
- **Lesson 2 - Order Matters, Without Replacement (Permutations)**
  - Idea: arrangements; `n! / (n-k)!`.
  - Interaction: tap-to-build an ordered lineup; a sample-space/tree visual updates as
  the learner places each item.
- **Lesson 3 - Order Matters, With Replacement**
  - Idea: independent choices; `n^k` (e.g., PIN codes, repeated dice).
  - Interaction: build a sequence where items can repeat; outcome count updates live.
- **Lesson 4 - Order Doesn't Matter, Without Replacement (Combinations)**
  - Idea: selecting a group; `C(n,k)`; why we divide out order.
  - Interaction: drag items into a "selected set"; show how multiple ordered
  arrangements collapse to one combination.
- **Lesson 5 - Choice vs. Distribution (and Order Doesn't Matter, With Replacement)**
  - Idea: connect **Choice experiments** (picking items) with **Distribution
  experiments** (placing items into bins); introduce stars-and-bars intuition for
  "order doesn't matter, with replacement."
  - Interaction: drag identical items into bins and watch it map to an equivalent
  choosing problem; the matching choice-count updates live.

> Note: The 4 combinatorics types are fully covered across Lessons 2-5; Lesson 1 is a
> recommended foundation framing the 2x2. If a leaner MVP is needed, Lesson 1 can be
> merged into Lesson 2.

## 7. Functional Requirements (by feature)

### 7.1 Authentication

- Sign up / log in / log out with email + password (backend-managed).
- Authenticated session restored on app load.
- All learner data is keyed to the authenticated user.

### 7.2 Course & Path

- Single course rendered as an ordered list/path of lessons with per-lesson status.
- Gating: a lesson is `available` only if the previous lesson is `completed`.
- Course progress summary (e.g., "2 / 5 lessons complete").
- After completing a lesson, recommend/auto-highlight the next lesson.

### 7.3 Lesson Player

- Ordered slides; forward navigation gated by completing required interactions.
- Position indicator (step X of N) and a way to exit back to the path.
- On re-entry, resume at the **first incompleted slide**.

### 7.4 Interactions & Feedback

- **Multiple choice:** single/multi-select; instant correct/incorrect feedback.
- **Drag/tap-to-build sequence:** learner arranges or selects items to form an answer;
validates ordering/membership; **live visual** (tree/sample space/outcome count)
responds to each action.
- Wrong answers surface a contextual **hint or explanation** and allow retry.
- Correct answers confirm and allow advancing.

### 7.5 Progress & Mastery Tracking

- Persist per-lesson: status and index of first incompleted slide.
- Mark lesson `completed` when the final slide's interaction is satisfied.
- Within-slide partial state is **not** persisted (by design).

### 7.6 Habit Loop (Minimal)

- Daily streak: increments once per active day; resets after a missed day.
- Course/lesson progress visible on the path and lesson player.
- Lesson-complete screen: confirmation, streak status, and "next lesson" CTA.

### 7.7 Mobile & Responsive

- Layouts, touch targets, and drag interactions designed for phone screens first.
- Drag/tap interactions must be fully usable via touch.

## 8. Technical Direction

Required stack for the MVP.

- **Build tooling (required):** **Vite** for dev server and production builds.
- **Language (required):** **TypeScript** across the entire frontend (strict mode),
with typed models for courses, lessons, slides, and progress.
- **Frontend:** React (mobile-first) on Vite + TypeScript, component library or
utility CSS (e.g., Tailwind), drag-and-drop via a touch-friendly library (e.g.,
dnd-kit), lightweight charting/SVG for live visuals.
- **Backend / persistence (required):** **Firebase** - Firebase Authentication for
email/password accounts and Cloud Firestore for progress, completion, and streak
data with cross-device sync.
- **State:** Firestore is the source of truth for progress/streak; client caches for
snappy UX and writes on slide completion and lesson completion.

### 8.1 Specific Tech Stack

- **Language:** TypeScript (strict mode).
- **Build tool / dev server:** Vite.
- **UI framework:** React 18 (function components + hooks).
- **Routing:** React Router.
- **Styling:** Tailwind CSS (mobile-first utilities).
- **Drag & drop:** dnd-kit (touch + pointer support).
- **Visuals/charts:** SVG + lightweight rendering (e.g., Recharts or hand-rolled SVG)
for live sample-space/outcome visuals.
- **State management:** React Context + hooks (lightweight; no Redux for MVP).
- **Backend - Auth:** Firebase Authentication (email/password).
- **Backend - Database:** Cloud Firestore (real-time, cross-device sync).
- **Firebase SDK:** `firebase` (v9+ modular SDK).
- **Hosting (suggested):** Firebase Hosting.
- **Tooling:** ESLint + Prettier; Vitest (optional) for unit tests.
- **Package manager:** npm.

### 8.2 Data Model (Firestore)

Collections/documents (course content can be seeded in Firestore or bundled as typed
static data; learner data lives in Firestore keyed by Firebase Auth `uid`).

- `users/{uid}` - email, created_at (Firebase Auth-managed; profile mirror optional).
- `courses/{courseId}` - title, description, order.
- `courses/{courseId}/lessons/{lessonId}` - title, order, summary.
- `lessons/{lessonId}/slides/{slideId}` - order, type
(`concept` | `mcq` | `build_sequence`), content (prompt, options, correct answer,
hint/explanation, visual config).
- `users/{uid}/lessonProgress/{lessonId}` - status
(`locked`/`available`/`in_progress`/`completed`), first_incomplete_slide_index,
updated_at.
- `users/{uid}/stats` - current_streak, last_active_date, lessons_completed_count.

### 8.3 Key Flows

- **Resume:** on lesson open, read `first_incomplete_slide_index` and jump there.
- **Advance:** on slide completion, increment index; on last slide, set lesson
`completed`, unlock next, update streak/stats.
- **Streak:** on any qualifying activity, compare `last_active_date` to today and
increment or reset.

## 9. Success Metrics & MVP Test Scenarios

The MVP is validated against these end-to-end scenarios:

1. **Complete a lesson with recovery:** a learner finishes one lesson end to end,
  answers some problems wrong, and uses the feedback (hint/explanation) to recover
   and continue.
2. **Interactive + live visual:** a learner manipulates the drag/tap interaction and
  watches the visual respond in real time.
3. **Persistence:** a learner leaves mid-lesson, returns (incl. a different device),
  and resumes from the first incompleted slide with streak/progress intact.
4. **Path recommendation:** finishing a lesson updates the path and surfaces a sensible
  next lesson.
5. **Mobile:** all of the above work well on a phone-sized screen.

Supporting metrics: lesson completion rate, day-1 return rate, streak retention.

## 10. Open Questions / Assumptions

- **Assumption:** 5 lessons is the right MVP depth (Lesson 1 can merge into Lesson 2
if scope must shrink).
- **Assumption:** drag/tap-to-build is the single rich interaction for MVP; sliders,
number-line plotting, and expanding trees are deferred.
- **Assumption:** "minimal habit loop" = streak + progress + completion screen (no XP/
badges/reminders).
- **Stack is fixed:** Vite + React + TypeScript on the frontend and Firebase
(Auth + Firestore) for accounts, persistence, and cross-device sync.

