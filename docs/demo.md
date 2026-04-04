# Demo Narrative

## Honest demo system

This project is best presented as a scoped hackathon MVP.

- Real in this demo:
  - deterministic scoring engine
  - OWS-managed service wallet identity
  - Ubuntu / WSL verified OWS CLI workflow
  - free summary to premium unlock product flow
- Demo-safe in this demo:
  - fallback wallet dataset instead of live Allium credentials
  - premium unlock verification instead of fully live x402 settlement
  - MoonPay funding path shown through product guidance and OWS CLI, not a finished live checkout

That keeps the pitch honest while still showing a credible product direction.

## One-minute pitch

Wallet Reputation Report turns a wallet address into a trust and risk product.

Users get a free summary first. If they want the deeper underwriting-style view, they unlock a premium report with an x402 payment. The provider identity is an OWS-managed wallet, and if the buyer wallet needs funds first, MoonPay acts as the top-up path. Allium supplies the onchain intelligence, and the score stays deterministic and explainable.

## Judge-facing script

1. Paste a wallet address into the form.
2. Click `Generate free summary`.
3. Show the free summary:
   - overall risk level
   - three key reasons
   - quick wallet snapshot
4. Click `Open premium report`.
5. Show that the premium report is locked:
   - this is the monetized intelligence layer
   - payment state is visible
   - the report provider is identified by an OWS service wallet
6. Say clearly:
   - this demo uses fallback data and a demo-safe unlock path
   - the deterministic score, OWS wallet identity, and OWS CLI path are real
7. Start the unlock flow:
   - OWS CLI is shown as the explicit buyer/service workflow
   - if funds are needed, MoonPay is shown as the top-up-to-unlock helper
8. Verify payment and reveal the report.
9. Show the unlocked sections:
   - operator decision
   - confidence level
   - behavior pattern
   - score breakdown
   - counterparties and limitations
10. Close with:
   - free summary drives interest
   - full report is paid intelligence
   - live Allium and live x402 settlement are the next step

## Demo framing

- Allium is the intelligence layer
- OWS is the payment/service identity layer
- MoonPay is the funding helper when the buyer wallet cannot unlock yet
- x402 is the pay-per-report monetization boundary
- The score is deterministic and explainable
