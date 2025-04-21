const ethers = require("ethers");
const { EscrowClient } = require("@human-protocol/sdk");

const run = async () => {
  try {
    const escrowAddress = process.env.ESCROW_ADDRESS;
    if (!escrowAddress) {
      throw new Error("Escrow address is required.");
    }

    const privateKey = process.env.WEB3_PRIVATE_KEY;
    const rpcUrl = process.env.WEB3_RPC_URL;
    if (!privateKey || !rpcUrl) {
      throw new Error(
        "Missing WEB3_PRIVATE_KEY or WEB3_RPC_URL in environment variables."
      );
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    const escrowClient = await EscrowClient.build(signer);

    await escrowClient.cancel(escrowAddress);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
