import { ethers } from "ethers";
import OffRamp_1_6_ABI from "../config/abi/OffRamp_1_6";
import { networkConfig } from "../../helper-config";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

import * as dotenv from "dotenv";
dotenv.config();

const argv = yargs(hideBin(process.argv))
    .option('txHash', {
        type: 'string',
        description: 'Specify the transaction hash for ccip_send',
        demandOption: true,
    }).option("destChain", {
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

// Define the enum for message execution states similar to what is used in the OffRamp contract (imported from Internal library)
enum MessageExecutionState {
    UNTOUCHED,
    IN_PROGRESS,
    SUCCESS,
    FAILURE
}

async function findExecutionStateChangeByMessageId() {
    // txHash is from user input
    let txHash = argv.txHash;
    if (!txHash || txHash.length !== 66 || !txHash.startsWith("0x")) {
        throw new Error("Please set aptos transaction hash with --txHash <your transaction hash>");
    }

    // set up the Aptos client
    const aptosConfig = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(aptosConfig);

    // Fetch the transaction by hash to get the messageId
    let targetMessageId: string;
    try {
        const transaction = await aptos.getTransactionByHash({ transactionHash: txHash });
        if (transaction.type === "user_transaction") {
            let ccipSendEvent = transaction.events.filter(event => event.type.includes("onramp::CCIPMessageSent"));
            targetMessageId = ccipSendEvent[0].data.message.header.message_id;
        } else {
            throw new Error("No events found or not a user transaction.");
        }
    } catch (error) {
        throw new Error(`Error fetching transaction events: ${error}`);
    }

    console.log(`CCIP Message ID to check on ${argv.destChain}:`, targetMessageId);

    // check the status on evm based on the messageId
    const iface = new ethers.Interface(OffRamp_1_6_ABI);
    const eventTopic = iface.getEvent("ExecutionStateChanged")!.topicHash;
    const latestBlock = await provider.getBlockNumber();

    const logs = await provider.getLogs({
        address: networkConfig.avalancheFuji.ccipOfframpAddress,
        fromBlock: latestBlock - 499, // Using a range of 500 blocks considering the RPC limits
        toBlock: latestBlock,
        topics: [eventTopic],
    });

    if (logs.length === 0) {
        console.warn("No messageId found in within the last 500 blocks");
    }

    for (const log of logs.reverse()) {
        try {
            const parsed = iface.parseLog(log);

            const messageId = parsed?.args.messageId as string;

            if (messageId.toLowerCase() === targetMessageId.toLowerCase()) {
                // Optional: verify it's an `execute()` call
                const tx = await provider.getTransaction(log.transactionHash);
                const executeSighash = iface.getFunction("execute")!.selector;

                if (tx?.data.startsWith(executeSighash)) {

                    const stateValue = parsed?.args.state;
                    // Cast to enum
                    const executionState = MessageExecutionState[stateValue as number];

                    console.log("Message Execution State:", executionState); // e.g., "SUCCESS"
                }
            }
            else {
                console.warn(`Message ID ${messageId} does not match the target ${targetMessageId}`);
            }

        } catch (err) {
            console.error("Error parsing log:", err);
            continue;
        }
    }
}

findExecutionStateChangeByMessageId()