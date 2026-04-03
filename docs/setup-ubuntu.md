# Ubuntu / WSL Demo Path

This project now includes a real Ubuntu / WSL path for the OWS CLI portion of the demo.

## What was verified

- WSL2 is available on the demo machine.
- The official OWS installer works inside Ubuntu.
- OWS CLI is installed at `~/.ows/bin/ows`.

## One-time setup

From the repo root on Windows:

```powershell
npm run demo:wsl:setup
```

This runs the Ubuntu-side installer script:

```bash
./scripts/setup-ows-ubuntu.sh
```

## Check readiness

From the repo root on Windows:

```powershell
npm run demo:wsl:check
```

This confirms:

- WSL is reachable
- OWS is installed
- the CLI exposes `wallet`, `pay`, and `fund`
- the MoonPay funding path is available through `ows fund deposit`

## Print the exact demo commands

From the repo root on Windows:

```powershell
npm run demo:wsl:commands
```

That prints the Ubuntu commands for:

1. creating the provider wallet
2. creating the buyer wallet
3. funding the buyer wallet with MoonPay through OWS
4. paying the x402 endpoint with `ows pay request`

## Direct Ubuntu commands

If you are already inside Ubuntu:

```bash
./scripts/check-ows-ubuntu.sh
./scripts/demo-ows-unlock.sh
```

## Demo note

The app itself still runs well on Windows with `npm run dev`. Ubuntu / WSL is used here to make the OWS CLI portion of the demo real and verifiable instead of just documented.
