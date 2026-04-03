export const ALLIUM_ASSUMPTIONS = {
  chain: "base",
  endpoints: {
    transactions: "/api/v1/developer/wallet/transactions",
    balances: "/api/v1/developer/wallet/balances",
  },
  transactionFields: {
    hash: ["hash", "id"],
    timestamp: ["block_timestamp", "timestamp"],
    from: ["from_address", "from"],
    to: ["to_address", "to"],
    success: ["success", "status"],
    type: ["type", "activity_type"],
    valueUsd: ["value_usd", "amount_usd", "usd_value"],
    feeUsd: ["fee.amount", "fee_usd"],
    labels: ["labels"],
  },
  balanceFields: {
    symbol: ["token.info.symbol", "symbol"],
    tokenAddress: ["token.address", "token_address"],
    amount: ["amount", "balance", "balance_formatted", "raw_balance"],
    usdValue: ["balance_usd", "value_usd", "usd_value"],
    tokenType: ["token.type"],
  },
} as const;

export const ALLIUM_INTEGRATION_NOTE =
  "If Allium field names or wallet endpoints differ by account tier, update this file only and keep the rest of the app unchanged.";
