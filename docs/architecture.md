# Architecture

## Goal

Ship the smallest credible scaffold for Wallet Reputation Report:

- free wallet summary
- locked premium report
- deterministic scoring
- adapter seams for Allium, OWS, x402, and MoonPay
- mock mode first, real mode later

## Runtime model

1. `app/page.tsx` renders the landing page, wallet input, summary card, and locked report card.
2. `POST /api/report/free` generates a wallet profile and free summary.
3. `POST /api/report/full` checks the x402 payment gate before returning the full report.
4. `src/reports/generate-report.ts` orchestrates wallet data + scoring + report shaping.
5. `src/adapters/*` select `mock` or `real` implementations using env vars.

## Core interfaces

Defined in `src/types/`:

- `WalletProfile`
- `RiskSignal`
- `ReputationScore`
- `ReportSummary`
- `FullReport`
- `AlliumClient`
- `OwsAdapter`
- `X402PaymentGate`
- `MoonPayAdapter`

## Modes

- `mock`: runnable immediately, no external credentials required
- `real`: uses adapter-backed integrations and TODO-safe placeholders for unresolved API details

## Folder map

- `app/`
- `src/adapters/allium/`
- `src/adapters/ows/`
- `src/adapters/x402/`
- `src/adapters/moonpay/`
- `src/reports/`
- `src/scoring/`
- `src/types/`
