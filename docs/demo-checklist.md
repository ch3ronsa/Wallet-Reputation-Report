# Demo Day Checklist

## Before judges arrive

- Run `npm install`
- Run `npm run build`
- Run `npm run dev`
- Confirm the landing page loads on `http://localhost:3000`
- Confirm the default wallet generates a free summary
- Confirm the premium report returns a locked x402 paywall before payment
- Confirm the paywall shows:
  - Allium or mock fallback status
  - x402 payment requirement
  - OWS service wallet identity
  - OWS CLI buyer commands
  - MoonPay top-up helper or fallback

## Mock-mode demo path

- Keep `APP_MODE=mock`
- Keep `ALLIUM_MODE=mock` if live Allium credentials are unavailable
- Keep `X402_MODE=mock` for the demo-safe unlock token flow
- Click `Generate free summary`
- Click `Open premium report`
- Click `Start paid unlock`
- Click `Verify x402 payment`
- Confirm the full report appears with:
  - score breakdown
  - observed facts
  - activity and limitations
  - plain-language interpretation

## Real-mode demo path

- Set `ALLIUM_MODE=real` and provide `ALLIUM_API_KEY`
- Set `OWS_MODE=real` and provide `OWS_SERVICE_ADDRESS`
- Set `X402_MODE=real` only if you have a live verifier path ready
- Set `MOONPAY_MODE=real` and `MOONPAY_ENABLED=true` if MoonPay is available
- Re-run the flow and confirm the audit line changes from mock to real where expected

## Judge talking points

- Free summary is the acquisition layer
- Full report is the monetized intelligence layer
- Allium provides the wallet intelligence inputs
- The score is deterministic and explainable
- x402 is the payment boundary
- OWS wallet is the provider payment identity
- OWS CLI is visible in the buyer unlock workflow
- MoonPay helps top up the buyer wallet before retrying payment

## Do not claim

- Do not claim live settlement if `X402_MODE=mock`
- Do not claim live Allium data if the audit line shows `Mock fallback`
- Do not claim direct MoonPay execution if the UI is showing fallback mode
