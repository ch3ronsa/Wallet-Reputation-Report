import { OwsAdapter, OwsServiceIdentity } from "@/types/adapters";
import { WalletLookupRequest } from "@/types/api";

export class MockOwsAdapter implements OwsAdapter {
  async getServiceIdentity(): Promise<OwsServiceIdentity> {
    return {
      walletName: "mock-wallet-reputation-report",
      address: "0xMockServiceWallet000000000000000000000000",
      chain: "base",
    };
  }

  async buildBuyerCommands(request: WalletLookupRequest): Promise<string[]> {
    return [
      'ows wallet create --name "report-buyer"',
      'ows fund deposit --wallet "report-buyer" --chain base --token USDC',
      `ows pay request http://localhost:3000/api/report/full --wallet "report-buyer" --method POST --body '${JSON.stringify(
        request,
      )}'`,
    ];
  }
}
