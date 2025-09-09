const crypto = require("crypto");

async function createManifest(env) {
  const chainId = parseInt(env.CHAIN_ID);
  if (!chainId) throw new Error("CHAIN_ID is required.");

  if (!env.START_DELAY || !env.DURATION) throw new Error("START_DELAY and DURATION are required.");
  const startDelay = parseInt(env.START_DELAY);
  if (isNaN(startDelay)) throw new Error("START_DELAY must be a number (seconds).");
  const now = Date.now();
  const startDate = new Date(now + startDelay * 1000);
  const duration = parseInt(env.DURATION) * 60 * 60;
  const startDateISO = startDate.toISOString();
  const endDateISO = new Date(startDate.getTime() + duration * 1000).toISOString();

  if (!env.EXCHANGE_NAME || !env.SYMBOL) throw new Error("EXCHANGE_NAME and SYMBOL are required.");
  if (!env.DAILY_VOLUME_TARGET) throw new Error("DAILY_VOLUME_TARGET is required.");

  const manifest = {
    exchange: env.EXCHANGE_NAME,
    pair: env.SYMBOL,
    start_date: startDateISO,
    end_date: endDateISO,
    type: "MARKET_MAKING",
    daily_volume_target: parseFloat(env.DAILY_VOLUME_TARGET),
  };

  const manifestString = JSON.stringify(manifest);
  const manifestHash = crypto.createHash("sha1").update(content).digest("hex");

  console.log(`Manifest created: ${manifest}`);
  return { manifestString, manifestHash, manifest };
}

if (require.main === module) {
  createManifest(process.env)
    .then(({ manifestString, manifestHash }) => {
      console.log(`MANIFEST=${manifestString}`);
      console.log(`MANIFEST_HASH=${manifestHash}`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { createManifest };
