import { FullReportResponse } from "@/types/api";

type PaywallPanelProps = {
  paywall?: Omit<FullReportResponse, "report">;
};

export function PaywallPanel(props: PaywallPanelProps) {
  if (!props.paywall) {
    return null;
  }

  return (
    <section className="grid">
      <div className="panel">
        <div className="section-heading">
          <h2>Payment path</h2>
          <span className="section-tag">OWS</span>
        </div>
        {props.paywall.owsService ? (
          <div className="signal neutral">
            <strong>{props.paywall.owsService.walletName}</strong>
            <small>
              Provider payment identity on {props.paywall.owsService.chain}: {props.paywall.owsService.address}
            </small>
          </div>
        ) : null}
        {props.paywall.owsWorkflow ? (
          <>
            <h3>OWS CLI setup</h3>
            <div className="command-list">
              {props.paywall.owsWorkflow.setupCommands.map((command) => (
                <div className="command" key={command}>
                  <code>{command}</code>
                </div>
              ))}
            </div>

            <h3>OWS CLI unlock flow</h3>
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
          </>
        ) : null}
      </div>

      <div className="panel">
        <div className="section-heading">
          <h2>Top up helper</h2>
          <span className="section-tag">MoonPay</span>
        </div>
        {props.paywall.moonpay ? (
          <>
            <p>
              <strong>{props.paywall.moonpay.skillName}</strong>: {props.paywall.moonpay.description}
            </p>
            <div className="signal neutral">
              <small>
                Availability: {props.paywall.moonpay.available ? "enabled" : "fallback mode"} | Asset:{" "}
                {props.paywall.moonpay.targetAsset ?? "USDC"} | Suggested amount:{" "}
                {props.paywall.moonpay.suggestedAmount ?? "custom"}
              </small>
            </div>
            <div className="command-list">
              {props.paywall.moonpay.commands.map((command) => (
                <div className="command" key={command}>
                  <code>{command}</code>
                </div>
              ))}
            </div>
            {props.paywall.moonpay.fallbackMessage ? (
              <div className="signal neutral">
                <small>{props.paywall.moonpay.fallbackMessage}</small>
              </div>
            ) : null}
          </>
        ) : (
          <p className="subtle">MoonPay top-up guidance appears here when the premium report is locked.</p>
        )}
      </div>
    </section>
  );
}
