import { ethers, toUtf8Bytes, hexlify } from "ethers";
import RouterABI from '../config/abi/Router';
import ERC20_ABI from '../config/abi/ERC20';
import OnRamp_1_6_ABI from "../config/abi/OnRamp_1_6";
import { networkConfig } from "../../helper-config";

import * as dotenv from "dotenv";
dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
    throw new Error("Please set the environment variable PRIVATE_KEY.");
}

const ethereumSepoliaRpcUrl = process.env.ETHEREUM_SEPOLIA_RPC_URL;
if (!ethereumSepoliaRpcUrl) {
    throw new Error("Please set the environment variable ETHEREUM_SEPOLIA_RPC_URL.");
}

const provider = new ethers.JsonRpcProvider(ethereumSepoliaRpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

const ccipRouterContract = new ethers.Contract(
    networkConfig.sepolia.ccipRouterAddress,
    RouterABI,
    wallet
);

const ccipOnRampContract = new ethers.Contract(
    networkConfig.sepolia.ccipOnrampAddress,
    OnRamp_1_6_ABI,
    wallet
);

async function approveToken(
    tokenAddress: string,
    amount: bigint
) {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    const currentAllowance: bigint = await tokenContract.allowance(wallet.address, networkConfig.sepolia.ccipRouterAddress);
    console.log(`Current Allowance of ${await tokenContract.symbol()} token:`, currentAllowance.toString());

    if (currentAllowance >= amount) {
        console.log("Sufficient allowance already granted.");
        return;
    }

    const tx = await tokenContract.approve(networkConfig.sepolia.ccipRouterAddress, amount);
    console.log("Approval tx sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Approval confirmed in block:", receipt.blockNumber);
    console.log(`Router contract approved to spend ${amount} of ${await tokenContract.symbol()} token from your account.`);
}

function buildCCIPMessage(
    recipient: string,
    data: string,
    feeToken: string,
    extraArgs: string
): Array<any> {
    return [
        recipient,
        data,
        [],
        feeToken,
        extraArgs
    ];
}

function encodeExtraArgsV2(gasLimit: bigint, strict: boolean): string {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    const encodedArgs = abiCoder.encode(["tuple(uint256 gasLimit, bool strict)"], [[gasLimit, strict]]);

    const GENERIC_EXTRA_ARGS_V2_TAG = "0x181dcf10";

    return ethers.concat([GENERIC_EXTRA_ARGS_V2_TAG, encodedArgs]);
}

async function extractCCIPMessageId(
    receipt: ethers.TransactionReceipt,
): Promise<string | null> {
    for (const log of receipt.logs) {
        try {
            const parsedLog = ccipOnRampContract.interface.parseLog(log);

            if (parsedLog?.name === "CCIPMessageSent") {
                const message = parsedLog.args.message;
                const messageId: string = message.header.messageId;

                console.log("🆔 CCIP Message ID:", messageId);
                return messageId;
            }
        } catch {
            // Skip unrelated logs
            continue;
        }
    }

    console.warn("❌ CCIPMessageSent event not found.");
    return null;
}

async function transferTokenPayLink() {
    // console.log(await ccipRouterContract.isChainSupported(networkConfig.aptos.chainSelector));
            
    // get the aptos receiver from .env file
    let recipient = process.env.APTOS_RECEIVER;
    if(!recipient) {
        throw new Error("Please set the APTOS_RECEIVER in .env");
    }

    try {

        const ccipMessage = buildCCIPMessage(
            recipient,
            hexlify(toUtf8Bytes("Hello world!")), // test data, can be any valid hex string
            networkConfig.sepolia.linkTokenAddress,
            encodeExtraArgsV2(0n, true) // Gas limit set to 0 (because transferring to EOA), OoO (Out of Order) execution enabled
        );

        const baseFee: bigint = await ccipRouterContract.getFee(networkConfig.aptos.chainSelector, ccipMessage);

        // Add 20% margin
        const margin = baseFee / 5n; // 20% of base fee
        const feeWithBuffer = baseFee + margin;

        console.log("Base Fee (in LINK JUELS):", baseFee.toString());
        console.log("Fee with 20% buffer (in LINK JUELS):", feeWithBuffer.toString());

        // Approve the LINK token for fee payment
        await approveToken(networkConfig.sepolia.linkTokenAddress, feeWithBuffer);

        console.log("Proceeding with the token transfer...");

        const tx = await ccipRouterContract.ccipSend(
            networkConfig.aptos.chainSelector,
            ccipMessage
        );

        console.log("Transaction sent:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        console.log("✅ Transaction successful:", tx.hash);
        await extractCCIPMessageId(receipt);
    } catch (error) {
        console.error(error);
    }

}

transferTokenPayLink()