import fs from 'fs';

import { ethers } from 'ethers';

import { createEscrow } from './create-escrow';
import { createMarketMakingCampaignManifest } from './create-manifest';
import launcherConfig from './env-config';
import { getSigner, maybeSendSlackMessage } from './utils';

void (async () => {
  try {
    const signer = await getSigner(
      launcherConfig.web3.launcherPrivateKey,
      launcherConfig.web3.rpcUrl,
    );

    console.log(
      `Going to launch new Market Making Campaign for ${signer.chainId} chain`,
    );

    const { manifest, manifestHash } = await createMarketMakingCampaignManifest(
      {
        exchangeName: launcherConfig.campaign.exchangeName,
        tradingPair: launcherConfig.campaign.symbol,
        duration: launcherConfig.campaign.duration,
        startDelay: launcherConfig.campaign.startDelay,
        dailyVolumeTarget: launcherConfig.campaign.dailyVolumeTarget,
      },
    );

    console.log('Constructed manifest:', JSON.stringify(manifest, null, 2));
    console.log('Constructed manifest hash:', manifestHash);

    const escrowAddress = await createEscrow(signer, {
      manifest,
      manifestHash,
      rewardToken: launcherConfig.campaign.rewardToken,
      rewardAmount: launcherConfig.campaign.rewardAmount,
      exchangeOracleAddress: launcherConfig.campaign.exchangeOracleAddress,
      recordingOracleAddress: launcherConfig.campaign.recordingOracleAddress,
      reputationOracleAddress: launcherConfig.campaign.reputationOracleAddress,
    });

    console.log(`Escrow launched. Address: ${escrowAddress}`);

    try {
      fs.writeFileSync('escrow_address.out', escrowAddress);
    } catch (error) {
      console.warn('Failed to write escrow address to output file', error);
    }

    try {
      // Warn if native gas token balance is low
      const gasWarnThreshold = ethers.parseEther(
        launcherConfig.web3.gasWarnThreshold.toString(),
      );

      const nativeBalance = await signer.provider.getBalance(signer.address);

      if (nativeBalance < gasWarnThreshold) {
        const warnMessage = `
          Warning: low native gas balance on chain ${signer.chainId} for ${signer.address}.
          Available: ${ethers.formatEther(nativeBalance)}.
          Threshold: ${ethers.formatEther(gasWarnThreshold)}
        `;
        await maybeSendSlackMessage(warnMessage);
      }
    } catch (noop) {
      /* noop */
    }

    process.exit(0);
  } catch (error) {
    console.error('Error while launching a campaign', error);

    await maybeSendSlackMessage(
      `Error launching campaign: ${error.message || error}`,
    );

    process.exit(1);
  }
})();
