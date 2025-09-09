const fs = require("fs");
const ethers = require("ethers");
const { EscrowClient, StakingClient } = require("@human-protocol/sdk");
const { getTokenAddress } = require("./utils");
const { v4: uuidV4 } = require("uuid");
const ERC20ABI = require("./abi/ERC20.json");

async function createEscrow(env, manifest, manifestHash) {
  const chainId = parseInt(env.CHAIN_ID);
  const privateKey = env.WEB3_PRIVATE_KEY;
  const rpcUrl = env.WEB3_RPC_URL;
  if (!privateKey || !rpcUrl)
    throw new Error("Missing WEB3_PRIVATE_KEY or WEB3_RPC_URL.");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const escrowClient = await EscrowClient.build(signer);
  
  const stakingClient = await StakingClient.build(signer);

  const tokenAddress = getTokenAddress(chainId, env.REWARD_TOKEN);
  const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20ABI,
          signer
        );
  const tokenDecimals = await tokenContract.decimals();
  const _tokenDecimals = Number(tokenDecimals) || 18;

  const fundAmount = ethers.parseUnits(
          env.REWARD_AMOUNT.toString(),
          _tokenDecimals
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
  
  const escrowAddress = await escrowClient.createEscrow(tokenAddress, uuidV4());
  console.log(`Escrow created at ${escrowAddress}`);

  console.log("Funding escrow...");
  await (await tokenContract.approve(escrowAddress, fundAmount)).wait();
  await escrowClient.fund(escrowAddress, fundAmount);

  console.log("Setting up escrow...");
  const manifestString = JSON.stringify(manifest)
  
  const escrowConfig = {
    exchangeOracle: signer.address,
    exchangeOracleFee: 1,
    recordingOracle: env.RECORDING_ORACLE_ADDRESS,
    recordingOracleFee: parseInt(env.RECORDING_ORACLE_FEE),
    reputationOracle: env.REPUTATION_ORACLE_ADDRESS,
    reputationOracleFee: parseInt(env.REPUTATION_ORACLE_FEE),
    manifest:manifestString,
    manifestHash:manifestHash,
  };

   await escrowClient.setup(escrowAddress, escrowConfig);

  return escrowAddress;
}

if (require.main === module) {
  const manifest = process.env.MANIFEST_STRING;
  const manifestHash = process.env.MANIFEST_HASH;
  createEscrow(process.env, manifest, manifestHash)
    .then((escrowAddress) => {
      console.log(`Escrow created at ${escrowAddress}`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { createEscrow };
