$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$repoRootUnix = $repoRoot.Replace("\", "/")
$wslRepo = (wsl.exe wslpath -a $repoRootUnix).Trim()

Write-Host "Checking Ubuntu/WSL demo readiness for Wallet Reputation Report..."
wsl.exe bash -lc "cd '$wslRepo' && chmod +x ./scripts/check-ows-ubuntu.sh && ./scripts/check-ows-ubuntu.sh"

if ($LASTEXITCODE -ne 0) {
  throw "Ubuntu/WSL check failed."
}
