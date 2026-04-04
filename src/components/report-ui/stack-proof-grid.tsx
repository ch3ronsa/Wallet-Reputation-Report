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
        <span className="proof-label">Free</span>
        <p>{props.dataMode === "real" ? "Allium live mode active." : "Demo dataset active."}</p>
      </article>

      <article className="proof-card">
        <span className="proof-label">Premium</span>
        <p>{props.paymentMode === "real" ? "x402 live path." : "x402 demo-safe unlock path."}</p>
      </article>

      <article className="proof-card">
        <span className="proof-label">OWS</span>
        <p>{props.owsWalletName ? `${props.owsWalletName} is the service wallet.` : "Service wallet shown at unlock."}</p>
      </article>

      <article className="proof-card">
        <span className="proof-label">MoonPay</span>
        <p>
          {props.moonPayAvailable === false
            ? "Funding fallback visible."
            : `${props.moonPaySkillName ?? "moonpay-buy-crypto"} can top up the buyer wallet.`}
        </p>
      </article>
    </section>
  );
}
