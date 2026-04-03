#!/usr/bin/env bash
set -euo pipefail

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to install OWS inside Ubuntu/WSL." >&2
  exit 1
fi

OWS_BIN="${HOME}/.ows/bin/ows"

if [ -x "${OWS_BIN}" ]; then
  echo "OWS already installed at ${OWS_BIN}"
  "${OWS_BIN}" --version
  exit 0
fi

echo "Installing OWS CLI into Ubuntu/WSL..."
curl -fsSL https://docs.openwallet.sh/install.sh | bash

if [ ! -x "${OWS_BIN}" ]; then
  echo "OWS installation completed but ${OWS_BIN} was not found." >&2
  exit 1
fi

echo
echo "OWS installed successfully:"
"${OWS_BIN}" --version
echo "Open a new Ubuntu shell or source ~/.bashrc to pick up the PATH change."
