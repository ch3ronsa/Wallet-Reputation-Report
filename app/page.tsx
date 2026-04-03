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
          Fast, deterministic wallet intelligence for OpenWallet hackathon demos. Run in mock mode immediately, then
          switch adapters to real Allium, OWS, MoonPay, and x402 flows when credentials are ready.
        </p>
        <div className="hero-badges">
          <span className="badge">Next.js + TypeScript</span>
          <span className="badge">App Router</span>
          <span className="badge">Mock/real adapters</span>
          <span className="badge">Deterministic scoring</span>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Check a wallet</h2>
          <p>Paste an EVM address to generate a free summary now and preview the locked premium report flow.</p>
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
                {loadingFree ? "Generating..." : "Generate summary"}
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={handleUnlockAttempt}
                disabled={loadingFull}
              >
                {loadingFull ? "Checking paywall..." : "View full report"}
              </button>
            </div>
          </form>

          {error ? <div className="error-note">{error}</div> : null}
        </div>

        <div className="panel">
          <h2>How this scaffold works</h2>
          <p>Mock mode is the default so the app runs immediately. Real mode stays adapter-driven and isolated.</p>
          <div className="signal-list">
            <div className="signal neutral">
              <strong>Allium adapter</strong>
              <small>Supplies the wallet profile in mock mode or real API mode.</small>
            </div>
            <div className="signal neutral">
              <strong>Scoring engine</strong>
              <small>Produces the reputation score deterministically from typed wallet metrics.</small>
            </div>
            <div className="signal neutral">
              <strong>x402 + OWS + MoonPay</strong>
              <small>Keep the premium report locked until payment, while exposing operator-safe commands.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="panel report-card">
          <h2>Summary card</h2>
          {freeReport ? (
            <>
              <div className="score-row">
                <div>
                  <div className="score-band">{freeReport.score.band}</div>
                  <div className="score-value">{freeReport.score.value}</div>
                </div>
                <div>
                  <h3>{freeReport.summary.headline}</h3>
                  <p>{freeReport.summary.verdict}</p>
                </div>
              </div>

              <div className="metric-grid">
                <div className="metric">
                  <span>Transactions</span>
                  <strong>{freeReport.wallet.metrics.txCount}</strong>
                </div>
                <div className="metric">
                  <span>Portfolio value</span>
                  <strong>${freeReport.wallet.metrics.totalPortfolioUsd.toFixed(2)}</strong>
                </div>
                <div className="metric">
                  <span>Active days</span>
                  <strong>{freeReport.wallet.metrics.uniqueActiveDays}</strong>
                </div>
                <div className="metric">
                  <span>Counterparties</span>
                  <strong>{freeReport.wallet.metrics.uniqueCounterparties}</strong>
                </div>
                <div className="metric">
                  <span>Wallet age</span>
                  <strong>
                    {freeReport.wallet.age.walletAgeDays !== null ? `${freeReport.wallet.age.walletAgeDays}d` : "Unknown"}
                  </strong>
                </div>
                <div className="metric">
                  <span>Recent 7d tx</span>
                  <strong>{freeReport.wallet.activity.recentTxCount7d}</strong>
                </div>
              </div>

              <div className="signal-list">
                {freeReport.summary.bullets.map((bullet) => (
                  <div className="signal neutral" key={bullet}>
                    <small>{bullet}</small>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="subtle">Generate a summary to populate this card with wallet-level reputation signals.</p>
          )}
        </div>

        <div className="panel report-card">
          <h2>Locked full report card</h2>
          {fullReport ? (
            <div className="signal-list">
              {fullReport.premiumInsights.map((insight) => (
                <div className="signal positive" key={insight.title}>
                  <strong>{insight.title}</strong>
                  <small>{insight.body}</small>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="locked-card">
                <div className="locked-badge">Premium</div>
                <h3>Underwriting details, premium signals, and monetized delivery</h3>
                <p>
                  This card stays locked until the full report route clears the x402 payment gate. In mock mode, the
                  API returns a realistic `402 Payment Required` response.
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

      {(freeReport?.score.signals.length || paywall?.owsCommands || paywall?.moonpay) && (
        <section className="grid">
          <div className="panel">
            <h2>Risk signals</h2>
            <div className="signal-list">
              {freeReport?.score.signals.map((signal) => (
                <div className={`signal ${signal.impact}`} key={signal.id}>
                  <strong>
                    {signal.title} {signal.weight > 0 ? `+${signal.weight}` : signal.weight}
                  </strong>
                  <small>{signal.explanation}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>Adapter guidance</h2>
            {freeReport?.wallet.topCounterparties.length ? (
              <>
                <h3>Top counterparties</h3>
                <div className="signal-list">
                  {freeReport.wallet.topCounterparties.map((counterparty) => (
                    <div className="signal neutral" key={counterparty.address}>
                      <strong>{counterparty.address}</strong>
                      <small>
                        {counterparty.interactions} interactions, {counterparty.direction} flow
                      </small>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {paywall?.owsCommands ? (
              <>
                <h3>OWS commands</h3>
                <div className="command-list">
                  {paywall.owsCommands.map((command) => (
                    <div className="command" key={command}>
                      <code>{command}</code>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="subtle">Attempt the full report to preview OWS and payment guidance here.</p>
            )}

            {paywall?.moonpay ? (
              <>
                <h3>MoonPay</h3>
                <p>
                  <strong>{paywall.moonpay.skillName}</strong>: {paywall.moonpay.description}
                </p>
                <div className="command-list">
                  {paywall.moonpay.commands.map((command) => (
                    <div className="command" key={command}>
                      <code>{command}</code>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </section>
      )}
    </main>
  );
}
