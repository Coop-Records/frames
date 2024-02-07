import { createPublicClient, createWalletClient, http } from "viem";
import { base, optimism } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const OPAlchemyKey = process.env.ALCHEMY_KEY as string;
const BASEAlchemyKey = process.env.BASE_ALCHEMY_KEY as string;
const deployerPrivateKey = process.env.DEPLOYER_ACCOUNT_PRIVATE_KEY;

export const OPpublicServerClient = createPublicClient({
  chain: optimism,
  transport: http(`https://opt-mainnet.g.alchemy.com/v2/${OPAlchemyKey}`),
});

export const DeployerAccount = privateKeyToAccount(`0x${deployerPrivateKey}`);

export const OPwalletClient = createWalletClient({
  chain: optimism,
  transport: http(`https://opt-mainnet.g.alchemy.com/v2/${OPAlchemyKey}`),
  account: DeployerAccount,
});

export const BASEpublicServerClient = createPublicClient({
  chain: base,
  transport: http(`https://base-mainnet.g.alchemy.com/v2/${OPAlchemyKey}`),
});

export const BASEwalletClient = createWalletClient({
  chain: base,
  transport: http(`https://base-mainnet.g.alchemy.com/v2/${OPAlchemyKey}`),
  account: DeployerAccount,
});
