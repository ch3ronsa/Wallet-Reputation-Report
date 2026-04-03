"use client";

import { FormEvent, useState } from "react";

type FreeReportResponse = {
  report?: {
    generatedAt: string;
    summary: {
      headline: string;
      reasons: string[];
    };
    score: {
      score: number;
      band: string;
      signals: Array<{
        id: string;
        label: string;
        impact: "positive" | "negative" | "neutral";
        weight: number;
        detail: string;
      }>;
    };
    metrics: {
      txCount: number;
      uniqueActiveDays: number;
      uniqueCounterparties: number;
      failedTxRatio: number;
      stablecoinShare: number;
      largestAssetShare: number;
      totalPortfolioUsd: number;
      nativeBalanceUsd: number;
      suspiciousLabelCount: number;
    };
  };
  error?: string;
};

type FullReportResponse = {
  report?: {
    premiumInsights: Array<{ title: string; body: string }>;
    score: {
      score: number;
      band: string;
      signals: Array<{
        id: string;
        label: string;
        impact: "positive" | "negative" | "neutral";
        weight: number;
        detail: string;
      }>;
    };
  };
  requirements?: Array<{
    network: string;
    asset: string;
    maxAmountRequired: string;
    receiver: string;
    description: string;
  }>;
  owsCommands?: string[];
  moonpay?: {
    skillName: string;
    description: string;
    commands: string[];
  };
  error?: string;
};

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
  const [loadingFree, setLoadingFree] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [freeReport, setFreeReport] = useState<FreeReportResponse["report"]>();
  const [fullReport, setFullReport] = useState<FullReportResponse["report"]>();
  const [paywall, setPaywall] = useState<Omit<FullReportResponse, "report">>();
  const [error, setError] = useState<string>();

  async function handleFreeReport(event: FormEvent) {
    event.preventDefault();
    setLoadingFree(true);
    setError(undefined);
    setPaywall(undefined);
    setFullReport(undefined);

    try {
      const { data } = await postJson<FreeReportResponse>("/api/report/free", {
        address,
        chain: "base",
      });

      if (data.error || !data.report) {
        throw new Error(data.error ?? "Unable to build free report.");
      }

      setFreeReport(data.report);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to build free report.");
    } finally {
      setLoadingFree(false);
    }
  }

  async function handlePremiumReport() {
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

      if (data.error || !data.report) {
        throw new Error(data.error ?? "Unable to unlock premium report.");
      }

      setFullReport(data.report);
      setPaywall(undefined);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to unlock premium report.");
    } finally {
      setLoadingFull(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Wallet Reputation Report</h1>
        <p>
          Deterministic wallet risk intelligence for OpenWallet. Allium supplies the live wallet data, a transparent
          TypeScript scoring engine computes the score, and x402 gates the premium report behind a machine-payments
          flow that works naturally with OWS.
        </p>
        <div className="hero-badges">
          <span className="badge">Allium intelligence layer</span>
          <span className="badge">Deterministic scoring</span>
          <span className="badge">OWS wallet + CLI payment flow</span>
          <span className="badge">x402 premium unlock</span>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Analyze a wallet</h2>
          <p>
            Start with a free summary. Then unlock the premium underwriting-grade report through an x402 payment
            request.
          </p>

          <form onSubmit={handleFreeReport}>
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
                {loadingFree ? "Computing..." : "Generate free summary"}
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={loadingFull}
                onClick={handlePremiumReport}
              >
                {loadingFull ? "Checking paywall..." : "Unlock full report"}
              </button>
            </div>
          </form>

          {error ? <div className="error-note">{error}</div> : null}
        </div>

        <div className="panel">
          <h2>Demo story</h2>
          <p>
            This MVP is single-chain first on Base. The score is rule-based, not LLM-authored. Language models can
            explain the report later, but they do not set the risk score.
          </p>
          <p className="subtle">
            For hackathon demoing, show the free summary in the browser and the premium unlock with
            <code> ows pay request </code> from the terminal.
          </p>
        </div>
      </section>

      {freeReport ? (
        <section className="grid">
          <div className="panel report-card">
            <div className="score-row">
              <div>
                <div className="score-band">{freeReport.score.band}</div>
                <div className="score-value">{freeReport.score.score}</div>
              </div>
              <div>
                <h3>{freeReport.summary.headline}</h3>
                <p>Generated at {new Date(freeReport.generatedAt).toLocaleString()}.</p>
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Transactions</span>
                <strong>{freeReport.metrics.txCount}</strong>
              </div>
              <div className="metric">
                <span>Active days</span>
                <strong>{freeReport.metrics.uniqueActiveDays}</strong>
              </div>
              <div className="metric">
                <span>Counterparties</span>
                <strong>{freeReport.metrics.uniqueCounterparties}</strong>
              </div>
              <div className="metric">
                <span>Portfolio value</span>
                <strong>${freeReport.metrics.totalPortfolioUsd.toFixed(2)}</strong>
              </div>
            </div>

            <div>
              <h3>Top reasons</h3>
              <div className="signal-list">
                {freeReport.summary.reasons.map((reason) => (
                  <div className="signal neutral" key={reason}>
                    <small>{reason}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <h2>Signal breakdown</h2>
            <div className="signal-list">
              {freeReport.score.signals.map((signal) => (
                <div className={`signal ${signal.impact}`} key={signal.id}>
                  <strong>
                    {signal.label} {signal.weight > 0 ? `+${signal.weight}` : signal.weight}
                  </strong>
                  <small>{signal.detail}</small>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {paywall?.requirements ? (
        <section className="grid">
          <div className="panel">
            <h2>Premium report is paywalled</h2>
            <p>
              The API returned HTTP <code>402</code>. That is the intended monetization boundary for the full report.
            </p>
            <div className="signal-list">
              {paywall.requirements.map((requirement) => (
                <div className="signal neutral" key={`${requirement.network}-${requirement.asset}`}>
                  <strong>
                    {requirement.maxAmountRequired} {requirement.asset} on {requirement.network}
                  </strong>
                  <small>
                    Receiver: {requirement.receiver} | {requirement.description}
                  </small>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>OWS + MoonPay workflow</h2>
            <p>Use OWS CLI to create and fund the buyer wallet, then retry the premium request.</p>

            {paywall.owsCommands ? (
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
            ) : null}

            {paywall.moonpay ? (
              <>
                <h3>MoonPay skill</h3>
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
      ) : null}

      {fullReport ? (
        <section className="panel">
          <h2>Premium report</h2>
          <div className="signal-list">
            {fullReport.premiumInsights.map((insight) => (
              <div className="signal positive" key={insight.title}>
                <strong>{insight.title}</strong>
                <small>{insight.body}</small>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
