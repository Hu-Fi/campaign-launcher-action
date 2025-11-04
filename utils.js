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

async function sendSlackMessage(env, text) {
  const webhookUrl = env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL not set; cannot send Slack message.");
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`Slack webhook error: ${res.status} ${res.statusText} ${body}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Failed to send Slack message:", e.message || e);
    return false;
  }
}

module.exports = {
  getTokenAddress,
  sendSlackMessage
};
