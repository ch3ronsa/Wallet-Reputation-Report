export const X402_ASSUMPTIONS = {
  headers: {
    unlockToken: "x-report-unlock-token",
    paymentSignature: "payment-signature",
    demoPayment: "x-demo-payment",
  },
  mock: {
    checkoutUrl: "/demo/x402-checkout",
  },
} as const;

export const X402_INTEGRATION_NOTE =
  "If your x402 facilitator or receipt format changes, update the x402 adapter layer only; the rest of the app should remain stable.";
