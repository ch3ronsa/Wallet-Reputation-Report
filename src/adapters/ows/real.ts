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

  async buildCliWorkflow(input: { reportRequest: WalletLookupRequest; serviceIdentity: OwsServiceIdentity }) {
    return {
      setupCommands: [
        `ows wallet create --name "${env.owsServiceWalletName}"`,
        "ows wallet info",
      ],
      unlockCommands: [
        'ows wallet create --name "report-buyer"',
        'ows fund deposit --wallet "report-buyer" --chain base --token USDC',
        `ows pay request ${env.owsPublicPaymentUrl} --wallet "report-buyer" --method POST --body '${JSON.stringify(
          input.reportRequest,
        )}'`,
      ],
      note: `OWS is the service payment identity for this product. Premium unlock proceeds route to ${input.serviceIdentity.address}.`,
    };
  }
}
