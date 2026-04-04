import { PaymentState } from "@/types/api";

type PremiumTeaserCardProps = {
  paymentMode: "mock" | "real";
  paymentState: PaymentState;
  paymentMessage?: string;
  loadingPayment: boolean;
  canVerifyPayment: boolean;
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
        <h3>Full reputation report</h3>
        <p>
          Unlock the score breakdown, signal explanations, activity notes, counterparties, and limitations.
        </p>
        {props.owsWalletLabel ? <p className="subtle">Service wallet: {props.owsWalletLabel}</p> : null}
        <p className="subtle">
          {props.paymentMode === "real"
            ? "This report uses the live x402 payment boundary."
            : "This demo uses a time-bound x402-style unlock token so the paywall stays visible without requiring live settlement."}
        </p>
      </div>

      <div className="button-row">
        <button className="button button-primary" type="button" onClick={props.onStartPayment} disabled={props.loadingPayment}>
          {props.loadingPayment ? "Starting payment..." : "Start paid unlock"}
        </button>
        <button
          className="button button-secondary"
          type="button"
          onClick={props.onVerifyPayment}
          disabled={props.loadingPayment || !props.canVerifyPayment}
        >
          {props.loadingPayment ? "Verifying..." : "Verify x402 payment"}
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
                  : "The full report is locked until payment is verified.")}
        </small>
      </div>
    </section>
  );
}
