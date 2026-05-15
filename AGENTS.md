# Project Instructions

## Architecture
- This is a full-stack application using **Express + Vite**.
- The main entry point is `server.ts`.
- The development server runs via `tsx server.ts`.
- The build process bundles `server.ts` into `dist/server.cjs` using `esbuild`.

## Database (Local)
- Data is stored in a `database.json` file on the server.
- Database access is managed via `src/lib/serverDb.ts`.
- The frontend interacts with the database through the local API routes in `server.ts`.
- API client is located at `src/services/api.ts`.

## Payments
- Razorpay integration is pre-configured on the server.
- Keys should be set as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.

## UI/UX
- Mobile-first approach for all pages.
- Use `motion/react` for transitions.
- Styling is strictly Tailwind CSS.
