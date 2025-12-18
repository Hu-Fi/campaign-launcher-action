import assert from 'assert';

import {
  EscrowClient,
  StakingClient,
  KVStoreClient,
  KVStoreKeys,
  NETWORKS,
  ChainId,
} from '@human-protocol/sdk';
import { ethers, type InterfaceAbi } from 'ethers';

import { ERC20_ABI, HMT_TOKEN_DECIMALS } from './constants';
import { type CampaignManifest } from './create-manifest';
import { getTokenAddress, type CustomSigner } from './utils';

const MIN_STAKED_AMOUNT_HMT = ethers.parseEther('0.001');

export async function createEscrow(
  signer: CustomSigner,
  escrowInput: {
    manifest: CampaignManifest;
    manifestHash: string;
    rewardToken: string;
    rewardAmount: string;
    exchangeOracleAddress: string;
    recordingOracleAddress: string;
    reputationOracleAddress: string;
  },
): Promise<string> {
  console.log('Checking staking info...');
  const stakingClient = await StakingClient.build(signer);
  const { stakedAmount } = await stakingClient.getStakerInfo(signer.address);
  if (stakedAmount < MIN_STAKED_AMOUNT_HMT) {
    console.log(
      `Provided launcher hasn't staked. Staking ${ethers.formatEther(MIN_STAKED_AMOUNT_HMT)} HMT...`,
    );
    await stakingClient.approveStake(MIN_STAKED_AMOUNT_HMT);
    await stakingClient.stake(MIN_STAKED_AMOUNT_HMT);
  } else {
    console.log(
      `Stake eligible: ${ethers.formatUnits(stakedAmount, HMT_TOKEN_DECIMALS)}`,
    );
  }

  const {
    rewardToken,
    rewardAmount,
    exchangeOracleAddress,
    recordingOracleAddress,
    reputationOracleAddress,
    manifest,
    manifestHash,
  } = escrowInput;

  const fundTokenAddress = getTokenAddress(signer.chainId, rewardToken);
  const tokenContract = new ethers.Contract(
    fundTokenAddress,
    ERC20_ABI as InterfaceAbi,
    signer,
  );
  const fundTokenDecimals: bigint = await tokenContract.decimals();
  const fundAmount = ethers.parseUnits(
    rewardAmount.toString(),
    fundTokenDecimals,
  );

  console.log('Checking wallet balance...');
  const walletTokenBalance: bigint = await tokenContract.balanceOf(
    signer.address,
  );
  if (walletTokenBalance < fundAmount) {
    const required = ethers.formatUnits(fundAmount, fundTokenDecimals);
    const available = ethers.formatUnits(walletTokenBalance, fundTokenDecimals);
    throw new Error(
      `Insufficient ${rewardToken} balance to fund escrow. Required ${required}, available ${available}.`,
    );
  } else {
    console.log(`Sufficient balance to fund escrow`);
  }

  console.log('Checking allowance...');
  const allowanceSpender = NETWORKS[signer.chainId as ChainId]!.factoryAddress;
  const allowance: bigint = await tokenContract.allowance(
    signer.address,
    allowanceSpender,
  );
  console.log(
    `Current allowance is ${ethers.formatUnits(allowance, fundTokenDecimals)}`,
  );
  if (allowance < fundAmount) {
    console.log('Approving allowance...');
    const approveAllowanceTx = await tokenContract.approve(
      allowanceSpender,
      fundAmount,
    );
    await approveAllowanceTx.wait();
  } else {
    console.log('Sufficient allowance to create escrow');
  }

  console.log('Getting oracles data...');
  const kvstoreClient = await KVStoreClient.build(signer);
  const [exchangeOracleFee, recordingOracleFee, reputationOracleFee] =
    await Promise.all([
      kvstoreClient.get(exchangeOracleAddress, KVStoreKeys.fee),
      kvstoreClient.get(recordingOracleAddress, KVStoreKeys.fee),
      kvstoreClient.get(reputationOracleAddress, KVStoreKeys.fee),
    ]);
  assert(
    exchangeOracleFee,
    `Exchange Oracle has invalid fee: ${exchangeOracleFee}`,
  );
  assert(
    recordingOracleFee,
    `Recording Oracle has invalid fee: ${recordingOracleFee}`,
  );
  assert(
    reputationOracleFee,
    `Reputation Oracle has invalid fee: ${reputationOracleFee}`,
  );

  console.log('Creating escrow...');
  const escrowClient = await EscrowClient.build(signer);
  const escrowAddress = await escrowClient.createFundAndSetupEscrow(
    fundTokenAddress,
    fundAmount,
    'campaign-launcher-action',
    {
      manifest: JSON.stringify(manifest),
      manifestHash,
      exchangeOracle: exchangeOracleAddress,
      exchangeOracleFee: BigInt(exchangeOracleFee),
      recordingOracle: recordingOracleAddress,
      recordingOracleFee: BigInt(recordingOracleFee),
      reputationOracle: reputationOracleAddress,
      reputationOracleFee: BigInt(reputationOracleFee),
    },
  );

  return escrowAddress;
}
