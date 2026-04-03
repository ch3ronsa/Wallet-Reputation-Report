import { PaymentState } from "@/types/api";

type StatusAuditLineProps = {
  dataMode: "mock" | "real";
  paymentMode: "mock" | "real";
  paymentState: PaymentState;
  chain?: string;
  generatedAt?: string;
  moonPayAvailable?: boolean;
  moonPayLabel?: string;
  owsWalletName?: string;
};

export function StatusAuditLine(props: StatusAuditLineProps) {
  return (
    <section className="audit-line">
      <span>Data: {props.dataMode === "real" ? "Allium live" : "Mock fallback"}</span>
      <span>Payments: {props.paymentMode === "real" ? "x402 live path" : "x402 demo-safe path"}</span>
      <span>Payment: {props.paymentState}</span>
      {props.chain ? <span>Chain: {props.chain}</span> : null}
      <span>OWS wallet: {props.owsWalletName ?? "ready"}</span>
      <span>
        MoonPay:{" "}
        {props.moonPayLabel
          ? `${props.moonPayLabel}${props.moonPayAvailable === false ? " fallback" : ""}`
          : props.moonPayAvailable === false
            ? "fallback funding"
            : "top-up helper"}
      </span>
      {props.generatedAt ? <span>Generated: {new Date(props.generatedAt).toLocaleString()}</span> : null}
    </section>
  );
}
