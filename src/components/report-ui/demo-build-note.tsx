type DemoBuildNoteProps = {
  dataMode: "mock" | "real";
  paymentMode: "mock" | "real";
};

export function DemoBuildNote(props: DemoBuildNoteProps) {
  const dataNote =
    props.dataMode === "real"
      ? "Live Allium data is active."
      : "This demo build uses a fallback dataset because live Allium credentials are unavailable.";
  const paymentNote =
    props.paymentMode === "real"
      ? "The premium gate is using the live x402 path."
      : "The premium gate uses a demo-safe unlock flow instead of live settlement.";

  return (
    <section className="panel demo-note">
      <div className="section-heading">
        <h2>Demo build</h2>
        <span className="section-tag">Honest mode</span>
      </div>
      <p>
        This is a scoped hackathon MVP. The deterministic scoring engine, OWS service wallet identity, and Ubuntu /
        WSL OWS CLI path are real. {dataNote} {paymentNote}
      </p>
    </section>
  );
}
