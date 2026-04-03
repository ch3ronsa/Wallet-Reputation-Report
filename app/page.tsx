"use client";

import { FormEvent, useMemo, useState } from "react";
import { FreeReportResponse, FullReportResponse, PaymentState, UnlockReportResponse } from "@/types/api";
import { HeroSection } from "@/components/report-ui/hero-section";
import { WalletForm } from "@/components/report-ui/wallet-form";
import { StatusAuditLine } from "@/components/report-ui/status-audit-line";
import { LoadingPanel } from "@/components/report-ui/loading-panel";
import { FreeSummaryCard } from "@/components/report-ui/free-summary-card";
import { PremiumTeaserCard } from "@/components/report-ui/premium-teaser-card";
import { PaywallPanel } from "@/components/report-ui/paywall-panel";
import { PremiumReportView } from "@/components/report-ui/premium-report-view";

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
  pending: "Payment pending. Complete the x402 flow, then verify to reveal the report.",
  success: "Payment success. The premium report is unlocked.",
  failed: "Payment failed or could not be verified. You can retry the unlock flow.",
  locked: "The premium report is currently locked until payment is verified.",
};

export default function HomePage() {
  const [address, setAddress] = useState("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  const [freeReport, setFreeReport] = useState<FreeReportResponse["report"]>();
  const [freeMode, setFreeMode] = useState<"mock" | "real">("mock");
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

  const auditMode = useMemo(() => fullReport ? "real" : paywall?.mode ?? freeMode, [freeMode, fullReport, paywall?.mode]);

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

      setFreeMode(data.mode);
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
      { address, chain: "base" },
      token ? { "x-report-unlock-token": token } : undefined,
    );

    if (status === 402) {
      setPaywall(data);
      setPaymentState(data.paymentState ?? "locked");
      setPaymentMessage(COPY.locked);
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

  async function handleOpenPremium() {
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

      setPaywall((current) => ({
        ...current,
        mode: data.mode ?? current?.mode ?? "mock",
        owsService: data.owsService,
        owsWorkflow: data.owsWorkflow,
        moonpay: data.moonpay,
      }));
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

      setPaywall((current) => ({
        ...current,
        mode: data.mode ?? current?.mode ?? "mock",
        owsService: data.owsService,
        owsWorkflow: data.owsWorkflow,
        moonpay: data.moonpay,
      }));
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
      <HeroSection />

      <StatusAuditLine
        mode={auditMode}
        paymentState={paymentState}
        chain={fullReport?.chain ?? freeReport?.chain}
        generatedAt={fullReport?.generatedAt}
      />

      <section className="grid">
        <WalletForm
          address={address}
          error={error}
          loadingFree={loadingFree}
          loadingFull={loadingFull}
          onAddressChange={setAddress}
          onGenerateSummary={handleGenerateSummary}
          onOpenPremium={handleOpenPremium}
        />

        <section className="panel">
          <div className="section-heading">
            <h2>What you get</h2>
            <span className="section-tag">Demo flow</span>
          </div>
          <div className="signal-list">
            <div className="signal neutral">
              <strong>Free summary</strong>
              <small>Fast trust and risk read with three reasons and a concise snapshot.</small>
            </div>
            <div className="signal neutral">
              <strong>Premium report</strong>
              <small>Detailed signal breakdown, counterparties, concentration, activity, and limitations.</small>
            </div>
            <div className="signal neutral">
              <strong>Unlock path</strong>
              <small>Paid intelligence via x402, with OWS payment identity and MoonPay top-up help when needed.</small>
            </div>
          </div>
        </section>
      </section>

      {(loadingFree || loadingFull) && !freeReport && !fullReport ? (
        <LoadingPanel
          title="Analyzing wallet"
          body="Collecting wallet activity, computing deterministic risk signals, and preparing the first trust read."
        />
      ) : null}

      <section className="grid">
        <FreeSummaryCard report={freeReport} />
        {!fullReport ? (
          <PremiumTeaserCard
            paymentState={paymentState}
            paymentMessage={paymentMessage}
            loadingPayment={loadingPayment}
            onStartPayment={handleStartPayment}
            onVerifyPayment={handleVerifyPayment}
            owsWalletLabel={paywall?.owsService ? `${paywall.owsService.walletName} | ${paywall.owsService.address}` : undefined}
          />
        ) : (
          <section className="panel report-card">
            <div className="section-heading">
              <h2>Premium status</h2>
              <span className="section-tag">Unlocked</span>
            </div>
            <div className="status-note">{paymentMessage ?? COPY.success}</div>
            <p className="subtle">The paid report is now visible below.</p>
          </section>
        )}
      </section>

      {!fullReport ? <PaywallPanel paywall={paywall} /> : null}
      {fullReport ? <PremiumReportView report={fullReport} /> : null}
    </main>
  );
}
