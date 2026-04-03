# Wallet Reputation Report

Wallet Reputation Report is a TypeScript-first OpenWallet hackathon MVP for **The Observatory - Onchain intelligence & data monetization**.

Users paste a wallet address, the app fetches live wallet data from Allium, computes a deterministic reputation/risk score, shows a free summary, and keeps the full report behind an x402-compatible `402 Payment Required` boundary.

## Why this fits the theme

- **Allium** is the intelligence layer for wallet balances and transactions.
- **Deterministic scoring** keeps the actual score explainable and auditable.
- **x402** monetizes the premium report as a machine-payments API.
- **OWS wallet + OWS CLI** are part of the setup and payment flow.
- **MoonPay** is used naturally in the funding path for the paying wallet.

## Exact stack

- Next.js 15 App Router
- React 19
- TypeScript 5
- Zod for API input validation
- Native `fetch` adapters for Allium
- CSS via `app/globals.css`

## Repo structure

- `app/` Next.js routes and UI
- `src/config/` env parsing and runtime config
- `src/lib/allium/` Allium API adapter
- `src/lib/reports/` report orchestration
- `src/lib/scoring/` deterministic scoring engine
- `src/lib/payments/` x402-compatible paywall adapter
- `src/lib/moonpay/` MoonPay funding helpers
- `src/lib/ows/` OWS wallet workflow helpers
- `src/types/` typed domain contracts
- `docs/` architecture, assumptions, and setup notes
- `scripts/` operator setup helpers

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy envs and add your Allium API key:

```bash
cp .env.example .env
```

3. Create a service wallet with OWS CLI:

```bash
ows wallet create --name "wallet-reputation-report"
ows wallet info
```

4. Start the app:

```bash
npm run dev
```

## OWS + x402 demo flow

Create a user wallet, fund it, and pay the premium endpoint:

```bash
ows wallet create --name "report-buyer"
ows fund deposit --wallet "report-buyer" --chain base --token USDC
ows pay request http://localhost:3000/api/report/full \
  --wallet "report-buyer" \
  --method POST \
  --body '{"address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045","chain":"base"}'
```

## MoonPay skill in the workflow

The natural MoonPay role in this product is funding the buyer wallet before the x402 request. In agent environments that expose MoonPay skills, use a wallet-funding or wallet-check skill before calling `ows pay request`. The equivalent CLI fallback is documented in `docs/setup.md`.

## Notes

- The premium route already returns protocol-shaped payment requirements using HTTP `402`.
- The verification layer is isolated behind a typed adapter so the official `@x402/next` middleware can replace the fallback adapter without changing business logic.
- Assumptions and integration seams are documented in `docs/architecture.md`.
