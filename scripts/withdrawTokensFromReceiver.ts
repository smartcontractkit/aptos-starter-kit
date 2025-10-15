import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
} from '@aptos-labs/ts-sdk';
import { ethers, Interface } from 'ethers';
import * as dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { networkConfig, supportedSourceChains } from '../helper-config';
import ERC20_ABI from './config/abi/ERC20';
import CCIPReceiver_ABI from './config/abi/CCIPReceiver';
import { getEvmChainConfig } from './utils/utils';

dotenv.config();

const argv = yargs(hideBin(process.argv))
  .option('network', {
    type: 'string',
    description: 'Specify the network to connect to',
    demandOption: true,
    choices: [networkConfig.aptos.networkName, ...supportedSourceChains],
  })
  .option('receiver', {
    type: 'string',
    description: 'Specify the receiver address to withdraw the token from',
    demandOption: true,
  })
  .option('to', {
    type: 'string',
    description: 'Specify the wallet address to withdraw the token to',
    demandOption: true,
  })
  .parseSync();

async function handleError(
  interfaces: { name: string; iface: Interface }[],
  err: any
) {
  const data = err.data ?? err.error?.data;

  if (!data || typeof data !== 'string' || !data.startsWith('0x')) {
    console.error('No valid revert data.');
    return;
  }

  const selector = data.slice(0, 10);

  if (selector === '0x08c379a0') {
    // Error(string)
    try {
      const fallbackInterface = interfaces[0].iface; // Pick any to decode standard error
      const reason = fallbackInterface.decodeErrorResult('Error(string)', data);
      console.log('Require/Revert with string:', reason[0]);
    } catch {
      console.log('Failed to decode standard error.');
    }
  } else if (selector === '0x4e487b71') {
    // Panic(uint256)
    const code = parseInt(data.slice(10, 74), 16);
    console.log('Panic with code:', code);
  } else {
    // Try parsing with each interface
    let matched = false;
    for (const { iface } of interfaces) {
      try {
        const decoded = iface.parseError(data);
        // console.log(`Custom Error matched in interface: ${name}`);
        console.log('Custom Error:', decoded!.name);

        if (decoded!.args.length > 0) {
          const namedArgs: { [key: string]: any } = {};
          decoded!.fragment.inputs.forEach((input, index) => {
            namedArgs[input.name] = decoded!.args[index];
          });
          console.log({ args: namedArgs });
        }

        matched = true;
        break;
      } catch {
        continue;
      }
    }

    if (!matched) {
      console.log('Unknown error format or not found in any interface.');
    }
  }
}

async function withdrawTokenFromReceiverOnAptos(
  receiver: string,
  to: string,
  tokenAddress: string
) {
  // Set up the account with the private key
  const privateKeyHex = process.env.PRIVATE_KEY_HEX;
  if (!privateKeyHex) {
    throw new Error('Please set the environment variable PRIVATE_KEY_HEX.');
  }
  const privateKey = new Ed25519PrivateKey(privateKeyHex);
  const account = Account.fromPrivateKey({ privateKey });

  // Set up Aptos client
  const aptosConfig = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(aptosConfig);

  const ccipReceiverModuleName = networkConfig.aptos.ccipReceiverModuleName;

  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${receiver}::${ccipReceiverModuleName}::withdraw_token`,
        functionArguments: [
          to, // recipient address
          tokenAddress, // token address
        ],
      },
    });

    // Simulate the transaction to check for errors
    const [userTransactionResponse] = await aptos.transaction.simulate.simple({
      signerPublicKey: account.publicKey,
      transaction,
    });

    if (!userTransactionResponse.success) {
      throw new Error(
        `Transaction simulation failed: ${userTransactionResponse.vm_status}`
      );
    }

    // Sign the transaction if the simulation was successful
    const senderAuthenticator = aptos.transaction.sign({
      signer: account,
      transaction,
    });

    // Submit the transaction
    const committedTransaction = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator,
    });

    // Wait for the transaction to be confirmed and return the hash
    const executed = await aptos.transaction.waitForTransaction({
      transactionHash: committedTransaction.hash,
    });

    if (executed.success === false) {
      throw new Error(`Transaction execution failed: ${executed.vm_status}`);
    }

    console.log(
      `✅ Transaction successful: https://explorer.aptoslabs.com/txn/${executed.hash}?network=testnet`
    );
    console.log(`Tokens have been successfully withdrawn to ${to}`);
  } catch (error) {
    console.error('Error during token withdrawal:', error);
  }
}

async function withdrawTokenFromReceiverOnEvm(
  evmChainRpcUrl: string,
  explorerUrl: string,
  receiver: string,
  to: string,
  tokenAddress: string
) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Please set the environment variable PRIVATE_KEY.');
  }

  const provider = new ethers.JsonRpcProvider(evmChainRpcUrl);
  const wallet = new ethers.Wallet(privateKey as string, provider);

  const ccipReceiverContract = new ethers.Contract(
    receiver,
    CCIPReceiver_ABI,
    wallet
  );

  try {
    const tx = await ccipReceiverContract.withdrawToken(to, tokenAddress);
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for transaction confirmation...');
    const confirmationsToWait = 3;
    const receipt = await tx.wait(confirmationsToWait);
    console.log(
      `Transaction confirmed in block ${receipt.blockNumber} after ${confirmationsToWait} confirmations.`
    );
    console.log('✅ Transaction successful:', `${explorerUrl}/tx/${tx.hash}`);
    console.log(`Tokens have been successfully withdrawn to ${to}`);
  } catch (error) {
    handleError(
      [
        {
          name: 'CCIPReceiverInterface',
          iface: ccipReceiverContract.interface,
        },
        { name: 'ERC20Interface', iface: new Interface(ERC20_ABI) },
      ],
      error
    );
  }
}

async function withdrawTokenFromReceiver() {
  if (argv.network === networkConfig.aptos.networkName) {
    withdrawTokenFromReceiverOnAptos(
      argv.receiver,
      argv.to,
      networkConfig.aptos.ccipBnMTokenAddress
    );
  } else {
    const chainConfig = getEvmChainConfig(argv.network);
    const { explorerUrl, rpcUrlEnv, ccipBnMTokenAddress } = chainConfig;
    const rpcUrl = process.env[rpcUrlEnv];
    if (!rpcUrl) {
      throw new Error(`Please set the environment variable ${rpcUrlEnv}.`);
    }
    withdrawTokenFromReceiverOnEvm(
      rpcUrl,
      explorerUrl,
      argv.receiver,
      argv.to,
      ccipBnMTokenAddress
    );
  }
}

withdrawTokenFromReceiver();
