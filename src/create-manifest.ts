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
    .optional(),
  /**
   * Expected in seconds
   */
  startDelay: Joi.number().strict().min(0).default(0),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
  dailyVolumeTarget: Joi.number().strict().greater(0).required(),
}).options({ allowUnknown: true, stripUnknown: false });

export async function createMarketMakingCampaignManifest(input: {
  exchangeName: string;
  tradingPair: string;
  duration?: number;
  startDelay?: number;
  startDate?: string;
  endDate?: string;
  dailyVolumeTarget: number;
}): Promise<{ manifest: CampaignManifest; manifestHash: string }> {
  let validatedInput: {
    exchangeName: string;
    tradingPair: string;
    duration?: number;
    startDelay: number;
    startDate?: string;
    endDate?: string;
    dailyVolumeTarget: number;
  };
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

  const hasExplicitDates =
    Boolean(validatedInput.startDate) || Boolean(validatedInput.endDate);

  if (hasExplicitDates) {
    if (!validatedInput.startDate || !validatedInput.endDate) {
      throw new Error('Both startDate and endDate are required together');
    }
  } else if (validatedInput.duration === undefined) {
    throw new Error(
      'Duration is required when startDate and endDate are not set',
    );
  }

  const startDate = hasExplicitDates
    ? new Date(validatedInput.startDate as string)
    : new Date(Date.now() + validatedInput.startDelay * 1000);

  const endDate = hasExplicitDates
    ? new Date(validatedInput.endDate as string)
    : new Date(
        startDate.valueOf() +
          (validatedInput.duration as number) * 60 * 60 * 1000,
      );

  if (endDate.valueOf() <= startDate.valueOf()) {
    throw new Error('End date must be later than start date');
  }

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
