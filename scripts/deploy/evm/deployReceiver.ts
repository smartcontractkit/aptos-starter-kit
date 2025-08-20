import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { networkConfig, supportedSourceChains } from "../../../helper-config";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getEvmChainConfig } from "../../utils/utils";

dotenv.config();

const argv = yargs(hideBin(process.argv))
  .option('evmChain', {
    type: 'string',
    description: 'Specify the EVM chain to deploy the receiver contract to',
    demandOption: true,
    choices: supportedSourceChains
  })
  .parseSync();

const chainConfig = getEvmChainConfig(argv.evmChain);
const { ccipRouterAddress, linkTokenAddress, rpcUrlEnv } = chainConfig;
const rpcUrl = process.env[rpcUrlEnv];
if (!rpcUrl) {
    throw new Error(`Please set the environment variable ${rpcUrlEnv}.`);
}

const PRIVATE_KEY = process.env.PRIVATE_KEY

if (!PRIVATE_KEY) {
  throw new Error("Please set the environment variable PRIVATE_KEY.");
}

__dirname = path.resolve(__dirname, '../../aptos2evm'); // Adjust the path 
// load the contract ABI and bytecode
const contractData = JSON.parse(fs.readFileSync(path.join(__dirname, "receiver", "receiver.json"), "utf8"));
const ABI = contractData.abi;
const BYTECODE = contractData.bytecode;

async function deployReceiverOnEvm() {
  try {

    // set up provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(PRIVATE_KEY as string, provider);

    // create a contract factory
    const factory = new ethers.ContractFactory(ABI, BYTECODE, wallet);

    // deploy the contract
    console.log(`Deploying Receiver Contract to ${argv.evmChain}...`);
    const gasPrice = (await provider.getFeeData()).gasPrice;
    const contract = await factory.deploy(
      ccipRouterAddress,
      linkTokenAddress,
      {
        gasPrice: gasPrice ? gasPrice : ethers.parseUnits("25", "gwei"),
        gasLimit: 3000000,
      }
    );

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log(`Receiver contract is deployed to: ${contractAddress}`);
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

deployReceiverOnEvm();