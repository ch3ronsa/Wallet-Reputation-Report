# Setup And Demo Workflow

## Service identity with OWS

Create the service wallet:

```bash
ows wallet create --name "wallet-reputation-report"
ows wallet info
```

Copy the Base address into `.env` as `OWS_SERVICE_ADDRESS`.

## Buyer flow with OWS CLI

```bash
ows wallet create --name "report-buyer"
ows fund deposit --wallet "report-buyer" --chain base --token USDC
ows pay request http://localhost:3000/api/report/full \
  --wallet "report-buyer" \
  --method POST \
  --body '{"address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045","chain":"base"}'
```

## MoonPay CLI fallback

If your environment exposes MoonPay CLI instead of an agent-skill runtime:

```bash
mp wallet create --name "report-buyer"
mp token balance list --wallet "report-buyer" --chain base
mp buy --token usdc_base --amount 10 --wallet <base-address> --email <your-email>
```

Use this to make sure the buyer wallet has Base USDC before retrying the premium request.
