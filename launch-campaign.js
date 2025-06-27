const { createManifest } = require("./create-manifest");
const { createEscrow } = require("./create-escrow");

(async () => {
  try {
    // Step 1: Create manifest and get URL/hash
    const { manifestUrl, manifestHash } = await createManifest(process.env);

    // Step 2: Create escrow using manifest info
    const escrowAddress = await createEscrow(process.env, manifestUrl, manifestHash);

    console.log(`Escrow launched at ${escrowAddress}`);
  } catch (err) {
    console.error("Error launching campaign:", err.message);
    process.exit(1);
  }
})();