import dotenv from 'dotenv';
import Joi, { ValidationError } from 'joi';

if (process.env.GITHUB_ACTIONS !== 'true') {
  dotenv.config({ path: ['.env.local', '.env'] });
}

const MIN_GAS_WARN_THRESHOLD = 0.5;
const MIN_START_DELAY = 0;

const evmAddressSchema = Joi.string().pattern(/^0x[0-9a-fA-F]{40}$/);

type EnvConfig = {
  WEB3_RPC_URL: string;
  WEB3_PRIVATE_KEY: string;
  GAS_WARN_THRESHOLD: number;
  SLACK_WEBHOOK_URL?: string;
  EXCHANGE_NAME: string;
  SYMBOL: string;
  DURATION: number;
  START_DELAY: number;
  DAILY_VOLUME_TARGET: number;
  REWARD_TOKEN: string;
  REWARD_AMOUNT: string;
  EXCHANGE_ORACLE_ADDRESS: string;
  RECORDING_ORACLE_ADDRESS: string;
  REPUTATION_ORACLE_ADDRESS: string;
};

const envConfigSchema = Joi.object({
  WEB3_RPC_URL: Joi.string().uri({ scheme: ['http', 'https'] }),
  WEB3_PRIVATE_KEY: Joi.string().pattern(/^(0x)?[a-fA-F0-9]{64}$/),
  GAS_WARN_THRESHOLD: Joi.number()
    .min(MIN_GAS_WARN_THRESHOLD)
    .optional()
    .default(MIN_GAS_WARN_THRESHOLD),
  SLACK_WEBHOOK_URL: Joi.string()
    .uri({ scheme: ['https'] })
    .optional(),
  EXCHANGE_NAME: Joi.string().min(2),
  SYMBOL: Joi.string().min(2),
  DURATION: Joi.number().positive(),
  START_DELAY: Joi.number()
    .min(MIN_START_DELAY)
    .optional()
    .default(MIN_START_DELAY),
  DAILY_VOLUME_TARGET: Joi.number().positive(),
  REWARD_TOKEN: Joi.string().valid('usdt', 'hmt').insensitive(),
  REWARD_AMOUNT: Joi.string().pattern(/^\d+(\.\d{1,18})?$/),
  EXCHANGE_ORACLE_ADDRESS: evmAddressSchema,
  RECORDING_ORACLE_ADDRESS: evmAddressSchema,
  REPUTATION_ORACLE_ADDRESS: evmAddressSchema,
}).options({
  presence: 'required',
  allowUnknown: true,
  stripUnknown: true,
});

type LauncherConfig = {
  web3: {
    rpcUrl: string;
    launcherPrivateKey: string;
    gasWarnThreshold: number;
  };
  campaign: {
    exchangeName: string;
    symbol: string;
    duration: number;
    startDelay: number;
    rewardToken: string;
    rewardAmount: string;
    exchangeOracleAddress: string;
    recordingOracleAddress: string;
    reputationOracleAddress: string;
    dailyVolumeTarget: number;
  };
  notifications: {
    slackWebhookUrl?: string;
  };
};

function loadEnvConfig(): LauncherConfig {
  try {
    const parsedEnvConfig: EnvConfig = Joi.attempt(
      process.env,
      envConfigSchema,
      {
        abortEarly: false,
      },
    );

    return {
      web3: {
        rpcUrl: parsedEnvConfig.WEB3_RPC_URL,
        launcherPrivateKey: parsedEnvConfig.WEB3_PRIVATE_KEY,
        gasWarnThreshold: parsedEnvConfig.GAS_WARN_THRESHOLD,
      },
      campaign: {
        exchangeName: parsedEnvConfig.EXCHANGE_NAME,
        symbol: parsedEnvConfig.SYMBOL,
        duration: parsedEnvConfig.DURATION,
        startDelay: parsedEnvConfig.START_DELAY,
        rewardToken: parsedEnvConfig.REWARD_TOKEN,
        rewardAmount: parsedEnvConfig.REWARD_AMOUNT,
        exchangeOracleAddress: parsedEnvConfig.EXCHANGE_ORACLE_ADDRESS,
        recordingOracleAddress: parsedEnvConfig.RECORDING_ORACLE_ADDRESS,
        reputationOracleAddress: parsedEnvConfig.REPUTATION_ORACLE_ADDRESS,
        dailyVolumeTarget: parsedEnvConfig.DAILY_VOLUME_TARGET,
      },
      notifications: {
        slackWebhookUrl: parsedEnvConfig.SLACK_WEBHOOK_URL,
      },
    };
  } catch (error) {
    const validationErrors: string[] = [];
    if (error instanceof ValidationError) {
      for (const detail of error.details) {
        validationErrors.push(detail.message);
      }
    } else {
      validationErrors.push(error.message as string);
    }

    console.error('Env vars validation error', validationErrors);
    throw new Error('Invalid input in env vars');
  }
}

export default loadEnvConfig();
