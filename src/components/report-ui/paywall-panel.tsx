import { FullReportResponse } from "@/types/api";

type PaywallPanelProps = {
  paywall?: Omit<FullReportResponse, "report">;
};

export function PaywallPanel(props: PaywallPanelProps) {
  if (!props.paywall) {
    return null;
  }

  return (
    <section className="panel report-card premium-panel premium-stage-panel">
      <div className="section-heading">
        <h2>Unlock details</h2>
        <span className="section-tag">x402 + OWS</span>
      </div>
      {props.paywall.requirements?.map((requirement) => (
        <div className="signal neutral" key={`${requirement.receiver}-${requirement.resource}`}>
          <strong>
            {requirement.maxAmountRequired} {requirement.asset} on {requirement.network}
          </strong>
          <small>
            x402 unlock target: {requirement.receiver} | Resource: {requirement.resource}
          </small>
        </div>
      ))}
      {props.paywall.owsService ? (
        <div className="signal neutral">
          <strong>{props.paywall.owsService.walletName}</strong>
          <small>
            Provider payment identity on {props.paywall.owsService.chain}: {props.paywall.owsService.address}
          </small>
        </div>
      ) : null}
      {props.paywall.moonpay ? (
        <div className="signal neutral">
          <strong>MoonPay top-up path</strong>
          <small>
            {props.paywall.moonpay.skillName} | Buyer wallet: {props.paywall.moonpay.targetWalletName ?? "report-buyer"} |{" "}
            Asset: {props.paywall.moonpay.targetAsset ?? "USDC"} | Suggested amount:{" "}
            {props.paywall.moonpay.suggestedAmount ?? "custom"}
          </small>
        </div>
      ) : null}
      {props.paywall.owsWorkflow ? (
        <div className="report-section">
          <h3>OWS CLI path</h3>
          <div className="command-list">
            {props.paywall.owsWorkflow.unlockCommands.map((command) => (
              <div className="command" key={command}>
                <code>{command}</code>
              </div>
            ))}
          </div>
          <div className="signal neutral">
            <small>{props.paywall.owsWorkflow.note}</small>
          </div>
        </div>
      ) : null}
    </section>
  );
}
