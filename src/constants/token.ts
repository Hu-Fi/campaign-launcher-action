import { ChainId } from '@human-protocol/sdk';

export const HMT_TOKEN_DECIMALS = 18;

export const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) public returns (bool)',
] as const;

export const USDT_CONTRACT_ADDRESS = {
  [ChainId.POLYGON]: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  [ChainId.POLYGON_AMOY]: '0x0E1fB03d02F3205108DE0c6a2b0B6B68e13D767e',
  [ChainId.SEPOLIA]: '0x6A3267e048B80FC2Fbd52510508c1eb884F0fDb1',
} as const;
