import { env } from "@/config/env";

export function getOwsCommands(address: string, chain: string): string[] {
  const payload = JSON.stringify({ address, chain });

  return [
    'ows wallet create --name "report-buyer"',
    'ows fund deposit --wallet "report-buyer" --chain base --token USDC',
    `ows pay request ${env.owsPublicPaymentUrl} --wallet "report-buyer" --method POST --body '${payload}'`,
  ];
}
