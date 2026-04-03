import { PaymentState } from "@/types/api";

type PremiumTeaserCardProps = {
  paymentState: PaymentState;
  paymentMessage?: string;
  loadingPayment: boolean;
  onStartPayment: () => void;
  onVerifyPayment: () => void;
  owsWalletLabel?: string;
};

export function PremiumTeaserCard(props: PremiumTeaserCardProps) {
  const tone =
    props.paymentState === "failed" ? "negative" : props.paymentState === "paid" ? "positive" : "neutral";

  return (
    <section className="panel report-card">
      <div className="section-heading">
        <h2>Locked full report</h2>
        <span className="section-tag">Paid intelligence</span>
      </div>

      <div className="locked-card">
        <div className="locked-badge">Premium</div>
        <h3>Decision-grade wallet intelligence</h3>
        <p>
          Unlock score breakdown, signal details, notable counterparties, concentration analysis, activity observations,
          limitations, and plain-language interpretation.
        </p>
        {props.owsWalletLabel ? <p className="subtle">Service wallet: {props.owsWalletLabel}</p> : null}
      </div>

      <div className="button-row">
        <button className="button button-primary" type="button" onClick={props.onStartPayment} disabled={props.loadingPayment}>
          {props.loadingPayment ? "Starting payment..." : "Pay to unlock full report"}
        </button>
        <button className="button button-secondary" type="button" onClick={props.onVerifyPayment} disabled={props.loadingPayment}>
          {props.loadingPayment ? "Verifying..." : "Verify payment"}
        </button>
      </div>

      <div className={`signal ${tone}`}>
        <strong>Payment status: {props.paymentState}</strong>
        <small>
          {props.paymentMessage ??
            (props.paymentState === "pending"
              ? "Payment pending. Complete payment and verify to reveal the full report."
              : props.paymentState === "failed"
                ? "Payment failed or could not be verified."
                : props.paymentState === "paid"
                  ? "Payment verified."
                  : "Premium content is currently locked.")}
        </small>
      </div>
    </section>
  );
}
