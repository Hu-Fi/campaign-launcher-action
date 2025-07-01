const crypto = require("crypto");
const Minio = require("minio");
const { getTokenAddress } = require("./utils");

async function createManifest(env) {
  const chainId = parseInt(env.CHAIN_ID);
  if (!chainId) throw new Error("CHAIN_ID is required.");

  if (!env.START_DELAY || !env.DURATION) throw new Error("START_DELAY and DURATION are required.");
  const startDelay = parseInt(env.START_DELAY);
  if (isNaN(startDelay)) throw new Error("START_DELAY must be a number (seconds).");
  const now = Date.now();
  const startDate = new Date(now + startDelay * 1000);
  const duration = parseInt(env.DURATION) * 24 * 60 * 60;
  const startDateISO = startDate.toISOString();
  const endDateISO = new Date(startDate.getTime() + duration * 1000).toISOString();

  if (!env.REWARD_TOKEN || !env.REWARD_AMOUNT) throw new Error("REWARD_TOKEN and REWARD_AMOUNT are required.");
  const tokenAddress = getTokenAddress(chainId, env.REWARD_TOKEN);
  if (!tokenAddress?.length) throw new Error("Fund token is not supported.");

  if (!env.EXCHANGE_NAME || !env.SYMBOL) throw new Error("EXCHANGE_NAME and SYMBOL are required.");
  if (!env.DAILY_VOLUME_TARGET) throw new Error("DAILY_VOLUME_TARGET is required.");

  const manifest = {
    exchange: env.EXCHANGE_NAME,
    pair: env.SYMBOL,
    fund_token: env.REWARD_TOKEN,
    start_date: startDateISO,
    end_date: endDateISO,
    type: "MARKET_MAKING",
    daily_volume_target: parseFloat(env.DAILY_VOLUME_TARGET),
    additional_data: env.ADDITIONAL_DATA || undefined,
  };
  Object.keys(manifest).forEach((key) => manifest[key] === undefined && delete manifest[key]);

  const s3AccessKey = env.S3_ACCESS_KEY;
  const s3SecretKey = env.S3_SECRET_KEY;
  const s3BucketName = env.S3_BUCKET_NAME;
  if (!s3AccessKey || !s3SecretKey) throw new Error("Missing S3_ACCESS_KEY or S3_SECRET_KEY.");
  if (!s3BucketName) throw new Error("Missing S3_BUCKET_NAME.");

  const minioClient = new Minio.Client({
    endPoint: "storage.googleapis.com",
    port: 443,
    accessKey: s3AccessKey,
    secretKey: s3SecretKey,
    useSSL: true,
  });

  const content = JSON.stringify(manifest);
  const hash = crypto.createHash("sha1").update(content).digest("hex");
  const key = `s3${hash}.json`;

  await minioClient.putObject(s3BucketName, key, content, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });

  const manifestUrl = `https://storage.googleapis.com/${s3BucketName}/${key}`;
  const manifestHash = hash;

  console.log(`Manifest created: ${manifest}`);
  return { manifestUrl, manifestHash, manifest };
}

if (require.main === module) {
  createManifest(process.env)
    .then(({ manifestUrl, manifestHash }) => {
      console.log(`MANIFEST_URL=${manifestUrl}`);
      console.log(`MANIFEST_HASH=${manifestHash}`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { createManifest };
