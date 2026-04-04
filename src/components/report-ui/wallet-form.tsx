import { FormEvent } from "react";

type WalletFormProps = {
  address: string;
  error?: string;
  hasFreeSummary: boolean;
  loadingFree: boolean;
  loadingFull: boolean;
  onAddressChange: (value: string) => void;
  onGenerateSummary: (event: FormEvent) => void;
  onOpenPremium: () => void;
};

export function WalletForm(props: WalletFormProps) {
  return (
    <section className="panel">
      <h2>Check a wallet</h2>
      <p>Start with the free summary. If the wallet needs deeper review, unlock the full report.</p>
      <form onSubmit={props.onGenerateSummary}>
        <label className="field-label" htmlFor="wallet-address">
          Wallet address
        </label>
        <input
          id="wallet-address"
          className="address-input"
          value={props.address}
          onChange={(event) => props.onAddressChange(event.target.value)}
          placeholder="0x..."
        />
        <div className="button-row">
          <button className="button button-primary" type="submit" disabled={props.loadingFree}>
            {props.loadingFree ? "Analyzing wallet..." : "Generate free summary"}
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={props.onOpenPremium}
            disabled={props.loadingFull || !props.hasFreeSummary}
          >
            {props.loadingFull ? "Checking premium access..." : "Open premium report"}
          </button>
        </div>
      </form>
      {!props.hasFreeSummary ? (
        <p className="subtle">Generate the summary first, then move to the paid report.</p>
      ) : null}
      {props.error ? <div className="error-note">{props.error}</div> : null}
    </section>
  );
}
