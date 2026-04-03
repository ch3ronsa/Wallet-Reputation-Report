#!/usr/bin/env bash
set -euo pipefail

OWS_BIN="${OWS_BIN:-}"

if [ -z "${OWS_BIN}" ]; then
  if command -v ows >/dev/null 2>&1; then
    OWS_BIN="$(command -v ows)"
  elif [ -x "${HOME}/.ows/bin/ows" ]; then
    OWS_BIN="${HOME}/.ows/bin/ows"
  else
    echo "OWS_STATUS=MISSING"
    echo "OWS_HINT=Run ./scripts/setup-ows-ubuntu.sh first."
    exit 1
  fi
fi

echo "WSL_STATUS=READY"
echo "OWS_STATUS=READY"
echo "OWS_BIN=${OWS_BIN}"
echo "OWS_VERSION=$("${OWS_BIN}" --version)"

if command -v node >/dev/null 2>&1; then
  echo "NODE_STATUS=READY"
  echo "NODE_VERSION=$(node --version)"
else
  echo "NODE_STATUS=OPTIONAL_MISSING"
  echo "NODE_HINT=Node is only needed if you want MoonPay CLI or to run the app inside Ubuntu."
fi

echo "CLI_SURFACE=wallet,pay,fund"
echo "MOONPAY_PATH=ows fund deposit --wallet report-buyer --chain base --token USDC"
echo "X402_PATH=ows pay request --wallet report-buyer http://localhost:3000/api/report/full --method POST --body '{\"address\":\"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\",\"chain\":\"base\"}'"
