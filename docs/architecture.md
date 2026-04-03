# Architecture

## Minimal architecture

1. **Web app**
   - Single-screen Next.js app
   - Free summary shown immediately after analysis
   - Premium report button calls a paid API route

2. **Report API**
   - `POST /api/report/free`
   - `POST /api/report/full`
   - Both routes share the same report service
   - The premium route checks x402 payment requirements before returning the full report

3. **Intelligence layer**
   - Allium wallet balances endpoint
   - Allium wallet transactions endpoint
   - Adapter maps raw Allium responses into a stable internal domain model

4. **Deterministic scoring engine**
   - Pure TypeScript rule engine
   - Input: normalized wallet activity snapshot
   - Output: score, band, signal breakdown, and premium insights

5. **Payment and wallet identity**
   - OWS service wallet defines the receiving identity
   - OWS CLI is used for buyer wallet creation and paid request flow
   - MoonPay funds the buyer wallet before x402 payment

## Exact stack

- Frontend: Next.js 15 App Router + React 19
- Backend: Next.js Route Handlers
- Language: TypeScript
- Validation: Zod
- Styling: plain CSS for speed and clarity
- Data source: Allium Wallet APIs
- Payment boundary: x402-compatible route adapter
- Wallet identity: OWS wallet + OWS CLI
- Funding path: MoonPay-backed wallet funding flow

## Typed interfaces

Core contracts live in `src/types/report.ts`:

- `WalletReportRequest`
- `WalletSnapshot`
- `WalletMetrics`
- `ScoreSignal`
- `WalletReport`
- `PremiumAccessResult`
- `X402PaymentRequirement`

## Deterministic scoring model

Start at `50`, then apply deterministic signal weights:

- History depth
- Wallet age by active days
- Counterparty diversity
- Failed transaction ratio
- Stablecoin share
- Asset concentration
- Native gas runway
- Suspicious label detection from Allium-enriched activity labels

The score is clamped to `0-100` and mapped to:

- `excellent`
- `good`
- `watch`
- `risky`

## Implementation order

1. Project scaffold and env contract
2. Allium adapter
3. Deterministic scoring engine
4. Free report API
5. Premium x402-gated API
6. Single-page UI
7. OWS + MoonPay operator workflow docs

## Integration assumptions

- **Allium**
  - Based on public wallet API docs, this MVP uses:
    - `POST /api/v1/developer/wallet/transactions`
    - `POST /api/v1/developer/wallet/balances`
  - If an Allium account also enables PnL or SQL APIs later, those can enrich the premium report without changing the score contract.

- **x402**
  - The production path should use the official Coinbase x402 TypeScript packages.
  - This repo keeps the payment check behind a typed adapter because facilitator configuration and settlement credentials vary by deployment.
  - The fallback route is protocol-compatible enough for hackathon demoing: it returns HTTP `402` with a structured requirement object and expects a future verifier to settle access.

- **OWS**
  - Based on the current OWS CLI reference, the wallet and payment flow assumes:
    - `ows wallet create`
    - `ows wallet info`
    - `ows fund deposit`
    - `ows pay request`

- **MoonPay**
  - The meaningful MoonPay role is to fund the buyer wallet with Base USDC before the premium request.
  - In environments with MoonPay agent skills, the expected skill category is wallet funding or wallet balance verification.
  - CLI fallback examples use `mp buy` and `mp token balance list`.
