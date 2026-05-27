import dotenv from 'dotenv';
import Joi, { ValidationError } from 'joi';

if (process.env.GITHUB_ACTIONS !== 'true') {
  dotenv.config({ path: ['.env.local', '.env'] });
}

const MIN_START_DELAY = 0;
const DEFAULT_TX_WAIT_TIMEOUT_MS = 2 * 60_000;
const DEFAULT_TX_CONFIRMATIONS = 1;

const ISO_DATE_FORMAT = Joi.string().isoDate();

const evmAddressSchema = Joi.string().pattern(/^0x[0-9a-fA-F]{40}$/);

type EnvConfig = {
  WEB3_RPC_URL: string;
  WEB3_PRIVATE_KEY: string;
  SLACK_WEBHOOK_URL?: string;
  EXCHANGE_NAME: string;
  SYMBOL: string;
  DURATION?: number;
  START_DELAY?: number;
  START_DATE?: string;
  END_DATE?: string;
  DAILY_VOLUME_TARGET: number;
  REWARD_TOKEN: string;
  REWARD_AMOUNT: string;
  EXCHANGE_ORACLE_ADDRESS: string;
  RECORDING_ORACLE_ADDRESS: string;
  REPUTATION_ORACLE_ADDRESS: string;
  TX_WAIT_TIMEOUT_MS: number;
  TX_CONFIRMATIONS: number;
};

const envConfigSchema = Joi.object({
  WEB3_RPC_URL: Joi.string().uri({ scheme: ['http', 'https'] }),
  WEB3_PRIVATE_KEY: Joi.string().pattern(/^(0x)?[a-fA-F0-9]{64}$/),
  SLACK_WEBHOOK_URL: Joi.string()
    .empty('')
    .uri({ scheme: ['https'] })
    .optional(),
  EXCHANGE_NAME: Joi.string().min(2),
  SYMBOL: Joi.string().min(2),
  DURATION: Joi.number().empty('').positive().optional(),
  START_DELAY: Joi.number()
    .empty('')
    .min(MIN_START_DELAY)
    .optional()
    .default(MIN_START_DELAY),
  START_DATE: ISO_DATE_FORMAT.empty('').optional(),
  END_DATE: ISO_DATE_FORMAT.empty('').optional(),
  DAILY_VOLUME_TARGET: Joi.number().positive(),
  REWARD_TOKEN: Joi.string().valid('usdt', 'hmt').insensitive(),
  REWARD_AMOUNT: Joi.string().pattern(/^\d+(\.\d{1,18})?$/),
  EXCHANGE_ORACLE_ADDRESS: evmAddressSchema,
  RECORDING_ORACLE_ADDRESS: evmAddressSchema,
  REPUTATION_ORACLE_ADDRESS: evmAddressSchema,
  TX_WAIT_TIMEOUT_MS: Joi.number()
    .empty('')
    .integer()
    .positive()
    .optional()
    .default(DEFAULT_TX_WAIT_TIMEOUT_MS),
  TX_CONFIRMATIONS: Joi.number()
    .empty('')
    .integer()
    .positive()
    .optional()
    .default(DEFAULT_TX_CONFIRMATIONS),
}).options({
  presence: 'required',
  allowUnknown: true,
  stripUnknown: true,
});

type LauncherConfig = {
  web3: {
    rpcUrl: string;
    launcherPrivateKey: string;
  };
  campaign: {
    exchangeName: string;
    symbol: string;
    duration?: number;
    startDelay?: number;
    startDate?: string;
    endDate?: string;
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
  transaction: {
    waitTimeoutMs: number;
    confirmations: number;
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

    const hasExplicitDates =
      Boolean(parsedEnvConfig.START_DATE) || Boolean(parsedEnvConfig.END_DATE);

    if (hasExplicitDates) {
      if (!parsedEnvConfig.START_DATE || !parsedEnvConfig.END_DATE) {
        throw new Error('START_DATE and END_DATE must be provided together');
      }

      if (
        new Date(parsedEnvConfig.END_DATE).valueOf() <=
        new Date(parsedEnvConfig.START_DATE).valueOf()
      ) {
        throw new Error('END_DATE must be later than START_DATE');
      }
    } else if (parsedEnvConfig.DURATION === undefined) {
      throw new Error(
        'Either START_DATE and END_DATE or DURATION must be provided',
      );
    }

    return {
      web3: {
        rpcUrl: parsedEnvConfig.WEB3_RPC_URL,
        launcherPrivateKey: parsedEnvConfig.WEB3_PRIVATE_KEY,
      },
      campaign: {
        exchangeName: parsedEnvConfig.EXCHANGE_NAME,
        symbol: parsedEnvConfig.SYMBOL,
        duration: parsedEnvConfig.DURATION,
        startDelay: parsedEnvConfig.START_DELAY,
        startDate: parsedEnvConfig.START_DATE,
        endDate: parsedEnvConfig.END_DATE,
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
      transaction: {
        waitTimeoutMs: parsedEnvConfig.TX_WAIT_TIMEOUT_MS,
        confirmations: parsedEnvConfig.TX_CONFIRMATIONS,
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
