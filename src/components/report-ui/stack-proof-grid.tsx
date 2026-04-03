type StackProofGridProps = {
  dataMode: "mock" | "real";
  paymentMode: "mock" | "real";
  moonPayAvailable?: boolean;
  moonPaySkillName?: string;
  owsWalletName?: string;
};

export function StackProofGrid(props: StackProofGridProps) {
  return (
    <section className="proof-grid">
      <article className="proof-card">
        <span className="section-tag">Allium</span>
        <h2>Intelligence layer</h2>
        <p>{props.dataMode === "real" ? "Live wallet intelligence is active." : "Mock fallback is active for demo-safe runs."}</p>
      </article>

      <article className="proof-card">
        <span className="section-tag">x402</span>
        <h2>Monetization gate</h2>
        <p>{props.paymentMode === "real" ? "Live payment verification path is configured." : "Demo-safe unlock flow is active and still enforces the paywall."}</p>
      </article>

      <article className="proof-card">
        <span className="section-tag">OWS wallet</span>
        <h2>Service identity</h2>
        <p>{props.owsWalletName ? `${props.owsWalletName} is surfaced as the provider payment identity.` : "Provider wallet identity appears when premium access is checked."}</p>
      </article>

      <article className="proof-card">
        <span className="section-tag">OWS CLI</span>
        <h2>Buyer workflow</h2>
        <p>CLI commands show wallet creation, funding, and the exact paid request used to unlock the report.</p>
      </article>

      <article className="proof-card">
        <span className="section-tag">MoonPay skill</span>
        <h2>Top-up helper</h2>
        <p>
          {props.moonPayAvailable === false
            ? "Local dev fallback is shown clearly when MoonPay is unavailable."
            : `${props.moonPaySkillName ?? "moonpay-buy-crypto"} helps fund the buyer wallet before retrying unlock.`}
        </p>
      </article>
    </section>
  );
}
