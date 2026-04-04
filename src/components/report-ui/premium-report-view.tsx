import { FullReport } from "@/types/domain";

type PremiumReportViewProps = {
  report: FullReport;
};

export function PremiumReportView(props: PremiumReportViewProps) {
  return (
    <section className="panel report-card premium-panel premium-stage-panel">
      <div className="section-heading">
        <h2>Premium report</h2>
        <span className="section-tag">
          {props.report.scoreBreakdown.riskLevel} risk | {props.report.scoreBreakdown.totalScore}/100
        </span>
      </div>

      <div className="report-section">
        <div className="section-heading">
          <h2>Operator view</h2>
          <span className="section-tag">{props.report.operatorView.operatorDecision}</span>
        </div>
        <div className="operator-snapshot-grid">
          <div className="operator-snapshot-card">
            <span>Decision</span>
            <strong>{props.report.operatorView.operatorDecision}</strong>
          </div>
          <div className="operator-snapshot-card">
            <span>Confidence</span>
            <strong>{props.report.operatorView.confidenceLevel}</strong>
          </div>
          <div className="operator-snapshot-card operator-snapshot-wide">
            <span>Behavior pattern</span>
            <strong>{props.report.operatorView.behaviorPattern}</strong>
          </div>
          <div className="operator-snapshot-card operator-snapshot-wide">
            <span>Funding source note</span>
            <strong>{props.report.operatorView.fundingSourceNote}</strong>
          </div>
        </div>
        <h3>Top activity types</h3>
        <div className="operator-activity-grid">
          {props.report.operatorView.topActivityTypes.map((activityType) => (
            <div className="metric" key={activityType.label}>
              <span>{activityType.label}</span>
              <strong>{Math.round(activityType.share * 100)}%</strong>
              <small>{activityType.count} recent item(s)</small>
            </div>
          ))}
        </div>
        <div className="signal-list">
          <div className="signal neutral">
            <strong>Confidence note</strong>
            <small>{props.report.operatorView.confidenceNote}</small>
          </div>
        </div>
      </div>

      <div className="report-section">
        <p className="subtle">Explanation only. The score itself remains deterministic and rule-based.</p>
        <div className="signal-list">
          <div className="signal positive">
            <strong>Plain-language interpretation</strong>
            <small>{props.report.interpretation.plainLanguage}</small>
          </div>
          <div className="signal positive">
            <strong>Trust posture</strong>
            <small>{props.report.interpretation.trustPosture}</small>
          </div>
          <div className="signal positive">
            <strong>Commercial note</strong>
            <small>{props.report.interpretation.monetizationNote}</small>
          </div>
        </div>
      </div>

      <div className="report-section">
        <div className="section-heading">
          <h2>Score breakdown</h2>
          <span className="section-tag">Signals</span>
        </div>
        <div className="signal-list">
          {props.report.scoreBreakdown.signals.map((signal) => (
            <div className={`signal ${signal.impact}`} key={signal.id}>
              <strong>
                {signal.title} -{signal.weight}
              </strong>
              <small>{signal.explanation}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="report-section">
        <div className="section-heading">
          <h2>Observed facts</h2>
          <span className="section-tag">Observed</span>
        </div>
        <h3>Notable counterparties</h3>
        <div className="signal-list">
          {props.report.facts.notableCounterparties.map((counterparty) => (
            <div className="signal neutral" key={counterparty.address}>
              <strong>{counterparty.address}</strong>
              <small>
                {counterparty.interactions} interactions, {counterparty.direction} flow
              </small>
            </div>
          ))}
        </div>

        <h3>Concentration observations</h3>
        <div className="signal-list">
          {props.report.facts.concentrationObservations.map((item) => (
            <div className="signal neutral" key={item}>
              <small>{item}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="report-section">
        <div className="section-heading">
          <h2>Activity and limitations</h2>
          <span className="section-tag">Context</span>
        </div>
        <h3>Activity observations</h3>
        <div className="signal-list">
          {props.report.facts.activityObservations.map((item) => (
            <div className="signal neutral" key={item}>
              <small>{item}</small>
            </div>
          ))}
        </div>

        <h3>Limitations / unknowns</h3>
        <div className="signal-list">
          {props.report.facts.limitations.map((item) => (
            <div className="signal neutral" key={item}>
              <small>{item}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
