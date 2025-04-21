const fs = require("fs");

const ethers = require("ethers");
const { EscrowClient, StakingClient } = require("@human-protocol/sdk");

const { getTokenAddress } = require("./utils");
const { v4: uuidV4 } = require("uuid");
const ERC20ABI = require("./abi/ERC20.json");

const run = async () => {
  try {
    const envFile = "./campaign.env";
    if (!fs.existsSync(envFile)) {
      throw new Error(`Environment file ${envFile} does not exist.`);
    }

    const envContent = fs.readFileSync(envFile, "utf-8");
    const envLines = envContent.split("\n");

    const envVariables = {};
    envLines.forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        envVariables[key.trim()] = value.trim();
      }
    });

    const {
      CHAIN_ID,
      REWARD_TOKEN,
      REWARD_AMOUNT,
      RECORDING_ORACLE_ADDRESS,
      RECORDING_ORACLE_FEE,
      REPUTATION_ORACLE_ADDRESS,
      REPUTATION_ORACLE_FEE,
      MANIFEST_URL,
      MANIFEST_HASH,
    } = envVariables;

    if (
      !CHAIN_ID ||
      !REWARD_TOKEN ||
      !REWARD_AMOUNT ||
      !RECORDING_ORACLE_ADDRESS ||
      !RECORDING_ORACLE_FEE ||
      !REPUTATION_ORACLE_ADDRESS ||
      !REPUTATION_ORACLE_FEE ||
      !MANIFEST_URL ||
      !MANIFEST_HASH
    ) {
      throw new Error(
        "Missing required environment variables in campaign.env."
      );
    }

    const chainId = parseInt(CHAIN_ID);

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
    const stakingClient = await StakingClient.build(signer);

    const tokenAddress = getTokenAddress(chainId, REWARD_TOKEN);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);

    const fundAmount = ethers.parseUnits(
      REWARD_AMOUNT,
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
      recordingOracle: RECORDING_ORACLE_ADDRESS,
      recordingOracleFee: parseInt(RECORDING_ORACLE_FEE),
      reputationOracle: REPUTATION_ORACLE_ADDRESS,
      reputationOracleFee: parseInt(REPUTATION_ORACLE_FEE),
      manifestUrl: MANIFEST_URL,
      manifestHash: MANIFEST_HASH,
    };
    await escrowClient.setup(escrowAddress, escrowConfig);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
