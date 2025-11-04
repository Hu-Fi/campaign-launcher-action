const { createManifest } = require("./create-manifest");
const { createEscrow } = require("./create-escrow");
const { sendSlackMessage } = require("./utils");

(async () => {
  try {
    // Step 1: Create manifest and get hash
    const { manifest, manifestHash } = await createManifest(process.env);

    // Step 2: Create escrow using manifest info
    const escrowAddress = await createEscrow(process.env, manifest, manifestHash);

    console.log(`Escrow launched at ${escrowAddress}`);
  } catch (err) {
    const msg = `Error launching campaign: ${err.message || err}`;
    console.error(msg);
    await sendSlackMessage(process.env, msg);
    process.exit(1);
  }
})();