"use client";

import { FormEvent, useState } from "react";
import { FreeReportResponse, FullReportResponse, PaymentState, UnlockReportResponse } from "@/types/api";

async function postJson<T>(url: string, body: Record<string, unknown>, headers?: HeadersInit): Promise<{
  status: number;
  data: T;
}> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    data: (await response.json()) as T,
  };
}

const COPY = {
  unlockCta: "Pay to unlock the full report",
  pending: "Payment pending. Complete the x402 flow, then verify to reveal the report.",
  success: "Payment success. The premium report is unlocked.",
  failed: "Payment failed or could not be verified. You can retry the unlock flow.",
};

export default function HomePage() {
  const [address, setAddress] = useState("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  const [freeReport, setFreeReport] = useState<FreeReportResponse["report"]>();
  const [fullReport, setFullReport] = useState<FullReportResponse["report"]>();
  const [paywall, setPaywall] = useState<Omit<FullReportResponse, "report">>();
  const [paymentState, setPaymentState] = useState<PaymentState>("locked");
  const [paymentMessage, setPaymentMessage] = useState<string>();
  const [unlockSessionId, setUnlockSessionId] = useState<string>();
  const [unlockToken, setUnlockToken] = useState<string>();
  const [loadingFree, setLoadingFree] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [error, setError] = useState<string>();

  async function handleGenerateSummary(event: FormEvent) {
    event.preventDefault();
    setLoadingFree(true);
    setError(undefined);
    setFullReport(undefined);
    setPaywall(undefined);
    setPaymentState("locked");
    setPaymentMessage(undefined);
    setUnlockSessionId(undefined);
    setUnlockToken(undefined);

    try {
      const { data } = await postJson<FreeReportResponse>("/api/report/free", {
        address,
        chain: "base",
      });

      if (!data.report || data.error) {
        throw new Error(data.error ?? "Unable to generate summary.");
      }

      setFreeReport(data.report);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to generate summary.");
    } finally {
      setLoadingFree(false);
    }
  }

  async function loadFullReport(token?: string) {
    const { status, data } = await postJson<FullReportResponse>(
      "/api/report/full",
      {
        address,
        chain: "base",
      },
      token ? { "x-report-unlock-token": token } : undefined,
    );

    if (status === 402) {
      setPaywall(data);
      setPaymentState(data.paymentState ?? "locked");
      setPaymentMessage("The premium report is locked until payment is verified.");
      return false;
    }

    if (!data.report || data.error) {
      throw new Error(data.error ?? "Unable to load the full report.");
    }

    setFullReport(data.report);
    setPaywall(undefined);
    setPaymentState("paid");
    setPaymentMessage(COPY.success);
    return true;
  }

  async function handleUnlockAttempt() {
    setLoadingFull(true);
    setError(undefined);

    try {
      await loadFullReport(unlockToken);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load the full report.");
    } finally {
      setLoadingFull(false);
    }
  }

  async function handleStartPayment() {
    setLoadingPayment(true);
    setError(undefined);

    try {
      const { data } = await postJson<UnlockReportResponse>("/api/report/unlock", {
        address,
        chain: "base",
      });

      if (!data.session || data.error) {
        throw new Error(data.error ?? "Unable to start payment.");
      }

      setUnlockSessionId(data.session.sessionId);
      setPaymentState(data.session.state);
      setPaymentMessage(data.session.message || COPY.pending);
    } catch (caughtError) {
      setPaymentState("failed");
      setPaymentMessage(COPY.failed);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start payment.");
    } finally {
      setLoadingPayment(false);
    }
  }

  async function handleVerifyPayment() {
    if (!unlockSessionId) {
      setPaymentState("failed");
      setPaymentMessage("No payment session exists yet. Start the unlock flow first.");
      return;
    }

    setLoadingPayment(true);
    setError(undefined);

    try {
      const { data } = await postJson<UnlockReportResponse>("/api/report/unlock/verify", {
        address,
        chain: "base",
        sessionId: unlockSessionId,
      });

      if (!data.session || data.error) {
        throw new Error(data.error ?? "Unable to verify payment.");
      }

      setPaymentState(data.session.state);
      setPaymentMessage(data.session.message);

      if (data.session.state === "paid" && data.session.unlockToken) {
        setUnlockToken(data.session.unlockToken);
        const loaded = await loadFullReport(data.session.unlockToken);

        if (!loaded) {
          setPaymentState("failed");
          setPaymentMessage("Payment was verified, but the report unlock could not be completed.");
        }
      } else if (data.session.state === "failed") {
        setPaymentMessage(data.session.failureReason ?? COPY.failed);
      }
    } catch (caughtError) {
      setPaymentState("failed");
      setPaymentMessage(COPY.failed);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to verify payment.");
    } finally {
      setLoadingPayment(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Wallet Reputation Report</h1>
        <p>
          Free summary first, x402-paid premium report second. The monetization flow is adapter-driven, demo-safe in
          mock mode, and isolated from the reporting logic.
        </p>
        <div className="hero-badges">
          <span className="badge">Free summary visible now</span>
          <span className="badge">Premium report locked</span>
          <span className="badge">Pay-per-report unlock</span>
          <span className="badge">Pending / paid / failed states</span>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Generate a report</h2>
          <p>Paste a wallet address to get the free summary immediately and decide whether to unlock the full report.</p>
          <form onSubmit={handleGenerateSummary}>
            <label className="field-label" htmlFor="wallet-address">
              Wallet address
            </label>
            <input
              id="wallet-address"
              className="address-input"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="0x..."
            />
            <div className="button-row">
              <button className="button button-primary" type="submit" disabled={loadingFree}>
                {loadingFree ? "Generating..." : "Generate free summary"}
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={handleUnlockAttempt}
                disabled={loadingFull}
              >
                {loadingFull ? "Checking access..." : "Open premium report"}
              </button>
            </div>
          </form>
          {error ? <div className="error-note">{error}</div> : null}
        </div>

        <div className="panel">
          <h2>Monetization flow</h2>
          <div className="signal-list">
            <div className="signal neutral">
              <strong>{COPY.unlockCta}</strong>
              <small>The user starts a paid unlock session for the premium report.</small>
            </div>
            <div className="signal neutral">
              <strong>Payment pending</strong>
              <small>{COPY.pending}</small>
            </div>
            <div className="signal neutral">
              <strong>Payment success</strong>
              <small>{COPY.success}</small>
            </div>
            <div className="signal neutral">
              <strong>Payment failed</strong>
              <small>{COPY.failed}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="panel report-card">
          <h2>Free summary</h2>
          {freeReport ? (
            <>
              <div className="score-row">
                <div>
                  <div className="score-band">{freeReport.overallRiskLevel} risk</div>
                  <div className="score-value">
                    {freeReport.quickSnapshot.visiblePortfolioUsd > 0
                      ? `$${freeReport.quickSnapshot.visiblePortfolioUsd.toFixed(0)}`
                      : "Profile"}
                  </div>
                </div>
                <div>
                  <h3>{freeReport.walletAddress}</h3>
                  <p>
                    Chain: {freeReport.chain} | Risk: {freeReport.overallRiskLevel}
                  </p>
                </div>
              </div>

              <div className="metric-grid">
                <div className="metric">
                  <span>Wallet age</span>
                  <strong>
                    {freeReport.quickSnapshot.walletAgeDays !== null
                      ? `${freeReport.quickSnapshot.walletAgeDays}d`
                      : "Unknown"}
                  </strong>
                </div>
                <div className="metric">
                  <span>Transactions</span>
                  <strong>{freeReport.quickSnapshot.transactionCount}</strong>
                </div>
                <div className="metric">
                  <span>Active days</span>
                  <strong>{freeReport.quickSnapshot.activeDays}</strong>
                </div>
                <div className="metric">
                  <span>Counterparties</span>
                  <strong>{freeReport.quickSnapshot.uniqueCounterparties}</strong>
                </div>
              </div>

              <div className="signal-list">
                {freeReport.keyReasons.map((reason) => (
                  <div className="signal neutral" key={reason}>
                    <small>{reason}</small>
                  </div>
                ))}
                {freeReport.uncertaintyNote ? (
                  <div className="signal neutral">
                    <strong>Uncertainty note</strong>
                    <small>{freeReport.uncertaintyNote}</small>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <p className="subtle">Generate a summary to see the free layer of the product.</p>
          )}
        </div>

        <div className="panel report-card">
          <h2>Premium report</h2>
          {fullReport ? (
            <>
              <div className="status-note">Unlocked</div>
              <div className="signal-list">
                <div className="signal positive">
                  <strong>Interpretation</strong>
                  <small>{fullReport.interpretation.plainLanguage}</small>
                </div>
                <div className="signal positive">
                  <strong>Trust posture</strong>
                  <small>{fullReport.interpretation.trustPosture}</small>
                </div>
                <div className="signal positive">
                  <strong>Commercial note</strong>
                  <small>{fullReport.interpretation.monetizationNote}</small>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="locked-card">
                <div className="locked-badge">Locked</div>
                <h3>Pay per report unlock</h3>
                <p>The full report stays locked until payment verification succeeds.</p>
              </div>

              <div className="button-row">
                <button className="button button-primary" type="button" onClick={handleStartPayment} disabled={loadingPayment}>
                  {loadingPayment ? "Starting payment..." : COPY.unlockCta}
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={loadingPayment || !unlockSessionId}
                >
                  {loadingPayment ? "Verifying..." : "Verify payment and reveal report"}
                </button>
              </div>

              <div className={`signal ${paymentState === "failed" ? "negative" : paymentState === "paid" ? "positive" : "neutral"}`}>
                <strong>State: {paymentState}</strong>
                <small>
                  {paymentMessage ??
                    (paymentState === "pending"
                      ? COPY.pending
                      : paymentState === "paid"
                        ? COPY.success
                        : paymentState === "failed"
                          ? COPY.failed
                          : "The premium report is currently locked.")}
                </small>
              </div>

              {paywall?.requirements ? (
                <div className="signal-list">
                  {paywall.requirements.map((requirement) => (
                    <div className="signal neutral" key={`${requirement.network}-${requirement.asset}`}>
                      <strong>
                        {requirement.maxAmountRequired} {requirement.asset} on {requirement.network}
                      </strong>
                      <small>{requirement.description}</small>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {fullReport ? (
        <section className="grid">
          <div className="panel">
            <h2>Score breakdown</h2>
            <div className="signal-list">
              {fullReport.scoreBreakdown.signals.map((signal) => (
                <div className={`signal ${signal.impact}`} key={signal.id}>
                  <strong>
                    {signal.title} -{signal.weight}
                  </strong>
                  <small>{signal.explanation}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>Paid content</h2>
            <h3>Notable counterparties</h3>
            <div className="signal-list">
              {fullReport.facts.notableCounterparties.map((counterparty) => (
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
              {fullReport.facts.concentrationObservations.map((item) => (
                <div className="signal neutral" key={item}>
                  <small>{item}</small>
                </div>
              ))}
            </div>

            <h3>Activity observations</h3>
            <div className="signal-list">
              {fullReport.facts.activityObservations.map((item) => (
                <div className="signal neutral" key={item}>
                  <small>{item}</small>
                </div>
              ))}
            </div>

            <h3>Limitations / unknowns</h3>
            <div className="signal-list">
              {fullReport.facts.limitations.map((item) => (
                <div className="signal neutral" key={item}>
                  <small>{item}</small>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!fullReport && (paywall?.owsCommands || paywall?.moonpay) ? (
        <section className="grid">
          <div className="panel">
            <h2>OWS payment workflow</h2>
            <div className="command-list">
              {paywall?.owsCommands?.map((command) => (
                <div className="command" key={command}>
                  <code>{command}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>MoonPay funding workflow</h2>
            <p>
              <strong>{paywall?.moonpay?.skillName}</strong>: {paywall?.moonpay?.description}
            </p>
            <div className="command-list">
              {paywall?.moonpay?.commands.map((command) => (
                <div className="command" key={command}>
                  <code>{command}</code>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
