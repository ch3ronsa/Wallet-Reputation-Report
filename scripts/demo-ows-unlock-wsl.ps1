param(
  [string]$ReportUrl = "http://localhost:3000/api/report/full",
  [string]$WalletAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  [string]$Chain = "base"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$repoRootUnix = $repoRoot.Replace("\", "/")
$wslRepo = (wsl.exe wslpath -a $repoRootUnix).Trim()

Write-Host "Printing the Ubuntu/WSL OWS demo commands..."
wsl.exe bash -lc "cd '$wslRepo' && chmod +x ./scripts/demo-ows-unlock.sh && ./scripts/demo-ows-unlock.sh '$ReportUrl' '$WalletAddress' '$Chain'"

if ($LASTEXITCODE -ne 0) {
  throw "Ubuntu/WSL demo command generation failed."
}
