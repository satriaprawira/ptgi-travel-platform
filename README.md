# NRT ⇄ HND Transfers — Reservation Form

Next.js (App Router, TypeScript) build of the reservation form mockup, ready to run locally and deploy to Vercel.

## What's in here

```
app/
  layout.tsx      Root layout — loads and self-hosts the three Google Fonts via next/font
  page.tsx         Static header + hero, renders <ReservationForm />
  globals.css      All styling (ported 1:1 from the HTML mockup)
components/
  ReservationForm.tsx   The interactive form — all 4 sections, React state
  TicketPreview.tsx     The live "e-ticket" summary panel
lib/
  options.ts       Car types, payment methods, country code/suggestion lists
```

The form is fully interactive (React state instead of the mockup's vanilla JS), but it doesn't call a backend yet — see "Next step" below.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploy to Vercel

1. Push this project to a GitHub/GitLab repo with `main` and `staging` branches (see the Staging & Production Setup doc for the full flow).
2. Import the repo in Vercel — it auto-detects Next.js, no config needed.
3. In Project Settings → Domains, point your production domain at `main` and a staging subdomain at `staging`.
4. In Project Settings → Environment Variables, add `NEXT_PUBLIC_API_URL` (see `.env.example`) separately for the **Production** and **Preview** scopes once the backend exists.

## Next step

The "Confirm reservation" button currently just shows a confirmation message — it doesn't submit anywhere. Once the NestJS API from the Tech Stack Recommendation doc is up, wire the `handleSubmit` function in `components/ReservationForm.tsx` to `POST` the form state to `${process.env.NEXT_PUBLIC_API_URL}/bookings`.
