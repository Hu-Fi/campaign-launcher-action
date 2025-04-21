const { ChainId, NETWORKS } = require("@human-protocol/sdk");

const USDT_CONTRACT_ADDRESS = {
  [ChainId.POLYGON]: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  [ChainId.POLYGON_AMOY]: "0x0E1fB03d02F3205108DE0c6a2b0B6B68e13D767e",
  [ChainId.SEPOLIA]: "0x6A3267e048B80FC2Fbd52510508c1eb884F0fDb1",
};

const getTokenAddress = (chainId, name) => {
  switch (name.toLowerCase()) {
    case "usdt":
      return USDT_CONTRACT_ADDRESS[chainId];
    case "hmt":
      return NETWORKS[chainId]?.hmtAddress;
  }
};

const getS3BucketName = (chainId) => {
  switch (chainId) {
    case ChainId.POLYGON:
      return "hufi-campaign-manifests-mainnet";
    default:
      return "hufi-campaign-manifests-testnet";
  }
};

module.exports = {
  getTokenAddress,
  getS3BucketName,
};
