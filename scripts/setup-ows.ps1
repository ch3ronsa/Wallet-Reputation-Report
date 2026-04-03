$walletName = "wallet-reputation-report"

Write-Host "Creating OWS wallet: $walletName"
ows wallet create --name $walletName

Write-Host ""
Write-Host "Wallet info:"
ows wallet info

Write-Host ""
Write-Host "Next step: copy the Base address into .env as OWS_SERVICE_ADDRESS"
