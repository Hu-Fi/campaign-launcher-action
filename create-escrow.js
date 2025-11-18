const ethers = require("ethers");
const {
  EscrowClient,
  StakingClient,
  KVStoreClient,
  KVStoreKeys,
} = require("@human-protocol/sdk");
const { getTokenAddress, sendSlackMessage } = require("./utils");
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

  const kvstoreClient = await KVStoreClient.build(signer);

  const tokenAddress = getTokenAddress(chainId, env.REWARD_TOKEN);
  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
  const tokenDecimals = Number(await tokenContract.decimals()) || 18;

  const fundAmount = ethers.parseUnits(
    env.REWARD_AMOUNT.toString(),
    tokenDecimals
  );

  // Check wallet balance
  const walletTokenBalance = await tokenContract.balanceOf(signer.address);
  if (walletTokenBalance < fundAmount) {
    const required = ethers.formatUnits(fundAmount, tokenDecimals);
    const available = ethers.formatUnits(walletTokenBalance, tokenDecimals);
    throw new Error(
      `Insufficient ${env.REWARD_TOKEN} balance to fund escrow. Required ${required}, available ${available}.`
    );
  }

  // Warn if balance after funding current escrow won't cover the next escrow
  const remainingAfterCurrent = walletTokenBalance - fundAmount;
  if (remainingAfterCurrent < fundAmount) {
    const requiredNext = ethers.formatUnits(fundAmount, tokenDecimals);
    const availableNext = ethers.formatUnits(
      remainingAfterCurrent,
      tokenDecimals
    );
    const msg = `Warn: Campaign launcher - Low ${env.REWARD_TOKEN} balance on chain ${chainId} for the next campaign. Address: ${signer.address} - Available: ${availableNext} - Required: ${requiredNext}.`;
    if (await sendSlackMessage(env, msg)) {
      console.log("Sent Slack low balance warning for next execution.");
    }
  }

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
  await escrowClient.fund(escrowAddress, fundAmount);

  console.log("Setting up escrow...");
  const manifestString = JSON.stringify(manifest);

  const escrowConfig = {
    exchangeOracle: env.EXCHANGE_ORACLE_ADDRESS,
    exchangeOracleFee: parseInt(
      await kvstoreClient.get(env.EXCHANGE_ORACLE_ADDRESS, KVStoreKeys.fee)
    ),
    recordingOracle: env.RECORDING_ORACLE_ADDRESS,
    recordingOracleFee: parseInt(
      await kvstoreClient.get(env.RECORDING_ORACLE_ADDRESS, KVStoreKeys.fee)
    ),
    reputationOracle: env.REPUTATION_ORACLE_ADDRESS,
    reputationOracleFee: parseInt(
      await kvstoreClient.get(env.REPUTATION_ORACLE_ADDRESS, KVStoreKeys.fee)
    ),
    manifest: manifestString,
    manifestHash: manifestHash,
  };

  await escrowClient.setup(escrowAddress, escrowConfig);

  // Warn if native gas token balance is low
  const nativeBalance = await provider.getBalance(signer.address);
  const gasWarnThresholdStr = (env.GAS_WARN_THRESHOLD || "0.5").toString();
  const gasWarnThreshold = ethers.parseEther(gasWarnThresholdStr);

  if (nativeBalance < gasWarnThreshold) {
    const thresholdFmt = ethers.formatEther(gasWarnThreshold);
    const nativeFmt = ethers.formatEther(nativeBalance);
    const msg = `Warn: Campaign launcher - Low native gas balance on chain ${chainId}. Address: ${signer.address} - Available: ${nativeFmt} - Threshold: ${thresholdFmt}.`;
    if (await sendSlackMessage(env, msg)) {
      console.log("Sent Slack native gas low-balance warning.");
    }
  }

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
