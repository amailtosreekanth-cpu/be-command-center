# CLAUDE.md — Broken English Operating System (BEOS)

Version: 1.0 MVP · Owner: Sreekanth K G · Company: Broken English LLP
Drop this at the **repo root** of `be-command-center`. Claude Code reads it every session.

---

## Mission
Build the internal operating system for Broken English. **BEOS is NOT a CRM** — the CRM is
external. BEOS begins **after a student is admitted**. Supabase is the single source of truth.
Google Sheets are permanently retired. One unified OS for every department.

## Current objective
Ship a usable MVP fast. Priority = **working software**, not new animations or feature creep.
If a feature isn't needed to run the company next week → Phase 2. **The cinematic Founder-deck
UI (JARVIS globe etc.) already exists and is accepted — do NOT rip it out to "simplify." Extend,
don't rewrite.**

## Core philosophy
One Login · One Database · One Employee Directory · One Notification System · One AI Assistant ·
One Founder Dashboard. Every department is just another module inside BEOS.

## Module architecture
Founder · Academics · Finance · HR · Media · Administration · Jarvis AI · Notifications · Reports · Audit Logs.
The Admissions CRM stays external.

```
Lead Gen → Sales CRM → Counsellor → Admission → Payment → Student Enrolled → BEOS
```
BEOS does not manage leads. It starts at "Student Enrolled." Wire the external CRM into
`students` + `payments` when its API/export is ready (get the URL from Sreekanth).

---

## Repo & hosting (facts)
- Repo: `github.com/amailtosreekanth-cpu/be-command-center` — GitHub Pages, `main`, root.
- Live: `https://amailtosreekanth-cpu.github.io/be-command-center/`
- Deploy = push to `main` → wait ~90s → hard-refresh (Cmd+Shift+R). Build fails → Actions → Re-run.

## Files (all deployed at root)
| File | Role |
|---|---|
| `index.html` | Founder OS — deck, Sales, Media, Projects, Academics command pages, JARVIS globe |
| `academics.html` | Academic portal — Josephine + trainers: batches, attendance, students, payments, HR clock |
| `admin.html` | Back-office — courses, batches, trainers (FT/PT + slots), departments, data sources, config |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA (installable Android/iOS/macOS) |
| `brand/` | `logo-full.png` (chevron), `logo-mark.png` (wordmark) — case-sensitive on Pages |
| `photos/` | `Sreekanth.jpg`, `Hasnu.png`, `Jazeel.png` |
| `sql/` | migration scripts — run manually in Supabase SQL editor |

## House rules (non-negotiable)
- **Single-file HTML** — inline CSS + JS per file. No React, no build tooling, no separate CSS/JS.
- **Fonts:** Montserrat (headings/numerals), Barlow (labels), Inter (body). **Syne is banned.**
- **Colors:** pink-red `#ed1f51`, orange `#f05825`, black `#050408`. Gradient `120deg,#ed1f51,#f05825`.
- **No fake data. Ever.** Every metric real or an honest empty/ghost state. Empty states are fine;
  placeholder numbers are not.
- **Globe.gl owns Three.js** — never add a separate three.js `<script>` (breaks the globe).
- **Permissions:** remove unauthorized components from the DOM. CSS `display:none` gating = fail.

---

## Authentication
Roles: `founder`, `academic_head`, `trainer`, `hr`, `media`, `counsellor`, `admin`. Each role sees
only its pages. Login writes `localStorage.be_session = {u,n,r,t}`, 30-day sliding TTL; all pages
restore on load and re-verify username against `roles`. Founder deck → Academics = no second login.

## Database — Supabase (single source of truth)
Main project: `baazubvfsrpmbfmrzumw.supabase.co` · anon key `sb_publishable_cpAjOHoZL3AMZHaNieb_0A_Tb1kspmh`
Media project (**separate, not yet merged**): `fevqnpllmarhoqdzpatq.supabase.co` — read-only from Media command.
RLS permissive `using(true)` (internal-tool posture). Passwords plaintext in `roles` (convenience lock;
source is public — acceptable internal, not real security).

Tables:
- `roles` (name, role, username, password)
- `courses` (name, total_group/mc/oneonone, total_sessions, duration_days, default_days, mc_day, fee, active)
- `trainers` (name, type ft/pt, status, work_start/end, weekly_hours) + `trainer_slots` (weekday, start/end, booked, course_hint)
- `batches` (name, course_id, trainer_id, day_pattern, time_slot, capacity, status active/completed, completed_at, baseline_sessions)
- `students` (name, uin, contact, batch_name, batch_id, trainer_name, programme, status, dates, source_counsellor)
- `class_sessions` + `attendance` (session_id/student_uin, present/absent, marked_by)
- `payments` (student_id, course_fee, discount, discount_by, next_due) + `payment_entries` (amount, paid_at, method, entered_by)
- `timeclock` (username, clock_in, clock_out) + `leaves` (username, from/to, reason)
- `audit_log`, `site_config` (jsonb key/value for admin-editable config)

Every metric reads from these. Never hardcode business data.

## Historical data policy
**Start fresh.** Do NOT migrate old operational data. Josephine gets a one-time **Historical Import**
page to manually create read-only: Completed Batches, Completed Courses, Historical Students,
Trainer History. Do NOT import attendance, payments, session logs, clock-ins, notifications — the
operational system starts Day 1. (`sql/fresh-start-wipe.sql` clears the 153 leftover sheet-imported
students to enable this clean slate.)

---

## Academics module
**Academic Head** (Josephine): create Course / Programme / Batch, assign Trainer, assign/move
Students, complete Batch, (Phase 2: generate Certificate). **Trainer:** dashboard, today's classes,
upcoming sessions, clock in/out, mark attendance, trainer notes, (Phase 2: homework upload), student list.
Each batch holds: students, trainer, sessions, attendance, progress, (Phase 2: homework, notes, announcements).
Progress = `baseline_sessions` (manual, for mid-way batches) + marked attendance, capped at course total.

## HR module
Every employee clocks in/out. Attendance computed **only** from clock events. HR dashboard: today's
attendance, present / absent / on-leave, late arrivals, working hours, reports, leave requests, monthly.

## Finance module
Track: revenue generated, cash received, pending payments, installments, outstanding fees, refunds.
Founder metrics: revenue today / this month, admissions, outstanding, collections, cash received.
**Revenue is computed from `payment_entries`, never from student count.**

## Founder dashboard
Company command center. Widgets: revenue, cash received, pending fees, admissions, students, active
batches, upcoming classes, employees present, employees on leave, trainer utilization, media pipeline,
notifications. Everything drills down to records.

## Media module
**Do NOT rebuild the existing Media/Production Suite — integrate it.** Reuse its pipeline,
assignments, editing, delivery, reports. Plan: move its auth into BEOS and its data into the shared
Supabase project (currently a separate project — migration is a Phase-2 task). Reuse existing UI.

## Jarvis AI
Jarvis is **a database assistant, not a chatbot**. Flow: user question → intent detection → Supabase
query → response. Examples: who's on leave today, revenue today, pending payments, trainer schedule,
students absent today, batch progress, media tasks pending. **Never fabricate — every answer from Supabase.**
(Current build has voice command → page navigation via the globe; extend toward DB queries.)

## Notifications (mostly Phase 2)
Trainer: new batch, upcoming class, homework reminder. Academic Head: trainer leave, attendance
missing, batch completed. Founder: revenue alerts, outstanding fees, leave alerts, media updates.
HR: missed clock-in, leave requests, late employees.

## Audit logs
Log every important action to `audit_log`: student added, payment added, attendance marked, batch
created, trainer assigned, employee clocked in, leave approved. Nothing important happens silently.

---

## Development priority
**Phase 1:** Auth · Supabase · Academics · HR · Finance · Founder Dashboard · Media integration · Jarvis.
**Phase 2:** Certificates · advanced analytics · automation · WhatsApp · Email · payroll · inventory · AI recs.

## SQL migrations (run manually in Supabase SQL editor, in order)
1. `sql/phase1-migration.sql` — all tables + seed courses & employee logins. Idempotent.
2. `sql/phase1b-sync-batches.sql` — rebuild `batches` from student batch_names (skip if starting fresh).
3. `sql/phase2b-baseline.sql` — adds `batches.baseline_sessions`.
4. `sql/fresh-start-wipe.sql` — OPTIONAL destructive wipe of imported operational data.

## Definition of Done
A feature is done only when: UI works · Supabase works · permissions work · audit log written ·
founder dashboard updates · notifications update (where relevant) · no console errors.

## Before every commit
Verify JavaScript (extract `<script>` blocks → `node --check`). Check permissions. Test desktop +
mobile. Push to `main`. Update progress.

## Claude Code rules
- Don't redesign working modules unnecessarily. Prefer extending existing code. Preserve backward compat.
- Never reintroduce Google Sheets. Never hardcode business data.
- Always ask first: "Can this be solved with the current architecture?" If yes → extend, don't rewrite.
- Optimize for shipping the MVP first.

## Working style
Sreekanth uses `/caveman` (terse). Screenshot-driven iteration. Ship = commit + push to `main`, he
hard-refreshes. End each turn asking for a screenshot + which telemetry lights are green/amber.
