export function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="hero-kicker">Paid onchain intelligence</span>
        <h1>Wallet Reputation Report</h1>
        <p>
          A clean wallet risk read powered by Allium, priced with x402, and delivered through an OWS-native payment
          flow with MoonPay top-up support when the buyer wallet needs funds.
        </p>
      </div>
      <div className="hero-badges">
        <span className="badge">Allium intelligence</span>
        <span className="badge">Deterministic score</span>
        <span className="badge">x402 unlock</span>
        <span className="badge">OWS wallet + CLI</span>
        <span className="badge">MoonPay top-up</span>
      </div>
    </section>
  );
}
