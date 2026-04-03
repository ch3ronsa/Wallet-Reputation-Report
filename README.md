# Wallet Reputation Report

Onchain trust intelligence with a free wallet summary and a paid premium report unlock.

## Overview

Wallet Reputation Report is a hackathon MVP for OpenWallet under **The Observatory - Onchain intelligence and data monetization**.

A user enters a wallet address. The app uses Allium to fetch minimum viable onchain intelligence, normalizes that data into a stable internal wallet profile, computes a deterministic reputation score, shows a free summary immediately, and locks the full report behind an x402 payment flow. OWS provides the service wallet identity and CLI-based payment workflow. If the buyer wallet does not have enough funds, MoonPay provides a natural top-up path before the user retries unlock.

## Why This Fits The Observatory

- It turns raw onchain activity into a structured intelligence product.
- It monetizes that intelligence directly through a per-report unlock.
- It separates free discovery from paid depth, which is a credible onchain data business model.
- It uses machine-native payment patterns instead of a fake Web2 checkout wall.
- It keeps scoring deterministic and explainable, which matters for trust-sensitive data products.

## Stack Mapping

- `OWS CLI`
  - Used in setup and buyer workflow.
  - Creates the service wallet and the buyer wallet.
  - Shows how a user can fund and pay for a report unlock.

- `OWS wallet`
  - Acts as the service/payment identity for the report provider.
  - Premium report payments are framed as routing to the provider's OWS-managed wallet.

- `MoonPay agent skill`
  - Used naturally as a top-up-to-unlock helper.
  - If the buyer wallet lacks enough USDC, MoonPay funds that wallet before payment is retried.
  - Current skill label in the app is `moonpay-buy-crypto`.

- `Allium`
  - Intelligence layer for wallet balances, activity, counterparties, concentration, and derived wallet profile signals.

- `x402`
  - Pay-per-report monetization boundary.
  - Free summary is open.
  - Full report requires payment verification and unlock.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start in mock mode:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Environment Variables

Core runtime:

- `APP_MODE`
  - Global mode switch.
  - Values: `mock`, `real`

- `ALLIUM_MODE`
  - Controls Allium adapter behavior.
  - Values: `mock`, `real`

- `OWS_MODE`
  - Controls OWS adapter behavior.
  - Values: `mock`, `real`

- `X402_MODE`
  - Controls x402 payment adapter behavior.
  - Values: `mock`, `real`

- `MOONPAY_MODE`
  - Controls MoonPay adapter behavior.
  - Values: `mock`, `real`

Allium:

- `ALLIUM_API_KEY`
  - Allium API key for real wallet intelligence requests.

- `ALLIUM_BASE_URL`
  - Base URL for Allium requests.

- `REPORT_CHAIN`
  - Primary chain for the MVP.
  - Default: `base`

- `REPORT_LOOKBACK_DAYS`
  - Intended lookback window for wallet observation.

OWS:

- `OWS_SERVICE_WALLET_NAME`
  - Human-readable name for the report provider wallet.

- `OWS_SERVICE_ADDRESS`
  - Onchain address for the report provider service wallet.

- `OWS_PUBLIC_PAYMENT_URL`
  - Public URL used in OWS/x402 payment flows for the premium endpoint.

x402:

- `X402_PRICE_USDC`
  - Price per premium report unlock.

- `X402_NETWORK`
  - Network used for payment.

- `X402_ASSET`
  - Asset used for payment.

- `X402_DESCRIPTION`
  - Human-readable payment description.

- `X402_UNLOCK_SECRET`
  - Signing secret for demo-safe unlock/session tokens.

- `X402_UNLOCK_TTL_MS`
  - TTL for unlock/session tokens.

- `X402_MOCK_AUTO_APPROVE`
  - If `true`, mock payment sessions auto-settle after a delay.

- `X402_MOCK_SETTLE_MS`
  - Delay before mock payment auto-settlement.

MoonPay:

- `MOONPAY_ENABLED`
  - Enables or disables MoonPay top-up guidance in real mode.

- `MOONPAY_DEFAULT_FIAT`
  - Default fiat currency for top-up flows.

- `MOONPAY_DEFAULT_AMOUNT`
  - Suggested top-up amount.

Demo:

- `DEMO_PAID_HEADER_VALUE`
  - Demo payment flag used by the mock x402 verification path.

## Mock Mode Vs Real Mode

### Mock mode

- Runs without external credentials.
- Uses believable mock wallet data.
- Uses demo-safe payment sessions and unlock tokens.
- Keeps the whole app runnable for judges and local development.

### Real mode

- Uses the real Allium adapter when credentials are configured.
- Uses the real OWS adapter for service wallet identity and workflow guidance.
- Uses the real x402 adapter boundary for payment verification flow.
- Uses the real MoonPay adapter for top-up guidance, with local fallback if MoonPay is unavailable.

## Demo Flow

1. Enter a wallet address.
2. Free summary appears immediately.
3. User clicks to open the premium report.
4. Premium report is locked and shows payment state plus OWS service identity.
5. User starts the unlock flow.
6. If needed, MoonPay helps top up the buyer wallet.
7. Payment is verified.
8. Full report is revealed.

## Architecture Summary

- `app/`
  - Next.js App Router UI and API routes.

- `src/adapters/allium/`
  - Wallet intelligence retrieval and normalization assumptions.

- `src/adapters/ows/`
  - Service wallet identity and OWS CLI workflow generation.

- `src/adapters/x402/`
  - Payment gate, session creation, verification, and unlock token flow.

- `src/adapters/moonpay/`
  - Top-up helper used when the buyer wallet needs funds before unlock.

- `src/scoring/`
  - Deterministic wallet reputation model and scoring engine.

- `src/reports/`
  - Free summary and premium full report generation.

- `src/components/report-ui/`
  - Hackathon-friendly frontend components.

## Known Limitations

- Real x402 settlement is still adapter-isolated and not yet wired to a production facilitator.
- Real MoonPay execution is currently expressed as a guided integration path rather than a completed live checkout session.
- Allium field assumptions are isolated, but final endpoint details may vary by account tier.
- The scoring engine is intentionally simple and deterministic for hackathon speed.
- The MVP is single-chain first.

## Future Roadmap

- Replace demo-safe x402 verification with a production receipt verifier.
- Add a direct OWS SDK payment flow instead of CLI-only guidance.
- Add a MoonPay deep link or session-based top-up instead of command guidance.
- Expand to multi-chain wallet support.
- Add more premium signals such as labels, protocol categories, and flow clustering.
- Add report history and paid access receipts per wallet.

## Judge Demo Script

Short live narrative:

1. "I enter a wallet address."
2. "The free summary appears immediately, showing quick trust and risk context."
3. "The premium report stays locked because this is the monetized intelligence layer."
4. "The provider identity is an OWS-managed wallet, and the buyer can pay using an OWS CLI-based workflow."
5. "If the buyer wallet does not have enough USDC, MoonPay is the natural top-up path before retrying unlock."
6. "After payment verification, the full report opens with score breakdown, counterparties, concentration, activity observations, and limitations."
7. "That makes this an onchain intelligence product with a real monetization surface, not just an analytics dashboard."

## Extra Demo Notes

For a compact judge demo, keep the focus on:

- deterministic score, not LLM scoring
- free-to-paid conversion
- OWS as service/payment identity
- MoonPay as unlock-enabling top-up
- Allium as the intelligence source
- x402 as the monetization boundary

## Demo Day Checklist

See [docs/demo-checklist.md](docs/demo-checklist.md) for the final pre-demo verification list and the judge-facing talking points.
