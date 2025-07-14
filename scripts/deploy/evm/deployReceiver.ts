import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { networkConfig } from "../../../helper-config";

dotenv.config();

// Avalanche Fuji config
const FUJI_RPC_URL = process.env.AVALANCHE_FUJI_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY

// load the contract ABI and bytecode
const contractData = JSON.parse(fs.readFileSync(path.join(__dirname, "receiver", "receiver.json"), "utf8"));
const ABI = contractData.abi;
const BYTECODE = contractData.bytecode;

async function deployReceiverOnEvm() {
  try {
    if (!FUJI_RPC_URL || !PRIVATE_KEY) {
        throw new Error("please set AVALANCHE_FUJI_RPC_URL and PRIVATE_KEY in .env")
    }
    // set up provider and wallet
    const provider = new ethers.JsonRpcProvider(FUJI_RPC_URL);
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