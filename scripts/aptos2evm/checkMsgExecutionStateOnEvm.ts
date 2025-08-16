import { ethers } from "ethers";
import OffRamp_1_6_ABI from "../config/abi/OffRamp_1_6";
import { networkConfig } from "../../helper-config";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as dotenv from "dotenv";
dotenv.config();

const argv = yargs(hideBin(process.argv))
    .option('msgId', {
        type: 'string',
        description: 'Specify the CCIP Message Id',
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
let ccipOfframpAddress: string | undefined;
if (argv.destChain === networkConfig.sepolia.networkName) {
    destChainRpcUrl = process.env.ETHEREUM_SEPOLIA_RPC_URL;
    ccipOfframpAddress = networkConfig.sepolia.ccipOfframpAddress;
} else if (argv.destChain === networkConfig.avalancheFuji.networkName) {
    destChainRpcUrl = process.env.AVALANCHE_FUJI_RPC_URL;
    ccipOfframpAddress = networkConfig.avalancheFuji.ccipOfframpAddress;
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
    // check the status on evm based on the messageId
    const iface = new ethers.Interface(OffRamp_1_6_ABI);
    const eventTopic = iface.getEvent("ExecutionStateChanged")!.topicHash;
    const latestBlock = await provider.getBlockNumber();

    const logs = await provider.getLogs({
        address: ccipOfframpAddress,
        fromBlock: latestBlock - 499, // Using a range of 500 blocks considering the RPC limits
        toBlock: latestBlock,
        topics: [eventTopic],
    });

    if (logs.length === 0) {
        console.warn("No ExecutionStateChanged event found in within the last 500 blocks");
    }
    else {

        let messageIdFound = false;

        for (const log of logs.reverse()) {
            try {
                const parsed = iface.parseLog(log);

                const messageId = parsed?.args.messageId as string;

                if (messageId.toLowerCase() === argv.msgId.toLowerCase()) {
                    // Optional: verify it's an `execute()` call
                    const tx = await provider.getTransaction(log.transactionHash);
                    const executeSighash = iface.getFunction("execute")!.selector;

                    if (tx?.data.startsWith(executeSighash)) {

                        const stateValue = parsed?.args.state;
                        // Cast to enum
                        const executionState = MessageExecutionState[stateValue as number];

                        console.log(`Execution state for CCIP message ${argv.msgId} is ${executionState}`); // e.g., "SUCCESS"

                        messageIdFound = true;

                        break; // Exit loop after finding the first match
                    }
                }

            } catch (err) {
                console.error("Error parsing log:", err);
                continue;
            }
        }

        if (!messageIdFound) {
            console.warn("No matching messageId found in within the last 500 blocks");
        }
    }
}

findExecutionStateChangeByMessageId()
