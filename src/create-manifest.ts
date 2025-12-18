import crypto from 'crypto';

import Joi, { ValidationError } from 'joi';

enum CampaignType {
  MARKET_MAKING = 'MARKET_MAKING',
}

type CampaignManifestBase = {
  type: string;
  exchange: string;
  start_date: Date;
  end_date: Date;
};

type MarketMakingCampaignManifest = CampaignManifestBase & {
  type: CampaignType.MARKET_MAKING;
  pair: string;
  daily_volume_target: number;
};

export type CampaignManifest = MarketMakingCampaignManifest;

const marketMakingInputSchema = Joi.object({
  exchangeName: Joi.string().min(2).required(),
  tradingPair: Joi.string()
    .pattern(/^[\dA-Z]{3,10}\/[\dA-Z]{3,10}$/)
    .required(),
  /**
   * Expected in hours
   */
  duration: Joi.number()
    .strict()
    .min(6)
    .max(100 * 24)
    .required(),
  /**
   * Expected in seconds
   */
  startDelay: Joi.number().strict().min(0).default(0),
  dailyVolumeTarget: Joi.number().strict().greater(0).required(),
}).options({ allowUnknown: true, stripUnknown: false });

export async function createMarketMakingCampaignManifest(input: {
  exchangeName: string;
  tradingPair: string;
  duration: number;
  startDelay?: number;
  dailyVolumeTarget: number;
}): Promise<{ manifest: CampaignManifest; manifestHash: string }> {
  let validatedInput: Required<typeof input>;
  try {
    validatedInput = Joi.attempt(input, marketMakingInputSchema, {
      abortEarly: false,
    });
  } catch (error) {
    const validationErrors: string[] = [];
    if (error instanceof ValidationError) {
      for (const detail of error.details) {
        validationErrors.push(detail.message);
      }
    } else {
      validationErrors.push(error.message as string);
    }
    console.error(
      'Market making manifest input is not valid:',
      validationErrors,
    );
    throw new Error('Failed to create market making manifest');
  }

  const startDelayMs = validatedInput.startDelay * 1000;
  const startDate = new Date(Date.now() + startDelayMs);

  const durationMs = validatedInput.duration * 60 * 60 * 1000;
  const endDate = new Date(startDate.valueOf() + durationMs);

  const manifest: MarketMakingCampaignManifest = {
    type: CampaignType.MARKET_MAKING,
    exchange: validatedInput.exchangeName,
    pair: validatedInput.tradingPair,
    start_date: startDate,
    end_date: endDate,
    daily_volume_target: validatedInput.dailyVolumeTarget,
  };

  const manifestString = JSON.stringify(manifest);
  const manifestHash = crypto
    .createHash('sha1')
    .update(manifestString)
    .digest('hex');

  return { manifest, manifestHash };
}
