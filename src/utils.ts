import assert from 'assert';

import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { ethers } from 'ethers';

import { USDT_CONTRACT_ADDRESS } from './constants';
import launcherConfig from './env-config';

export function getTokenAddress(chainId: number, name: string): string {
  let tokenAddress: string | undefined;

  switch (name.toLowerCase()) {
    case 'usdt':
      tokenAddress =
        USDT_CONTRACT_ADDRESS[chainId as keyof typeof USDT_CONTRACT_ADDRESS];
      break;
    case 'hmt':
      tokenAddress = NETWORKS[chainId as ChainId]?.hmtAddress;
      break;
  }

  if (!tokenAddress) {
    throw new Error(`"${name}" token is not supported for "${chainId}" chain`);
  }

  return tokenAddress;
}

async function sendSlackMessage(
  webhookUrl: string,
  messageText: string,
): Promise<void> {
  assert(webhookUrl, 'Slack webhook URL is required');
  assert(messageText, 'Slack message text is required');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[Campaign Launcher] ${messageText}`,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');

      console.warn(
        `Slack webhook error: ${response.status} - ${response.statusText}`,
        body,
      );
    }
  } catch (error) {
    console.warn('Failed to send Slack message:', error);
    console.log(`Message: ${messageText}`);
  }
}

export async function maybeSendSlackMessage(
  messageText: string,
): Promise<void> {
  const { slackWebhookUrl } = launcherConfig.notifications;

  if (!slackWebhookUrl) {
    console.warn(
      `Slack webhook is not configured. Message to send: "${messageText}"`,
    );
    return;
  }

  await sendSlackMessage(slackWebhookUrl, messageText);
}

export type CustomSigner = ethers.Wallet & {
  provider: ethers.JsonRpcProvider;
  chainId: number;
};

export async function getSigner(
  privateKey: string,
  rpcUrl: string,
): Promise<CustomSigner> {
  assert(privateKey, 'Private key is required');
  assert(rpcUrl, 'RPC URL is required');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  try {
    const network = await provider.getNetwork();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (signer as any).chainId = network.chainId;
  } catch (error) {
    console.error('Error while getting chain id from provider', error);
    throw new Error('Failed to get signer with provided RPC');
  }

  return signer as CustomSigner;
}
