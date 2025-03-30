import { Client, PrivateKey, AccountId } from "@hashgraph/sdk";

interface SwapResult {
  amounts: string[];
  inputAmount: string;
  outputAmount: string;
  transactionId: string;
}

export function swapExactTokensForTokens(
  client: Client,
  routerContractId: string,
  amountIn: number,
  amountOutMin: number,
  tokenPath: string[],
  toAddress: string,
  deadline: number,
  gasLim?: number
): Promise<SwapResult>;

export function associateTokenToAccount(
  client: Client,
  accountId: AccountId,
  privateKey: PrivateKey,
  tokenId: string
): Promise<any>;

export function approveAllowance(
  client: Client,
  accountId: AccountId,
  privateKey: PrivateKey,
  tokenId: string,
  routerAddress: string,
  amount: number
): Promise<any>;
