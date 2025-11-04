const ethers = require("ethers");
const { EscrowClient } = require("@human-protocol/sdk");

async function cancelEscrow(escrowAddress, env = process.env) {
  try {
    if (!escrowAddress) {
      throw new Error("Escrow address is required.");
    }

    const privateKey = env.WEB3_PRIVATE_KEY;
    const rpcUrl = env.WEB3_RPC_URL;
    if (!privateKey || !rpcUrl) {
      throw new Error(
        "Missing WEB3_PRIVATE_KEY or WEB3_RPC_URL in environment variables."
      );
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    const escrowClient = await EscrowClient.build(signer);

    await escrowClient.requestCancellation(escrowAddress);
    console.log(`Escrow ${escrowAddress} cancellation requested.`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

if (require.main === module) {
  cancelEscrow(process.env.ESCROW_ADDRESS);
}

module.exports = { cancelEscrow };
