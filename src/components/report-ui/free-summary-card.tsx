import { FreeSummary } from "@/types/domain";

type FreeSummaryCardProps = {
  report?: FreeSummary;
  variant?: "default" | "sidebar";
};

export function FreeSummaryCard(props: FreeSummaryCardProps) {
  const isSidebar = props.variant === "sidebar";

  return (
    <section className={`panel report-card free-panel ${isSidebar ? "summary-sidebar-card" : ""}`}>
      <div className="section-heading">
        <h2>Free summary</h2>
        <span className="section-tag">{isSidebar ? "Snapshot" : "Immediate"}</span>
      </div>
      {props.report ? (
        <>
          <div className={`score-row ${isSidebar ? "score-row-compact" : ""}`}>
            <div>
              <div className="score-band">{props.report.overallRiskLevel} risk</div>
              <div className={`score-value ${isSidebar ? "score-value-compact" : ""}`}>
                {props.report.overallRiskLevel.toUpperCase()}
              </div>
            </div>
            <div>
              <h3 className={isSidebar ? "summary-address" : ""}>{props.report.walletAddress}</h3>
              <p>
                Chain: {props.report.chain} | Risk level: {props.report.overallRiskLevel}
              </p>
            </div>
          </div>

          <div className={`metric-grid ${isSidebar ? "metric-grid-compact" : ""}`}>
            <div className="metric">
              <span>Wallet age</span>
              <strong>
                {props.report.quickSnapshot.walletAgeDays !== null
                  ? `${props.report.quickSnapshot.walletAgeDays}d`
                  : "Unknown"}
              </strong>
            </div>
            <div className="metric">
              <span>Transactions</span>
              <strong>{props.report.quickSnapshot.transactionCount}</strong>
            </div>
            <div className="metric">
              <span>Active days</span>
              <strong>{props.report.quickSnapshot.activeDays}</strong>
            </div>
            <div className="metric">
              <span>Counterparties</span>
              <strong>{props.report.quickSnapshot.uniqueCounterparties}</strong>
            </div>
          </div>

          <div className={`signal-list ${isSidebar ? "signal-list-compact" : ""}`}>
            {props.report.keyReasons.map((reason) => (
              <div className="signal neutral" key={reason}>
                <small>{reason}</small>
              </div>
            ))}
            {props.report.uncertaintyNote ? (
              <div className="signal neutral">
                <strong>Uncertainty note</strong>
                <small>{props.report.uncertaintyNote}</small>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="empty-card">
          <h3>Free trust read</h3>
          <p>Risk level, three reasons, and a short wallet snapshot appear here.</p>
        </div>
      )}
    </section>
  );
}
