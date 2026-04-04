import { PaymentState } from "@/types/api";

type StatusAuditLineProps = {
  dataMode: "mock" | "real";
  paymentMode: "mock" | "real";
  paymentState: PaymentState;
  chain?: string;
  generatedAt?: string;
};

export function StatusAuditLine(props: StatusAuditLineProps) {
  return (
    <section className="audit-line">
      <span>Data: {props.dataMode === "real" ? "Allium live" : "Demo dataset"}</span>
      <span>Unlock: {props.paymentMode === "real" ? "x402 live" : "x402 demo-safe"}</span>
      <span>Payment: {props.paymentState}</span>
      {props.chain ? <span>Chain: {props.chain}</span> : null}
      {props.generatedAt ? <span>Generated: {new Date(props.generatedAt).toLocaleString()}</span> : null}
    </section>
  );
}
