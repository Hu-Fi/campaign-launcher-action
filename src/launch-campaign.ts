import { createMarketMakingCampaignManifest } from './create-manifest';

void (async () => {
  try {
    console.log('Going to launch new market making campaign');

    const { manifest, manifestHash } = await createMarketMakingCampaignManifest(
      {
        exchangeName: 'test',
        tradingPair: 'HMT/USDT',
        duration: 24,
        dailyVolumeTarget: 1.42,
      },
    );

    console.log('Constructed manifest:', manifest);
    console.log('Constructed manifest hash:', manifestHash);

    process.exit(0);
  } catch (error) {
    console.error('Error while launching a campaign', error);
    process.exit(1);
  }
})();
