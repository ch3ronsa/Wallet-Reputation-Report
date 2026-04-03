$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$repoRootUnix = $repoRoot.Replace("\", "/")
$wslRepo = (wsl.exe wslpath -a $repoRootUnix).Trim()

Write-Host "Installing or verifying OWS inside Ubuntu/WSL..."
wsl.exe bash -lc "cd '$wslRepo' && chmod +x ./scripts/setup-ows-ubuntu.sh && ./scripts/setup-ows-ubuntu.sh"

if ($LASTEXITCODE -ne 0) {
  throw "Ubuntu/WSL setup failed."
}
