import { FreeSummary } from "@/types/domain";

type FreeSummaryCardProps = {
  report?: FreeSummary;
};

export function FreeSummaryCard(props: FreeSummaryCardProps) {
  return (
    <section className="panel report-card">
      <div className="section-heading">
        <h2>Free summary</h2>
        <span className="section-tag">Immediate</span>
      </div>
      {props.report ? (
        <>
          <div className="score-row">
            <div>
              <div className="score-band">{props.report.overallRiskLevel} risk</div>
              <div className="score-value">{props.report.overallRiskLevel.toUpperCase()}</div>
            </div>
            <div>
              <h3>{props.report.walletAddress}</h3>
              <p>
                Chain: {props.report.chain} | Risk level: {props.report.overallRiskLevel}
              </p>
            </div>
          </div>

          <div className="metric-grid">
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

          <div className="signal-list">
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
