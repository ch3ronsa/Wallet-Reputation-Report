import { env } from "@/config/env";
import { OwsAdapter, OwsServiceIdentity } from "@/types/adapters";
import { WalletLookupRequest } from "@/types/api";

export class RealOwsAdapter implements OwsAdapter {
  async getServiceIdentity(): Promise<OwsServiceIdentity> {
    return {
      walletName: env.owsServiceWalletName,
      address: env.owsServiceAddress || "SET_OWS_SERVICE_ADDRESS",
      chain: env.x402Network,
    };
  }

  async buildBuyerCommands(request: WalletLookupRequest): Promise<string[]> {
    return [
      'ows wallet create --name "report-buyer"',
      'ows fund deposit --wallet "report-buyer" --chain base --token USDC',
      `ows pay request ${env.owsPublicPaymentUrl} --wallet "report-buyer" --method POST --body '${JSON.stringify(
        request,
      )}'`,
      "# TODO: replace command-only guidance with a direct OWS SDK integration when the exact API surface is finalized.",
    ];
  }
}
