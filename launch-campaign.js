const { createManifest } = require("./create-manifest");
const { createEscrow } = require("./create-escrow");
const { sendSlackMessage } = require("./utils");

function validateInputs(env) {
  const requiredInputs = [
    "CHAIN_ID",
    "DAILY_VOLUME_TARGET",
    "DURATION",
    "EXCHANGE_NAME",
    "EXCHANGE_ORACLE_ADDRESS",
    "RECORDING_ORACLE_ADDRESS",
    "REPUTATION_ORACLE_ADDRESS",
    "GAS_WARN_THRESHOLD",
    "REWARD_AMOUNT",
    "REWARD_TOKEN",
    "START_DELAY",
    "SYMBOL",
    "WEB3_RPC_URL",
    "WEB3_PRIVATE_KEY",
  ];

  const missing = requiredInputs.filter((input) => !env[input]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required inputs: ${missing.join(", ")}. ` +
        `Please ensure all required parameters are provided in the action configuration.`
    );
  }
}

(async () => {
  try {
    // Validate all required inputs
    validateInputs(process.env);

    // Step 1: Create manifest and get hash
    const { manifest, manifestHash } = await createManifest(process.env);

    // Step 2: Create escrow using manifest info
    const escrowAddress = await createEscrow(
      process.env,
      manifest,
      manifestHash
    );

    console.log(escrowAddress);
  } catch (err) {
    const msg = `Error launching campaign: ${err.message || err}`;
    console.error(msg);
    await sendSlackMessage(process.env, msg);
    process.exit(1);
  }
})();
