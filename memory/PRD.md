# MEALUR — Coming Soon Landing Page

## Original Problem Statement
Design a modern, premium "Coming Soon" landing page for a food-tech brand called MEALUR. Hero heading "Still Cooking Our Website", countdown timer below, subtext "We're cooking up something delicious — launching first in Pune.", email capture CTA ("Get Early Access" / "Notify Me"), right-side minimal food-themed illustration, warm gradient background, micro-interactions, fully responsive.

## User Choices (Dec 2025)
- Launch date: **July 31, 2026**
- Email storage: **MongoDB via FastAPI**
- Right-side visual: **Minimal food-themed illustration** (plate + steam in floating glass card)
- Brand tone: **Designer's choice** — landed on warm cream/peach background with ember-orange accent (`#E05A3D`)

## Architecture
- **Frontend**: React 19 + Tailwind + Shadcn tokens + framer-motion + sonner
  - Fonts: Clash Display (heading) + Satoshi (body) via Fontshare, JetBrains Mono (timer) via Google Fonts
  - Components: `App.js`, `components/CountdownTimer.jsx`, `components/EmailForm.jsx`, `components/RightVisual.jsx`
- **Backend**: FastAPI + Motor (async MongoDB)
  - `GET  /api/` — health
  - `POST /api/waitlist` — subscribe `{email, source?}` → `{ok, already_subscribed, count}`
  - `GET  /api/waitlist/stats` — `{count}`
  - Unique index on `waitlist.email`, pydantic `EmailStr` validation, case-normalized storage
- **DB**: MongoDB `waitlist` collection (id, email, source, created_at)

## What's Implemented (Dec 2025)
- Premium hero with "Still Cooking Our Website" (italic underlined "Website" accent)
- 4-card countdown timer (Days/Hours/Minutes/Seconds) ticking to 2026-07-31, with "Launching July 31, 2026" eyebrow
- Subtext + email form with inline validation, loading/success/error states, sonner toasts
- Right-side floating glass card with plate image, steam SVG animation, "Fresh · Pune" tag, live "foodies already on the list" counter (baseline + live `/api/waitlist/stats`)
- Orbiting chips ("Kitchen open", waitlist counter)
- Warm fluid background (CSS gradient + animated blurred blobs + grain overlay)
- Staggered fade-in load, button hover lift, floating visuals — framer-motion
- Responsive: mobile CTA shows "Notify Me", desktop "Get Early Access"; layout stacks on `<lg`
- Duplicate-email graceful handling ("you're already on the list" toast)
- **Admin CSV export** (`/admin` route): token-protected dashboard with subscriber count, table, refresh, and CSV download. Token stored in `backend/.env` as `ADMIN_TOKEN`, accepted via `Authorization: Bearer`, `X-Admin-Token` header, or `?token=` query (CSV fallback). Frontend fetches CSV as Blob (no token in URL).

## Test Coverage
- Backend pytest suite: `/app/backend/tests/test_waitlist.py` (9/9 passing)
- Testing agent iteration 1: **100% backend / 100% frontend**

## Backlog / Next Tasks
- ~~**P1**: Admin CSV export~~ ✅ Done (Dec 2025)
- **P1**: Post-launch redirect — when countdown hits 0, auto-redirect to main site
- **P2**: Referral mechanics ("skip the line" when 3 friends join) to drive viral Pune launch
- **P2**: Instagram/Twitter share cards with countdown snapshot
- **P2**: Multi-city waitlist (collect city field, surface "first 100 in your area")
- **P2**: Email confirmation via Resend / SendGrid integration
