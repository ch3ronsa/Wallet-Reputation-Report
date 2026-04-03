# Wallet Reputation Report

Minimal scaffold for an OpenWallet hackathon app:

- Next.js + TypeScript
- App Router
- Simple landing page
- Wallet input form
- Free summary card
- Locked full report card
- Backend API routes
- Adapter-driven mock/real integrations for Allium, OWS, x402, and MoonPay

## Run

```bash
npm install
npm run dev
```

The app is runnable immediately because the default mode is `mock`.

## Environment

Copy `.env.example` to `.env` and switch modes as needed:

```bash
APP_MODE=mock
ALLIUM_MODE=mock
OWS_MODE=mock
X402_MODE=mock
MOONPAY_MODE=mock
```

Set `APP_MODE=real` and flip any adapter to `real` only when its credentials and flow are ready.

## Structure

- `app/` UI and route handlers
- `src/adapters/` external integration seams
- `src/reports/` report generation
- `src/scoring/` deterministic scoring engine
- `src/types/` domain, API, and adapter interfaces
- `src/config/` env handling
- `src/lib/` small shared utilities

## Notes

- Real adapters include TODO-safe placeholders where exact SDK or settlement flows are still unknown.
- The premium report route is adapter-driven and returns a realistic `402 Payment Required` response shape.
- Mock mode keeps demo and local development fast without external credentials.
