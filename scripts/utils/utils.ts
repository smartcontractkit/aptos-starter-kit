import { networkConfig, supportedSourceChains } from '../../helper-config';

// Define an interface for EVM chain configurations to ensure type safety
export interface EvmChainConfig {
  networkName: string;
  chainSelector: string;
  ccipRouterAddress: string;
  ccipOnrampAddress: string;
  linkTokenAddress: string;
  explorerUrl: string;
  rpcUrlEnv: string;
  ccipOfframpAddress: string;
  ccipBnMTokenAddress: string;
}

// Define an interface for Aptos chain configurations to ensure type safety
export interface AptosChainConfig {
  networkName: string;
  chainSelector: string;
  ccipObjectAddress: string;
  ccipRouterModuleName: string;
  ccipOfframpModuleName: string;
  ccipOnrampModuleName: string;
  ccipBnMTokenAddress: string;
  ccipBnMFaucetAddress: string;
  feeTokenNameLink: string;
  linkTokenAddress: string;
  feeTokenNameNative: string;
  nativeTokenAddress: string;
  feeTokenStoreAddress: string;
  dataFeedDemoModuleName: string;
  dataFeedDemoAddressName: string;
  dataFeedId: string;
  ccipSenderModuleName: string;
  ccipSenderAddressName: string;
  ccipReceiverModuleName: string;
  ccipReceiverAddressName: string;
  destChains: { [key: string]: string };
}

export type ChainConfig = EvmChainConfig | AptosChainConfig;

// Type guard to check if a config is an EVM chain configuration
function isEvmChainConfig(config: ChainConfig): config is EvmChainConfig {
  return (
    'ccipRouterAddress' in config &&
    'ccipOnrampAddress' in config &&
    'rpcUrlEnv' in config
  );
}

/**
 * Retrieves the EVM chain configuration for a given source chain.
 * @param sourceChain The name of the source chain (e.g., 'sepolia', 'arbitrumSepolia').
 * @returns The EVM chain configuration object.
 * @throws Error if the source chain is invalid or not supported.
 */
export function getEvmChainConfig(sourceChain: string): EvmChainConfig {
  const chainConfig = Object.values(networkConfig).find(
    (config): config is EvmChainConfig =>
      isEvmChainConfig(config) && config.networkName === sourceChain
  );

  if (!chainConfig) {
    throw new Error(
      `Invalid source chain specified: ${sourceChain}. Please specify a valid source chain from ${supportedSourceChains.join(', ')}.`
    );
  }

  return chainConfig;
}
