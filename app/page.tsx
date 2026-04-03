"use client";

import { FormEvent, useState } from "react";
import { FreeReportResponse, FullReportResponse } from "@/types/api";

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

export default function HomePage() {
  const [address, setAddress] = useState("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  const [freeReport, setFreeReport] = useState<FreeReportResponse["report"]>();
  const [fullReport, setFullReport] = useState<FullReportResponse["report"]>();
  const [paywall, setPaywall] = useState<Omit<FullReportResponse, "report">>();
  const [loadingFree, setLoadingFree] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [error, setError] = useState<string>();

  async function handleGenerateSummary(event: FormEvent) {
    event.preventDefault();
    setLoadingFree(true);
    setError(undefined);
    setFullReport(undefined);
    setPaywall(undefined);

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

  async function handleUnlockAttempt() {
    setLoadingFull(true);
    setError(undefined);

    try {
      const { status, data } = await postJson<FullReportResponse>("/api/report/full", {
        address,
        chain: "base",
      });

      if (status === 402) {
        setPaywall(data);
        setFullReport(undefined);
        return;
      }

      if (!data.report || data.error) {
        throw new Error(data.error ?? "Unable to load the full report.");
      }

      setFullReport(data.report);
      setPaywall(undefined);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load the full report.");
    } finally {
      setLoadingFull(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Wallet Reputation Report</h1>
        <p>
          Deterministic, monetizable wallet intelligence. The free tier gives a short risk read; the paid report turns
          the same profile into an operator-ready decision document.
        </p>
        <div className="hero-badges">
          <span className="badge">Allium-backed profile</span>
          <span className="badge">Deterministic scoring</span>
          <span className="badge">Free summary</span>
          <span className="badge">Premium report</span>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Generate a report</h2>
          <p>Paste a wallet address to get a short free read first, then unlock the structured full report.</p>
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
                {loadingFull ? "Checking paywall..." : "Unlock full report"}
              </button>
            </div>
          </form>
          {error ? <div className="error-note">{error}</div> : null}
        </div>

        <div className="panel">
          <h2>What changes between free and paid</h2>
          <div className="signal-list">
            <div className="signal neutral">
              <strong>Free summary</strong>
              <small>Address, chain, overall risk level, three key reasons, and a quick snapshot.</small>
            </div>
            <div className="signal neutral">
              <strong>Full report</strong>
              <small>Score breakdown, counterparties, concentration, activity observations, limitations, and interpretation.</small>
            </div>
            <div className="signal neutral">
              <strong>Rules</strong>
              <small>Facts stay in fact sections. Interpretation stays in interpretation sections.</small>
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
                    Chain: {freeReport.chain} | Overall risk: {freeReport.overallRiskLevel}
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
            <p className="subtle">Generate a summary to fill this card with a short, operator-friendly wallet read.</p>
          )}
        </div>

        <div className="panel report-card">
          <h2>Locked full report</h2>
          {fullReport ? (
            <>
              <div className="signal-list">
                <div className="signal neutral">
                  <strong>Interpretation</strong>
                  <small>{fullReport.interpretation.plainLanguage}</small>
                </div>
                <div className="signal neutral">
                  <strong>Trust posture</strong>
                  <small>{fullReport.interpretation.trustPosture}</small>
                </div>
                <div className="signal neutral">
                  <strong>Commercial note</strong>
                  <small>{fullReport.interpretation.monetizationNote}</small>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="locked-card">
                <div className="locked-badge">Premium</div>
                <h3>Facts, interpretation, and a monetizable decision layer</h3>
                <p>
                  The paid report is designed to feel operationally useful: clearly structured, easy to scan, and
                  suitable for underwriting-style decisions.
                </p>
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
            <h2>Facts</h2>
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

            <h3>Limitations and unknowns</h3>
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
            <h2>OWS commands</h2>
            <div className="command-list">
              {paywall?.owsCommands?.map((command) => (
                <div className="command" key={command}>
                  <code>{command}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>MoonPay</h2>
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
