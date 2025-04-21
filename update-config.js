const crypto = require("crypto");
const fs = require("fs");

const ethers = require("ethers");
const Minio = require("minio");

const { getTokenAddress, getS3BucketName } = require("./utils");
const ERC20ABI = require("./abi/ERC20.json");

const run = async () => {
  try {
    const envFile = "./campaign.env";
    if (!fs.existsSync(envFile)) {
      throw new Error(`Environment file ${envFile} does not exist.`);
    }

    const chainId = parseInt(process.env.CHAIN_ID);
    if (!chainId) {
      throw new Error("CHAIN_ID is required.");
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

    if (!process.env.START_DATE || !process.env.DURATION) {
      throw new Error(
        "START_DATE and DURATION are required in environment variables."
      );
    }
    const startDate = new Date(process.env.START_DATE);
    const startBlock = Math.floor(startDate.getTime() / 1000);
    const duration = parseInt(process.env.DURATION) * 24 * 60 * 60; // Convert days to seconds
    const endBlock = startBlock + duration;

    if (!process.env.REWARD_TOKEN || !process.env.REWARD_AMOUNT) {
      throw new Error(
        "REWARD_TOKEN and REWARD_AMOUNT are required in environment variables."
      );
    }
    const tokenAddress = getTokenAddress(chainId, process.env.REWARD_TOKEN);
    if (!tokenAddress?.length) {
      throw new Error("Fund token is not supported.");
    }
    const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
    const fundAmount = ethers.parseUnits(
      process.env.REWARD_AMOUNT,
      await tokenContract.decimals()
    );

    if (!process.env.EXCHANGE_NAME || !process.env.SYMBOL) {
      throw new Error(
        "EXCHANGE_NAME and SYMBOL are required in environment variables."
      );
    }
    const manifest = {
      chainId,
      exchangeName: process.env.EXCHANGE_NAME,
      token: process.env.SYMBOL,
      startBlock,
      duration,
      endBlock,
      fundAmount: fundAmount.toString(),
      requesterAddress: signer.address,
      type: "MARKET_MAKING",
    };

    const s3AccessKey = process.env.S3_ACCESS_KEY;
    const s3SecretKey = process.env.S3_SECRET_KEY;
    if (!s3AccessKey || !s3SecretKey) {
      throw new Error(
        "Missing S3_ACCESS_KEY or S3_SECRET_KEY in environment variables."
      );
    }

    const minioClient = new Minio.Client({
      endPoint: "storage.googleapis.com",
      port: 443,
      accessKey: s3AccessKey,
      secretKey: s3SecretKey,
      useSSL: true,
    });

    const content = JSON.stringify(manifest);
    const hash = crypto.createHash("sha1").update(content).digest("hex");
    const key = `s3${hash}.json`;

    try {
      await minioClient.putObject(getS3BucketName(chainId), key, content, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });

      console.log(`Manifest uploaded to S3: ${key}`);
    } catch (e) {
      throw new Error(`Failed to upload manifest to S3: ${e.message}`);
    }

    const manifestUrl = `https://storage.googleapis.com/${getS3BucketName(
      chainId
    )}/${key}`;
    const manifestHash = hash;

    // Build File Content
    const fileContent = `CHAIN_ID=${chainId}
EXCHANGE_NAME=${process.env.EXCHANGE_NAME}
SYMBOL=${process.env.SYMBOL}
REWARD_TOKEN=${process.env.REWARD_TOKEN}
REWARD_AMOUNT=${process.env.REWARD_AMOUNT}
START_DATE=${process.env.START_DATE}
DURATION=${process.env.DURATION}
RECORDING_ORACLE_ADDRESS=${process.env.RECORDING_ORACLE_ADDRESS}
RECORDING_ORACLE_FEE=${process.env.RECORDING_ORACLE_FEE}
REPUTATION_ORACLE_ADDRESS=${process.env.REPUTATION_ORACLE_ADDRESS}
REPUTATION_ORACLE_FEE=${process.env.REPUTATION_ORACLE_FEE}
MANIFEST_URL=${manifestUrl}
MANIFEST_HASH=${manifestHash}
`;

    // Write
    fs.writeFileSync(envFile, fileContent, { encoding: "utf8" });
    console.log(`Campaign details saved to ${envFile}`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
