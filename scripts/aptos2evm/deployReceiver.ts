import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { networkConfig } from "../../helper-config";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

dotenv.config();

const argv = yargs(hideBin(process.argv))
    .option("destChain", {
        type: 'string',
        description: 'Specify the destination chain where the token will be sent',
        demandOption: true,
        choices: [
            networkConfig.aptos.destChains.ethereumSepolia,
            networkConfig.aptos.destChains.avalancheFuji
        ]
    })
    .parseSync();

let destChainRpcUrl: string | undefined;
if (argv.destChain === networkConfig.sepolia.networkName) {
    destChainRpcUrl = process.env.ETHEREUM_SEPOLIA_RPC_URL;
} else if (argv.destChain === networkConfig.avalancheFuji.networkName) {
    destChainRpcUrl = process.env.AVALANCHE_FUJI_RPC_URL;
} else {
    throw new Error("Invalid destination chain specified. Please specify --destChain sepolia or --destChain fuji.");
}

const provider = new ethers.JsonRpcProvider(destChainRpcUrl);

// Fetch the eth private key from .env
const PRIVATE_KEY = process.env.PRIVATE_KEY

// load the contract ABI and bytecode
const contractData = JSON.parse(fs.readFileSync(path.join(__dirname, "receiver", "receiver.json"), "utf8"));
const ABI = contractData.abi;
const BYTECODE = contractData.bytecode;

async function deployReceiverOnEvm() {
  try {
    if (!PRIVATE_KEY) {
        throw new Error("please set PRIVATE_KEY in .env")
    }
    
    // set up provider and wallet
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // create a contract factory
    const factory = new ethers.ContractFactory(ABI, BYTECODE, wallet);

    // deploy the contract
    console.log("Deploying contract to Avalanche Fuji...");
    const gasPrice = (await provider.getFeeData()).gasPrice;
    const contract = await factory.deploy(
        networkConfig.avalancheFuji.ccipRouterAddress,
        networkConfig.avalancheFuji.linkTokenAddress,
        {
            gasPrice: gasPrice ? gasPrice : ethers.parseUnits("25", "gwei"),
            gasLimit: 3000000,
        }
    );

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log(`receiver contract is deployed to: ${contractAddress}`);
  } catch (error) {
    console.error("部署失败:", error);
    throw error;
  }
}

deployReceiverOnEvm();