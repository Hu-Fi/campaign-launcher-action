const fs = require("fs");
const ethers = require("ethers");
const { EscrowClient, StakingClient } = require("@human-protocol/sdk");
const { getTokenAddress } = require("./utils");
const { v4: uuidV4 } = require("uuid");
const ERC20ABI = require("./abi/ERC20.json");
const https = require("https");

function fetchManifest(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function createEscrow(env, manifestUrl, manifestHash) {
  const chainId = parseInt(env.CHAIN_ID);
  const privateKey = env.WEB3_PRIVATE_KEY;
  const rpcUrl = env.WEB3_RPC_URL;
  if (!privateKey || !rpcUrl)
    throw new Error("Missing WEB3_PRIVATE_KEY or WEB3_RPC_URL.");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const escrowClient = await EscrowClient.build(signer);
  const stakingClient = await StakingClient.build(signer);

  const manifest = await fetchManifest(manifestUrl);

  const tokenAddress = getTokenAddress(chainId, manifest.fund_token);
  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);

  const fundAmount = ethers.parseUnits(
    env.REWARD_AMOUNT,
    await tokenContract.decimals()
  );

  // Check if staked
  const { stakedAmount } = await stakingClient.getStakerInfo(signer.address);
  if (stakedAmount === 0n) {
    console.log("Staking 0.001 HMT...");
    const stakeAmount = ethers.parseEther("0.001");
    await stakingClient.approveStake(stakeAmount);
    await stakingClient.stake(stakeAmount);
  }

  console.log("Creating escrow...");
  const escrowAddress = await escrowClient.createEscrow(
    tokenAddress,
    [signer.address],
    uuidV4()
  );
  console.log(`Escrow created at ${escrowAddress}`);

  console.log("Funding escrow...");
  await (await tokenContract.approve(escrowAddress, fundAmount)).wait();
  await escrowClient.fund(escrowAddress, fundAmount);

  console.log("Setting up escrow...");
  const escrowConfig = {
    exchangeOracle: signer.address,
    exchangeOracleFee: 10,
    recordingOracle: env.RECORDING_ORACLE_ADDRESS,
    recordingOracleFee: parseInt(env.RECORDING_ORACLE_FEE),
    reputationOracle: env.REPUTATION_ORACLE_ADDRESS,
    reputationOracleFee: parseInt(env.REPUTATION_ORACLE_FEE),
    manifestUrl,
    manifestHash,
  };
  await escrowClient.setup(escrowAddress, escrowConfig);

  return escrowAddress;
}

if (require.main === module) {
  const manifestUrl = process.env.MANIFEST_URL;
  const manifestHash = process.env.MANIFEST_HASH;
  createEscrow(process.env, manifestUrl, manifestHash)
    .then((escrowAddress) => {
      console.log(`Escrow created at ${escrowAddress}`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { createEscrow };
