#!/usr/bin/env bash
set -euo pipefail

REPORT_URL="${1:-http://localhost:3000/api/report/full}"
WALLET_ADDRESS="${2:-0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045}"
CHAIN="${3:-base}"

OWS_BIN="${OWS_BIN:-}"

if [ -z "${OWS_BIN}" ]; then
  if command -v ows >/dev/null 2>&1; then
    OWS_BIN="$(command -v ows)"
  elif [ -x "${HOME}/.ows/bin/ows" ]; then
    OWS_BIN="${HOME}/.ows/bin/ows"
  else
    echo "OWS is not installed. Run ./scripts/setup-ows-ubuntu.sh first." >&2
    exit 1
  fi
fi

REQUEST_BODY="{\"address\":\"${WALLET_ADDRESS}\",\"chain\":\"${CHAIN}\"}"

echo "Ubuntu / WSL demo path for Wallet Reputation Report"
echo
echo "1. Create or inspect the provider wallet"
echo "   ${OWS_BIN} wallet create --name \"wallet-reputation-report\""
echo "   ${OWS_BIN} wallet info"
echo
echo "2. Create the buyer wallet used for premium unlock"
echo "   ${OWS_BIN} wallet create --name \"report-buyer\""
echo
echo "3. Fund the buyer wallet through MoonPay via OWS"
echo "   ${OWS_BIN} fund deposit --wallet \"report-buyer\" --chain ${CHAIN} --token USDC"
echo
echo "4. Pay the x402-enabled report endpoint"
echo "   ${OWS_BIN} pay request --wallet \"report-buyer\" \"${REPORT_URL}\" --method POST --body '${REQUEST_BODY}'"
echo
echo "Tip: start the app locally with npm run dev before running step 4."
