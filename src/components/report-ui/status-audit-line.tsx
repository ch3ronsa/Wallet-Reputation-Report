import { PaymentState } from "@/types/api";

type StatusAuditLineProps = {
  mode: "mock" | "real";
  paymentState: PaymentState;
  chain?: string;
  generatedAt?: string;
};

export function StatusAuditLine(props: StatusAuditLineProps) {
  return (
    <section className="audit-line">
      <span>Mode: {props.mode}</span>
      <span>Payment: {props.paymentState}</span>
      {props.chain ? <span>Chain: {props.chain}</span> : null}
      {props.generatedAt ? <span>Generated: {new Date(props.generatedAt).toLocaleString()}</span> : null}
    </section>
  );
}
